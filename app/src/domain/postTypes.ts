export const POST_TIPOS = ['historia', 'pedido', 'projeto', 'evento', 'conquista'] as const;
export type PostTipo = typeof POST_TIPOS[number];

const LABELS: Record<PostTipo, string> = {
  historia: 'História',
  pedido: 'Pedido',
  projeto: 'Projeto',
  evento: 'Evento',
  conquista: 'Conquista',
};

export function isPostTipo(s: string): s is PostTipo {
  return (POST_TIPOS as readonly string[]).includes(s);
}

export function postTipoLabel(t: PostTipo): string {
  return LABELS[t];
}
