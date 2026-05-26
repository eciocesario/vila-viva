# Vila Viva Light — Design Spec (Spin-off F2a)

**Data:** 2026-05-26
**Autor:** Écio Cesário, com Claude (Opus 4.7)
**Status:** Em review do usuário
**Relação com o plano técnico:** execução antecipada de `docs/vila_viva_plano_tecnico_v1_2.md` §6.F2a (MVP-Lite), iniciada 5 semanas antes da janela formal de Junho W3.

---

## 1. Posicionamento

A Vila Viva Light é a execução antecipada da **F2a · MVP-Lite** do plano técnico v1.2, exposta em URL privada de staging para stakeholders da Ecovila Piracanga testarem do iPhone deles, antes da janela formal do piloto. **Pace adotado:** 2 semanas corridas (compressão do S1–S4 original do plano v1.2 em duas entregas semanais), com convite a stakeholders ao fim da Semana 1.

**O que é:**
- Implementação real, em código, das features do F2a (Onboarding, Feed, Reactions, Comments, Match Pessoas, Profile, Notificações in-app, Edge Function `match-engine`, 1 Desafio piloto).
- Deploy contínuo em staging privada na nuvem (Vercel + Supabase hosted free tier).
- Base de código que **vira** o piloto formal quando o calendário alcançar Jun W3.

**O que NÃO é:**
- Não é protótipo descartável. O código produzido aqui é o F2a — quando o piloto formal começar, este repo recebe as 5 famílias-piloto reais sem reescrita.
- Não é piloto real. Falta o hardening de "go-live 1" do plano v1.2 (bug bash, QA em 5 dispositivos, Lighthouse ≥ 90 obrigatório, onboarding presencial, PDF de 2 páginas). Esses entram quando a janela formal abrir.
- Não é F2b (sem Vagas, sem Profile completo com badges/sementes, sem endpoints LGPD, sem notificações por e-mail, sem PWA cache de dados).

**Único corte explícito vs. F2a oficial:** Painel SSO leve. Justificativa: o Painel Inteligência Territorial Piracanga ainda não existe.

**Critério de sucesso do spin-off (qualitativo):** stakeholders convidados conseguem percorrer todos os fluxos do F2a no iPhone deles e dar feedback acionável. Os critérios numéricos do go-live 1 do plano v1.2 (5 famílias ativas, ≥ 3 publicações/dia, NPS ≥ 7) **não** se aplicam aqui — eles valem para o piloto formal.

---

## 2. Arquitetura e infra

### 2.1 Stack (idêntica ao plano v1.2 §3, sem desvios)

**Frontend (cliente)**
- React 18 + Vite + TypeScript strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- Tailwind CSS reaproveitando os tokens já definidos em `index.html` do protótipo (extraídos para `tailwind.config.ts`)
- TanStack Query (cache de servidor) + Zustand (estado local mínimo)
- React Router para roteamento
- Workbox para PWA (cache de assets; cache de dados fica para F2b)

**Backend gerenciado (Supabase hosted, free tier, sa-east-1)**
- Projeto Supabase já provisionado: `qpfkppkizdexdbwxxacw`
- Postgres 15 + RLS como defesa primária de autorização
- Supabase Auth (magic link via SMTP padrão Supabase, limite ~4 e-mails/hora no free tier)
- Supabase Realtime para subscription na tabela `notification`
- Uma única Edge Function Deno: `match-engine`

**Deploy e CI**
- Vercel free tier — staging permanente em URL privada + preview por PR
- Subdomínio `*.vercel.app` (o domínio `vilaviva.piracanga.org` fica reservado para o piloto formal)
- GitHub Actions para rodar testes em PR + `supabase db push` em merge para `main`

**Observabilidade**
- Sentry free tier — erros JS não-tratados + source maps
- PostHog free tier — eventos nomeados conforme plano v1.2 §15 Event Taxonomy
- Ambos desligados em `MODE=development` para não poluir telemetria

