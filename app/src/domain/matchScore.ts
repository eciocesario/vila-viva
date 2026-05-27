import type { Perfil } from './onboardingValidation';

type Side = { perfil_tipo: string; oferece: string[]; busca: string[] };

// Pares complementares explícitos do v3.3 (apresentação pp.07-09):
// - Aliado e Cultivador são os "perfis-âncora" do MVP
// - Sementes recebem onboarding mentorado por Guardiões na F3
const COMPLEMENTARES: ReadonlyArray<readonly [Perfil, Perfil]> = [
  ['aliado', 'cultivador'],
  ['semente', 'guardiao'],
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

  if (sameAgente(eu.perfil_tipo, outro.perfil_tipo)) score += 1;
  if (complementar(eu.perfil_tipo, outro.perfil_tipo)) score += 1;

  const setOferece = new Set(outro.oferece);
  for (const s of eu.busca) if (setOferece.has(s)) score += 1;

  const meusOferece = new Set(eu.oferece);
  for (const s of outro.busca) if (meusOferece.has(s)) score += 1;

  return score;
}
