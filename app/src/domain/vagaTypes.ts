export const VAGA_TIPOS = ['voluntariado', 'remunerado'] as const;
export type VagaTipo = typeof VAGA_TIPOS[number];

const LABELS: Record<VagaTipo, string> = {
  voluntariado: 'Voluntariado',
  remunerado: 'Remunerado',
};

export function isVagaTipo(s: string): s is VagaTipo {
  return (VAGA_TIPOS as readonly string[]).includes(s);
}

export function vagaTipoLabel(t: VagaTipo): string {
  return LABELS[t];
}
