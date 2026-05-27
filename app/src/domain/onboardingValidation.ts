export const PERFIS = [
  'cultivador',
  'guardiao',
  'aliado',
  'prof_remoto',
  'trabalhador_regiao',
  'polinizador',
  'semente',
  'embaixador',
  'aliado_externo',
  'org_local',
  'org_comunitaria',
  'gt_coletivo',
  'governanca',
  'org_parceira',
  'observador',
] as const;

export type Perfil = typeof PERFIS[number];

// Perfis pickáveis no onboarding (exclui observador, que é fora do MVP)
export const PERFIS_ONBOARDING: ReadonlyArray<Perfil> = PERFIS.filter(p => p !== 'observador');

export const PERFIL_LABELS: Record<Perfil, string> = {
  cultivador: 'Cultivador/a',
  guardiao: 'Guardião/ã',
  aliado: 'Aliado/a',
  prof_remoto: 'Prof. Remoto/a',
  trabalhador_regiao: 'Trabalhador da Região',
  polinizador: 'Polinizador/a',
  semente: 'Semente',
  embaixador: 'Embaixador/a',
  aliado_externo: 'Aliado Externo',
  org_local: 'Org. Local',
  org_comunitaria: 'Org. Comunitária',
  gt_coletivo: 'GT / Coletivo',
  governanca: 'Governança',
  org_parceira: 'Org. Parceira',
  observador: 'Observador',
};

export const PERFIL_DESCRICOES: Record<Perfil, string> = {
  cultivador: 'Mora em Piracanga, não é proprietário/a',
  guardiao: 'Mora e tem propriedade em Piracanga',
  aliado: 'Tem propriedade mas mora fora',
  prof_remoto: 'Mora aqui, trabalha digitalmente',
  trabalhador_regiao: 'Trabalha aqui, mora no entorno',
  polinizador: 'Visita com frequência, até 1 mês',
  semente: 'Chegou e quer criar raízes aqui',
  embaixador: 'Vem sempre, parceiro/a da vila',
  aliado_externo: 'Proprietário/a rural da bacia hidrográfica',
  org_local: 'Empreendimento ou iniciativa local',
  org_comunitaria: 'Instituto local sem fins lucrativos',
  gt_coletivo: 'Grupo de Trabalho comunitário',
  governanca: 'A.MOR ou conselho territorial',
  org_parceira: 'Organização externa de apoio / pesquisa',
  observador: 'Gov. e inst. públicas — acesso somente leitura',
};

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
  if (!PERFIS_ONBOARDING.includes(d.perfil_tipo as Perfil)) {
    errors.perfil_tipo = 'Escolha um perfil da lista.';
  }
  if (d.intencao && d.intencao.length > 280) {
    errors.intencao = 'Intenção precisa caber em 280 caracteres.';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: { ...d, perfil_tipo: d.perfil_tipo as Perfil } };
}
