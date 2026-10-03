import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { API_PATHS, apiError, LIMITS } from '@covert/shared';
import Fastify, {
  type FastifyError,
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
  type FastifyServerOptions,
} from 'fastify';

import type { TokenVerifier } from './auth/token-verifier';
import type { DocumentRepository } from './documents/repository';
import { AppError, isAppError, logFailure } from './errors';
import type { Extractor } from './extraction/extractor';
import type { OcrProvider } from './ocr/types';
import { ConversionLimiter } from './pipeline/conversion-limiter';
import { documentRoutes } from './routes/documents';

export interface AppDeps {
  verifyToken: TokenVerifier;
  ocr: OcrProvider;
  extractor: Extractor;
  documents: DocumentRepository;
}

export interface AppOptions {
  logger?: FastifyServerOptions['logger'];
  corsOrigins?: string[];
  conversionsPerHour?: number;
  requestsPerMinute?: number;
}

export async function buildApp(deps: AppDeps, options: AppOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? false,
    // Cloud Run terminates TLS and forwards the client address.
    trustProxy: true,
    bodyLimit: 256 * 1024,
  });

  app.decorateRequest('user', null);
  app.setErrorHandler(handleError);
  app.setNotFoundHandler((_request, reply) => {
    void reply.code(404).send({ error: apiError('NOT_FOUND', 'Not found.') });
  });

  await app.register(rateLimit, {
    max: options.requestsPerMinute ?? 120,
    timeWindow: '1 minute',
    errorResponseBuilder: () => new AppError('RATE_LIMITED'),
  });

  if (options.corsOrigins?.length) {
    await app.register(cors, {
      origin: options.corsOrigins,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['authorization', 'content-type'],
    });
  }

  await app.register(multipart, {
    limits: {
      fileSize: LIMITS.maxFileBytes,
      files: LIMITS.maxImagePages,
      parts: LIMITS.maxImagePages + 4,
      fields: 4,
    },
  });

  app.get(API_PATHS.health, async () => ({ status: 'ok' }));

  const limiter = new ConversionLimiter(options.conversionsPerHour ?? 30, 60 * 60 * 1000);
  await app.register(documentRoutes, { deps, limiter });

  return app;
}

/** Maps framework and plugin errors onto COVERT's error codes. */
function toAppError(error: FastifyError | Error): AppError {
  if (isAppError(error)) return error;
  const code = 'code' in error ? error.code : undefined;
  switch (code) {
    case 'FST_REQ_FILE_TOO_LARGE':
      return new AppError('FILE_TOO_LARGE', { cause: error });
    case 'FST_FILES_LIMIT':
    case 'FST_PARTS_LIMIT':
      return new AppError('TOO_MANY_FILES', { cause: error });
  }
  const status = 'statusCode' in error ? error.statusCode : undefined;
  if (status === 429) return new AppError('RATE_LIMITED', { cause: error });
  if (typeof status === 'number' && status >= 400 && status < 500) {
    return new AppError('INVALID_REQUEST', { cause: error });
  }
  return new AppError('INTERNAL', { cause: error });
}

function handleError(error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) {
  const appError = toAppError(error);
  logFailure(request.log, appError);
  void reply.code(appError.status).send(appError.toBody());
}
