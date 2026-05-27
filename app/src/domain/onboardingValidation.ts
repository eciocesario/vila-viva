export const PERFIS = [
  'tecedor', 'curador', 'mediador', 'guardian', 'sonhador',
  'praticante', 'aprendiz', 'guia', 'tradutor', 'semeador',
  'pesquisador', 'comunicador', 'artesao', 'visionario',
] as const;

export type Perfil = typeof PERFIS[number];

export type OnboardingData = {
  nome: string;
  perfil_tipo: string;
  casa: string;
  intencao: string;
};

export type ValidationResult =
  | { ok: true; data: OnboardingData & { perfil_tipo: Perfil } }
  | { ok: false; errors: Partial<Record<keyof OnboardingData, string>> };

export function validateOnboarding(d: OnboardingData): ValidationResult {
  const errors: Partial<Record<keyof OnboardingData, string>> = {};

  if (!d.nome || d.nome.trim().length < 2) {
    errors.nome = 'Nome precisa ter pelo menos 2 caracteres.';
  }
  if (!PERFIS.includes(d.perfil_tipo as Perfil)) {
    errors.perfil_tipo = 'Escolha um perfil da lista.';
  }
  if (d.intencao && d.intencao.length > 280) {
    errors.intencao = 'Intenção precisa caber em 280 caracteres.';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: { ...d, perfil_tipo: d.perfil_tipo as Perfil } };
}
