// app/tests/domain/challengeProgress.test.ts
import { describe, it, expect } from 'vitest';
import { describeChallengeState, progressPercent } from '@/domain/challengeProgress';

describe('describeChallengeState', () => {
  it('retorna label PT-BR para cada estado', () => {
    expect(describeChallengeState('nao_iniciado')).toBe('Não iniciado');
    expect(describeChallengeState('em_progresso')).toBe('Em progresso');
    expect(describeChallengeState('concluido')).toBe('Concluído');
  });
});

describe('progressPercent', () => {
  it('retorna 0 quando meta é 0 ou negativa', () => {
    expect(progressPercent(5, 0)).toBe(0);
    expect(progressPercent(5, -1)).toBe(0);
  });

  it('calcula percentual corretamente', () => {
    expect(progressPercent(1, 3)).toBeCloseTo(33.33, 1);
    expect(progressPercent(3, 3)).toBe(100);
  });

  it('limita em 100 mesmo se contador exceder meta', () => {
    expect(progressPercent(5, 3)).toBe(100);
  });
});
