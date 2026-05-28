# Vila Viva F2b-α · Vagas — Design Spec

**Data:** 2026-05-28
**Autor:** Écio Cesário, com Claude (Opus 4.7)
**Status:** Em review do usuário
**Relação com o plano técnico:** primeiro de 5 spin-offs decompostos do §6.F2b do plano v1.2 (`docs/vila_viva_plano_tecnico_v1_2.md`). Os outros 4 (Gamificação, PWA cache, Email, LGPD) seguem em F2b-β..ε.
**Relação com a entrega anterior:** continuação do Vila Viva Light (F2a) entregue em 2026-05-27, aplicação rodando em `https://app-vila-viva.vercel.app`.

---

## 1. Posicionamento

Adição de **Vagas** (oportunidades de Voluntariado e Remunerado) à Vila Viva Light, permitindo que usuários publiquem necessidades de ajuda e outros sinalizem interesse. A conversa real acontece fora da plataforma (WhatsApp, encontro presencial); a plataforma facilita apenas a **descoberta** e o **sinal de interesse**.

**Princípio de design:** reaproveitamento integral dos padrões já provados no Light:
- FAB + bottom-sheet (mesma UX de criar post)
- Feature flag (`vagas` default off, destrava manualmente no Studio antes do convite a stakeholders)
- Rota nova com NavLink no AppLayout existente
- RLS Postgres como autorização única
- Notificações Realtime via trigger Postgres (infra já existe)
- Skills do catálogo existente (sem novas tabelas de habilidades)

**O que NÃO é:**
- ❌ Workflow de candidatura com estados (aceita/rejeita/preenchida) — só "Tenho interesse" booleano
- ❌ Mensageria in-platform — conversa via WhatsApp/presencial
- ❌ Email notifications de novo interesse — adiado para F2b-δ
- ❌ Ranking inteligente "vagas pra mim" via matchScore — adiado para F2b-α.2 se houver demanda
- ❌ Integração com Censo ou tratamento especial perfil Aliado↔Cultivador no Match de vagas

**Critério de sucesso:** stakeholder consegue, do iPhone, (a) criar uma vaga em < 60s, (b) ver lista de vagas filtradas por tipo + skill, (c) clicar "Tenho interesse" e o autor receber notificação Realtime em < 2s.

---

## 2. Arquitetura

**Stack:** mesma do Light, sem desvios. React 18 + Vite + TS strict + Tailwind + Supabase (Postgres + Auth + Realtime) + Vercel. **Sem Edge Function nova** — tudo via PostgREST + RLS.

**Reaproveitamento direto:**
- Catálogo `skill` (52 entradas)
- Tabela `profile` + perfil_tipo + RLS
- `feature_flag` + hook `useFlag`
- `notification` + Realtime + NotificationBell
- `AppLayout` + NavLink ativo
- ShareWaButton (componente genérico)
- Pattern de FAB + bottom-sheet (PostCreator)
- Pattern de optimistic UI (ReactionBar)

---

## 3. Modelo de dados

### 3.1 Tabelas novas (3)

