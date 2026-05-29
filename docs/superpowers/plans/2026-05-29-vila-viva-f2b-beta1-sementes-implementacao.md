# Vila Viva F2b-β.1 · Sementes + 3 Badges — Plano de Implementação

> **Para workers agentes:** SUB-SKILL OBRIGATÓRIA: Use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para executar tarefa por tarefa. Passos usam sintaxe checkbox (`- [ ]`).

**Goal:** Implementar Sementes (pontos por contribuição) + 3 badges (Tecelã, Polinizadora, Fonte de Saber) exibidos no `/profile/:id`. Sem schema novo — tudo compute-on-demand.

**Architecture:** 2 domain modules (TS puro, TDD) + 2 componentes React + modificação no Profile.tsx (2 queries agregadas adicionais). Zero migrations, zero triggers Postgres. Backfill grátis: deriva-se sempre do estado atual de `post` + `vaga` + `vaga_interesse`.

**Tech Stack:** TypeScript strict · React 18 · TanStack Query · Tailwind · Supabase (queries via PostgREST) · Vitest

**Spec de referência:** [`docs/superpowers/specs/2026-05-29-vila-viva-f2b-beta1-sementes-design.md`](../specs/2026-05-29-vila-viva-f2b-beta1-sementes-design.md)

**Root do projeto:** `C:\Users\Samsung\projetos\vila-viva\` · **Código novo em:** `app/`

---

## Estrutura de arquivos

**Criar:**
- `app/src/domain/sementes.ts`
- `app/tests/domain/sementes.test.ts`
- `app/src/domain/badges.ts`
- `app/tests/domain/badges.test.ts`
- `app/src/components/SementesDisplay.tsx`
- `app/src/components/BadgesGrid.tsx`

**Modificar:**
- `app/src/routes/Profile.tsx` (2 queries adicionais + render dos 2 componentes)

---

## Task 1: Domain `sementes` (TDD)

**Files:**
- Create: `app/tests/domain/sementes.test.ts`
- Create: `app/src/domain/sementes.ts`

- [ ] **Step 1: Escrever teste primeiro**

`app/tests/domain/sementes.test.ts`:

```typescript
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
```

- [ ] **Step 2: Rodar — esperar FAIL**

```bash
cd C:/Users/Samsung/projetos/vila-viva/app
npm run test -- sementes
```

Expected: módulo não existe, FAIL.

- [ ] **Step 3: Implementar**

`app/src/domain/sementes.ts`:

```typescript
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
```

- [ ] **Step 4: Rodar — esperar PASS**

```bash
npm run test -- sementes
```

Expected: 5/5 verde.

- [ ] **Step 5: Commit**

```bash
cd C:/Users/Samsung/projetos/vila-viva
git add app/src/domain/sementes.ts app/tests/domain/sementes.test.ts
git commit -m "feat(gamif): domain sementes com 6 pesos do v3.3 (TDD)"
```

---

## Task 2: Domain `badges` (TDD)

**Files:**
- Create: `app/tests/domain/badges.test.ts`
- Create: `app/src/domain/badges.ts`

- [ ] **Step 1: Escrever teste primeiro**

`app/tests/domain/badges.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { BADGES, badgesDesbloqueados } from '@/domain/badges';

