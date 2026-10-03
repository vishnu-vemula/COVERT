import { z } from 'zod';

/**
 * Public client configuration, supplied through EXPO_PUBLIC_* variables (see
 * .env.example). Firebase web config identifies the project; it grants nothing
 * on its own. Privileged credentials live only in the API.
 */
const EnvSchema = z.object({
  apiUrl: z.url(),
  firebase: z.object({
    apiKey: z.string().min(1),
    authDomain: z.string().min(1),
    projectId: z.string().min(1),
    appId: z.string().min(1),
    messagingSenderId: z.string().optional(),
  }),
  authEmulatorHost: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

// EXPO_PUBLIC_* values are inlined at build time, so each must be read literally.
const parsed = EnvSchema.safeParse({
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || undefined,
  },
  authEmulatorHost: process.env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST || undefined,
});

export const env: Env | null = parsed.success ? parsed.data : null;

/** Names of missing or invalid settings, for the configuration screen. */
export const envProblems: string[] = parsed.success
  ? []
  : parsed.error.issues.map((issue) => issue.path.join('.'));

export function requireEnv(): Env {
  if (!env) throw new Error('COVERT is not configured');
  return env;
}