```sql
-- vaga: a oportunidade publicada
CREATE TABLE public.vaga (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('voluntariado', 'remunerado')),
  titulo TEXT NOT NULL CHECK (length(titulo) BETWEEN 3 AND 80),
  descricao TEXT NOT NULL CHECK (length(descricao) BETWEEN 10 AND 2000),
  local TEXT,                                     -- "Casa do Vento", "Remoto", etc.
  periodo TEXT,                                   -- "Sábado 8h-12h", "1 mês ongoing"
  valor_remuneracao TEXT,                         -- livre; só preenchido quando tipo='remunerado'
  status TEXT NOT NULL DEFAULT 'aberta'
    CHECK (status IN ('aberta', 'fechada')),
  count_interesses INT NOT NULL DEFAULT 0,        -- denormalizado via trigger; público
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX vaga_status_created_idx ON public.vaga (status, created_at DESC);
CREATE INDEX vaga_autor_idx ON public.vaga (autor_id);
CREATE INDEX vaga_tipo_idx ON public.vaga (tipo);

-- vaga_skill: habilidades requeridas (N:N com catálogo skill existente)
CREATE TABLE public.vaga_skill (
  vaga_id UUID NOT NULL REFERENCES public.vaga(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skill(id) ON DELETE CASCADE,
  PRIMARY KEY (vaga_id, skill_id)
);

CREATE INDEX vaga_skill_skill_idx ON public.vaga_skill (skill_id);

-- vaga_interesse: quem clicou "Tenho interesse"
CREATE TABLE public.vaga_interesse (
  vaga_id UUID NOT NULL REFERENCES public.vaga(id) ON DELETE CASCADE,
  interessado_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (vaga_id, interessado_id)            -- garantia única + cheap dedup
);
```

### 3.2 RLS — autorização por linha

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `vaga` | autenticado (público) | autenticado WHERE `autor_id = auth.uid()` | autor | autor |
| `vaga_skill` | autenticado | autor da vaga (via subquery) | — | autor da vaga |
| `vaga_interesse` | `interessado_id = auth.uid()` OR `vaga.autor_id = auth.uid()` | `interessado_id = auth.uid()` | — | `interessado_id = auth.uid()` |

A privacidade da lista de interessados sai de graça: visitante consultando `vaga_interesse` por uma vaga que não é dele recebe linhas vazias (RLS filtra). O **contador público** vive em `vaga.count_interesses` (mantido por trigger).

### 3.3 Triggers (2 novos)

**`tg_vaga_interesse_count`** — após INSERT/DELETE em `vaga_interesse`, atualiza `vaga.count_interesses` com `+1` ou `-1` (atomic, sem race condition).

**`tg_vaga_interesse_notify`** — após INSERT em `vaga_interesse`, insere `notification` com `tipo='vaga_interesse_recebido'` para `vaga.autor_id`, **skip** se `NEW.interessado_id = autor_id` (autor não notifica a si mesmo). Payload: `{ vaga_id, interessado_id }`.

### 3.4 ALTER constraint em `notification`

A CHECK constraint atual (migration 009) tem 4 tipos. Migration 017 dropa e recria com 5 tipos incluindo `vaga_interesse_recebido`:

```sql
ALTER TABLE public.notification DROP CONSTRAINT notification_tipo_check;
ALTER TABLE public.notification ADD CONSTRAINT notification_tipo_check
  CHECK (tipo IN (
    'post_comentado', 'reaction_recebida', 'match_sugerido',
    'challenge_progresso', 'vaga_interesse_recebido'
  ));
```

### 3.5 Feature flag

```sql
INSERT INTO public.feature_flag (key, enabled) VALUES ('vagas', false)
  ON CONFLICT (key) DO NOTHING;
```

Hook `useFlag('vagas')` gateia a NavLink, as rotas, e o FAB de criar vaga.

### 3.6 Migrations + tipos

- `015_vaga.sql` — tabela vaga + indexes + RLS + count trigger + updated_at trigger
- `016_vaga_skill.sql` — tabela vaga_skill + RLS
- `017_vaga_interesse.sql` — tabela vaga_interesse + RLS + notify trigger + ALTER notification CHECK
- `018_feature_flag_vagas.sql` — INSERT flag

Após apply: `supabase gen types typescript --linked > src/lib/database.types.ts` para refletir os novos types.

---

## 4. UX, rotas e componentes

### 4.1 Novas rotas (3)

| Path | Renderiza | Acesso |
|---|---|---|
| `/vagas` | `Vagas.tsx` — lista 2 abas + filtros | autenticado, gated por flag |
| `/vagas/:id` | `VagaDetail.tsx` — detalhe + interesse + share | autenticado, gated por flag |
| `/vagas/:id/interessados` | `VagaInteressados.tsx` — lista privada | autor; se não-autor, Navigate to `/vagas/:id` |

