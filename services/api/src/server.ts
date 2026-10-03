import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import OpenAI from 'openai';

import { buildApp } from './app';
import { firebaseTokenVerifier } from './auth/token-verifier';
import { loadConfig, parseOrigins, type Config } from './config';
import { FirestoreDocuments } from './documents/firestore';
import { createExtractor } from './extraction/extractor';
import { openAiCompletion } from './extraction/openai';
import { GoogleVisionOcr } from './ocr/google-vision';

const config = loadConfig();

// Credentials come from Application Default Credentials: the Cloud Run service
// account in production, GOOGLE_APPLICATION_CREDENTIALS locally. The Auth and
// Firestore emulators are used automatically when their *_EMULATOR_HOST is set.
initializeApp({ projectId: config.FIREBASE_PROJECT_ID });
const firestore = getFirestore();
firestore.settings({ ignoreUndefinedProperties: true });

const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
  timeout: config.OPENAI_TIMEOUT_MS,
  maxRetries: 1,
});

const app = await buildApp(
  {
    verifyToken: firebaseTokenVerifier(getAuth()),
    ocr: new GoogleVisionOcr(),
    extractor: createExtractor(openAiCompletion(openai, config.OPENAI_MODEL)),
    documents: new FirestoreDocuments(firestore),
  },
  {
    logger: loggerOptions(config),
    corsOrigins: parseOrigins(config.CORS_ORIGINS),
    conversionsPerHour: config.CONVERSIONS_PER_HOUR,
    requestsPerMinute: config.REQUESTS_PER_MINUTE,
  },
);

await app.listen({ port: config.PORT, host: config.HOST });

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    app.log.info({ signal }, 'shutting down');
    void app.close().then(() => process.exit(0));
  });
}

function loggerOptions(config: Config) {
  return {
    level: config.LOG_LEVEL,
    redact: ['req.headers.authorization', 'req.headers.cookie'],
    // Cloud Logging reads `severity`.
    formatters: { level: (label: string) => ({ severity: label.toUpperCase(), level: label }) },
    ...(config.NODE_ENV === 'development'
      ? { transport: { target: 'pino-pretty', options: { singleLine: true } } }
      : {}),
  };
}
