import { describe, it, expect, vi, beforeEach } from 'vitest';

const delMock = vi.fn(() => Promise.resolve());
vi.mock('idb-keyval', () => ({
  get: vi.fn(() => Promise.resolve(null)),
  set: vi.fn(() => Promise.resolve()),
  del: delMock,
}));

describe('clearPersistedCache', () => {
  beforeEach(() => delMock.mockClear());

  it('remove a chave do cache persistido', async () => {
    const { clearPersistedCache } = await import('@/lib/persistQuery');
    await clearPersistedCache();
    expect(delMock).toHaveBeenCalledWith('vila-viva-rq-cache');
  });
});