### 4.2 Novos componentes/routes (7)

| Arquivo | Responsabilidade |
|---|---|
| `routes/Vagas.tsx` | 2 abas (Voluntariado/Remunerado), chips skill multi-select, lista filtrada por `status='aberta'`, FAB embutida |
| `routes/VagaDetail.tsx` | Detalhe completo + InteresseButton + ShareWaButton + (se autor) link "Ver interessados" e botão "Fechar vaga" |
| `routes/VagaInteressados.tsx` | Lista profiles que clicaram interesse — nome + perfil_tipo + link pro perfil |
| `components/VagaCard.tsx` | Card compacto: título + autor (link) + tipo (badge) + 2-3 skills chips + `count_interesses` + "há X dias" |
| `components/VagaCreator.tsx` | FAB + bottom-sheet com form completo |
| `components/InteresseButton.tsx` | Toggle "Tenho interesse" ↔ "Você se interessou ✓" + contador, optimistic UI |
| `components/VagaSkillSelector.tsx` | Multi-select chips do catálogo skill (usado em Creator e em Vagas filter) |

### 4.3 Domain layer

`app/src/domain/vagaTypes.ts` — exporta:
- `VAGA_TIPOS = ['voluntariado', 'remunerado'] as const`
- `type VagaTipo = typeof VAGA_TIPOS[number]`
- `vagaTipoLabel(t: VagaTipo): string` retornando 'Voluntariado' ou 'Remunerado'
- `isVagaTipo(s: string): s is VagaTipo`

Teste TDD em `app/tests/domain/vagaTypes.test.ts` com 3 casos (lista, type guard, label PT-BR).

### 4.4 Modificações em arquivos existentes

- `components/AppLayout.tsx` — adiciona NavLink "Vagas" entre "Pessoas" e "Desafios"
- `components/NotificationBell.tsx` — `describeNotif` ganha case `vaga_interesse_recebido: 'Alguém demonstrou interesse na sua vaga.'`
- `App.tsx` — wire 3 rotas novas dentro do AppLayout

### 4.5 Fluxos chave

**Criar vaga** — Em `/vagas`, FAB → bottom-sheet:
- Radio tipo (Voluntariado padrão)
- Título input (3-80 chars, contador visível)
- Descrição textarea (10-2000 chars)
- Local input (opcional)
- Período input (opcional)
- Valor input (opcional, **só aparece quando tipo=remunerado**)
- Skills requeridas (VagaSkillSelector — multi-select chips)
- Publicar

Mutação: 2 INSERTs sequenciais (vaga → pega `id` → vaga_skill em batch). `qc.invalidateQueries(['vagas'])` após sucesso. Fecha o sheet e renderiza no topo da lista.

**Listagem** — `/vagas` mostra vagas `status='aberta'` ordenadas por `created_at DESC`. Tabs filtram por `tipo`. Chips de skills filtram por interseção:

```sql
SELECT v.*, ARRAY_AGG(s.slug) AS skills
FROM vaga v
LEFT JOIN vaga_skill vs ON vs.vaga_id = v.id
LEFT JOIN skill s ON s.id = vs.skill_id
WHERE v.status = 'aberta'
  AND v.tipo = $1
  AND ($2::uuid[] IS NULL OR v.id IN (
    SELECT vaga_id FROM vaga_skill WHERE skill_id = ANY($2)
  ))
GROUP BY v.id
ORDER BY v.created_at DESC
LIMIT 50;
```

Sem search textual. Skill filter = OR ("tem pelo menos UMA dessas").

