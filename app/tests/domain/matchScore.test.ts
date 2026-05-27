import { describe, it, expect } from 'vitest';
import { computeMatchScore } from '@/domain/matchScore';

describe('computeMatchScore', () => {
  it('retorna 0 quando não há interseção e perfis não-complementares', () => {
    const score = computeMatchScore({
      eu: { perfil_tipo: 'polinizador', oferece: ['a', 'b'], busca: ['x'] },
      outro: { perfil_tipo: 'org_local', oferece: ['c'], busca: ['d'] },
    });
    expect(score).toBe(0);
  });

  it('soma +1 por skill que eu busco e outro oferece', () => {
    const score = computeMatchScore({
      eu: { perfil_tipo: 'aliado', oferece: [], busca: ['canto'] },
      outro: { perfil_tipo: 'aliado', oferece: ['canto'], busca: [] },
    });
    expect(score).toBeGreaterThanOrEqual(2); // mesmo perfil + 1 cruzamento
  });

  it('soma bônus quando perfis são complementares (aliado/cultivador)', () => {
    const score = computeMatchScore({
      eu: { perfil_tipo: 'aliado', oferece: [], busca: [] },
      outro: { perfil_tipo: 'cultivador', oferece: [], busca: [] },
    });
    expect(score).toBe(1); // 0 mesmo + 1 complementar
  });

  it('soma bônus quando perfis são complementares (semente/guardiao)', () => {
    const score = computeMatchScore({
      eu: { perfil_tipo: 'semente', oferece: [], busca: [] },
      outro: { perfil_tipo: 'guardiao', oferece: [], busca: [] },
    });
    expect(score).toBe(1);
  });

  it('é simétrico em skills cruzadas', () => {
    const score = computeMatchScore({
      eu: { perfil_tipo: 'cultivador', oferece: ['canto'], busca: ['danca'] },
      outro: { perfil_tipo: 'aliado', oferece: ['danca'], busca: ['canto'] },
    });
    expect(score).toBeGreaterThanOrEqual(3); // 0 mesmo + 1 complementar + 2 cruzamentos
  });
});
