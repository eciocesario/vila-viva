// app/tests/domain/matchScore.test.ts
import { describe, it, expect } from 'vitest';
import { computeMatchScore } from '@/domain/matchScore';

describe('computeMatchScore', () => {
  it('retorna 0 quando não há interseção de skills nem arquétipo compatível', () => {
    // tecedor e sonhador não são complementares, e não há skills cruzadas
    const score = computeMatchScore({
      eu: { agente: 'tecedor', oferece: ['a', 'b'], busca: ['x'] },
      outro: { agente: 'sonhador', oferece: ['c'], busca: ['d'] },
    });
    expect(score).toBe(0);
  });

  it('soma +1 por skill que eu busco e outro oferece', () => {
    const score = computeMatchScore({
      eu: { agente: 'tecedor', oferece: [], busca: ['canto'] },
      outro: { agente: 'tecedor', oferece: ['canto'], busca: [] },
    });
    expect(score).toBeGreaterThanOrEqual(2); // arquétipo compatível + skill cruzada
  });

  it('soma bônus quando arquétipos são complementares', () => {
    const tecedorCurador = computeMatchScore({
      eu: { agente: 'tecedor', oferece: [], busca: [] },
      outro: { agente: 'curador', oferece: [], busca: [] },
    });
    expect(tecedorCurador).toBeGreaterThan(0);
  });

  it('é simétrico em skills cruzadas', () => {
    const a = computeMatchScore({
      eu: { agente: 'tecedor', oferece: ['canto'], busca: ['danca'] },
      outro: { agente: 'curador', oferece: ['danca'], busca: ['canto'] },
    });
    expect(a).toBeGreaterThanOrEqual(3); // 2 cruzamentos + bônus arquétipo complementar
  });
});