**Custos esperados:** US$ 0/mês na janela inteira do spin-off (tudo dentro dos free tiers).

### 2.2 Layout do repositório

```
C:\Users\Samsung\projetos\vila-viva\
├── app/                          ← novo: o produto React
│   ├── src/
│   │   ├── routes/               ← uma pasta por tela do protótipo
│   │   ├── components/           ← reutilizáveis (FeedCard, MatchCard, …)
│   │   ├── lib/                  ← supabase client, useFlag, tipos gerados
│   │   ├── domain/               ← lógica pura, testável sem React
│   │   └── styles/               ← tailwind config + tokens do protótipo
│   ├── supabase/
│   │   ├── migrations/           ← SQL declarativo, versionado
│   │   ├── seed.sql              ← os ~20 perfis fictícios + posts iniciais
│   │   └── functions/
│   │       └── match-engine/     ← Edge Function Deno
│   ├── tests/                    ← Vitest (domain) + Playwright (smoke)
│   ├── package.json
│   └── vite.config.ts
├── index.html                    ← protótipo HTML preservado (referência viva)
├── vila-viva.html                ← cópia offline iPhone preservada
└── docs/                         ← inalterado
```

O nome `app/` é convenção de pasta. **Não há distribuição via Google Play ou App Store** — é web app puro, com PWA install prompt no iPhone Safari.

### 2.3 Fluxo de dados

```
[Browser iPhone]
       │
       │  supabase-js (JWT do usuário)
       ▼
[PostgREST automático do Supabase]
       │
       │  RLS aplicada em toda query
       ▼
[Postgres 15]
       │
       ├──▶ [Supabase Auth (magic link → e-mail)]
       ├──▶ [Supabase Realtime (channel: notification)]
       └──▶ [Edge Function match-engine (Deno, invocada sob demanda)]
```

Nenhum servidor Node custom. Toda lógica que não cabe em RLS + Postgres functions vai para a Edge Function `match-engine`. Tipagem do schema é gerada via `supabase gen types typescript --linked` no `predev` e no CI; o schema é fonte da verdade.

### 2.4 Variáveis de ambiente

Arquivo `.env.local` em `app/`, **nunca commitado**:

- `VITE_SUPABASE_URL` — URL pública do projeto Supabase
- `VITE_SUPABASE_ANON_KEY` — anon key (público por design)
- `VITE_SENTRY_DSN` — DSN do projeto Sentry
- `VITE_POSTHOG_KEY` — projeto key do PostHog
- `SUPABASE_SERVICE_ROLE_KEY` — usada **apenas localmente** via Supabase CLI para rodar migrations e seeds. Nunca chega ao bundle do cliente.

Variáveis com prefixo `VITE_` são expostas ao bundle; sem prefixo não são. Verificar no build que `SUPABASE_SERVICE_ROLE_KEY` não vaza para `dist/`.

---

## 3. Modelo de dados

### 3.1 Tabelas (12 essenciais para o F2a)

**Identidade**
- `profile` — 1:1 com `auth.users`, contém bio, agente/arquétipo, casa, intenção, foto_url
- `skill` — catálogo curado (~80 entradas extraídas do protótipo)
- `profile_skill` — N:N profile ↔ skill, com nível e intenção (oferece/busca)

**Conteúdo**
- `post` — coluna `tipo` com 5 valores: `historia | pedido | projeto | evento | conquista`
- `reaction` — N:N profile ↔ post, com tipo (`coracao | mao | semente | fogo`)
- `comment` — thread plana (sem nested no F2a), 1:N com post

**Conexão**
- `notification` — alimentada por triggers Postgres; lida pelo frontend via Realtime subscription do destinatário
- `connection_seen` — log de "quem o usuário X já viu no Match" para evitar repetição

