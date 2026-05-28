import { describe, it, expect } from 'vitest';
import { VAGA_TIPOS, isVagaTipo, vagaTipoLabel } from '@/domain/vagaTypes';

describe('vagaTypes', () => {
  it('lista 2 tipos', () => {
    expect(VAGA_TIPOS).toHaveLength(2);
    expect(VAGA_TIPOS).toContain('voluntariado');
    expect(VAGA_TIPOS).toContain('remunerado');
  });

  it('isVagaTipo aceita valores válidos e rejeita inválidos', () => {
    expect(isVagaTipo('voluntariado')).toBe(true);
    expect(isVagaTipo('remunerado')).toBe(true);
    expect(isVagaTipo('foo')).toBe(false);
    expect(isVagaTipo('')).toBe(false);
  });

  it('vagaTipoLabel retorna PT-BR', () => {
    expect(vagaTipoLabel('voluntariado')).toBe('Voluntariado');
    expect(vagaTipoLabel('remunerado')).toBe('Remunerado');
  });
});
