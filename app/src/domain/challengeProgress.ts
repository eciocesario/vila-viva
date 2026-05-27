// app/src/domain/challengeProgress.ts

export type ChallengeEstado = 'nao_iniciado' | 'em_progresso' | 'concluido';

const LABELS: Record<ChallengeEstado, string> = {
  nao_iniciado: 'Não iniciado',
  em_progresso: 'Em progresso',
  concluido: 'Concluído',
};

export function describeChallengeState(estado: ChallengeEstado): string {
  return LABELS[estado];
}

/**
 * Returns a 0..100 percentage, capped at 100.
 * Returns 0 if meta <= 0 (safe division guard).
 */
export function progressPercent(contador: number, meta: number): number {
  if (meta <= 0) return 0;
  return Math.min(100, (contador / meta) * 100);
}
