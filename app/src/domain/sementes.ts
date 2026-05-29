export const SEMENTES_POR_TIPO = {
  historia: 2,
  pedido: 3,
  evento: 5,
  vaga: 5,
  projeto: 8,
  conquista: 10,
} as const;

export type SementesCounts = {
  historia: number;
  pedido: number;
  evento: number;
  projeto: number;
  conquista: number;
  vaga: number;
};

export function calcularSementes(counts: SementesCounts): number {
  return (
    counts.historia * SEMENTES_POR_TIPO.historia +
    counts.pedido * SEMENTES_POR_TIPO.pedido +
    counts.evento * SEMENTES_POR_TIPO.evento +
    counts.projeto * SEMENTES_POR_TIPO.projeto +
    counts.conquista * SEMENTES_POR_TIPO.conquista +
    counts.vaga * SEMENTES_POR_TIPO.vaga
  );
}
