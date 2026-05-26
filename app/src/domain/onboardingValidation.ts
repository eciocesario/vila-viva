export const AGENTES = [
  'tecedor', 'curador', 'mediador', 'guardian', 'sonhador',
  'praticante', 'aprendiz', 'guia', 'tradutor', 'semeador',
  'pesquisador', 'comunicador', 'artesao', 'visionario',
] as const;

export type Agente = typeof AGENTES[number];

export type OnboardingData = {
  nome: string;
  agente: string;
  casa: string;
  intencao: string;
};

export type ValidationResult =
  | { ok: true; data: OnboardingData & { agente: Agente } }
  | { ok: false; errors: Partial<Record<keyof OnboardingData, string>> };

export function validateOnboarding(d: OnboardingData): ValidationResult {
  const errors: Partial<Record<keyof OnboardingData, string>> = {};

  if (!d.nome || d.nome.trim().length < 2) {
    errors.nome = 'Nome precisa ter pelo menos 2 caracteres.';
  }
  if (!AGENTES.includes(d.agente as Agente)) {
    errors.agente = 'Escolha um agente da lista.';
  }
  if (d.intencao && d.intencao.length > 280) {
    errors.intencao = 'Intenção precisa caber em 280 caracteres.';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: { ...d, agente: d.agente as Agente } };
}
