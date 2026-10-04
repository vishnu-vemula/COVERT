/**
 * Local preview server for UI work without cloud credentials.
 *
 * Runs the real COVERT routes, validation, streaming and Firebase token
 * verification (against the Firebase Auth emulator), but replaces Cloud Vision,
 * OpenAI and Firestore with the test fixtures and in-memory storage. Never used
 * by the production build (`src/server.ts`).
 *
 *   FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 npm run preview -w @covert/api
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

import { buildApp } from '../../src/app';
import { firebaseTokenVerifier } from '../../src/auth/token-verifier';
import { createExtractor } from '../../src/extraction/extractor';
import type { OcrProvider, OcrResult } from '../../src/ocr/types';
import {
  FIXTURE_NAMES,
  loadOcrText,
  loadRawExtraction,
  type FixtureName,
} from '../support/fixtures';
import { MemoryDocuments } from '../support/memory-documents';

if (!process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  throw new Error('The preview server only runs against the Firebase Auth emulator.');
}

const projectId = process.env.FIREBASE_PROJECT_ID ?? 'demo-covert';
const port = Number(process.env.PORT ?? 8080);
/** Simulated provider latency so each stage is visible in the app. */
const delayMs = Number(process.env.PREVIEW_DELAY_MS ?? 900);

initializeApp({ projectId });

const wait = () => new Promise((resolve) => setTimeout(resolve, delayMs));
let next = 0;
let current: FixtureName = FIXTURE_NAMES[0];

const ocr: OcrProvider = {
  async recognize(input): Promise<OcrResult> {
    current = FIXTURE_NAMES[next++ % FIXTURE_NAMES.length] ?? 'clean-invoice';
    await wait();
    const pages = input.kind === 'images' ? input.images.length : 1;
    return {
      pages: Array.from({ length: pages }, (_, index) => ({
        pageNumber: index + 1,
        text: index === 0 ? loadOcrText(current) : '',
      })),
      totalPages: pages,
    };
  },
};

const app = await buildApp(
  {
    verifyToken: firebaseTokenVerifier(getAuth()),
    ocr,
    extractor: createExtractor(async () => {
      await wait();
      return loadRawExtraction(current);
    }),
    documents: new MemoryDocuments(),
  },
  {
    logger: { level: 'info', redact: ['req.headers.authorization'] },
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:8081').split(','),
    conversionsPerHour: 1000,
    requestsPerMinute: 1000,
  },
);

await app.listen({ port, host: '0.0.0.0' });
