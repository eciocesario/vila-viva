import { describe, it, expect } from 'vitest';
import { POST_TIPOS, isPostTipo, postTipoLabel } from '@/domain/postTypes';

describe('postTypes', () => {
  it('lista 5 tipos', () => {
    expect(POST_TIPOS).toHaveLength(5);
  });

  it('aceita tipos válidos', () => {
    expect(isPostTipo('historia')).toBe(true);
    expect(isPostTipo('pedido')).toBe(true);
  });

  it('rejeita tipos inválidos', () => {
    expect(isPostTipo('foo')).toBe(false);
    expect(isPostTipo('')).toBe(false);
  });

  it('retorna label PT-BR', () => {
    expect(postTipoLabel('historia')).toBe('História');
    expect(postTipoLabel('conquista')).toBe('Conquista');
  });
});
