export const BADGES = {
  tecela: {
    slug: 'tecela',
    label: 'Tecelã',
    descricao: 'Participou de 5+ projetos',
    criterio: 'Criar 5 posts tipo "projeto"',
  },
  polinizadora: {
    slug: 'polinizadora',
    label: 'Polinizadora',
    descricao: 'Conectou-se a iniciativas alheias',
    criterio: 'Demonstrar interesse em 3 vagas distintas',
  },
  fonte_de_saber: {
    slug: 'fonte_de_saber',
    label: 'Fonte de Saber',
    descricao: 'Compartilhou conhecimento com a vila',
    criterio: 'Criar 5 posts tipo "conquista"',
  },
} as const;

export type BadgeSlug = keyof typeof BADGES;

export type BadgeCounts = {
  projeto: number;
  conquista: number;
  vaga_interesse: number;
};

export function badgesDesbloqueados(counts: BadgeCounts): BadgeSlug[] {
  const unlocked: BadgeSlug[] = [];
  if (counts.projeto >= 5) unlocked.push('tecela');
  if (counts.vaga_interesse >= 3) unlocked.push('polinizadora');
  if (counts.conquista >= 5) unlocked.push('fonte_de_saber');
  return unlocked;
}
