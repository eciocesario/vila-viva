import { describe, it, expect } from 'vitest';
import { calcularSementes, SEMENTES_POR_TIPO } from '@/domain/sementes';

describe('sementes', () => {
  it('SEMENTES_POR_TIPO tem os 6 pesos do v3.3', () => {
    expect(SEMENTES_POR_TIPO).toEqual({
      historia: 2,
      pedido: 3,
      evento: 5,
      vaga: 5,
      projeto: 8,
      conquista: 10,
    });
  });

  it('calcularSementes retorna 0 quando tudo é zero', () => {
    expect(
      calcularSementes({ historia: 0, pedido: 0, evento: 0, projeto: 0, conquista: 0, vaga: 0 })
    ).toBe(0);
  });

  it('soma pesos corretamente — só histórias', () => {
    expect(
      calcularSementes({ historia: 3, pedido: 0, evento: 0, projeto: 0, conquista: 0, vaga: 0 })
    ).toBe(6);
  });

  it('soma pesos corretamente — mix de tipos', () => {
    // 2 histórias (4) + 1 pedido (3) + 1 evento (5) + 2 projetos (16) + 1 conquista (10) + 1 vaga (5) = 43
    expect(
      calcularSementes({ historia: 2, pedido: 1, evento: 1, projeto: 2, conquista: 1, vaga: 1 })
    ).toBe(43);
  });

  it('escala linear — 10 conquistas = 100 sementes', () => {
    expect(
      calcularSementes({ historia: 0, pedido: 0, evento: 0, projeto: 0, conquista: 10, vaga: 0 })
    ).toBe(100);
  });
});
