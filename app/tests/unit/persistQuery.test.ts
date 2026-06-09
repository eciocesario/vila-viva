import { describe, it, expect } from 'vitest';
import { shouldPersistQuery } from '@/lib/persistQuery';

describe('shouldPersistQuery', () => {
  it('persiste feed, vagas e vaga:id', () => {
    expect(shouldPersistQuery(['feed'])).toBe(true);
    expect(shouldPersistQuery(['vagas'])).toBe(true);
    expect(shouldPersistQuery(['vaga', 'abc-123'])).toBe(true);
  });

  it('NÃO persiste perfis, comentários, reactions, notificações', () => {
    expect(shouldPersistQuery(['profile', 'u1'])).toBe(false);
    expect(shouldPersistQuery(['comments', 'p1'])).toBe(false);
    expect(shouldPersistQuery(['reactions', 'p1'])).toBe(false);
    expect(shouldPersistQuery(['notifications', 'u1'])).toBe(false);
  });

  it('NÃO persiste quando a chave não é string', () => {
    expect(shouldPersistQuery([])).toBe(false);
    expect(shouldPersistQuery([123])).toBe(false);
  });
});
