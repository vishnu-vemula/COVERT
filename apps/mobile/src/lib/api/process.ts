import {
  API_PATHS,
  apiError,
  ApiErrorResponseSchema,
  type ApiError,
  type CovertDocument,
  type ProcessingStage,
} from '@covert/shared';

import { ApiRequestError, apiUrl, authorizedHeaders, handleUnauthorized } from './client';
import { createEventReader } from './ndjson';
import { buildUploadBody } from './upload-body';

export interface UploadFile {
  uri: string;
  name: string;
  mimeType: string;
}

export interface ProcessCallbacks {
  /** Real bytes sent, when the platform reports them. */
  onUploadProgress?: (sent: number, total: number) => void;
  /** A stage the server has actually started. */
  onStage: (stage: ProcessingStage) => void;
}

export interface ProcessJob {
  result: Promise<CovertDocument>;
  cancel: () => void;
}

export class CancelledError extends Error {
  constructor() {
    super('Cancelled');
    this.name = 'CancelledError';
  }
}

/** Generous: large PDFs take a while to read and structure. */
const PROCESS_TIMEOUT_MS = 4 * 60 * 1000;

/**
 * Uploads a document and follows the server's NDJSON progress stream. XHR is
 * used because it reports upload progress and exposes partial response text on
 * every platform.
 */
export function processDocument(files: UploadFile[], callbacks: ProcessCallbacks): ProcessJob {
  let xhr: XMLHttpRequest | null = null;
  let cancelled = false;

  const attempt = async (forceRefresh: boolean): Promise<CovertDocument> => {
    const [headers, body] = await Promise.all([authorizedHeaders(forceRefresh), buildUploadBody(files)]);
    if (cancelled) throw new CancelledError();

    return new Promise<CovertDocument>((resolve, reject) => {
      const request = new XMLHttpRequest();
      xhr = request;
      const read = createEventReader();
      let settled = false;
      const finish = (outcome: () => void) => {
        if (settled) return;
        settled = true;
        outcome();
      };

      const handle = (final: boolean) => {
        if (request.status !== 200) return;
        for (const event of read(request.responseText ?? '', final)) {
          if (event.type === 'stage') callbacks.onStage(event.stage);
          else if (event.type === 'ready') finish(() => resolve(event.document));
          else finish(() => reject(new ApiRequestError(event.error)));
        }
      };

      request.open('POST', apiUrl(API_PATHS.documents));
      request.setRequestHeader('Authorization', headers.Authorization ?? '');
      request.setRequestHeader('Accept', 'application/x-ndjson');
      request.responseType = 'text';
      request.timeout = PROCESS_TIMEOUT_MS;

      request.upload.onprogress = (event) => {
        if (event.lengthComputable) callbacks.onUploadProgress?.(event.loaded, event.total);
      };
      // Handlers must be attached before send() for React Native to stream partial text.
      request.onprogress = () => handle(false);
      request.onreadystatechange = () => {
        if (request.readyState === XMLHttpRequest.LOADING) handle(false);
      };
      request.onload = () => {
        if (request.status === 200) {
          handle(true);
          // The stream ended without a final event: the connection was cut.
          finish(() => reject(new ApiRequestError(apiError('NETWORK_ERROR'))));
          return;
        }
        finish(() => reject(new HttpStatusError(request.status, parseError(request.responseText))));
      };
      request.onerror = () => finish(() => reject(new ApiRequestError(apiError('NETWORK_ERROR'))));
      request.ontimeout = () => finish(() => reject(new ApiRequestError(apiError('TIMEOUT'))));
      request.onabort = () => finish(() => reject(new CancelledError()));
      request.send(body);
    });
  };

  const result = (async () => {
    try {
      return await attempt(false);
    } catch (error) {
      if (!(error instanceof HttpStatusError)) throw error;
      if (error.status !== 401) throw new ApiRequestError(error.error);
    }
    // The session was rejected: refresh the ID token once, then return to sign-in.
    try {
      return await attempt(true);
    } catch (error) {
      if (!(error instanceof HttpStatusError)) throw error;
      if (error.status === 401) return handleUnauthorized(error.error);
      throw new ApiRequestError(error.error);
    }
  })();

  return {
    result,
    cancel: () => {
      cancelled = true;
      xhr?.abort();
    },
  };
}

class HttpStatusError extends Error {
  constructor(
    readonly status: number,
    readonly error: ApiError,
  ) {
    super(error.message);
  }
}

function parseError(text: string | null): ApiError {
  try {
    const parsed = ApiErrorResponseSchema.safeParse(JSON.parse(text ?? ''));
    if (parsed.success) return parsed.data.error;
  } catch {
    // Not JSON.
  }
  return apiError('INTERNAL');
}