**Detalhe** — `/vagas/:id` renderiza todos os campos. Botão "Tenho interesse" alterna entre INSERT/DELETE em `vaga_interesse` com optimistic UI (pattern do ReactionBar). Se você é autor (`vaga.autor_id === session.user.id`), 2 botões extras: "Ver interessados (X)" → `/vagas/:id/interessados`, e "Fechar vaga" (UPDATE status='fechada'). Botão interesse fica disabled quando você é autor (evitar interesse na própria vaga).

**Notificação** — Trigger insere `notification` para autor. NotificationBell já trata via Realtime + describeNotif precisa do case novo.

**Share WhatsApp** — Botão wa.me com URL do detail (`${origin}/vagas/${id}`). Mesmo pattern do ShareWaButton existente.

**Fechar vaga** — Atualiza `status='fechada'`. Some da lista pública. Acesso direto via URL ainda funciona (autor pode revisar histórico).

### 4.6 Seeds

`app/supabase/seed.sql` ganha um novo bloco que insere 8 vagas fictícias após os profiles e posts já existentes:

- 4 voluntariado (típico: "Preciso de ajuda pra carregar mudas sábado", "Mediação de Reunião Casa do Vento", "Tradução de carta pra parceria com BIOMAS", "Acompanhar visita de pesquisador")
- 4 remunerado (típico: "Aulas de inglês 2x/sem", "Manutenção elétrica casa", "Diarista 1x/sem", "Aula de yoga semanal")
- Cada vaga vinculada a 1-3 skills do catálogo
- Distribuídas entre os 14 seed users como autores
- Todas com `status='aberta'`, `count_interesses=0`

### 4.7 Observabilidade (PostHog)

4 eventos novos: `vaga_created` (com `tipo`), `vaga_interesse_clicked` (com `vaga_id`, ação `add`/`remove`), `vaga_share_wa_clicked`, `vaga_closed`. No-op até `VITE_POSTHOG_KEY` ser configurada.

---

## 5. Sequência de entrega (5 fases iterativas)

Como "sem prazo definido", cada fase é uma entrega coerente que pode ser pausada antes da próxima. Stakeholders podem ser convidados ao fim das Fases 2, 3, 4 e 5 (cada uma agrega valor sentível).

### Fase 1 · Schema + seeds (invisível ao usuário)

- Migrations 015-018 aplicadas
- `database.types.ts` regenerado
- `vagaTypes.ts` + 3 testes TDD
- 8 seed vagas inseridas via `supabase db query`

**Critério de saída:** `supabase migration list` mostra 015-018; total de tests 23/23 (20 atuais após F2a + 3 vagaTypes); 8 vagas no DB; nada visível na UI ainda.

### Fase 2 · Listagem read-only

- `VagaCard.tsx` + `VagaSkillSelector.tsx`
- `Vagas.tsx` com 2 abas + chips
- NavLink no AppLayout
- Rota em App.tsx

**Critério de saída:** ao destravar flag `vagas=true`, você vê 8 seed vagas no /vagas, abas alternam tipo, chips filtram.

### Fase 3 · Detalhe + Interesse

- `VagaDetail.tsx`
- `InteresseButton.tsx` com optimistic UI
- `NotificationBell.describeNotif` atualizado
- ShareWaButton reaproveitado

**Critério de saída:** clicar em uma vaga abre detalhe; click "Tenho interesse" insere row + autor recebe notificação em < 2s; toggle funciona; share WA abre wa.me corretamente.

### Fase 4 · Criar vaga

- `VagaCreator.tsx` (FAB + bottom-sheet)
- Embebido no `Vagas.tsx`

**Critério de saída:** do iPhone, em < 60s, você cria uma vaga de cada tipo, aparece no topo da lista, persiste após reload.

### Fase 5 · Ferramentas do autor + go-live

- `VagaInteressados.tsx`
- Botões "Ver interessados" + "Fechar vaga" no detail
- Vercel deploy de produção
- Flip `vagas=true` no Studio

