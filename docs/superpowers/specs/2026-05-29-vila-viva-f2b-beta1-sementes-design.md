# Vila Viva F2b-β.1 · Sementes + 3 Badges — Design Spec

**Data:** 2026-05-29
**Autor:** Écio Cesário, com Claude (Opus 4.7)
**Status:** Em review do usuário
**Relação com o plano técnico:** primeira de 2 ondas do F2b-β (Gamificação), seguindo a decomposição prescrita no §13/§15 do `docs/vila_viva_v3_3.pdf` ("Gamificação inicial: Sementes + 3 badges"). A onda 2 (F2b-β.2) entrega Raízes + 8 níveis + 5 badges restantes + badges coletivos.
**Relação com entregas anteriores:** continuação do Vila Viva Light (F2a) + F2b-α Vagas. Aplicação rodando em `https://app-vila-viva.vercel.app`.

---

## 1. Posicionamento

Primeira onda de gamificação seguindo o roadmap do v3.3 (§13: "Fase 3 ... gamificação inicial (Sementes + 3 badges)"). Acrescenta um sistema de **Sementes** (pontos ganhos automaticamente por contribuição) e **3 badges desbloqueáveis** ao Vila Viva Light, exibidos na página de Perfil.

**Princípio arquitetural central:** **compute on-demand**. Sem migrations, sem schema novo, sem triggers Postgres. A página `/profile/:id` faz queries agregadas (SUM/COUNT) sobre tabelas existentes (`post`, `vaga`, `vaga_interesse`) ao renderizar. Backfill é grátis — derivado dos dados atuais.

**O que NÃO é:**
- ❌ Raízes (peer reputation) — F2b-β.2
- ❌ 8 níveis de progressão (Semente → Broto → ... → Raiz Viva) — F2b-β.2
- ❌ 5 badges restantes (Raiz Profunda, Guardiã do Fogo, Plantadora, Solstício, Luna Nova) — F2b-β.2
- ❌ Badges coletivos (vila inteira atinge meta) — F2b-β.2
- ❌ Notificação de "🎉 desbloqueou X badge" — F2b-β.2 (exige trigger-based unlock)
- ❌ Decay de Sementes antigas — fora do v3.3
- ❌ Pontos por comentar/reagir/demonstrar interesse — fora do v3.3 (lista só criação de post)
- ❌ Display em FeedCard / MatchCard / VagaCard — só Profile

**Critério de sucesso:** ao abrir `/profile/:id` (próprio ou alheio), vê-se o total de Sementes + 3 badges (desbloqueados com cor/destaque, bloqueados em cinza com tooltip do critério). Stakeholder interpreta a contribuição da pessoa em ~2 segundos.

---

## 2. Modelo de dados

**Schema: 0 mudanças.** Nada novo no banco. Toda lógica vive no domain TypeScript + queries Supabase a partir das tabelas existentes.

### 2.1 Pesos das Sementes (constante no domain)

Per v3.3 §12:

| Ação | Sementes |
|---|---:|
| Criar post tipo `historia` | 2 |
| Criar post tipo `pedido` | 3 |
| Criar post tipo `evento` | 5 |
| Criar vaga (qualquer tipo) | 5 |
| Criar post tipo `projeto` | 8 |
| Criar post tipo `conquista` | 10 |

Note que `vaga` no v3.3 é uma das ações pontuáveis — no nosso schema vaga vive em sua própria tabela (`vaga`), não em `post.tipo`. Então a Sementes total combina:
- SUM(weight(post.tipo)) WHERE post.autor_id = profile.id
- COUNT(*) * 5 FROM vaga WHERE autor_id = profile.id

### 2.2 Catálogo de badges (constante no domain)

3 badges, critérios SQL-count automatizáveis:

| Slug | Label | Critério |
|---|---|---|
| `tecela` | Tecelã | 5+ posts tipo `projeto` (`COUNT(post WHERE autor_id = id AND tipo = 'projeto') >= 5`) |
| `polinizadora` | Polinizadora | 3+ vagas distintas com "Tenho interesse" demonstrado (`COUNT(vaga_interesse WHERE interessado_id = id) >= 3`) |
| `fonte_de_saber` | Fonte de Saber | 5+ posts tipo `conquista` (`COUNT(post WHERE autor_id = id AND tipo = 'conquista') >= 5`) |

### 2.3 RLS implications

