import type { FastifyRequest } from 'fastify';

import { AppError } from '../errors';
import { readBearerToken, TokenError, type TokenVerifier } from './token-verifier';

declare module 'fastify' {
  interface FastifyRequest {
    /** Set by `requireUser`. Identity always comes from the verified token. */
    user: { uid: string } | null;
  }
}

/**
 * onRequest hook that rejects requests without a valid Firebase ID token.
 * Runs before the body is read, so unauthenticated uploads are never buffered.
 */
export function requireUser(verify: TokenVerifier) {
  return async function authenticate(request: FastifyRequest): Promise<void> {
    const token = readBearerToken(request.headers.authorization);
    if (!token) throw new AppError('UNAUTHENTICATED');
    try {
      request.user = await verify(token);
    } catch (error) {
      if (error instanceof TokenError && error.reason === 'expired') {
        throw new AppError('SESSION_EXPIRED');
      }
      throw new AppError('UNAUTHENTICATED', { cause: error });
    }
  };
}

export function currentUid(request: FastifyRequest): string {
  if (!request.user) throw new AppError('UNAUTHENTICATED');
  return request.user.uid;
}