**Desafio**
- `challenge` — catálogo, com `slug`, `titulo`, `descricao`, `criterio`
- `challenge_progress` — N:N profile ↔ challenge, com estado (`nao_iniciado | em_progresso | concluido`)

**Infra**
- `feature_flag` — `{key, enabled, audience}`, a base do rollout incremental
- `allowed_email` — allowlist de e-mails que podem completar signup

### 3.2 RLS — política central

Toda tabela tem RLS habilitada. Resumo:

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profile` | autenticado | trigger no `auth.signup` | dono | — |
| `skill` | autenticado | service_role | service_role | service_role |
| `profile_skill` | autenticado | dono | dono | dono |
| `post` | autenticado | autenticado (autor) | autor | autor |
| `reaction` | autenticado | autenticado | — | autor |
| `comment` | autenticado | autenticado | autor | autor |
| `notification` | destinatário | trigger / Edge Function | destinatário (marcar lida) | — |
| `connection_seen` | autenticado (próprio) | autenticado (próprio) | — | — |
| `challenge` | autenticado | service_role | service_role | service_role |
| `challenge_progress` | autenticado (próprio) | trigger | trigger | — |
| `feature_flag` | autenticado | service_role | service_role | service_role |
| `allowed_email` | service_role | service_role | service_role | service_role |

Decisão herdada da review de engenharia 2026-05-18: nunca usar `service_role` client-side; quando precisa, é via Edge Function recebendo JWT do usuário e aplicando autorização explícita.

### 3.3 Feature flags — o núcleo da Abordagem A

Estado inicial das flags ao fim da Semana 1 (antes dos convites):

```sql
INSERT INTO feature_flag (key, enabled) VALUES
  ('auth_signup',          true),   -- Sem 1
  ('onboarding',           true),   -- Sem 1
  ('feed_read',            true),   -- Sem 1
  ('feed_create_historia', true),   -- Sem 1
  ('feed_create_outros',   false),  -- Sem 1, destrava por convite
  ('reactions',            false),  -- Sem 1, destrava por convite
  ('comments',             false),  -- Sem 1, destrava por convite
  ('share_wa',             false),  -- Sem 1, destrava por convite
  ('match_pessoas',        false),  -- Sem 2
  ('profile_edit',         false),  -- Sem 2
  ('notifications',        false),  -- Sem 2
  ('challenge_piloto',     false);  -- Sem 2
