import { apiError, ApiErrorResponseSchema, type ApiError } from '@covert/shared';
import type { z } from 'zod';

import { getIdToken, signOut } from '../auth';
import { requireEnv } from '../env';

/** A failure the UI can describe: always carries human-readable copy. */
export class ApiRequestError extends Error {
  constructor(readonly error: ApiError) {
    super(error.message);
    this.name = 'ApiRequestError';
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiRequestError) return error.error;
  return apiError('INTERNAL');
}

export function apiUrl(path: string): string {
  return `${requireEnv().apiUrl.replace(/\/$/, '')}${path}`;
}

/** Reads `{ error }` from a failed response, falling back to a status-based error. */
export async function readError(response: Response): Promise<ApiError> {
  try {
    const parsed = ApiErrorResponseSchema.safeParse(await response.json());
    if (parsed.success) return parsed.data.error;
  } catch {
    // Body was not JSON (proxy error page, empty body).
  }
  if (response.status === 401) return apiError('UNAUTHENTICATED');
  if (response.status === 404) return apiError('NOT_FOUND');
  if (response.status === 429) return apiError('RATE_LIMITED');
  return apiError('INTERNAL');
}

/**
 * When the API rejects a session even after a token refresh, sign out so the
 * protected routes return the person to the welcome screen.
 */
export async function handleUnauthorized(error: ApiError): Promise<never> {
  await signOut().catch(() => undefined);
  throw new ApiRequestError(error);
}

export async function authorizedHeaders(forceRefresh = false): Promise<Record<string, string>> {
  const token = await getIdToken(forceRefresh);
  if (!token) throw new ApiRequestError(apiError('UNAUTHENTICATED'));
  return { Authorization: `Bearer ${token}` };
}

async function send(path: string, init: RequestInit, timeoutMs: number, refresh: boolean) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(apiUrl(path), {
      ...init,
      headers: {
        ...(init.headers as Record<string, string>),
        ...(await authorizedHeaders(refresh)),
      },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError(apiError(controller.signal.aborted ? 'TIMEOUT' : 'NETWORK_ERROR'));
  } finally {
    clearTimeout(timer);
  }
}

/** Authenticated JSON request validated against `schema`. */
export async function request<T>(
  path: string,
  schema: z.ZodType<T> | null,
  init: RequestInit = {},
  timeoutMs = 20_000,
): Promise<T> {
  let response = await send(path, init, timeoutMs, false);
  if (response.status === 401) {
    // The SDK refreshes tokens near expiry; force one refresh before giving up.
    response = await send(path, init, timeoutMs, true);
    if (response.status === 401) return handleUnauthorized(await readError(response));
  }
  if (!response.ok) throw new ApiRequestError(await readError(response));
  if (!schema) return undefined as T;

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiRequestError(apiError('INTERNAL'));
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw new ApiRequestError(apiError('INTERNAL'));
  return parsed.data;
}

export function jsonBody(value: unknown): RequestInit {
  return { body: JSON.stringify(value), headers: { 'Content-Type': 'application/json' } };
}
