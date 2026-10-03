import { getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, type Auth } from 'firebase/auth';

import { requireEnv } from '../env';
import { createAuth } from './create-auth';

let auth: Auth | null = null;

/** The single Firebase Auth instance. Only call once configuration is known to be valid. */
export function getFirebaseAuth(): Auth {
  if (auth) return auth;
  const env = requireEnv();
  const app = getApps()[0] ?? initializeApp(env.firebase);
  auth = createAuth(app);
  if (env.authEmulatorHost) {
    connectAuthEmulator(auth, `http://${env.authEmulatorHost}`, { disableWarnings: true });
  }
  return auth;
}
