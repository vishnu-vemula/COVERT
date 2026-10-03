/** Human copy for Firebase Auth failures. Unknown codes fall back to a generic message. */
const MESSAGES: Record<string, string> = {
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/missing-email': 'Enter your email address.',
  'auth/missing-password': 'Enter your password.',
  'auth/invalid-credential': 'That email and password don’t match an account.',
  'auth/wrong-password': 'That email and password don’t match an account.',
  'auth/user-not-found': 'That email and password don’t match an account.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/email-already-in-use': 'An account with this email already exists. Sign in instead.',
  'auth/weak-password': 'Choose a password with at least 8 characters.',
  'auth/password-does-not-meet-requirements': 'Choose a longer password with letters and numbers.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  'auth/network-request-failed': 'Couldn’t reach the network. Check your connection and try again.',
  'auth/operation-not-allowed': 'Email sign-in isn’t enabled for this project.',
};

export function authErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
  return MESSAGES[code] ?? 'Something went wrong. Try again.';
}