```

**Como o frontend lê:** hook `useFlag('key')` que faz 1 query no boot, cached pelo TanStack Query por 60s. Componentes invisíveis quando flag off.

**Como destravar para stakeholders:** `UPDATE feature_flag SET enabled=true WHERE key='X'` no Supabase Studio. Rollback é o mesmo update com `false`. Sem redeploy.

### 3.4 Migrations e tipos

- Migrations versionadas em `app/supabase/migrations/`, nomeadas `NNN_descricao.sql`
- Aplicadas via `supabase db push --linked`
- `supabase gen types typescript --linked > app/src/lib/database.types.ts` no script `predev` e no CI

---

## 4. Sequência de entrega (compactada em 2 semanas)

**Decisão de pace:** o spin-off é executado em ~2 semanas corridas, ao invés dos 4 sprints originais do plano v1.2. Os marcos S1–S4 do plano são preservados conceitualmente mas fundidos em 2 entregas semanais. Stakeholders são convidados ao fim da Semana 1 e veem novas features destravadas por flag durante a Semana 2 — mesma URL, sem reconvite.

### Semana 1 · Walking Skeleton + Conteúdo · 7 dias

**Saída:** stakeholders logam, fazem onboarding em 4 steps, navegam o feed, **criam posts dos 5 tipos, reagem, comentam, compartilham no WhatsApp** e visualizam perfis dos seeds. Pace de S1+S2 do plano original, fundidos.

**Entregas:**
- Scaffold `app/`: Vite + TS strict + Tailwind + Workbox + ESLint + Prettier
- Tokens do protótipo extraídos para `tailwind.config.ts` (cores, tipografia, raios)
- Migrations `001_profile.sql`, `002_post.sql`, `003_reaction.sql`, `004_comment.sql`, `005_feature_flag.sql`, `006_allowed_email.sql`
- `seed.sql` com ~15 perfis fictícios + ~25 posts distribuídos entre os 5 tipos
- Auth real Supabase magic link + página `/login` + allowlist
- Onboarding 4 steps persistindo em `profile` (nome, agente/arquétipo, casa, intenção)
- Rota `/` (Feed) lendo da tabela `post` (5 tipos renderizados com layout específico, reaproveitando CSS do protótipo)
- FAB de criar post + bottom-sheet com seletor de tipo (5 opções)
- Reactions (4 tipos: coração, mão, semente, fogo) com optimistic UI
- Comments (thread plana) com input no rodapé do card expandido
- Botão "Compartilhar no WhatsApp" gera link `wa.me/?text=...`
- Tela `/profile/:id` (read-only nesta semana — edit fica para Semana 2)
- Hook `useFlag()` + página admin `/_/flags` (oculta, só pelo seu `auth.uid()`)
- Deploy Vercel + Supabase linked + GitHub Actions configurado
- Sentry inicializado (PostHog completo só na Semana 2)
- Política de privacidade v1 publicada em `/privacidade` (texto curto em §5.1)
- Flags `feed_create_outros`, `reactions`, `comments`, `share_wa` podem ficar `false` até o convite real

**Critério de saída:** do iPhone, você completa o fluxo: magic link → onboarding → cria 1 post de cada tipo → reage e comenta em pelo menos 2 → compartilha 1 no WhatsApp e o link abre o WA. Sentry sem erros não-tratados na percorrida.

**Convites enviados ao fim da Semana 1.**

### Semana 2 · Conexão + Desafio + Polish · 7 dias

**Saída:** Match Pessoas com busca incremental e filtro por arquétipo, Profile editável, notificações in-app realtime, 1 Desafio piloto end-to-end. Pace de S3+S4 do plano original, fundidos.

**Entregas:**
- Migrations `007_skill.sql`, `008_profile_skill.sql`, `009_notification.sql`, `010_connection_seen.sql`, `011_challenge.sql`, `012_challenge_progress.sql`
- Catálogo `skill` populado via seed (~80 entradas extraídas do protótipo)
- Tela `/match` com search-as-you-type (debounce 250ms) + chips de filtro por arquétipo
- Edge Function `match-engine` — recebe JWT do usuário, devolve top-N profiles com score = interseção de skills + arquétipo compatível
- Tela `/profile/me/edit` (bio, skills, foto via Boring Avatars)
- Trigger Postgres: quando match relevante é gerado, `INSERT INTO notification`
- Frontend faz Realtime subscribe no `notification` do usuário logado → badge no nav + toast
- Seed do desafio piloto: "Conectar Aliados Distantes", critério = enviar 3 mensagens iniciais para perfis de arquétipos diferentes
- Tela `/desafios` listando challenges + card de progresso
- Postgres function `recompute_challenge_progress(user_id, challenge_slug)` chamada por trigger no evento relevante
- PostHog completo + funnel `signup → onboarding → primeiro_post → primeiro_match`
- Bug-pass leve: você roda os 4 fluxos principais do iPhone e de 1 device desktop, anota o que travar
- Lighthouse mobile alvo informal ≥ 80 (não bloqueante)

**Critério de saída:** com 2 contas logadas em devices diferentes criando matches mútuos, notificação aparece em tempo real (< 2s) na outra ponta; Desafio piloto pode ser completado end-to-end por um stakeholder do iPhone.

### Pace, riscos e ponto de re-baseline

Este pace de 2 semanas é **apertado mas viável** porque (a) o design system está 100% pronto no protótipo HTML e Tailwind apenas reembrulha tokens existentes, (b) Supabase elimina ~3 semanas de backend custom que existiam no plano v1.0, (c) Claude (Opus 4.7) atua como pair full-time. **Ponto de re-baseline:** ao fim do dia 5 da Semana 1, se algum bloco da Semana 1 estiver visivelmente atrasado, re-prioriza-se: Match (S2) tem precedência sobre Desafio (Semana 2 fim) — Desafio pode ser entregue depois do convite inicial, atrás de flag, sem reconvite.

---

## 5. Acesso, seeds e observabilidade

### 5.1 Acesso dos stakeholders — allowlist on por default

Magic link Supabase, com **allowlist habilitada** desde a Semana 1:

- Tabela `allowed_email` curada por você no Supabase Studio
- Trigger `on_auth_user_created` bloqueia signup de e-mail fora da lista (raise exception → o Auth devolve erro amigável)
- Para abrir para um novo stakeholder: `INSERT INTO allowed_email VALUES ('fulano@email.com')` — funciona como flag granular por pessoa

Allowlist é justificada por dois motivos: (1) URL "privada" no Vercel não é segredo criptográfico — bots descobrem em horas; (2) free tier do Supabase tem limite de 4 e-mails/hora, então signup massivo quebraria o convite legítimo.

**Política de privacidade v1**, publicada em `/privacidade` desde a Semana 1:
> "Este é um ambiente de testes restrito a stakeholders convidados pela Ecovila Piracanga. Os dados visíveis (perfis, posts, conexões) são em sua maioria fictícios. Seu e-mail é usado apenas para autenticação via magic link, não é compartilhado, não é usado para marketing. Você pode pedir exclusão a qualquer momento por e-mail a eciocesario@gmail.com."

### 5.2 Seeds — os ~20 perfis fictícios

Em `app/supabase/seed.sql`, rodam via `supabase db reset --linked`:

- **14 arquétipos do protótipo cobertos** — ao menos 1 perfil por arquétipo (Tecedor, Curador, Mediador, etc.)
- **Skills cruzadas** — perfis projetados para terem interseção de skills entre si (senão Match volta vazio)
- **Posts iniciais** — ~30 posts pré-criados distribuídos entre os 5 tipos, datados nos últimos 14 dias
- **Nomes plausíveis mas fictícios** — geração via lista curada (não pegar nada do `pessoas base.csv` real, mesmo anonimizado — zero risco LGPD)
- **Fotos** — Boring Avatars determinísticos por `user_id` (sem dependência de assets externos)

Quando um stakeholder real fizer signup, vira o 21º perfil, lado a lado com os fictícios, completando onboarding normal.

### 5.3 Observabilidade — o mínimo que ainda merece o nome

- **Sentry** — captura erros JS não-tratados, source maps do bundle, alerta por e-mail em erro novo. Filtro: ignorar erros conhecidos do iOS Safari (network-canceled, etc).
- **PostHog** — eventos nomeados do plano v1.2 §15 Event Taxonomy. Dashboard único com funil `signup → onboarding → primeiro_post → primeiro_match`. Sem session recording.
- **Ambos desligados em dev local** — só ligam quando `import.meta.env.MODE === 'production'`.

### 5.4 Testes — pragmáticos

- **Vitest** configurado na Semana 1, cobertura crescendo ao longo das 2 semanas: alvo de 70% em `app/src/domain/` ao fim da Semana 2 (lógica pura — score de match, validação de onboarding, parse de tipos de post). Sem teste de componente React no spin-off.
- **Playwright** com 1 smoke test do fluxo crítico (login magic-link mock → onboarding → criar post → ver no feed), entregue na Semana 2. Roda em CI a cada PR contra preview Vercel.
- **Sem QA em 5 dispositivos.** Isso é gate do piloto formal (plano v1.2 §6.F2a S4), não desta spin-off.

---

## 6. Cortes explícitos

### 6.1 Cortado vs. F2a oficial
- Painel SSO leve (Painel ainda não existe)

### 6.2 Adiado para F2b (próxima spin-off, se for o caso)
- Vagas (aba Voluntariado + Remunerado)
- Profile editável **completo** (badges, sementes — no light fica só bio + agente + casa + skills + intenção + foto)
- Notificações por e-mail (apenas in-app realtime)
- Endpoints LGPD `export-user-data` e `delete-user-data`
- PWA cache de feed/perfis (Workbox configura, mas só assets — sem cache de dados)

### 6.3 Adiado para o piloto formal (Jun W3)
- Bug bash + QA em 5 dispositivos
- Lighthouse mobile ≥ 90 como gate bloqueante (alvo informal ≥ 80)
- Documentação PDF de 2 páginas
- Onboarding presencial das 5 famílias
- Critérios numéricos de "go-live 1" do plano v1.2

### 6.4 Adiado para F3+
- Importação Censo, banner opt-in, Jardim de Conexões pré-populado, WhatsApp Cloud API, Organizações, IA, Painel Biomas.

---

## 7. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Magic link cair no spam do stakeholder | Pré-aviso por WhatsApp: "olha sua caixa de e-mail"; remetente verificado no Supabase Auth |
| Free tier do Supabase estourar (e-mails: 4/hora) | Allowlist controla volume; convites em batch de 3-4 por hora |
| Stakeholder vê seeds fictícios e acha "não somos nós" | Posicionamento no convite: "ambiente de testes, perfis são fictícios; você é o 21º" |
| Código do light divergir do F2a real | Não tratamos como descartável — este código É o F2a |
| Bus factor (Écio + Claude apenas) | ADRs em `docs/` para decisões; commits pequenos com mensagem rica; cada feature numa migration |
| Inadequação visual em telas pequenas | Smoke test no iPhone real (app Documents da Readdle) ao fim de cada sprint |
| Domínio futuro `vilaviva.piracanga.org` colidir com a URL de staging | Mantemos `*.vercel.app` no spin-off; quando o piloto formal abrir, configura-se o domínio em fresh DNS |

---

## 8. Decisões registradas

| # | Decisão | Status |
|---|---|---|
| 1 | Localização do código: `projetos/vila-viva/app/` | Decidido |
| 2 | Shape: walking skeleton + feature flags (Abordagem A) | Decidido |
| 3 | Sequência interna: S1 → S2 → S3 → S4 conforme plano v1.2 §6.F2a | Decidido |
| 4 | Seeds: ~20 perfis fictícios curados (zero CSV Censo real) | Decidido |
| 5 | Auth: magic link Supabase | Decidido |
| 6 | Allowlist: **habilitada desde S1** (signup só de e-mails pré-cadastrados em `allowed_email`) | Decidido (confirmar na review) |
| 7 | Domínio: subdomínio `*.vercel.app` (não usar `vilaviva.piracanga.org`) | Decidido (confirmar na review) |
| 8 | E-mail provider: Supabase Auth default (4/hora) | Decidido (sem Resend nesta janela) |
| 9 | Cortes vs. F2a oficial: apenas Painel SSO leve | Decidido |
| 10 | Web app puro: zero submissão a App Store ou Play Store | Decidido |
| 11 | Timeline: 2 semanas corridas (Sem 1 fundação+conteúdo, Sem 2 conexão+desafio) | Decidido |
| 12 | Convite a stakeholders ao fim da Semana 1, com Sem 2 destravando features por flag sem reconvite | Decidido |

---

## 9. Próximos passos

1. Você relê este spec.
2. Se houver ajustes, voltamos a este arquivo.
3. Quando aprovado, invoco a skill `writing-plans` para gerar o plano de implementação detalhado (sub-tarefas executáveis em ordem, agrupadas por S1/S2/S3/S4).
4. Só então começamos a escrever código.
