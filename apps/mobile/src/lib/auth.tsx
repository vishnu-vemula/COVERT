import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  onIdTokenChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';

import { getFirebaseAuth } from './firebase';

interface AuthState {
  user: User | null;
  /** True until Firebase has restored (or ruled out) a saved session. */
  initializing: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, initializing: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, initializing: true });

  useEffect(
    () =>
      onIdTokenChanged(getFirebaseAuth(), (user) => {
        setState({ user, initializing: false });
      }),
    [],
  );

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

export function signIn(email: string, password: string) {
  return signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
}

export function signUp(email: string, password: string) {
  return createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
}

export function sendReset(email: string) {
  return sendPasswordResetEmail(getFirebaseAuth(), email.trim());
}

export function signOut() {
  return firebaseSignOut(getFirebaseAuth());
}

/**
 * The current user's Firebase ID token. The SDK refreshes it when it is near
 * expiry; `forceRefresh` is used once after the API reports an expired session.
 */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = getFirebaseAuth().currentUser;
  return user ? user.getIdToken(forceRefresh) : null;
}