**Limitação aceita:** A RLS de `vaga_interesse` (definida em migration 017) permite SELECT apenas para `interessado_id = auth.uid()` OR `vaga.autor_id = auth.uid()`. Isso significa:

- ✅ Posso ver badge **Polinizadora** no meu próprio perfil (eu sou interessado)
- ❌ NÃO posso ver Polinizadora no perfil de outros (RLS bloqueia COUNT alheio)

Quando visitando perfil de outro usuário, o badge Polinizadora aparece sempre como bloqueado (mesmo se a pessoa realmente desbloqueou). Aceito como decisão consciente de privacidade — não exigimos ver quem se interessou em quais vagas publicamente.

Fix para F2b-β.2 (se quisermos badges sociais públicos): criar uma RPC `get_polinizadora_count(profile_id)` com SECURITY DEFINER que bypassa RLS.

---

## 3. UX e componentes

### 3.1 Novos arquivos (6)

| Arquivo | Responsabilidade |
|---|---|
| `app/src/domain/sementes.ts` | Constante `SEMENTES_POR_TIPO` + função `calcularSementes(counts)` |
| `app/src/domain/badges.ts` | Constante `BADGES` (catálogo de 3) + função `badgesDesbloqueados(counts)` |
| `app/tests/domain/sementes.test.ts` | TDD: ~4 testes (zero, soma simples, mix, overflow) |
| `app/tests/domain/badges.test.ts` | TDD: ~5 testes (cada badge isolado, threshold exato, todos combinados) |
| `app/src/components/SementesDisplay.tsx` | Bloco visual 🌱 + número + label |
| `app/src/components/BadgesGrid.tsx` | Linha de 3 ícones desbloqueado/bloqueado com tooltip |

### 3.2 Arquivo modificado (1)

`app/src/routes/Profile.tsx` — adicionar 2 queries (post counts agregados + vaga counts), calcular Sementes e badges, renderizar os 2 componentes novos.

### 3.3 Funções domain (esboço)

```typescript
// app/src/domain/sementes.ts
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

```typescript
// app/src/domain/badges.ts
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

### 3.4 SementesDisplay.tsx (esboço)

```tsx
export function SementesDisplay({ total }: { total: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-3xl">🌱</span>
      <div>
        <p className="font-display text-2xl text-mata leading-none">{total}</p>
        <p className="text-xs opacity-60">Sementes</p>
      </div>
    </div>
  );
}
```

### 3.5 BadgesGrid.tsx (esboço)

```tsx
import { BADGES, type BadgeSlug } from '@/domain/badges';

export function BadgesGrid({ unlocked }: { unlocked: BadgeSlug[] }) {
  const unlockedSet = new Set(unlocked);
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
              <span className="text-2xl mb-1">{isUnlocked ? '🏵️' : '🔒'}</span>
              <p className="text-xs font-medium">{b.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 3.6 Profile.tsx — onde inserir

Entre o bloco de bio existente e o bloco de botões "Editar perfil / Sair" existente:

```tsx
{/* Gamificação */}
{(sementesTotal !== null || unlocked) && (
  <div className="pt-4 border-t border-carvao/10 space-y-4">
    {sementesTotal !== null && <SementesDisplay total={sementesTotal} />}
    {unlocked && <BadgesGrid unlocked={unlocked} />}
  </div>
)}
```

Com as 2 queries adicionais já fazendo o trabalho de buscar os counts (via `useQuery` em paralelo às queries existentes).

### 3.7 Queries no Profile

```typescript
const { data: postCounts } = useQuery({
  queryKey: ['profile_post_counts', id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('post')
      .select('tipo')
      .eq('autor_id', id!);
    if (error) throw error;
    const counts: Record<string, number> = {
      historia: 0, pedido: 0, evento: 0, projeto: 0, conquista: 0,
    };
    for (const p of data) counts[p.tipo] = (counts[p.tipo] ?? 0) + 1;
    return counts as SementesCounts;
  },
  enabled: !!id,
});

