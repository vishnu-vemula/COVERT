import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  FIREBASE_PROJECT_ID: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().min(1).default('gpt-5.4-mini'),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().positive().default(120_000),

  /** Comma-separated origins allowed to call the API from a browser (development only). */
  CORS_ORIGINS: z.string().optional(),
  CONVERSIONS_PER_HOUR: z.coerce.number().int().positive().default(30),
  REQUESTS_PER_MINUTE: z.coerce.number().int().positive().default(120),
});

export type Config = z.infer<typeof EnvSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid API configuration. Check: ${missing}`);
  }
  return parsed.data;
}

export function parseOrigins(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
