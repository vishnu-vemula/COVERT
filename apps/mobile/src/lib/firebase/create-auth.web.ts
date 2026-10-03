import type { FirebaseApp } from 'firebase/app';
import { browserLocalPersistence, initializeAuth, type Auth } from 'firebase/auth';

/** Web (development preview): persist the session in local storage. */
export function createAuth(app: FirebaseApp): Auth {
  return initializeAuth(app, { persistence: browserLocalPersistence });
}
