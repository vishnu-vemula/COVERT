import { PassThrough } from 'node:stream';

import {
  apiError,
  API_PATHS,
  RenameRequestSchema,
  UPLOAD_FIELD,
  UpdateCellRequestSchema,
  type ProcessEvent,
} from '@covert/shared';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { z } from 'zod';

import type { AppDeps } from '../app';
import { currentUid, requireUser } from '../auth/require-user';
import { AppError, isAppError, logFailure } from '../errors';
import type { ConversionLimiter } from '../pipeline/conversion-limiter';
import { processDocument } from '../pipeline/process-document';
import { validateUpload } from '../upload/file-type';

// Route patterns; clients build concrete URLs with API_PATHS.
const DOCUMENT_ROUTE = `${API_PATHS.documents}/:id`;
const CELLS_ROUTE = `${DOCUMENT_ROUTE}/cells`;

const IdParams = z.object({ id: z.string().min(1) });
const ListQuery = z.object({ limit: z.coerce.number().int().min(1).max(100).default(50) });

export const documentRoutes: FastifyPluginAsync<{ deps: AppDeps; limiter: ConversionLimiter }> = async (
  app,
  { deps, limiter },
) => {
  // Every route in this plugin requires a verified Firebase ID token.
  app.addHook('onRequest', requireUser(deps.verifyToken));

  app.get(API_PATHS.documents, async (request) => {
    const { limit } = parse(ListQuery, request.query);
    return { documents: await deps.documents.list(currentUid(request), limit) };
  });

  app.get(DOCUMENT_ROUTE, async (request) => {
    const { id } = parse(IdParams, request.params);
    const document = await deps.documents.get(currentUid(request), id);
    if (!document) throw new AppError('NOT_FOUND');
    return { document };
  });

  app.patch(DOCUMENT_ROUTE, async (request) => {
    const { id } = parse(IdParams, request.params);
    const { title } = parse(RenameRequestSchema, request.body);
    const document = await deps.documents.rename(currentUid(request), id, title);
    if (!document) throw new AppError('NOT_FOUND');
    return { document };
  });

  app.patch(CELLS_ROUTE, async (request) => {
    const { id } = parse(IdParams, request.params);
    const { value, ...target } = parse(UpdateCellRequestSchema, request.body);
    const result = await deps.documents.updateCell(currentUid(request), id, target, value);
    if (!result || result === 'no-cell') throw new AppError('NOT_FOUND');
    return result;
  });

  app.delete(DOCUMENT_ROUTE, async (request, reply) => {
    const { id } = parse(IdParams, request.params);
    const deleted = await deps.documents.delete(currentUid(request), id);
    if (!deleted) throw new AppError('NOT_FOUND');
    return reply.code(204).send();
  });

  app.delete(API_PATHS.documents, async (request) => {
    return { deleted: await deps.documents.deleteAll(currentUid(request)) };
  });

  app.post(API_PATHS.documents, async (request, reply) => {
    const uid = currentUid(request);
    const upload = validateUpload(await readUploads(request));
    if (!limiter.tryConsume(uid)) throw new AppError('RATE_LIMITED');

    // From here the response is a stream of NDJSON events describing real progress.
    const stream = new PassThrough();
    const abort = new AbortController();
    reply.raw.on('close', () => {
      if (!reply.raw.writableFinished) abort.abort();
    });
    const send = (event: ProcessEvent) => {
      if (!stream.writableEnded) stream.write(`${JSON.stringify(event)}\n`);
    };

    void processDocument(uid, upload, deps, (stage) => send({ type: 'stage', stage }), abort.signal)
      .then(({ document, metrics }) => {
        request.log.info({ documentId: document.id, ...metrics }, 'document processed');
        send({ type: 'ready', document });
      })
      .catch((error: unknown) => {
        const appError = isAppError(error) ? error : new AppError('INTERNAL', { cause: error });
        logFailure(request.log, appError);
        send({ type: 'error', error: apiError(appError.code) });
      })
      .finally(() => stream.end());

    return reply
      .header('content-type', 'application/x-ndjson; charset=utf-8')
      .header('cache-control', 'no-store')
      .header('x-accel-buffering', 'no')
      .send(stream);
  });
};

async function readUploads(request: FastifyRequest): Promise<Buffer[]> {
  if (!request.isMultipart()) throw new AppError('INVALID_REQUEST', { detail: 'Expected multipart' });
  const buffers: Buffer[] = [];
  for await (const part of request.parts()) {
    if (part.type !== 'file') continue;
    if (part.fieldname !== UPLOAD_FIELD) {
      part.file.resume();
      continue;
    }
    buffers.push(await part.toBuffer());
  }
  return buffers;
}

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new AppError('INVALID_REQUEST', { detail: result.error.issues[0]?.message });
  return result.data;
}