const { data: vagaCounts } = useQuery({
  queryKey: ['profile_vaga_counts', id],
  queryFn: async () => {
    const [{ count: vagas_criadas }, { count: vaga_interesses }] = await Promise.all([
      supabase.from('vaga').select('*', { count: 'exact', head: true }).eq('autor_id', id!),
      supabase.from('vaga_interesse').select('*', { count: 'exact', head: true }).eq('interessado_id', id!),
    ]);
    return {
      vaga: vagas_criadas ?? 0,
      vaga_interesse: vaga_interesses ?? 0,
    };
  },
  enabled: !!id,
});
```

> **TanStack Query staleTime padrão 60s** se aplica — cached por 1min em re-visitas ao perfil.

---

## 4. Sequência de entrega (1 fase única, ~12 tasks)

F2b-β.1 não justifica decomposição em fases. Lógica interna:

### Bloco 1 · Domain TDD (4 tasks)

1. `sementes.ts` + teste TDD (red → green → commit)
2. `badges.ts` + teste TDD (red → green → commit)

### Bloco 2 · Componentes (3 tasks)

3. `SementesDisplay.tsx`
4. `BadgesGrid.tsx`
5. Atualizar `Profile.tsx` com 2 queries + render

### Bloco 3 · Deploy + bug-pass (2 tasks)

6. Build + push + Vercel deploy
7. Bug-pass manual no iPhone

**Estimativa:** ~2 horas de execução com subagent-driven (vs 1 dia inteiro do F2b-α).

### Estado depois

- Aurora (criou seed posts) terá Sementes baseado nos posts dela
- Seeds que criaram vagas terão também os pontos delas
- Você (eciocesario) terá pontos de tudo que criou + 0-1 badge dependendo do tipo
- Eciomar terá 0-poucas Sementes (não criou muito conteúdo ainda)

---

## 5. Cortes explícitos

### Cortado vs §12 v3.3 (vai para F2b-β.2)
- Raízes (peer reputation)
- 8 níveis de progressão
- 5 badges restantes (Raiz Profunda, Guardiã do Fogo, Plantadora, Solstício, Luna Nova)
- Badges coletivos (vila inteira atinge meta)
- Notificação de unlock

### Cortado dentro do escopo desta entrega
- Polinizadora visível em perfis alheios (RLS de `vaga_interesse` bloqueia COUNT público)
- Decay de Sementes antigas
- Pontos por comentar/reagir/demonstrar interesse
- Display em cards de Feed/Match/Vaga

---

## 6. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Performance: 2 queries extras por load de Profile | Cache TanStack Query 60s; ~100 posts/user máx; cost negligível |
| RLS de `vaga_interesse` esconde Polinizadora de outros | Documentado; fix em F2b-β.2 via RPC SECURITY DEFINER se houver demanda |
| Compute on-demand sem trilha "quando ganhou X" | Aceito; F2b-β.1 não tem celebração; histórico em F2b-β.2 |
| Drift se posts forem deletados via Studio | Compute sempre reflete estado atual — sem drift por design |
| `count: 'exact'` caro em produção futura | Pra <1000 rows é instantâneo; revisitar se vila crescer |
| Stakeholder estranha "Sementes" vs "Pontos" | Termo já estabelecido no v3.3 e na comunidade; manter |

---

## 7. Decisões registradas

| # | Decisão | Status |
|---|---|---|
| 1 | F2b-β decomposto em β.1 (Sementes + 3 badges) e β.2 (Raízes + 8 níveis + 5 badges + coletivos) | Decidido |
| 2 | Ações pontuáveis: só 6 tipos do v3.3 (historia 2, pedido 3, evento 5, vaga 5, projeto 8, conquista 10) | Decidido |
| 3 | Backfill: tudo retroativo via compute on-demand (deriva de dados existentes) | Decidido |
| 4 | 3 badges com critérios SQL-counts: Tecelã (5+ projetos), Polinizadora (3+ vaga_interesse), Fonte de Saber (5+ conquistas) | Decidido |
| 5 | Visibilidade: só na página `/profile/:id` (não em cards) | Decidido |
| 6 | Arquitetura: compute on-demand, 0 mudanças no banco, 0 triggers | Decidido |
| 7 | Polinizadora visível só no próprio perfil (RLS limita COUNT alheio) | Decidido (aceitar limitação) |
| 8 | Visual: emoji 🏵️ desbloqueado, 🔒 bloqueado, tooltip com critério | Decidido (confirmar review) |
| 9 | Sem notificação de unlock nesta fase | Decidido |
| 10 | Sem flag feature dedicada (entra direto, todos veem; Profile é gateado por session) | Decidido (confirmar review) |

---

## 8. Próximos passos

1. Você relê este spec.
2. Se houver ajustes, voltamos ao arquivo.
3. Quando aprovado, invoco `writing-plans` para gerar plano de implementação (~12 tasks executáveis).
4. Só então código.
