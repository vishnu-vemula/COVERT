import type { Auth } from 'firebase-admin/auth';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { firebaseTokenVerifier, readBearerToken, TokenError } from '../src/auth/token-verifier';
import { createHarness, type Harness } from './support/harness';

describe('readBearerToken', () => {
  it('extracts bearer tokens', () => {
    expect(readBearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi');
    expect(readBearerToken('bearer  token ')).toBe('token');
  });

  it.each([undefined, '', 'Basic dXNlcjpwYXNz', 'Bearer', 'Bearer a b', 'Token abc'])(
    'rejects %j',
    (header) => {
      expect(readBearerToken(header)).toBeNull();
    },
  );
});

describe('firebaseTokenVerifier', () => {
  const fakeAuth = (behaviour: () => Promise<{ uid: string }>) =>
    ({ verifyIdToken: behaviour }) as unknown as Auth;

  it('returns the uid from the verified token', async () => {
    const verify = firebaseTokenVerifier(fakeAuth(async () => ({ uid: 'user-1' })));
    await expect(verify('token')).resolves.toEqual({ uid: 'user-1' });
  });

  it.each([
    ['auth/id-token-expired', 'expired'],
    ['auth/id-token-revoked', 'expired'],
    ['auth/argument-error', 'invalid'],
    ['auth/invalid-id-token', 'invalid'],
  ])('maps %s to %s', async (code, reason) => {
    const verify = firebaseTokenVerifier(
      fakeAuth(async () => {
        throw Object.assign(new Error('nope'), { code });
      }),
    );
    const error = await verify('token').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(TokenError);
    expect((error as TokenError).reason).toBe(reason);
  });
});

describe('authentication middleware', () => {
  let harness: Harness;
  beforeAll(async () => {
    harness = await createHarness();
  });
  afterAll(() => harness.app.close());

  it('leaves the health check public', async () => {
    const response = await harness.app.inject({ method: 'GET', url: '/healthz' });
    expect(response.statusCode).toBe(200);
  });

  it('rejects requests without a token', async () => {
    const response = await harness.app.inject({ method: 'GET', url: '/v1/documents' });
    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      error: { code: 'UNAUTHENTICATED', message: 'Sign in to continue.', retryable: false },
    });
  });

  it('rejects malformed and invalid tokens', async () => {
    for (const authorization of ['Basic abc', 'Bearer forged-token']) {
      const response = await harness.app.inject({
        method: 'GET',
        url: '/v1/documents',
        headers: { authorization },
      });
      expect(response.statusCode).toBe(401);
      expect(response.json().error.code).toBe('UNAUTHENTICATED');
    }
  });

  it('tells clients when a session has expired', async () => {
    const response = await harness.app.inject({
      method: 'GET',
      url: '/v1/documents',
      headers: { authorization: 'Bearer expired' },
    });
    expect(response.statusCode).toBe(401);
    expect(response.json().error.code).toBe('SESSION_EXPIRED');
  });

  it('rejects uploads before reading them when unauthenticated', async () => {
    const response = await harness.app.inject({
      method: 'POST',
      url: '/v1/documents',
      headers: { 'content-type': 'multipart/form-data; boundary=x' },
      payload: '--x--',
    });
    expect(response.statusCode).toBe(401);
    expect(harness.ocr.calls).toBe(0);
  });

  it('accepts a valid token', async () => {
    const response = await harness.app.inject({
      method: 'GET',
      url: '/v1/documents',
      headers: { authorization: 'Bearer valid:user-1' },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ documents: [] });
  });
});
