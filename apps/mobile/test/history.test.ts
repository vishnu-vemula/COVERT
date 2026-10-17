import { beforeEach, describe, expect, it, vi } from 'vitest';

import { request } from '@/lib/api/client';
import { listDocuments } from '@/lib/api/documents';

vi.mock('@/lib/api/client', () => ({ request: vi.fn(), jsonBody: vi.fn() }));

describe('history API client', () => {
  beforeEach(() => vi.resetAllMocks());

  it('follows continuation pages instead of silently stopping at 100 records', async () => {
    vi.mocked(request)
      .mockResolvedValueOnce({ documents: [{ id: 'first' }], nextCursor: 'page-two' })
      .mockResolvedValueOnce({ documents: [{ id: 'older' }] });
    await expect(listDocuments()).resolves.toEqual([{ id: 'first' }, { id: 'older' }]);
    expect(request).toHaveBeenNthCalledWith(
      2,
      '/v1/documents?limit=100&cursor=page-two',
      expect.anything(),
    );
  });

  it('does not return partial history as a successful refresh if a later page fails', async () => {
    vi.mocked(request)
      .mockResolvedValueOnce({ documents: [{ id: 'first' }], nextCursor: 'page-two' })
      .mockRejectedValueOnce(new Error('offline'));
    await expect(listDocuments()).rejects.toThrow('offline');
  });
});
