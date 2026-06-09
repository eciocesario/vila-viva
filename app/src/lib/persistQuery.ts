import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';

/** queryKeys[0] cujo cache deve sobreviver offline. */
const PERSIST_KEYS: readonly string[] = ['feed', 'vagas', 'vaga'];

/** Bump manual quando uma mudança quebra o shape do cache persistido. */
const CACHE_BUSTER = 'f2b-gamma-1';

const STORAGE_KEY = 'vila-viva-rq-cache';

export function shouldPersistQuery(queryKey: readonly unknown[]): boolean {
  const head = queryKey[0];
  return typeof head === 'string' && PERSIST_KEYS.includes(head);
}

const persister = createAsyncStoragePersister({
  key: STORAGE_KEY,
  storage: {
    getItem: (key: string) => get(key),
    setItem: (key: string, value: string) => set(key, value),
    removeItem: (key: string) => del(key),
  },
});

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister,
  maxAge: 24 * 60 * 60 * 1000, // 24h
  buster: CACHE_BUSTER,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => shouldPersistQuery(query.queryKey),
  },
};

/** Remove o cache persistido (chamar no logout). */
export async function clearPersistedCache(): Promise<void> {
  await del(STORAGE_KEY);
}
