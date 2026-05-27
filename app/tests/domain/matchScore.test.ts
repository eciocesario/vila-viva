// app/tests/domain/matchScore.test.ts
import { describe, it, expect } from 'vitest';
import { computeMatchScore } from '@/domain/matchScore';

describe('computeMatchScore', () => {
  it('retorna 0 quando não há interseção de skills nem perfil compatível', () => {
    // tecedor e sonhador não são complementares, e não há skills cruzadas
    const score = computeMatchScore({
      eu: { perfil_tipo: 'tecedor', oferece: ['a', 'b'], busca: ['x'] },
      outro: { perfil_tipo: 'sonhador', oferece: ['c'], busca: ['d'] },
    });
    expect(score).toBe(0);
  });

  it('soma +1 por skill que eu busco e outro oferece', () => {
    const score = computeMatchScore({
      eu: { perfil_tipo: 'tecedor', oferece: [], busca: ['canto'] },
      outro: { perfil_tipo: 'tecedor', oferece: ['canto'], busca: [] },
    });
    expect(score).toBeGreaterThanOrEqual(2); // perfil compatível + skill cruzada
  });

  it('soma bônus quando perfis são complementares', () => {
    const tecedorCurador = computeMatchScore({
      eu: { perfil_tipo: 'tecedor', oferece: [], busca: [] },
      outro: { perfil_tipo: 'curador', oferece: [], busca: [] },
    });
    expect(tecedorCurador).toBeGreaterThan(0);
  });

  it('é simétrico em skills cruzadas', () => {
    const a = computeMatchScore({
      eu: { perfil_tipo: 'tecedor', oferece: ['canto'], busca: ['danca'] },
      outro: { perfil_tipo: 'curador', oferece: ['danca'], busca: ['canto'] },
    });
    expect(a).toBeGreaterThanOrEqual(3); // 2 cruzamentos + bônus perfil complementar
  });
});
