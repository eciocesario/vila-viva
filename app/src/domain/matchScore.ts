import type { Agente } from './onboardingValidation';

type Side = { agente: string; oferece: string[]; busca: string[] };

// Pares complementares de arquétipos (bônus +1 cada par)
const COMPLEMENTARES: ReadonlyArray<readonly [Agente, Agente]> = [
  ['tecedor', 'curador'],
  ['mediador', 'guardian'],
  ['sonhador', 'praticante'],
  ['aprendiz', 'guia'],
  ['tradutor', 'semeador'],
  ['pesquisador', 'comunicador'],
  ['artesao', 'visionario'],
];

function sameAgente(a: string, b: string): boolean {
  return a === b;
}

function complementar(a: string, b: string): boolean {
  return COMPLEMENTARES.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a)
  );
}

export function computeMatchScore({ eu, outro }: { eu: Side; outro: Side }): number {
  let score = 0;

  // Arquétipo: +1 mesmo, +1 complementar
  if (sameAgente(eu.agente, outro.agente)) score += 1;
  if (complementar(eu.agente, outro.agente)) score += 1;

  // Skills cruzadas (eu busco × outro oferece)
  const setOferece = new Set(outro.oferece);
  for (const s of eu.busca) if (setOferece.has(s)) score += 1;

  // Skills cruzadas (outro busca × eu ofereço)
  const meusOferece = new Set(eu.oferece);
  for (const s of outro.busca) if (meusOferece.has(s)) score += 1;

  return score;
}
