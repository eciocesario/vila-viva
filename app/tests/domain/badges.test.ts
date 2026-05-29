import { describe, it, expect } from 'vitest';
import { BADGES, badgesDesbloqueados } from '@/domain/badges';

describe('badges', () => {
  it('BADGES tem exatamente 3 entradas', () => {
    expect(Object.keys(BADGES)).toEqual(['tecela', 'polinizadora', 'fonte_de_saber']);
  });

  it('cada badge tem slug, label, descricao, criterio', () => {
    for (const b of Object.values(BADGES)) {
      expect(b).toMatchObject({
        slug: expect.any(String),
        label: expect.any(String),
        descricao: expect.any(String),
        criterio: expect.any(String),
      });
    }
  });

  it('retorna array vazio quando counts estão abaixo dos thresholds', () => {
    expect(badgesDesbloqueados({ projeto: 4, conquista: 4, vaga_interesse: 2 })).toEqual([]);
  });

  it('desbloqueia Tecelã exatamente em 5 projetos', () => {
    expect(badgesDesbloqueados({ projeto: 5, conquista: 0, vaga_interesse: 0 })).toEqual(['tecela']);
  });

  it('desbloqueia Polinizadora exatamente em 3 vaga_interesse', () => {
    expect(badgesDesbloqueados({ projeto: 0, conquista: 0, vaga_interesse: 3 })).toEqual(['polinizadora']);
  });

  it('desbloqueia Fonte de Saber exatamente em 5 conquistas', () => {
    expect(badgesDesbloqueados({ projeto: 0, conquista: 5, vaga_interesse: 0 })).toEqual(['fonte_de_saber']);
  });

  it('desbloqueia os 3 quando todos os thresholds são cruzados', () => {
    expect(badgesDesbloqueados({ projeto: 10, conquista: 8, vaga_interesse: 5 })).toEqual([
      'tecela',
      'polinizadora',
      'fonte_de_saber',
    ]);
  });
});