describe('badges', () => {
  it('BADGES tem exatamente 3 entradas', () => {
    expect(Object.keys(BADGES)).toEqual(['tecela', 'polinizadora', 'fonte_de_saber']);
  });

  it('cada badge tem slug, label, descricao, criterio', () => {
    for (const b of Object.values(BADGES)) {
      expect(b).toMatchObject({
        slug: expect.any(String),
        label: expect.any(String),
        descricao: expect.any(String),
        criterio: expect.any(String),
      });
    }
  });

  it('retorna array vazio quando counts estão abaixo dos thresholds', () => {
    expect(badgesDesbloqueados({ projeto: 4, conquista: 4, vaga_interesse: 2 })).toEqual([]);
  });

  it('desbloqueia Tecelã exatamente em 5 projetos', () => {
    expect(badgesDesbloqueados({ projeto: 5, conquista: 0, vaga_interesse: 0 })).toEqual(['tecela']);
  });

  it('desbloqueia Polinizadora exatamente em 3 vaga_interesse', () => {
    expect(badgesDesbloqueados({ projeto: 0, conquista: 0, vaga_interesse: 3 })).toEqual(['polinizadora']);
  });

  it('desbloqueia Fonte de Saber exatamente em 5 conquistas', () => {
    expect(badgesDesbloqueados({ projeto: 0, conquista: 5, vaga_interesse: 0 })).toEqual(['fonte_de_saber']);
  });

  it('desbloqueia os 3 quando todos os thresholds são cruzados', () => {
    expect(badgesDesbloqueados({ projeto: 10, conquista: 8, vaga_interesse: 5 })).toEqual([
      'tecela',
      'polinizadora',
      'fonte_de_saber',
    ]);
  });
});
```

- [ ] **Step 2: Rodar — esperar FAIL**

```bash
npm run test -- badges
```

Expected: módulo não existe, FAIL.

- [ ] **Step 3: Implementar**

`app/src/domain/badges.ts`:

```typescript
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
```

- [ ] **Step 4: Rodar — esperar PASS**

```bash
npm run test
```

Expected: **35/35 verde** (23 atuais após F2b-α + 5 novos de sementes + 7 novos de badges).

- [ ] **Step 5: Commit**

```bash
cd C:/Users/Samsung/projetos/vila-viva
git add app/src/domain/badges.ts app/tests/domain/badges.test.ts
git commit -m "feat(gamif): domain badges com 3 badges desbloqueáveis (TDD)"
```

---

## Task 3: `SementesDisplay` component

**Files:**
- Create: `app/src/components/SementesDisplay.tsx`

- [ ] **Step 1: Criar componente**

```tsx
export function SementesDisplay({ total }: { total: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-3xl" aria-hidden="true">🌱</span>
      <div>
        <p className="font-display text-2xl text-mata leading-none">{total}</p>
        <p className="text-xs opacity-60">Sementes</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
cd C:/Users/Samsung/projetos/vila-viva/app
npm run typecheck
```

Expected: 0 erros.

- [ ] **Step 3: Commit**

```bash
cd C:/Users/Samsung/projetos/vila-viva
git add app/src/components/SementesDisplay.tsx
git commit -m "feat(gamif): SementesDisplay — emoji + contador + label"
```

---

## Task 4: `BadgesGrid` component

**Files:**
- Create: `app/src/components/BadgesGrid.tsx`

- [ ] **Step 1: Criar componente**

```tsx
import { BADGES, type BadgeSlug } from '@/domain/badges';

export function BadgesGrid({ unlocked }: { unlocked: BadgeSlug[] }) {
  const unlockedSet = new Set<BadgeSlug>(unlocked);
  return (
    <div>
      <p className="text-xs opacity-60 mb-2">Conquistas</p>
      <div className="flex gap-3">
        {Object.values(BADGES).map((b) => {
          const isUnlocked = unlockedSet.has(b.slug);
          return (
            <div
              key={b.slug}
              className={`flex flex-col items-center text-center w-24 p-2 rounded-soft ${
                isUnlocked ? 'bg-mata/10 text-carvao' : 'bg-carvao/5 text-carvao/40'
              }`}
              title={isUnlocked ? b.descricao : `Como desbloquear: ${b.criterio}`}
            >
              <span className="text-2xl mb-1" aria-hidden="true">
                {isUnlocked ? '🏵️' : '🔒'}
              </span>
              <p className="text-xs font-medium">{b.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

Expected: 0 erros.

- [ ] **Step 3: Commit**

```bash
cd C:/Users/Samsung/projetos/vila-viva
git add app/src/components/BadgesGrid.tsx
git commit -m "feat(gamif): BadgesGrid — 3 badges desbloqueado/bloqueado com tooltip"
```

---

## Task 5: Modificar `Profile.tsx` — queries + render

**Files:**
- Modify: `app/src/routes/Profile.tsx`

- [ ] **Step 1: Ler arquivo atual**

Ler `app/src/routes/Profile.tsx` (já tem useAuth, useQuery, signOut, Link). Identifique:
- Onde está a query atual do profile (`useQuery({ queryKey: ['profile', id], ... })`)
- Onde renderiza nome, perfil_tipo, intencao, bio, "Editar perfil", "Sair"

- [ ] **Step 2: Adicionar imports**

No topo:

```tsx
import { calcularSementes, type SementesCounts } from '@/domain/sementes';
import { badgesDesbloqueados } from '@/domain/badges';
import { SementesDisplay } from '@/components/SementesDisplay';
import { BadgesGrid } from '@/components/BadgesGrid';
```

- [ ] **Step 3: Adicionar 2 queries paralelas**

Após o `useQuery` existente do profile, adicionar:

```tsx
const { data: postCounts } = useQuery({
  queryKey: ['profile_post_counts', id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('post')
      .select('tipo')
      .eq('autor_id', id!);
    if (error) throw error;
    const counts: SementesCounts = {
      historia: 0,
      pedido: 0,
      evento: 0,
      projeto: 0,
      conquista: 0,
      vaga: 0,  // preenchido na próxima query
    };
    for (const p of data) {
      const t = p.tipo as keyof SementesCounts;
      if (t in counts) counts[t]++;
    }
    return counts;
  },
  enabled: !!id,
});

const { data: vagaCounts } = useQuery({
  queryKey: ['profile_vaga_counts', id],
  queryFn: async () => {
    const [{ count: vagas_criadas }, { count: vaga_interesses }] = await Promise.all([
      supabase.from('vaga').select('*', { count: 'exact', head: true }).eq('autor_id', id!),
      supabase
        .from('vaga_interesse')
        .select('*', { count: 'exact', head: true })
        .eq('interessado_id', id!),
    ]);
    return {
      vaga: vagas_criadas ?? 0,
      vaga_interesse: vaga_interesses ?? 0,
    };
  },
  enabled: !!id,
});
```

- [ ] **Step 4: Computar Sementes total e badges**

Após as queries (antes do return):

```tsx
const sementesTotal =
  postCounts && vagaCounts
    ? calcularSementes({ ...postCounts, vaga: vagaCounts.vaga })
    : null;

const unlocked =
  postCounts && vagaCounts
    ? badgesDesbloqueados({
        projeto: postCounts.projeto,
        conquista: postCounts.conquista,
        vaga_interesse: vagaCounts.vaga_interesse,
      })
    : null;
```

- [ ] **Step 5: Inserir bloco de gamificação no JSX**

Encontre a estrutura visual. Inserir o bloco **entre** o último elemento de informação (bio ou intencao) e o bloco condicional `{data.id === session.user.id && (...)}` que tem "Editar perfil" + "Sair".

```tsx
{(sementesTotal !== null || (unlocked && unlocked.length > 0)) && (
  <div className="pt-4 border-t border-carvao/10 space-y-4">
    {sementesTotal !== null && <SementesDisplay total={sementesTotal} />}
    {unlocked && <BadgesGrid unlocked={unlocked} />}
  </div>
)}
```

> Cuidado: o `unlocked && unlocked.length > 0` na condição externa permite mostrar a seção mesmo se SEMENTES é 0 mas badges é null (loading). Ajuste se preferir lógica mais simples: `(sementesTotal !== null && unlocked) && ...` exige ambos carregarem antes de aparecer.

- [ ] **Step 6: Verificar build**

```bash
cd C:/Users/Samsung/projetos/vila-viva/app
npm run typecheck && npm run build
```

Expected: 0 erros.

- [ ] **Step 7: Commit**

```bash
cd C:/Users/Samsung/projetos/vila-viva
git add app/src/routes/Profile.tsx
git commit -m "feat(gamif): Profile renderiza Sementes + 3 badges via 2 queries agregadas"
```

---

## Task 6: Deploy + push

**Files:** nenhum (operações)

- [ ] **Step 1: Push para GitHub**

```bash
cd C:/Users/Samsung/projetos/vila-viva
git push origin master 2>&1 | tail -3
```

- [ ] **Step 2: Deploy Vercel**

```bash
cd C:/Users/Samsung/projetos/vila-viva/app
vercel --prod --yes 2>&1 | tail -5
```

Expected: "Ready" + URL de produção.

- [ ] **Step 3: Smoke test via curl**

```bash
curl -I https://app-vila-viva.vercel.app 2>&1 | head -5
```

Expected: HTTP 200.

---

## Task 7: Bug-pass manual no iPhone

**Files:** nenhum (manual)

- [ ] **Step 1: Abrir produção**

Hard reload `https://app-vila-viva.vercel.app` no iPhone.

- [ ] **Step 2: Validar 5 cenários**

1. **Meu próprio perfil** — click no nome no header → `/profile/<my-id>`. Ver Sementes total + 3 badges com estado correto.
2. **Perfil da Aurora** (criou 1 historia no seed) — Sementes = 2, 3 badges bloqueados.
3. **Perfil do Joaquim** (criou 1 historia + 1 vaga "Manutenção elétrica") — Sementes = 2 + 5 = 7, 3 badges bloqueados.
4. **Perfil do eciocesario** — Sementes depende do que você criou em testes; badges variam.
5. **Polinizadora limitada por RLS** — abre perfil de qualquer seed user; Polinizadora aparece bloqueado mesmo se hipoteticamente desbloqueou (RLS de vaga_interesse esconde COUNT alheio). No SEU próprio perfil, Polinizadora reflete corretamente.

- [ ] **Step 3: Anotar bugs (se houver)**

Reportar pro usuário. Bugs encontrados viram tasks novas.

---

# Resumo

| Task | O que faz |
|---|---|
| 1 | domain/sementes.ts + TDD |
| 2 | domain/badges.ts + TDD |
| 3 | SementesDisplay component |
| 4 | BadgesGrid component |
| 5 | Profile.tsx — 2 queries + render gamificação |
| 6 | Deploy + push |
| 7 | Bug-pass manual iPhone |

**Total: 7 tasks.** Estimativa ~2 horas de execução subagent-driven.

**Sem flag dedicada** — feature entra direto para todos os usuários, pois é additiva (não muda nenhum fluxo existente) e não-invasiva (só aparece em /profile).