**Critério de saída:** vagas fechadas somem da lista pública; autor vê os 2 botões; lista de interessados privada funciona; stakeholders convidados conseguem usar Vagas end-to-end.

---

## 6. Cortes explícitos

### Cortado vs §6.F2b oficial (vai pra F2b-β..ε)
- Gamificação (Sementes, Raízes, níveis, badges) — F2b-β
- Email notifications via Resend — F2b-δ
- LGPD endpoints export/delete-user-data — F2b-ε
- PWA data cache (feed/perfis offline) — F2b-γ

### Cortado dentro de Vagas (este spin-off)
- Workflow de candidatura com estados (aceita/rejeita)
- Mensageria in-platform
- Ranking inteligente "vagas pra mim"
- Edição de vaga após criação (só fechar)
- Multiple statuses além de aberta/fechada
- Filtro textual (search)
- Vagas atribuídas a organizações (sempre individual)
- Pagamento integrado
- Endereço estruturado / mapa
- Atachar fotos
- Application rate limits

---

## 7. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Spam (vagas frívolas em massa) | Você é admin único; se virar problema, rate limit via Postgres function |
| Skill ausente no catálogo | Pular essa skill no MVP; F3 expande via Censo |
| Race condition no `count_interesses` | Trigger usa UPDATE atomic — sem race |
| Notification spam (autor recebe muitas) | 1 notif por par único (vaga, interessado); PK previne duplicates |
| Vagas remuneradas sem garantia de pagamento | Aviso na descrição que transação é fora da plataforma — fora do escopo |
| LGPD: lista de interessados expõe nome+perfil | RLS bloqueia visitantes; só autor vê. Cobertura completa LGPD em F2b-ε |
| Vaga "preenchida" continua aparecendo (autor esqueceu de fechar) | Botão "Fechar vaga" no detail; UX explicita |
| Autor da vaga deletado/conta apagada | ON DELETE CASCADE limpa todas as vagas dele — aceito |

---

## 8. Decisões registradas

| # | Decisão | Status |
|---|---|---|
| 1 | Vagas é primeiro de 5 spin-offs do F2b (β=Gamificação, γ=PWA, δ=Email, ε=LGPD) | Decidido |
| 2 | Fluxo de candidatura: só "Tenho interesse" + share WA (não workflow de aceita/rejeita) | Decidido |
| 3 | Visibilidade da lista de interessados: privada, só autor vê; visitantes veem contador apenas | Decidido |
| 4 | Pace: sem prazo definido, iterativo, pausa entre fases | Decidido |
| 5 | Abordagem: reaproveitamento direto dos padrões do Light (PostCreator, ReactionBar, AppLayout, RLS) | Decidido |
| 6 | Posição da NavLink "Vagas": entre "Pessoas" e "Desafios" | Decidido (confirmar review) |
| 7 | Sem search textual nesta fase — só filtros estruturados (aba tipo + chips skill) | Decidido (confirmar review) |
| 8 | Sem edição de vaga após criação — só fechar/re-criar | Decidido (confirmar review) |
| 9 | Ordem da lista: `created_at DESC` | Decidido (confirmar review) |
| 10 | Quantidade de seed vagas: 8 (4 voluntariado + 4 remunerado) | Decidido (confirmar review) |
| 11 | Quem pode criar vaga? Todos os 14 perfis pickáveis (incluindo Semente); `observador` já bloqueado por estar fora do MVP | Decidido |
| 12 | Vaga deletável? Apenas fechável; delete físico só via Studio admin | Decidido |
| 13 | Edge Function? Não — tudo via PostgREST + RLS | Decidido |
| 14 | Nova flag `vagas` default `false` | Decidido |

---

## 9. Próximos passos

1. Você relê este spec.
2. Se houver ajustes, voltamos ao arquivo.
3. Quando aprovado, invoco `writing-plans` para gerar plano de implementação detalhado (com a divisão em 5 fases já mapeada).
4. Só então começamos a escrever código.
