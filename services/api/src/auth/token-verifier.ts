import type { Auth } from 'firebase-admin/auth';

export interface VerifiedUser {
  uid: string;
}

export class TokenError extends Error {
  constructor(readonly reason: 'expired' | 'invalid') {
    super(`Token ${reason}`);
    this.name = 'TokenError';
  }
}

/** Resolves a bearer token to a user or throws `TokenError`. */
export type TokenVerifier = (token: string) => Promise<VerifiedUser>;

const EXPIRED_CODES = new Set(['auth/id-token-expired', 'auth/id-token-revoked', 'auth/user-disabled']);

export function firebaseTokenVerifier(auth: Auth): TokenVerifier {
  return async (token) => {
    try {
      const decoded = await auth.verifyIdToken(token);
      return { uid: decoded.uid };
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
      throw new TokenError(EXPIRED_CODES.has(code) ? 'expired' : 'invalid');
    }
  };
}

/** Extracts the token from an `Authorization: Bearer <token>` header. */
export function readBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header);
  return match?.[1] ?? null;
}
