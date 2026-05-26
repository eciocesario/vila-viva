# Vila Viva Light — Plano de Implementação

> **Para workers agentes:** SUB-SKILL OBRIGATÓRIA: Use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para executar este plano tarefa por tarefa. Passos usam sintaxe checkbox (`- [ ]`) para rastreamento.

**Goal:** Implementar a F2a do plano técnico v1.2 (Vila Viva Light) em 2 semanas, exposta em staging privada na nuvem para teste de stakeholders.

**Architecture:** Single-page app React + Vite + TS strict, frontend chama Supabase via supabase-js (PostgREST + Auth + Realtime + 1 Edge Function). Walking skeleton + feature flags: rollout incremental sem reconvite. Stakeholders convidados ao fim da Semana 1.

**Tech Stack:** React 18 · Vite · TypeScript strict · Tailwind CSS · TanStack Query · Zustand · Workbox PWA · Supabase (Postgres 15 + Auth + Realtime + Edge Functions Deno) · Vercel · Sentry · PostHog · Vitest · Playwright · GitHub Actions

**Spec de referência:** [`docs/superpowers/specs/2026-05-26-vila-viva-light-design.md`](../specs/2026-05-26-vila-viva-light-design.md)

**Root do projeto:** `C:\Users\Samsung\projetos\vila-viva\` · **Código novo em:** `app/`

---

## Pré-requisitos (verificar antes da Task 1)

- [ ] Node.js ≥ 20 instalado (`node -v`)
- [ ] npm ≥ 10 disponível (`npm -v`)
- [ ] Supabase CLI instalada (`supabase --version`); se não, `scoop install supabase` ou `npm install -g supabase`
- [ ] Conta Supabase logada na CLI (`supabase login`)
- [ ] Projeto Supabase `agzldrdonirirftgvdfl` acessível (anon key + service role key em mãos)
- [ ] Conta Vercel criada e `vercel` CLI instalada (`npm i -g vercel`)
- [ ] Conta Sentry com projeto `vila-viva-light` criado, DSN em mãos
- [ ] Conta PostHog com projeto criado, key em mãos
- [ ] GitHub repo criado (público ou privado) para o `vila-viva` — se ainda não, `gh repo create eciocesario/vila-viva --private --source=. --remote=origin`

---

# SEMANA 1 — Fundação + Conteúdo

## Task 1: Scaffold `app/` com Vite + React + TS strict + Tailwind

**Files:**
- Create: `app/package.json`
- Create: `app/tsconfig.json`
- Create: `app/vite.config.ts`
- Create: `app/index.html`
- Create: `app/src/main.tsx`
- Create: `app/src/App.tsx`
- Create: `app/tailwind.config.ts`
- Create: `app/postcss.config.js`
- Create: `app/src/styles/index.css`
- Create: `app/.gitignore`
- Create: `app/.env.example`

- [ ] **Step 1: Criar o app via Vite template**

```bash
cd C:\Users\Samsung\projetos\vila-viva
npm create vite@latest app -- --template react-ts
cd app
npm install
```

- [ ] **Step 2: Ativar TS strict completo em `app/tsconfig.json`**

Adicionar/manter no `compilerOptions`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "useDefineForClassFields": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "tests"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Instalar Tailwind + dependências**

```bash
cd C:\Users\Samsung\projetos\vila-viva\app
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/node
npm install react-router-dom @tanstack/react-query zustand
npm install @supabase/supabase-js
npm install @sentry/react posthog-js
npx tailwindcss init -p
```

- [ ] **Step 4a: Extrair tokens do protótipo**

```bash
cd C:\Users\Samsung\projetos\vila-viva
# Procurar definições de CSS variables no protótipo
Select-String -Path index.html -Pattern "--[a-z-]+:\s*[^;]+;" | Select-Object -First 60
```

Anotar as 5-10 variáveis mais usadas (cores principais, raios, fontes). O protótipo usa CSS custom properties no `:root` — pegar os hex/rgb e raios definidos lá.

- [ ] **Step 4b: Configurar `app/tailwind.config.ts` com os valores extraídos**

```typescript
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Valores abaixo são DEFAULT baseados na paleta vista no protótipo;
        // substitua pelos hex exatos extraídos no Step 4a.
        terra: '#7A2E1F',
        mata: '#2E5D3A',
        areia: '#F5EBD7',
        carvao: '#1A1A1A',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        soft: '12px',
        card: '20px',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

> Se os hex extraídos divergirem dos defaults, substituir agora. Os tokens guiam toda a UI subsequente.

- [ ] **Step 5: CSS base em `app/src/styles/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body, #root {
    height: 100%;
    background: theme('colors.areia');
    color: theme('colors.carvao');
    font-family: theme('fontFamily.body');
  }
}
```

- [ ] **Step 6: `app/src/main.tsx` com QueryClient + Router**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000 } },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
```

- [ ] **Step 7: `app/src/App.tsx` placeholder**

```tsx
export default function App() {
  return (
    <div className="p-6">
      <h1 className="font-display text-3xl text-terra">Vila Viva Light</h1>
      <p className="mt-2">Walking skeleton ativo.</p>
    </div>
  );
}
```

- [ ] **Step 8: `.env.example` documentando variáveis**

```
VITE_SUPABASE_URL=https://agzldrdonirirftgvdfl.supabase.co
VITE_SUPABASE_ANON_KEY=
VITE_SENTRY_DSN=
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

- [ ] **Step 9: `.gitignore` em `app/`**

```
node_modules/
dist/
.env.local
.env.*.local
.vercel/
*.log
```

- [ ] **Step 10: Smoke test local**

```bash
cd C:\Users\Samsung\projetos\vila-viva\app
npm run dev
```

Expected: vite dev server inicia em `http://localhost:5173`, página mostra "Vila Viva Light · Walking skeleton ativo." sem erros no console.

- [ ] **Step 11: Commit**

```bash
cd C:\Users\Samsung\projetos\vila-viva
git add app/.gitignore app/.env.example app/package.json app/package-lock.json app/tsconfig.json app/tsconfig.node.json app/vite.config.ts app/index.html app/src app/tailwind.config.ts app/postcss.config.js
git commit -m "feat(app): scaffold inicial React + Vite + TS strict + Tailwind"
```

---

## Task 2: Configurar Supabase CLI e estrutura de migrations

**Files:**
- Create: `app/supabase/config.toml`
- Create: `app/supabase/.gitignore`
- Create: `app/supabase/migrations/` (dir)
- Create: `app/supabase/functions/` (dir)

- [ ] **Step 1: Inicializar Supabase no projeto**

```bash
cd C:\Users\Samsung\projetos\vila-viva\app
supabase init
```

- [ ] **Step 2: Linkar ao projeto remoto**

```bash
supabase link --project-ref agzldrdonirirftgvdfl
```

Quando perguntar database password, informar a senha do projeto (do painel Supabase).

- [ ] **Step 3: Verificar conexão**

```bash
supabase db remote list
```

Expected: lista de migrations remotas (provavelmente vazia se o projeto está fresh).

- [ ] **Step 4: Criar `.env.local` em `app/` (NÃO COMMITAR)**

```
VITE_SUPABASE_URL=https://agzldrdonirirftgvdfl.supabase.co
VITE_SUPABASE_ANON_KEY=<copiar do painel Supabase > API Settings>
VITE_SENTRY_DSN=<DSN do Sentry>
VITE_POSTHOG_KEY=<key do PostHog>
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

- [ ] **Step 5: Commit (sem .env.local)**

```bash
cd C:\Users\Samsung\projetos\vila-viva
git add app/supabase/config.toml app/supabase/.gitignore
git commit -m "chore(supabase): inicializar CLI e linkar projeto agzldrdonirirftgvdfl"
```

---

## Task 3: Migration 001 — tabela `profile` + RLS

**Files:**
- Create: `app/supabase/migrations/001_profile.sql`

- [ ] **Step 1: Escrever migration**

```sql
-- 001_profile.sql
-- Tabela profile 1:1 com auth.users

CREATE TABLE IF NOT EXISTS public.profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  agente TEXT NOT NULL CHECK (agente IN (
    'tecedor', 'curador', 'mediador', 'guardian', 'sonhador',
    'praticante', 'aprendiz', 'guia', 'tradutor', 'semeador',
    'pesquisador', 'comunicador', 'artesao', 'visionario'
  )),
  casa TEXT,
  intencao TEXT,
  bio TEXT,
  foto_url TEXT,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_select_authenticated" ON public.profile
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profile_update_own" ON public.profile
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "profile_insert_own" ON public.profile
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Trigger auto-criação de profile no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profile (id, nome, agente)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', 'Sem nome'), 'aprendiz');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER profile_updated_at
  BEFORE UPDATE ON public.profile
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
```

- [ ] **Step 2: Aplicar migration**

```bash
cd C:\Users\Samsung\projetos\vila-viva\app
supabase db push
```

Expected: `Applied migration 001_profile.sql`

- [ ] **Step 3: Verificar no Supabase Studio**

Abrir https://supabase.com/dashboard/project/agzldrdonirirftgvdfl/database/tables, conferir que `profile` existe com as colunas e RLS habilitada.

- [ ] **Step 4: Commit**

```bash
cd C:\Users\Samsung\projetos\vila-viva
git add app/supabase/migrations/001_profile.sql
git commit -m "feat(db): migration 001 — tabela profile com RLS e trigger auto-criação"
```

---

## Task 4: Migration 002 — tabela `post` + RLS

**Files:**
- Create: `app/supabase/migrations/002_post.sql`

- [ ] **Step 1: Escrever migration**

```sql
-- 002_post.sql
-- Tabela post — 5 tipos no F2a

CREATE TABLE IF NOT EXISTS public.post (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('historia', 'pedido', 'projeto', 'evento', 'conquista')),
  titulo TEXT,
  corpo TEXT NOT NULL CHECK (length(corpo) >= 1 AND length(corpo) <= 2000),
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX post_created_desc_idx ON public.post (created_at DESC);
CREATE INDEX post_autor_idx ON public.post (autor_id);
CREATE INDEX post_tipo_idx ON public.post (tipo);

ALTER TABLE public.post ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_select_authenticated" ON public.post
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "post_insert_own" ON public.post
  FOR INSERT TO authenticated WITH CHECK (autor_id = auth.uid());

CREATE POLICY "post_update_own" ON public.post
  FOR UPDATE TO authenticated USING (autor_id = auth.uid()) WITH CHECK (autor_id = auth.uid());

CREATE POLICY "post_delete_own" ON public.post
  FOR DELETE TO authenticated USING (autor_id = auth.uid());

CREATE TRIGGER post_updated_at
  BEFORE UPDATE ON public.post
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
```

- [ ] **Step 2: Aplicar e commitar**

```bash
cd C:\Users\Samsung\projetos\vila-viva\app
supabase db push
cd ..
git add app/supabase/migrations/002_post.sql
git commit -m "feat(db): migration 002 — tabela post com RLS por autor"
```

---

## Task 5: Migrations 003 + 004 — `reaction` e `comment`

**Files:**
- Create: `app/supabase/migrations/003_reaction.sql`
- Create: `app/supabase/migrations/004_comment.sql`

- [ ] **Step 1: `003_reaction.sql`**

```sql
CREATE TABLE IF NOT EXISTS public.reaction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.post(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('coracao', 'mao', 'semente', 'fogo')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, autor_id, tipo)
);

CREATE INDEX reaction_post_idx ON public.reaction (post_id);

ALTER TABLE public.reaction ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reaction_select_authenticated" ON public.reaction
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "reaction_insert_own" ON public.reaction
  FOR INSERT TO authenticated WITH CHECK (autor_id = auth.uid());

CREATE POLICY "reaction_delete_own" ON public.reaction
  FOR DELETE TO authenticated USING (autor_id = auth.uid());
```

- [ ] **Step 2: `004_comment.sql`**

```sql
CREATE TABLE IF NOT EXISTS public.comment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.post(id) ON DELETE CASCADE,
  autor_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  corpo TEXT NOT NULL CHECK (length(corpo) >= 1 AND length(corpo) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX comment_post_created_idx ON public.comment (post_id, created_at);

ALTER TABLE public.comment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comment_select_authenticated" ON public.comment
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "comment_insert_own" ON public.comment
  FOR INSERT TO authenticated WITH CHECK (autor_id = auth.uid());

CREATE POLICY "comment_update_own" ON public.comment
  FOR UPDATE TO authenticated USING (autor_id = auth.uid()) WITH CHECK (autor_id = auth.uid());

CREATE POLICY "comment_delete_own" ON public.comment
  FOR DELETE TO authenticated USING (autor_id = auth.uid());

CREATE TRIGGER comment_updated_at
  BEFORE UPDATE ON public.comment
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
```

- [ ] **Step 3: Aplicar e commitar**

```bash
cd C:\Users\Samsung\projetos\vila-viva\app
supabase db push
cd ..
git add app/supabase/migrations/003_reaction.sql app/supabase/migrations/004_comment.sql
git commit -m "feat(db): migrations 003/004 — reaction e comment com RLS"
```

---

## Task 6: Migration 005 — `feature_flag` + 006 — `allowed_email`

**Files:**
- Create: `app/supabase/migrations/005_feature_flag.sql`
- Create: `app/supabase/migrations/006_allowed_email.sql`

- [ ] **Step 1: `005_feature_flag.sql`**

```sql
CREATE TABLE IF NOT EXISTS public.feature_flag (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  audience TEXT DEFAULT 'all',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.feature_flag ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_flag_select_authenticated" ON public.feature_flag
  FOR SELECT TO authenticated USING (true);

-- INSERT/UPDATE/DELETE only via service_role (Supabase Studio)

CREATE TRIGGER feature_flag_updated_at
  BEFORE UPDATE ON public.feature_flag
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Seed flags da Semana 1
INSERT INTO public.feature_flag (key, enabled) VALUES
  ('auth_signup',          true),
  ('onboarding',           true),
  ('feed_read',            true),
  ('feed_create_historia', true),
  ('feed_create_outros',   false),
  ('reactions',            false),
  ('comments',             false),
  ('share_wa',             false),
  ('match_pessoas',        false),
  ('profile_edit',         false),
  ('notifications',        false),
  ('challenge_piloto',     false)
ON CONFLICT (key) DO NOTHING;
```

- [ ] **Step 2: `006_allowed_email.sql`**

```sql
CREATE TABLE IF NOT EXISTS public.allowed_email (
  email TEXT PRIMARY KEY,
  added_by TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.allowed_email ENABLE ROW LEVEL SECURITY;

-- Sem políticas: tabela acessível apenas via service_role.

-- Trigger que bloqueia signup de e-mail fora da allowlist
CREATE OR REPLACE FUNCTION public.enforce_email_allowlist()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.allowed_email WHERE email = NEW.email) THEN
    RAISE EXCEPTION 'E-mail não autorizado para esta plataforma de testes.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_email_allowlist_trigger ON auth.users;
CREATE TRIGGER enforce_email_allowlist_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_email_allowlist();

-- Adicionar seu próprio e-mail (substitua antes de aplicar)
INSERT INTO public.allowed_email (email, added_by) VALUES
  ('eciocesario@gmail.com', 'bootstrap')
ON CONFLICT (email) DO NOTHING;
```

- [ ] **Step 3: Aplicar e commitar**

```bash
cd C:\Users\Samsung\projetos\vila-viva\app
supabase db push
cd ..
git add app/supabase/migrations/005_feature_flag.sql app/supabase/migrations/006_allowed_email.sql
git commit -m "feat(db): migrations 005/006 — feature_flag e allowed_email com gatekeeping"
```

---

## Task 7: Seeds da Semana 1 — 15 perfis fictícios + 25 posts

**Files:**
- Create: `app/supabase/seed.sql`

- [ ] **Step 1: Escrever seed (executado via `supabase db push` ou aplicado manualmente)**

> **Nota:** seeds rodam *contra produção* (free tier) já que estamos em hosted. Não usar `supabase db reset` em hosted — usar INSERT idempotente.

```sql
-- app/supabase/seed.sql
-- 15 perfis fictícios (auth.users + profile)
-- Usuários fictícios são criados via auth.users + profile diretamente,
-- evitando o trigger handle_new_user (já que rodamos como service_role).

DO $$
DECLARE
  v_users RECORD;
BEGIN
  FOR v_users IN (
    SELECT * FROM (VALUES
      (gen_random_uuid(), 'aurora@seed.vilaviva.local',  'Aurora Pelegrini',  'tecedor',      'Casa do Vento',   'Tecer redes entre pessoas e propósitos.'),
      (gen_random_uuid(), 'benjamim@seed.vilaviva.local','Benjamim Lobato',   'curador',      'Casa do Sol',     'Cuidar de espaços e ritmos.'),
      (gen_random_uuid(), 'celeste@seed.vilaviva.local', 'Celeste Andrade',   'mediador',     'Casa da Lua',     'Pontear conflitos com presença.'),
      (gen_random_uuid(), 'dario@seed.vilaviva.local',   'Dário Mendes',      'guardian',     'Casa da Mata',    'Guardar a mata e o saber dela.'),
      (gen_random_uuid(), 'elis@seed.vilaviva.local',    'Elis Castanho',     'sonhador',     'Casa do Rio',     'Imaginar futuros possíveis.'),
      (gen_random_uuid(), 'fabio@seed.vilaviva.local',   'Fábio Sereno',      'praticante',   'Casa da Terra',   'Pôr mão na massa, todo dia.'),
      (gen_random_uuid(), 'gisele@seed.vilaviva.local',  'Gisele Tavares',    'aprendiz',     'Casa do Vento',   'Aprender com quem caminhou antes.'),
      (gen_random_uuid(), 'helio@seed.vilaviva.local',   'Hélio Borges',      'guia',         'Casa do Sol',     'Acompanhar grupos pela terra.'),
      (gen_random_uuid(), 'iara@seed.vilaviva.local',    'Iara Vargas',       'tradutor',     'Casa da Lua',     'Traduzir entre saberes e linguagens.'),
      (gen_random_uuid(), 'joaquim@seed.vilaviva.local', 'Joaquim Reis',      'semeador',     'Casa da Mata',    'Plantar futuros — literalmente.'),
      (gen_random_uuid(), 'katia@seed.vilaviva.local',   'Kátia Munduruku',   'pesquisador',  'Casa do Rio',     'Investigar a biodiversidade local.'),
      (gen_random_uuid(), 'lucas@seed.vilaviva.local',   'Lucas Caetano',     'comunicador',  'Casa da Terra',   'Contar histórias da vila.'),
      (gen_random_uuid(), 'marina@seed.vilaviva.local',  'Marina Albuquerque','artesao',      'Casa do Vento',   'Fazer com as mãos, em barro e linho.'),
      (gen_random_uuid(), 'nuno@seed.vilaviva.local',    'Nuno Cassiano',     'visionario',   'Casa do Sol',     'Enxergar o todo, propor o novo.'),
      (gen_random_uuid(), 'olivia@seed.vilaviva.local',  'Olívia Quitéria',   'tecedor',      'Casa da Lua',     'Conectar visitantes ao território.')
    ) AS u(id, email, nome, agente, casa, intencao)
  ) LOOP
    -- Criar entry em auth.users sem trigger (rodando como service_role)
    INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
    VALUES (v_users.id, v_users.email, NOW(), NOW(), NOW(), jsonb_build_object('nome', v_users.nome, 'seed', true))
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profile (id, nome, agente, casa, intencao, onboarding_completed_at)
    VALUES (v_users.id, v_users.nome, v_users.agente, v_users.casa, v_users.intencao, NOW())
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- 25 posts iniciais distribuídos entre os 5 tipos
INSERT INTO public.post (autor_id, tipo, titulo, corpo, created_at)
SELECT
  p.id,
  posts.tipo,
  posts.titulo,
  posts.corpo,
  NOW() - (posts.dias_atras || ' days')::interval
FROM public.profile p
JOIN LATERAL (VALUES
  ('historia',  'O dia que choveu de lado',          'Ontem o vento veio do mar e a chuva entrou pelas frestas. A casa cheirou a terra molhada por 3 horas.', 1),
  ('pedido',    'Procuro uma escada de 5m',          'Vou colher coco amanhã cedo, alguém empresta?', 1),
  ('projeto',   'Horta sintrópica na Casa do Vento', 'Começamos em junho. Quem quer participar?', 2),
  ('evento',    'Roda de violão sábado',             'Às 19h no centro comunitário. Tragam o instrumento.', 2),
  ('conquista', 'Primeira muda de cacau brotou',     'Depois de 8 meses, ela apareceu.', 3)
) AS posts(tipo, titulo, corpo, dias_atras) ON true
WHERE p.agente IN ('tecedor', 'curador', 'mediador', 'guardian', 'sonhador')
LIMIT 25;
```

- [ ] **Step 2: Aplicar seeds**

```bash
cd C:\Users\Samsung\projetos\vila-viva\app
supabase db push
# Ou aplicar manualmente via Studio > SQL Editor se preferir mais controle
```

- [ ] **Step 3: Verificar no Studio**

Em https://supabase.com/dashboard/project/agzldrdonirirftgvdfl — `profile` deve ter 15 linhas, `post` 25 linhas.

- [ ] **Step 4: Commit**

```bash
cd C:\Users\Samsung\projetos\vila-viva
git add app/supabase/seed.sql
git commit -m "feat(db): seed Sem 1 — 15 perfis fictícios + 25 posts distribuídos"
```

---

## Task 8: Cliente Supabase + tipos gerados + auth lib

**Files:**
- Create: `app/src/lib/supabase.ts`
- Create: `app/src/lib/database.types.ts` (gerado)
- Modify: `app/package.json` (script `predev`)

- [ ] **Step 1: Gerar tipos do schema**

```bash
cd C:\Users\Samsung\projetos\vila-viva\app
supabase gen types typescript --linked > src/lib/database.types.ts
```

Expected: arquivo de ~200+ linhas com `Database` exportado.

- [ ] **Step 2: Script `predev` em `app/package.json`**

Adicionar em `scripts`:

```json
{
  "scripts": {
    "predev": "supabase gen types typescript --linked > src/lib/database.types.ts",
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 3: Cliente Supabase em `app/src/lib/supabase.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error('VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórios em .env.local');
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
```

- [ ] **Step 4: Verificar typecheck**

```bash
cd C:\Users\Samsung\projetos\vila-viva\app
npm run typecheck
```

Expected: 0 erros.

- [ ] **Step 5: Commit**

```bash
cd C:\Users\Samsung\projetos\vila-viva
git add app/src/lib/supabase.ts app/src/lib/database.types.ts app/package.json
git commit -m "feat(app): cliente Supabase tipado + script predev de geração de tipos"
```

---

## Task 9: Hook `useAuth` + página `/login` (magic link)

**Files:**
- Create: `app/src/lib/useAuth.ts`
- Create: `app/src/routes/Login.tsx`
- Modify: `app/src/App.tsx`

- [ ] **Step 1: `app/src/lib/useAuth.ts`**

```typescript
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return { session, loading, signIn, signOut };
}
```

- [ ] **Step 2: `app/src/routes/Login.tsx`**

```tsx
import { useState } from 'react';
import { useAuth } from '@/lib/useAuth';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    try {
      await signIn(email);
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao enviar link.');
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-4xl text-terra mb-2">Vila Viva</h1>
        <p className="text-sm mb-6 opacity-70">
          Ambiente de testes restrito. Informe o e-mail cadastrado para receber o link de entrada.
        </p>
        <form onSubmit={handle} className="space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full px-4 py-3 rounded-soft border border-carvao/20 bg-white"
            disabled={status === 'sending' || status === 'sent'}
          />
          <button
            type="submit"
            disabled={status === 'sending' || status === 'sent'}
            className="w-full px-4 py-3 rounded-soft bg-terra text-areia font-medium disabled:opacity-50"
          >
            {status === 'sending' ? 'Enviando…' : status === 'sent' ? 'Link enviado' : 'Receber link'}
          </button>
        </form>
        {status === 'sent' && (
          <p className="mt-4 text-sm text-mata">Cheque seu e-mail — o link expira em 1h.</p>
        )}
        {status === 'error' && (
          <p className="mt-4 text-sm text-terra">{errorMsg}</p>
        )}
        <p className="mt-8 text-xs opacity-60">
          <a href="/privacidade" className="underline">Política de privacidade</a>
        </p>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Atualizar `App.tsx` com rotas básicas**

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/useAuth';
import Login from '@/routes/Login';

export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center">Carregando…</main>;
  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={session ? <Home /> : <Navigate to="/login" replace />} />
      <Route path="/privacidade" element={<Privacidade />} />
    </Routes>
  );
}

function Home() {
  const { signOut } = useAuth();
  return (
    <main className="p-6">
      <h1 className="font-display text-3xl text-terra">Vila Viva Light</h1>
      <p className="mt-2">Você está dentro. (Feed virá na Task 12.)</p>
      <button onClick={signOut} className="mt-4 text-sm underline">Sair</button>
    </main>
  );
}

function Privacidade() {
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="font-display text-2xl text-terra mb-4">Política de privacidade</h1>
      <p className="mb-3">
        Este é um ambiente de testes restrito a stakeholders convidados pela Ecovila Piracanga.
      </p>
      <p className="mb-3">
        Os dados visíveis (perfis, posts, conexões) são em sua maioria fictícios. Seu e-mail é
        usado apenas para autenticação via magic link, não é compartilhado, não é usado para
        marketing.
      </p>
      <p>
        Você pode pedir exclusão a qualquer momento por e-mail a <a className="underline" href="mailto:eciocesario@gmail.com">eciocesario@gmail.com</a>.
      </p>
    </main>
  );
}
```

- [ ] **Step 4: Smoke test do magic link**

```bash
cd C:\Users\Samsung\projetos\vila-viva\app
npm run dev
```

Abrir `http://localhost:5173`, deve redirecionar para `/login`. Digitar seu próprio e-mail, clicar "Receber link". Verificar e-mail; ao clicar, deve voltar autenticado.

> **Importante:** seu e-mail precisa estar em `allowed_email` (já inserido na Task 6).

- [ ] **Step 5: Commit**

```bash
cd C:\Users\Samsung\projetos\vila-viva
git add app/src/lib/useAuth.ts app/src/routes/Login.tsx app/src/App.tsx
git commit -m "feat(auth): magic link + rota /login + /privacidade"
```

---

## Task 10: Onboarding — 4 steps persistindo em `profile`

**Files:**
- Create: `app/src/routes/Onboarding.tsx`
- Create: `app/src/domain/onboardingValidation.ts`
- Create: `app/tests/domain/onboardingValidation.test.ts`
- Modify: `app/src/App.tsx`

- [ ] **Step 1: Instalar Vitest**

```bash
cd C:\Users\Samsung\projetos\vila-viva\app
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

Adicionar em `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

(Adicionar `/// <reference types="vitest" />` no topo se TS reclamar.)

- [ ] **Step 2: TDD — escrever teste primeiro**

`app/tests/domain/onboardingValidation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { validateOnboarding, type OnboardingData } from '@/domain/onboardingValidation';

describe('validateOnboarding', () => {
  const valid: OnboardingData = {
    nome: 'Maria Silva',
    agente: 'tecedor',
    casa: 'Casa do Vento',
    intencao: 'Tecer redes.',
  };

  it('aceita dados válidos', () => {
    expect(validateOnboarding(valid).ok).toBe(true);
  });

  it('rejeita nome vazio', () => {
    const r = validateOnboarding({ ...valid, nome: '' });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.errors.nome).toBeDefined();
  });

  it('rejeita nome com menos de 2 caracteres', () => {
    const r = validateOnboarding({ ...valid, nome: 'M' });
    expect(r.ok).toBe(false);
  });

  it('rejeita agente fora da lista de 14', () => {
    const r = validateOnboarding({ ...valid, agente: 'inexistente' as never });
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.errors.agente).toBeDefined();
  });

  it('aceita casa vazia (opcional)', () => {
    expect(validateOnboarding({ ...valid, casa: '' }).ok).toBe(true);
  });

  it('rejeita intencao com mais de 280 caracteres', () => {
    const r = validateOnboarding({ ...valid, intencao: 'x'.repeat(281) });
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 3: Rodar — esperar falhar**

```bash
cd C:\Users\Samsung\projetos\vila-viva\app
npm run test
```

Expected: erro de import (módulo não existe).

- [ ] **Step 4: Implementar domain**

`app/src/domain/onboardingValidation.ts`:

```typescript
export const AGENTES = [
  'tecedor', 'curador', 'mediador', 'guardian', 'sonhador',
  'praticante', 'aprendiz', 'guia', 'tradutor', 'semeador',
  'pesquisador', 'comunicador', 'artesao', 'visionario',
] as const;

export type Agente = typeof AGENTES[number];

export type OnboardingData = {
  nome: string;
  agente: string;
  casa: string;
  intencao: string;
};

export type ValidationResult =
  | { ok: true; data: OnboardingData & { agente: Agente } }
  | { ok: false; errors: Partial<Record<keyof OnboardingData, string>> };

export function validateOnboarding(d: OnboardingData): ValidationResult {
  const errors: Partial<Record<keyof OnboardingData, string>> = {};

  if (!d.nome || d.nome.trim().length < 2) {
    errors.nome = 'Nome precisa ter pelo menos 2 caracteres.';
  }
  if (!AGENTES.includes(d.agente as Agente)) {
    errors.agente = 'Escolha um agente da lista.';
  }
  if (d.intencao && d.intencao.length > 280) {
    errors.intencao = 'Intenção precisa caber em 280 caracteres.';
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, data: { ...d, agente: d.agente as Agente } };
}
```

- [ ] **Step 5: Rodar testes — devem passar**

```bash
npm run test
```

Expected: 6/6 testes verdes.

- [ ] **Step 6: Tela `app/src/routes/Onboarding.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { AGENTES, validateOnboarding, type OnboardingData } from '@/domain/onboardingValidation';

const STEPS = ['Nome', 'Agente', 'Casa', 'Intenção'] as const;

export default function Onboarding() {
  const { session } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    nome: '',
    agente: '',
    casa: '',
    intencao: '',
  });
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (d: OnboardingData) => {
      const valid = validateOnboarding(d);
      if (!valid.ok) throw new Error(Object.values(valid.errors).join(' '));

      const { error } = await supabase
        .from('profile')
        .update({
          nome: d.nome,
          agente: d.agente,
          casa: d.casa || null,
          intencao: d.intencao || null,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', session!.user.id);
      if (error) throw error;
    },
    onSuccess: () => nav('/'),
    onError: (e) => setError(e instanceof Error ? e.message : 'Erro ao salvar'),
  });

  function next() {
    setError(null);
    if (step < STEPS.length - 1) setStep(step + 1);
    else save.mutate(data);
  }

  function back() {
    setError(null);
    if (step > 0) setStep(step - 1);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 max-w-md mx-auto">
      <div className="w-full">
        <p className="text-xs opacity-60 mb-1">Passo {step + 1} de {STEPS.length}</p>
        <h2 className="font-display text-2xl text-terra mb-6">{STEPS[step]}</h2>

        {step === 0 && (
          <input
            type="text"
            placeholder="Seu nome completo"
            value={data.nome}
            onChange={(e) => setData({ ...data, nome: e.target.value })}
            className="w-full px-4 py-3 rounded-soft border border-carvao/20 bg-white"
          />
        )}
        {step === 1 && (
          <select
            value={data.agente}
            onChange={(e) => setData({ ...data, agente: e.target.value })}
            className="w-full px-4 py-3 rounded-soft border border-carvao/20 bg-white"
          >
            <option value="">Escolha um agente…</option>
            {AGENTES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        )}
        {step === 2 && (
          <input
            type="text"
            placeholder="Casa onde mora (opcional)"
            value={data.casa}
            onChange={(e) => setData({ ...data, casa: e.target.value })}
            className="w-full px-4 py-3 rounded-soft border border-carvao/20 bg-white"
          />
        )}
        {step === 3 && (
          <textarea
            placeholder="Sua intenção em Piracanga (até 280 caracteres)"
            maxLength={280}
            value={data.intencao}
            onChange={(e) => setData({ ...data, intencao: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 rounded-soft border border-carvao/20 bg-white"
          />
        )}

        {error && <p className="mt-3 text-sm text-terra">{error}</p>}

        <div className="mt-6 flex gap-2">
          {step > 0 && (
            <button onClick={back} className="px-4 py-3 rounded-soft border border-carvao/20">
              Voltar
            </button>
          )}
          <button
            onClick={next}
            disabled={save.isPending}
            className="flex-1 px-4 py-3 rounded-soft bg-terra text-areia font-medium disabled:opacity-50"
          >
            {step === STEPS.length - 1 ? 'Concluir' : 'Próximo'}
          </button>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 7: Roteamento em `App.tsx`**

Substituir `Home` placeholder por lógica que checa se onboarding está completo:

```tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Onboarding from '@/routes/Onboarding';

function Home() {
  const { session, signOut } = useAuth();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile')
        .select('onboarding_completed_at, nome, agente')
        .eq('id', session!.user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!session,
  });

  if (isLoading) return <main className="p-6">Carregando…</main>;

  if (!profile?.onboarding_completed_at) return <Onboarding />;

  return (
    <main className="p-6">
      <h1 className="font-display text-3xl text-terra">Olá, {profile.nome}</h1>
      <p className="mt-2">Feed virá na Task 12.</p>
      <button onClick={signOut} className="mt-4 text-sm underline">Sair</button>
    </main>
  );
}
```

- [ ] **Step 8: Smoke test**

`npm run dev` → entrar, completar onboarding, checar no Supabase Studio que `profile` foi atualizado.

- [ ] **Step 9: Commit**

```bash
cd C:\Users\Samsung\projetos\vila-viva
git add app/src/domain/onboardingValidation.ts app/tests app/src/routes/Onboarding.tsx app/src/App.tsx app/vite.config.ts app/package.json
git commit -m "feat(onboarding): 4 steps com validação domain + persistência em profile"
```

---

## Task 11: Hook `useFlag` + página admin `/_/flags`

**Files:**
- Create: `app/src/lib/useFlag.ts`
- Create: `app/src/routes/AdminFlags.tsx`
- Modify: `app/src/App.tsx`

- [ ] **Step 1: `app/src/lib/useFlag.ts`**

```typescript
import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

type FlagMap = Record<string, boolean>;

async function fetchFlags(): Promise<FlagMap> {
  const { data, error } = await supabase.from('feature_flag').select('key, enabled');
  if (error) throw error;
  return Object.fromEntries(data.map((f) => [f.key, f.enabled]));
}

export function useFlags() {
  return useQuery({
    queryKey: ['feature_flags'],
    queryFn: fetchFlags,
    staleTime: 60_000,
  });
}

export function useFlag(key: string): boolean {
  const { data } = useFlags();
  return data?.[key] ?? false;
}
```

- [ ] **Step 2: Lista de e-mails admin em `app/src/lib/admins.ts`**

```typescript
export const ADMIN_EMAILS = new Set(['eciocesario@gmail.com']);
```

- [ ] **Step 3: Página admin `app/src/routes/AdminFlags.tsx`**

```tsx
import { useAuth } from '@/lib/useAuth';
import { useFlags } from '@/lib/useFlag';
import { ADMIN_EMAILS } from '@/lib/admins';
import { Navigate } from 'react-router-dom';

export default function AdminFlags() {
  const { session } = useAuth();
  const { data: flags, isLoading } = useFlags();

  if (!session || !ADMIN_EMAILS.has(session.user.email ?? '')) {
    return <Navigate to="/" replace />;
  }
  if (isLoading) return <main className="p-6">Carregando…</main>;

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="font-display text-2xl text-terra mb-4">Feature flags</h1>
      <p className="text-sm opacity-70 mb-4">
        Estas flags são lidas pelo frontend. Para alternar valores, use o Supabase Studio
        (SQL Editor) — o frontend não tem permissão de UPDATE.
      </p>
      <ul className="space-y-2">
        {flags && Object.entries(flags).map(([key, enabled]) => (
          <li key={key} className="flex items-center justify-between py-2 border-b border-carvao/10">
            <code>{key}</code>
            <span className={enabled ? 'text-mata' : 'opacity-50'}>
              {enabled ? '✓ on' : '✗ off'}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 4: Adicionar rota em `App.tsx`**

```tsx
<Route path="/_/flags" element={<AdminFlags />} />
```

- [ ] **Step 5: Smoke test**

`npm run dev` → logar como admin → visitar `/_/flags` → ver as 12 flags listadas.

- [ ] **Step 6: Commit**

```bash
cd C:\Users\Samsung\projetos\vila-viva
git add app/src/lib/useFlag.ts app/src/lib/admins.ts app/src/routes/AdminFlags.tsx app/src/App.tsx
git commit -m "feat(flags): hook useFlag + página admin /_/flags read-only"
```

---

## Task 12: Tela Feed com 5 tipos de post + FeedCard

**Files:**
- Create: `app/src/domain/postTypes.ts`
- Create: `app/tests/domain/postTypes.test.ts`
- Create: `app/src/routes/Feed.tsx`
- Create: `app/src/components/FeedCard.tsx`
- Modify: `app/src/App.tsx`

- [ ] **Step 1: TDD — teste de domain primeiro**

`app/tests/domain/postTypes.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { POST_TIPOS, isPostTipo, postTipoLabel } from '@/domain/postTypes';

describe('postTypes', () => {
  it('lista 5 tipos', () => {
    expect(POST_TIPOS).toHaveLength(5);
  });

  it('aceita tipos válidos', () => {
    expect(isPostTipo('historia')).toBe(true);
    expect(isPostTipo('pedido')).toBe(true);
  });

  it('rejeita tipos inválidos', () => {
    expect(isPostTipo('foo')).toBe(false);
    expect(isPostTipo('')).toBe(false);
  });

  it('retorna label PT-BR', () => {
    expect(postTipoLabel('historia')).toBe('História');
    expect(postTipoLabel('conquista')).toBe('Conquista');
  });
});
```

- [ ] **Step 2: Rodar — falha**

```bash
npm run test -- postTypes
```

- [ ] **Step 3: Implementar `app/src/domain/postTypes.ts`**

```typescript
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
```

- [ ] **Step 4: Testes verdes**

```bash
npm run test -- postTypes
```

- [ ] **Step 5: Componente `app/src/components/FeedCard.tsx`**

```tsx
import { postTipoLabel, type PostTipo } from '@/domain/postTypes';

export type FeedCardData = {
  id: string;
  tipo: PostTipo;
  titulo: string | null;
  corpo: string;
  created_at: string;
  autor: { id: string; nome: string; agente: string };
};

const TIPO_COLOR: Record<PostTipo, string> = {
  historia: 'bg-areia',
  pedido: 'bg-terra/10',
  projeto: 'bg-mata/10',
  evento: 'bg-yellow-100',
  conquista: 'bg-amber-200',
};

export function FeedCard({ post }: { post: FeedCardData }) {
  return (
    <article className={`${TIPO_COLOR[post.tipo]} rounded-card p-5 border border-carvao/10`}>
      <header className="flex items-center justify-between mb-2">
        <div className="text-xs opacity-60">
          <span className="font-medium">{post.autor.nome}</span>
          <span className="mx-1">·</span>
          <span>{post.autor.agente}</span>
        </div>
        <span className="text-xs uppercase tracking-wider opacity-50">
          {postTipoLabel(post.tipo)}
        </span>
      </header>
      {post.titulo && (
        <h3 className="font-display text-lg text-carvao mb-2">{post.titulo}</h3>
      )}
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.corpo}</p>
      <footer className="mt-3 text-xs opacity-50">
        {new Date(post.created_at).toLocaleString('pt-BR')}
      </footer>
    </article>
  );
}
```

- [ ] **Step 6: Rota `app/src/routes/Feed.tsx`**

```tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { FeedCard, type FeedCardData } from '@/components/FeedCard';

export default function Feed() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post')
        .select('id, tipo, titulo, corpo, created_at, autor:profile!autor_id(id, nome, agente)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as FeedCardData[];
    },
  });

  if (isLoading) return <main className="p-6">Carregando feed…</main>;
  if (error) return <main className="p-6 text-terra">Erro: {String(error)}</main>;

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="font-display text-2xl text-terra px-2">Feed</h1>
      {data?.map((p) => <FeedCard key={p.id} post={p} />)}
    </main>
  );
}
```

- [ ] **Step 7: Trocar `Home` em `App.tsx` por `Feed`**

```tsx
import Feed from '@/routes/Feed';
// ... e no Home, depois do check de onboarding:
return <Feed />;
```

- [ ] **Step 8: Smoke test**

`npm run dev` → logar → ver feed populado com posts dos seeds (até 25 cards).

- [ ] **Step 9: Commit**

```bash
cd C:\Users\Samsung\projetos\vila-viva
git add app/src/domain/postTypes.ts app/tests/domain/postTypes.test.ts app/src/components/FeedCard.tsx app/src/routes/Feed.tsx app/src/App.tsx
git commit -m "feat(feed): listagem de posts com 5 tipos e renderização específica"
```

---

## Task 13: Criar post — FAB + bottom-sheet

**Files:**
- Create: `app/src/components/PostCreator.tsx`
- Modify: `app/src/routes/Feed.tsx`

- [ ] **Step 1: Componente `app/src/components/PostCreator.tsx`**

```tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { useFlag } from '@/lib/useFlag';
import { POST_TIPOS, postTipoLabel, type PostTipo } from '@/domain/postTypes';

export function PostCreator() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const canCreateOutros = useFlag('feed_create_outros');
  const canCreateHistoria = useFlag('feed_create_historia');
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<PostTipo>('historia');
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');

  const tiposPermitidos = POST_TIPOS.filter((t) =>
    t === 'historia' ? canCreateHistoria : canCreateOutros
  );

  const create = useMutation({
    mutationFn: async () => {
      if (!corpo.trim()) throw new Error('Corpo é obrigatório.');
      const { error } = await supabase.from('post').insert({
        autor_id: session!.user.id,
        tipo,
        titulo: titulo || null,
        corpo: corpo.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed'] });
      setOpen(false);
      setTitulo('');
      setCorpo('');
    },
  });

  if (tiposPermitidos.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-terra text-areia text-3xl shadow-lg"
        aria-label="Criar post"
      >+</button>

      {open && (
        <div className="fixed inset-0 bg-carvao/40 flex items-end z-40" onClick={() => setOpen(false)}>
          <div
            className="w-full bg-areia rounded-t-card p-5 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl text-terra mb-3">Novo post</h3>

            <label className="block text-xs opacity-70 mb-1">Tipo</label>
            <div className="flex gap-2 flex-wrap mb-4">
              {tiposPermitidos.map((t) => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    tipo === t ? 'bg-terra text-areia' : 'bg-white border border-carvao/20'
                  }`}
                >{postTipoLabel(t)}</button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Título (opcional)"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-4 py-2 rounded-soft border border-carvao/20 bg-white mb-2"
            />
            <textarea
              placeholder="O que você quer compartilhar?"
              value={corpo}
              onChange={(e) => setCorpo(e.target.value)}
              rows={6}
              maxLength={2000}
              className="w-full px-4 py-2 rounded-soft border border-carvao/20 bg-white"
            />

            {create.error && (
              <p className="mt-2 text-sm text-terra">{(create.error as Error).message}</p>
            )}

            <div className="mt-4 flex gap-2">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-soft border border-carvao/20">
                Cancelar
              </button>
              <button
                onClick={() => create.mutate()}
                disabled={create.isPending || !corpo.trim()}
                className="flex-1 px-4 py-2 rounded-soft bg-terra text-areia disabled:opacity-50"
              >
                {create.isPending ? 'Publicando…' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Adicionar `<PostCreator />` em `Feed.tsx`**

```tsx
import { PostCreator } from '@/components/PostCreator';
// ... no return, depois da lista:
<PostCreator />
```

- [ ] **Step 3: Smoke test**

`npm run dev` → criar 1 post tipo `historia`, ver aparecer no topo do feed. No Supabase Studio, alternar `feed_create_outros` para `true`, recarregar a página, ver os 5 tipos disponíveis.

- [ ] **Step 4: Commit**

```bash
cd C:\Users\Samsung\projetos\vila-viva
git add app/src/components/PostCreator.tsx app/src/routes/Feed.tsx
git commit -m "feat(feed): criar post via FAB + bottom-sheet, respeitando flags"
```

---

## Task 14: Reactions com optimistic UI

**Files:**
- Create: `app/src/components/ReactionBar.tsx`
- Modify: `app/src/components/FeedCard.tsx`

- [ ] **Step 1: Componente `app/src/components/ReactionBar.tsx`**

```tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { useFlag } from '@/lib/useFlag';

const REACOES = [
  { tipo: 'coracao', emoji: '🫶' },
  { tipo: 'mao', emoji: '🤝' },
  { tipo: 'semente', emoji: '🌱' },
  { tipo: 'fogo', emoji: '🔥' },
] as const;

type TipoReacao = typeof REACOES[number]['tipo'];

export function ReactionBar({ postId }: { postId: string }) {
  const { session } = useAuth();
  const enabled = useFlag('reactions');
  const qc = useQueryClient();

  const { data: reactions } = useQuery({
    queryKey: ['reactions', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reaction')
        .select('tipo, autor_id')
        .eq('post_id', postId);
      if (error) throw error;
      return data;
    },
    enabled,
  });

  const toggle = useMutation({
    mutationFn: async (tipo: TipoReacao) => {
      const mine = reactions?.find((r) => r.tipo === tipo && r.autor_id === session!.user.id);
      if (mine) {
        await supabase.from('reaction').delete().eq('post_id', postId).eq('autor_id', session!.user.id).eq('tipo', tipo);
      } else {
        await supabase.from('reaction').insert({ post_id: postId, autor_id: session!.user.id, tipo });
      }
    },
    onMutate: async (tipo) => {
      await qc.cancelQueries({ queryKey: ['reactions', postId] });
      const prev = qc.getQueryData<{ tipo: string; autor_id: string }[]>(['reactions', postId]);
      const mine = prev?.find((r) => r.tipo === tipo && r.autor_id === session!.user.id);
      qc.setQueryData(['reactions', postId], (old: { tipo: string; autor_id: string }[] = []) =>
        mine
          ? old.filter((r) => !(r.tipo === tipo && r.autor_id === session!.user.id))
          : [...old, { tipo, autor_id: session!.user.id }]
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['reactions', postId], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['reactions', postId] }),
  });

  if (!enabled) return null;

  return (
    <div className="mt-3 flex gap-2">
      {REACOES.map((r) => {
        const count = reactions?.filter((x) => x.tipo === r.tipo).length ?? 0;
        const mine = reactions?.some((x) => x.tipo === r.tipo && x.autor_id === session?.user.id);
        return (
          <button
            key={r.tipo}
            onClick={() => toggle.mutate(r.tipo)}
            className={`px-2 py-1 rounded-full text-sm ${
              mine ? 'bg-terra/10' : 'bg-white border border-carvao/10'
            }`}
          >
            {r.emoji} {count > 0 && count}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Adicionar `<ReactionBar postId={post.id} />` em `FeedCard.tsx`** dentro do `<article>`, depois do `<footer>`.

- [ ] **Step 3: Smoke test**

`npm run dev` → ativar flag `reactions=true` no Studio → recarregar → clicar em emoji, ver contador subir/zerar.

- [ ] **Step 4: Commit**

```bash
cd C:\Users\Samsung\projetos\vila-viva
git add app/src/components/ReactionBar.tsx app/src/components/FeedCard.tsx
git commit -m "feat(reactions): 4 tipos com optimistic UI atrás de flag"
```

---

## Task 15: Comments (thread plana)

**Files:**
- Create: `app/src/components/CommentList.tsx`
- Modify: `app/src/components/FeedCard.tsx`

- [ ] **Step 1: `app/src/components/CommentList.tsx`**

```tsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { useFlag } from '@/lib/useFlag';

export function CommentList({ postId }: { postId: string }) {
  const { session } = useAuth();
  const enabled = useFlag('comments');
  const qc = useQueryClient();
  const [draft, setDraft] = useState('');

  const { data: comments } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comment')
        .select('id, corpo, created_at, autor:profile!autor_id(nome)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled,
  });

  const post = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('comment').insert({
        post_id: postId,
        autor_id: session!.user.id,
        corpo: draft.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft('');
      qc.invalidateQueries({ queryKey: ['comments', postId] });
    },
  });

  if (!enabled) return null;

  return (
    <div className="mt-3 border-t border-carvao/10 pt-3">
      {comments && comments.length > 0 && (
        <ul className="space-y-2 mb-2">
          {comments.map((c) => (
            <li key={c.id} className="text-sm">
              <span className="font-medium">{(c.autor as { nome: string }).nome}: </span>
              <span>{c.corpo}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Comentar…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1 px-3 py-2 rounded-soft border border-carvao/20 bg-white text-sm"
          onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) post.mutate(); }}
        />
        <button
          onClick={() => post.mutate()}
          disabled={!draft.trim() || post.isPending}
          className="px-3 py-2 rounded-soft bg-terra text-areia text-sm disabled:opacity-50"
        >Enviar</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Adicionar `<CommentList postId={post.id} />` em `FeedCard.tsx`** depois do `ReactionBar`.

- [ ] **Step 3: Smoke test**

Ativar `comments=true` no Studio. Comentar num post. Ver aparecer.

- [ ] **Step 4: Commit**

```bash
cd C:\Users\Samsung\projetos\vila-viva
git add app/src/components/CommentList.tsx app/src/components/FeedCard.tsx
git commit -m "feat(comments): thread plana com input inline atrás de flag"
```

---

## Task 16: Share WhatsApp + Profile read

**Files:**
- Create: `app/src/components/ShareWaButton.tsx`
- Create: `app/src/routes/Profile.tsx`
- Modify: `app/src/components/FeedCard.tsx`
- Modify: `app/src/App.tsx`

- [ ] **Step 1: `app/src/components/ShareWaButton.tsx`**

```tsx
import { useFlag } from '@/lib/useFlag';

export function ShareWaButton({ postId, titulo, autorNome }: { postId: string; titulo: string | null; autorNome: string }) {
  const enabled = useFlag('share_wa');
  if (!enabled) return null;

  const url = `${window.location.origin}/post/${postId}`;
  const text = `${titulo ? `"${titulo}" — ` : ''}post de ${autorNome} na Vila Viva: ${url}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-mata/10 text-mata"
    >
      Compartilhar no WhatsApp
    </a>
  );
}
```

- [ ] **Step 2: Adicionar em `FeedCard.tsx`** no footer.

- [ ] **Step 3: Tela `app/src/routes/Profile.tsx`**

```tsx
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile')
        .select('id, nome, agente, casa, intencao, bio, foto_url')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <main className="p-6">Carregando…</main>;
  if (error || !data) return <main className="p-6 text-terra">Perfil não encontrado.</main>;

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="font-display text-3xl text-terra">{data.nome}</h1>
      <p className="text-sm opacity-70 mt-1">
        {data.agente} {data.casa ? `· ${data.casa}` : ''}
      </p>
      {data.intencao && (
        <blockquote className="mt-4 italic border-l-4 border-mata pl-3">
          {data.intencao}
        </blockquote>
      )}
      {data.bio && (
        <p className="mt-4 whitespace-pre-wrap">{data.bio}</p>
      )}
    </main>
  );
}
```

- [ ] **Step 4: Rota em `App.tsx`**

```tsx
<Route path="/profile/:id" element={session ? <Profile /> : <Navigate to="/login" replace />} />
```

Tornar nome do autor no `FeedCard` clicável para abrir o perfil.

- [ ] **Step 5: Smoke test**

`share_wa=true` → clicar botão, abrir wa.me corretamente. Clicar nome do autor → ir para `/profile/:id`.

- [ ] **Step 6: Commit**

```bash
cd C:\Users\Samsung\projetos\vila-viva
git add app/src/components app/src/routes/Profile.tsx app/src/App.tsx
git commit -m "feat(share+profile): share wa.me + tela /profile/:id read-only"
```

---

## Task 17: Sentry inicializado + Deploy Vercel + CI

**Files:**
- Create: `app/src/lib/sentry.ts`
- Create: `.github/workflows/ci.yml` (na raiz do repo, não em app/)
- Create: `app/vercel.json`
- Modify: `app/src/main.tsx`

- [ ] **Step 1: `app/src/lib/sentry.ts`**

```typescript
import * as Sentry from '@sentry/react';

export function initSentry() {
  if (import.meta.env.MODE !== 'production') return;
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: 'staging',
    tracesSampleRate: 0.1,
    ignoreErrors: ['Network request failed', 'AbortError'],
  });
}
```

- [ ] **Step 2: Chamar em `main.tsx`** antes do `ReactDOM.createRoot`:

```tsx
import { initSentry } from '@/lib/sentry';
initSentry();
```

- [ ] **Step 3: `app/vercel.json`**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 4: GitHub Actions CI em `.github/workflows/ci.yml` na raiz**

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [master, main]

jobs:
  test:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: app } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm', cache-dependency-path: app/package-lock.json }
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test
```

- [ ] **Step 5: Deploy Vercel (uma vez, interativo)**

```bash
cd C:\Users\Samsung\projetos\vila-viva\app
vercel
# Responder: Set up and deploy? Y
# Which scope? <sua conta>
# Link to existing project? N
# What's your project's name? vila-viva-light
# In which directory is your code? ./
# Want to modify settings? N
```

No painel do Vercel, em Settings > Environment Variables, adicionar:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SENTRY_DSN`
- `VITE_POSTHOG_KEY`
- `VITE_POSTHOG_HOST`

Depois:

```bash
vercel --prod
```

Anotar URL final (ex: `https://vila-viva-light.vercel.app`).

- [ ] **Step 6: Configurar redirect do magic link**

No painel Supabase > Authentication > URL Configuration, adicionar `https://vila-viva-light.vercel.app` em "Site URL" e em "Redirect URLs".

- [ ] **Step 7: Smoke test produção**

Abrir URL do Vercel no iPhone (via app Documents da Readdle, conforme reference memory), receber magic link, completar fluxo.

- [ ] **Step 8: Commit**

```bash
cd C:\Users\Samsung\projetos\vila-viva
git add app/src/lib/sentry.ts app/src/main.tsx app/vercel.json .github/workflows/ci.yml
git commit -m "feat(ops): Sentry + Vercel staging + GitHub Actions CI"
git push -u origin master
```

---

# SEMANA 2 — Conexão + Desafio + Polish

## Task 18: Migrations 007 + 008 — `skill` e `profile_skill`

**Files:**
- Create: `app/supabase/migrations/007_skill.sql`
- Create: `app/supabase/migrations/008_profile_skill.sql`

- [ ] **Step 1: `007_skill.sql`**

```sql
CREATE TABLE IF NOT EXISTS public.skill (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  rotulo TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (categoria IN ('manual', 'mental', 'social', 'tecnica', 'ecologica', 'artistica'))
);

ALTER TABLE public.skill ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skill_select_authenticated" ON public.skill FOR SELECT TO authenticated USING (true);

-- Seed do catálogo ~80 skills (substituir lista abaixo conforme protótipo)
INSERT INTO public.skill (slug, rotulo, categoria) VALUES
  ('agro-sintropico', 'Agrofloresta sintrópica', 'ecologica'),
  ('apicultura', 'Apicultura', 'ecologica'),
  ('audiovisual', 'Audiovisual', 'tecnica'),
  ('bioconstrucao', 'Bioconstrução', 'manual'),
  ('canto', 'Canto e voz', 'artistica'),
  ('cartografia', 'Cartografia comunitária', 'tecnica'),
  ('ceramica', 'Cerâmica', 'artistica'),
  ('comunicacao-naoviolenta', 'Comunicação não violenta', 'social'),
  ('costura', 'Costura', 'manual'),
  ('culinaria-vegana', 'Culinária vegana', 'manual'),
  ('danca', 'Dança', 'artistica'),
  ('design', 'Design gráfico', 'tecnica'),
  ('educacao-infantil', 'Educação infantil', 'social'),
  ('educacao-popular', 'Educação popular', 'social'),
  ('escrita', 'Escrita criativa', 'artistica'),
  ('facilitacao', 'Facilitação de grupos', 'social'),
  ('fermentacao', 'Fermentação', 'manual'),
  ('fitoterapia', 'Fitoterapia', 'ecologica'),
  ('fotografia', 'Fotografia', 'artistica'),
  ('gestao', 'Gestão de projetos', 'mental'),
  ('horticultura', 'Horticultura', 'ecologica'),
  ('idiomas-ingles', 'Inglês', 'mental'),
  ('idiomas-espanhol', 'Espanhol', 'mental'),
  ('jardinagem', 'Jardinagem', 'ecologica'),
  ('marcenaria', 'Marcenaria', 'manual'),
  ('massagem', 'Massagem', 'manual'),
  ('mediacao-conflitos', 'Mediação de conflitos', 'social'),
  ('mecanica-basica', 'Mecânica básica', 'tecnica'),
  ('meditacao', 'Meditação', 'social'),
  ('musica', 'Música instrumental', 'artistica'),
  ('panificacao', 'Panificação artesanal', 'manual'),
  ('pedreiro', 'Pedreiro', 'manual'),
  ('pesca-sustentavel', 'Pesca sustentável', 'ecologica'),
  ('pintura', 'Pintura', 'artistica'),
  ('plantio', 'Plantio de mudas', 'ecologica'),
  ('podcast', 'Podcast', 'tecnica'),
  ('programacao', 'Programação web', 'tecnica'),
  ('reciclagem', 'Reciclagem', 'ecologica'),
  ('reiki', 'Reiki', 'social'),
  ('saneamento', 'Saneamento ecológico', 'ecologica'),
  ('sapataria', 'Sapataria', 'manual'),
  ('serralheria', 'Serralheria', 'manual'),
  ('teatro', 'Teatro', 'artistica'),
  ('terapia-floral', 'Terapia floral', 'social'),
  ('terapia-pratica', 'Atendimento terapêutico', 'social'),
  ('tradicao-oral', 'Tradição oral', 'social'),
  ('traducao', 'Tradução', 'mental'),
  ('turismo-comunitario', 'Turismo comunitário', 'social'),
  ('uxdesign', 'UX design', 'tecnica'),
  ('video-edicao', 'Edição de vídeo', 'tecnica'),
  ('voluntariado-coord', 'Coordenação de voluntariado', 'social'),
  ('yoga', 'Yoga', 'social'),
  ('zumba', 'Zumba', 'artistica')
ON CONFLICT (slug) DO NOTHING;
```

- [ ] **Step 2: `008_profile_skill.sql`**

```sql
CREATE TABLE IF NOT EXISTS public.profile_skill (
  profile_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skill(id) ON DELETE CASCADE,
  intencao TEXT NOT NULL CHECK (intencao IN ('oferece', 'busca')),
  nivel TEXT CHECK (nivel IN ('iniciante', 'intermediario', 'avancado')),
  PRIMARY KEY (profile_id, skill_id, intencao)
);

CREATE INDEX profile_skill_profile_idx ON public.profile_skill (profile_id);
CREATE INDEX profile_skill_skill_idx ON public.profile_skill (skill_id);

ALTER TABLE public.profile_skill ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_skill_select_authenticated" ON public.profile_skill
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profile_skill_insert_own" ON public.profile_skill
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

CREATE POLICY "profile_skill_delete_own" ON public.profile_skill
  FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- Seed: distribuir 3-5 skills oferece + 1-2 busca por perfil-seed
DO $$
DECLARE
  v_profile RECORD;
  v_skill RECORD;
  v_counter INT;
BEGIN
  FOR v_profile IN (SELECT id FROM public.profile WHERE id IN (SELECT id FROM auth.users WHERE email LIKE '%@seed.vilaviva.local')) LOOP
    v_counter := 0;
    FOR v_skill IN (SELECT id FROM public.skill ORDER BY random() LIMIT 4) LOOP
      INSERT INTO public.profile_skill (profile_id, skill_id, intencao, nivel)
      VALUES (v_profile.id, v_skill.id, 'oferece', 'intermediario')
      ON CONFLICT DO NOTHING;
      v_counter := v_counter + 1;
    END LOOP;
    FOR v_skill IN (SELECT id FROM public.skill ORDER BY random() LIMIT 2) LOOP
      INSERT INTO public.profile_skill (profile_id, skill_id, intencao, nivel)
      VALUES (v_profile.id, v_skill.id, 'busca', NULL)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
```

- [ ] **Step 3: Aplicar + commit**

```bash
cd C:\Users\Samsung\projetos\vila-viva\app
supabase db push
cd ..
git add app/supabase/migrations/007_skill.sql app/supabase/migrations/008_profile_skill.sql
git commit -m "feat(db): migrations 007/008 — catálogo skill (53 entradas) e profile_skill"
```

---

## Task 19: Domain `matchScore` (TDD)

**Files:**
- Create: `app/src/domain/matchScore.ts`
- Create: `app/tests/domain/matchScore.test.ts`

- [ ] **Step 1: Teste primeiro**

```typescript
// app/tests/domain/matchScore.test.ts
import { describe, it, expect } from 'vitest';
import { computeMatchScore } from '@/domain/matchScore';

describe('computeMatchScore', () => {
  it('retorna 0 quando não há interseção de skills nem arquétipo compatível', () => {
    const score = computeMatchScore({
      eu: { agente: 'tecedor', oferece: ['a', 'b'], busca: ['x'] },
      outro: { agente: 'curador', oferece: ['c'], busca: ['d'] },
    });
    expect(score).toBe(0);
  });

  it('soma +1 por skill que eu busco e outro oferece', () => {
    const score = computeMatchScore({
      eu: { agente: 'tecedor', oferece: [], busca: ['canto'] },
      outro: { agente: 'tecedor', oferece: ['canto'], busca: [] },
    });
    expect(score).toBeGreaterThanOrEqual(2); // arquétipo compatível + skill cruzada
  });

  it('soma bônus quando arquétipos são complementares', () => {
    const tecedorCurador = computeMatchScore({
      eu: { agente: 'tecedor', oferece: [], busca: [] },
      outro: { agente: 'curador', oferece: [], busca: [] },
    });
    expect(tecedorCurador).toBeGreaterThan(0);
  });

  it('é simétrico em skills cruzadas', () => {
    const a = computeMatchScore({
      eu: { agente: 'tecedor', oferece: ['canto'], busca: ['danca'] },
      outro: { agente: 'curador', oferece: ['danca'], busca: ['canto'] },
    });
    expect(a).toBeGreaterThanOrEqual(4); // 2 cruzamentos + arquétipos
  });
});
```

- [ ] **Step 2: Rodar — falha**

```bash
npm run test -- matchScore
```

- [ ] **Step 3: Implementar `app/src/domain/matchScore.ts`**

```typescript
import type { Agente } from './onboardingValidation';

type Side = { agente: string; oferece: string[]; busca: string[] };

// Pares complementares de arquétipos (bônus +1 cada par)
const COMPLEMENTARES: ReadonlyArray<readonly [Agente, Agente]> = [
  ['tecedor', 'curador'],
  ['mediador', 'guardian'],
  ['sonhador', 'praticante'],
  ['aprendiz', 'guia'],
  ['tradutor', 'semeador'],
  ['pesquisador', 'comunicador'],
  ['artesao', 'visionario'],
];

function sameAgente(a: string, b: string): boolean {
  return a === b;
}

function complementar(a: string, b: string): boolean {
  return COMPLEMENTARES.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a)
  );
}

export function computeMatchScore({ eu, outro }: { eu: Side; outro: Side }): number {
  let score = 0;

  // Arquétipo: +1 mesmo, +1 complementar
  if (sameAgente(eu.agente, outro.agente)) score += 1;
  if (complementar(eu.agente, outro.agente)) score += 1;

  // Skills cruzadas (eu busco × outro oferece)
  const setOferece = new Set(outro.oferece);
  for (const s of eu.busca) if (setOferece.has(s)) score += 1;

  // Skills cruzadas (outro busca × eu ofereço)
  const meusOferece = new Set(eu.oferece);
  for (const s of outro.busca) if (meusOferece.has(s)) score += 1;

  return score;
}
```

- [ ] **Step 4: Testes verdes**

```bash
npm run test -- matchScore
```

- [ ] **Step 5: Commit**

```bash
cd C:\Users\Samsung\projetos\vila-viva
git add app/src/domain/matchScore.ts app/tests/domain/matchScore.test.ts
git commit -m "feat(domain): matchScore com bônus por arquétipo complementar (TDD)"
```

---

## Task 20: Edge Function `match-engine`

**Files:**
- Create: `app/supabase/functions/match-engine/index.ts`
- Create: `app/supabase/functions/match-engine/deno.json`

- [ ] **Step 1: `deno.json`**

```json
{
  "imports": {
    "@supabase/supabase-js": "jsr:@supabase/supabase-js@2"
  }
}
```

- [ ] **Step 2: `app/supabase/functions/match-engine/index.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';

const COMPLEMENTARES: readonly [string, string][] = [
  ['tecedor', 'curador'], ['mediador', 'guardian'], ['sonhador', 'praticante'],
  ['aprendiz', 'guia'], ['tradutor', 'semeador'], ['pesquisador', 'comunicador'],
  ['artesao', 'visionario'],
];

function score(eu: { agente: string; oferece: Set<string>; busca: Set<string> },
               o:  { agente: string; oferece: Set<string>; busca: Set<string> }): number {
  let s = 0;
  if (eu.agente === o.agente) s += 1;
  if (COMPLEMENTARES.some(([a,b]) => (a===eu.agente && b===o.agente) || (a===o.agente && b===eu.agente))) s += 1;
  for (const x of eu.busca) if (o.oferece.has(x)) s += 1;
  for (const x of o.busca) if (eu.oferece.has(x)) s += 1;
  return s;
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Missing auth', { status: 401 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return new Response('Unauthorized', { status: 401 });

  // Body opcional: { agenteFilter?: string, limit?: number, search?: string }
  const body = req.method === 'POST' ? await req.json() : {};
  const limit = Math.min(body.limit ?? 20, 50);

  const { data: meRow } = await supabase
    .from('profile')
    .select('id, agente')
    .eq('id', user.id)
    .single();
  if (!meRow) return new Response('Profile not found', { status: 404 });

  const { data: meSkills } = await supabase
    .from('profile_skill')
    .select('skill_id, intencao')
    .eq('profile_id', user.id);

  const meOferece = new Set((meSkills ?? []).filter(s => s.intencao === 'oferece').map(s => s.skill_id));
  const meBusca = new Set((meSkills ?? []).filter(s => s.intencao === 'busca').map(s => s.skill_id));

  let query = supabase
    .from('profile')
    .select('id, nome, agente, casa, intencao, foto_url')
    .neq('id', user.id)
    .not('onboarding_completed_at', 'is', null);

  if (body.agenteFilter) query = query.eq('agente', body.agenteFilter);
  if (body.search) query = query.ilike('nome', `%${body.search}%`);

  const { data: outros, error } = await query.limit(100);
  if (error) return new Response(error.message, { status: 500 });

  const otherIds = (outros ?? []).map(o => o.id);
  const { data: otherSkillsRows } = await supabase
    .from('profile_skill')
    .select('profile_id, skill_id, intencao')
    .in('profile_id', otherIds);

  const skillsByProfile = new Map<string, { oferece: Set<string>; busca: Set<string> }>();
  for (const r of otherSkillsRows ?? []) {
    if (!skillsByProfile.has(r.profile_id))
      skillsByProfile.set(r.profile_id, { oferece: new Set(), busca: new Set() });
    skillsByProfile.get(r.profile_id)![r.intencao as 'oferece'|'busca'].add(r.skill_id);
  }

  const scored = (outros ?? []).map(o => {
    const s = skillsByProfile.get(o.id) ?? { oferece: new Set(), busca: new Set() };
    return {
      ...o,
      score: score({ agente: meRow.agente, oferece: meOferece, busca: meBusca },
                   { agente: o.agente, oferece: s.oferece, busca: s.busca }),
    };
  }).sort((a, b) => b.score - a.score).slice(0, limit);

  return new Response(JSON.stringify(scored), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

- [ ] **Step 3: Deploy**

```bash
cd C:\Users\Samsung\projetos\vila-viva\app
supabase functions deploy match-engine
```

Expected: `Deployed Function match-engine to https://agzldrdonirirftgvdfl.supabase.co/functions/v1/match-engine`

- [ ] **Step 4: Smoke test via curl**

```bash
curl -X POST \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"limit": 5}' \
  https://agzldrdonirirftgvdfl.supabase.co/functions/v1/match-engine
```

Expected: 401 (anon não é user); ao testar do app autenticado vai retornar array.

- [ ] **Step 5: Commit**

```bash
cd C:\Users\Samsung\projetos\vila-viva
git add app/supabase/functions/match-engine
git commit -m "feat(edge): match-engine Deno com score de arquétipo + skills cruzadas"
```

---

## Task 21: Tela `/match` com busca + filtro

**Files:**
- Create: `app/src/routes/Match.tsx`
- Create: `app/src/components/MatchCard.tsx`
- Modify: `app/src/App.tsx`

- [ ] **Step 1: `app/src/components/MatchCard.tsx`**

```tsx
import { Link } from 'react-router-dom';

export type MatchResult = {
  id: string;
  nome: string;
  agente: string;
  casa: string | null;
  intencao: string | null;
  score: number;
};

export function MatchCard({ m }: { m: MatchResult }) {
  return (
    <Link
      to={`/profile/${m.id}`}
      className="block p-4 rounded-card bg-white border border-carvao/10 hover:border-mata"
    >
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-lg text-terra">{m.nome}</h3>
        <span className="text-xs opacity-50">score {m.score}</span>
      </div>
      <p className="text-xs opacity-70">{m.agente}{m.casa ? ` · ${m.casa}` : ''}</p>
      {m.intencao && <p className="text-sm mt-2 italic">{m.intencao}</p>}
    </Link>
  );
}
```

- [ ] **Step 2: `app/src/routes/Match.tsx`**

```tsx
import { useState, useDeferredValue } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useFlag } from '@/lib/useFlag';
import { Navigate } from 'react-router-dom';
import { AGENTES } from '@/domain/onboardingValidation';
import { MatchCard, type MatchResult } from '@/components/MatchCard';

export default function Match() {
  const enabled = useFlag('match_pessoas');
  const [search, setSearch] = useState('');
  const [agenteFilter, setAgenteFilter] = useState<string>('');
  const deferredSearch = useDeferredValue(search);

  const { data, isLoading } = useQuery({
    queryKey: ['match', deferredSearch, agenteFilter],
    queryFn: async (): Promise<MatchResult[]> => {
      const { data, error } = await supabase.functions.invoke('match-engine', {
        body: { search: deferredSearch || undefined, agenteFilter: agenteFilter || undefined, limit: 20 },
      });
      if (error) throw error;
      return data as MatchResult[];
    },
    enabled,
    staleTime: 30_000,
  });

  if (!enabled) return <Navigate to="/" replace />;

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="font-display text-2xl text-terra mb-4">Pessoas</h1>

      <input
        type="search"
        placeholder="Busca por nome…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 rounded-soft border border-carvao/20 bg-white mb-3"
      />

      <div className="flex gap-2 flex-wrap mb-4">
        <button
          onClick={() => setAgenteFilter('')}
          className={`px-2.5 py-1 rounded-full text-xs ${
            agenteFilter === '' ? 'bg-terra text-areia' : 'bg-white border border-carvao/20'
          }`}
        >Todos</button>
        {AGENTES.map((a) => (
          <button
            key={a}
            onClick={() => setAgenteFilter(a)}
            className={`px-2.5 py-1 rounded-full text-xs ${
              agenteFilter === a ? 'bg-terra text-areia' : 'bg-white border border-carvao/20'
            }`}
          >{a}</button>
        ))}
      </div>

      {isLoading && <p>Buscando…</p>}
      <div className="space-y-3">
        {data?.map((m) => <MatchCard key={m.id} m={m} />)}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Adicionar rota `/match` em `App.tsx` + link no Feed**

- [ ] **Step 4: Smoke test**

Ativar `match_pessoas=true` no Studio. Abrir `/match`, ver 15 perfis ordenados por score. Filtrar por arquétipo.

- [ ] **Step 5: Commit**

```bash
cd C:\Users\Samsung\projetos\vila-viva
git add app/src/routes/Match.tsx app/src/components/MatchCard.tsx app/src/App.tsx
git commit -m "feat(match): tela /match com search + filtro por arquétipo via edge function"
```

---

## Task 22: Profile edit (bio, skills, foto)

**Files:**
- Create: `app/src/routes/ProfileEdit.tsx`
- Modify: `app/src/App.tsx`

- [ ] **Step 1: `app/src/routes/ProfileEdit.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { useFlag } from '@/lib/useFlag';
import { AGENTES } from '@/domain/onboardingValidation';

export default function ProfileEdit() {
  const enabled = useFlag('profile_edit');
  const { session } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: profile, isLoading: loadingP } = useQuery({
    queryKey: ['profile', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile').select('*').eq('id', session!.user.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!session && enabled,
  });

  const { data: allSkills } = useQuery({
    queryKey: ['skill_catalog'],
    queryFn: async () => {
      const { data, error } = await supabase.from('skill').select('id, slug, rotulo, categoria').order('rotulo');
      if (error) throw error;
      return data;
    },
    enabled,
  });

  const { data: mySkills } = useQuery({
    queryKey: ['my_skills', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_skill').select('skill_id, intencao').eq('profile_id', session!.user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!session && enabled,
  });

  const [nome, setNome] = useState('');
  const [agente, setAgente] = useState('');
  const [casa, setCasa] = useState('');
  const [intencao, setIntencao] = useState('');
  const [bio, setBio] = useState('');
  const [oferece, setOferece] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (profile) {
      setNome(profile.nome);
      setAgente(profile.agente);
      setCasa(profile.casa ?? '');
      setIntencao(profile.intencao ?? '');
      setBio(profile.bio ?? '');
    }
    if (mySkills) {
      setOferece(new Set(mySkills.filter(s => s.intencao === 'oferece').map(s => s.skill_id)));
      setBusca(new Set(mySkills.filter(s => s.intencao === 'busca').map(s => s.skill_id)));
    }
  }, [profile, mySkills]);

  const save = useMutation({
    mutationFn: async () => {
      const { error: e1 } = await supabase
        .from('profile')
        .update({ nome, agente, casa: casa || null, intencao: intencao || null, bio: bio || null })
        .eq('id', session!.user.id);
      if (e1) throw e1;

      // Reset profile_skill: delete all + reinsert
      await supabase.from('profile_skill').delete().eq('profile_id', session!.user.id);

      const rows = [
        ...Array.from(oferece).map(skill_id => ({ profile_id: session!.user.id, skill_id, intencao: 'oferece' as const, nivel: 'intermediario' as const })),
        ...Array.from(busca).map(skill_id => ({ profile_id: session!.user.id, skill_id, intencao: 'busca' as const, nivel: null })),
      ];
      if (rows.length > 0) {
        const { error: e2 } = await supabase.from('profile_skill').insert(rows);
        if (e2) throw e2;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['my_skills'] });
      nav(`/profile/${session!.user.id}`);
    },
  });

  if (!enabled) return <Navigate to="/" replace />;
  if (loadingP) return <main className="p-6">Carregando…</main>;

  function toggle(set: Set<string>, setSet: (s: Set<string>) => void, id: string) {
    const n = new Set(set);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setSet(n);
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="font-display text-2xl text-terra">Editar perfil</h1>

      <label className="block">
        <span className="text-xs opacity-70">Nome</span>
        <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-3 py-2 rounded-soft border border-carvao/20 bg-white" />
      </label>

      <label className="block">
        <span className="text-xs opacity-70">Agente</span>
        <select value={agente} onChange={(e) => setAgente(e.target.value)} className="w-full px-3 py-2 rounded-soft border border-carvao/20 bg-white">
          {AGENTES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="text-xs opacity-70">Casa</span>
        <input value={casa} onChange={(e) => setCasa(e.target.value)} className="w-full px-3 py-2 rounded-soft border border-carvao/20 bg-white" />
      </label>

      <label className="block">
        <span className="text-xs opacity-70">Intenção (até 280)</span>
        <textarea value={intencao} onChange={(e) => setIntencao(e.target.value)} maxLength={280} rows={2} className="w-full px-3 py-2 rounded-soft border border-carvao/20 bg-white" />
      </label>

      <label className="block">
        <span className="text-xs opacity-70">Bio</span>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-soft border border-carvao/20 bg-white" />
      </label>

      <div>
        <span className="text-xs opacity-70">Habilidades que ofereço</span>
        <div className="flex gap-1 flex-wrap mt-1">
          {allSkills?.map(s => (
            <button key={s.id} type="button" onClick={() => toggle(oferece, setOferece, s.id)}
              className={`px-2 py-1 rounded-full text-xs ${oferece.has(s.id) ? 'bg-mata text-areia' : 'bg-white border border-carvao/20'}`}>
              {s.rotulo}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="text-xs opacity-70">Habilidades que busco</span>
        <div className="flex gap-1 flex-wrap mt-1">
          {allSkills?.map(s => (
            <button key={s.id} type="button" onClick={() => toggle(busca, setBusca, s.id)}
              className={`px-2 py-1 rounded-full text-xs ${busca.has(s.id) ? 'bg-terra text-areia' : 'bg-white border border-carvao/20'}`}>
              {s.rotulo}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => save.mutate()}
        disabled={save.isPending}
        className="w-full px-4 py-3 rounded-soft bg-terra text-areia font-medium disabled:opacity-50"
      >
        {save.isPending ? 'Salvando…' : 'Salvar'}
      </button>
      {save.error && <p className="text-sm text-terra">{(save.error as Error).message}</p>}
    </main>
  );
}
```

- [ ] **Step 2: Rota em `App.tsx`**

```tsx
<Route path="/profile/me/edit" element={session ? <ProfileEdit /> : <Navigate to="/login" replace />} />
```

- [ ] **Step 3: Smoke test**

Ativar `profile_edit=true`. Editar bio, marcar skills oferece/busca, salvar, ver perfil atualizado.

- [ ] **Step 4: Commit**

```bash
cd C:\Users\Samsung\projetos\vila-viva
git add app/src/routes/ProfileEdit.tsx app/src/App.tsx
git commit -m "feat(profile): edição completa incluindo skills oferece/busca"
```

---

## Task 23: Migrations 009/010 — `notification` + `connection_seen` + Realtime

**Files:**
- Create: `app/supabase/migrations/009_notification.sql`
- Create: `app/supabase/migrations/010_connection_seen.sql`
- Create: `app/src/components/NotificationBell.tsx`
- Modify: `app/src/App.tsx`

- [ ] **Step 1: `009_notification.sql`**

```sql
CREATE TABLE IF NOT EXISTS public.notification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('post_comentado', 'reaction_recebida', 'match_sugerido', 'challenge_progresso')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  lida_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notification_dest_unread_idx ON public.notification (destinatario_id, lida_em) WHERE lida_em IS NULL;
CREATE INDEX notification_dest_created_idx ON public.notification (destinatario_id, created_at DESC);

ALTER TABLE public.notification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_select_own" ON public.notification
  FOR SELECT TO authenticated USING (destinatario_id = auth.uid());

CREATE POLICY "notification_update_own" ON public.notification
  FOR UPDATE TO authenticated USING (destinatario_id = auth.uid()) WITH CHECK (destinatario_id = auth.uid());

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification;

-- Trigger: ao receber comment em post, notifica autor do post
CREATE OR REPLACE FUNCTION public.notify_post_commented()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_autor_post UUID;
BEGIN
  SELECT autor_id INTO v_autor_post FROM public.post WHERE id = NEW.post_id;
  IF v_autor_post IS NOT NULL AND v_autor_post != NEW.autor_id THEN
    INSERT INTO public.notification (destinatario_id, tipo, payload)
    VALUES (v_autor_post, 'post_comentado',
      jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'autor_id', NEW.autor_id));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER comment_notify
  AFTER INSERT ON public.comment
  FOR EACH ROW EXECUTE FUNCTION public.notify_post_commented();

-- Trigger: ao receber reaction, notifica autor
CREATE OR REPLACE FUNCTION public.notify_reaction_recebida()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_autor_post UUID;
BEGIN
  SELECT autor_id INTO v_autor_post FROM public.post WHERE id = NEW.post_id;
  IF v_autor_post IS NOT NULL AND v_autor_post != NEW.autor_id THEN
    INSERT INTO public.notification (destinatario_id, tipo, payload)
    VALUES (v_autor_post, 'reaction_recebida',
      jsonb_build_object('post_id', NEW.post_id, 'autor_id', NEW.autor_id, 'tipo_reacao', NEW.tipo));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER reaction_notify
  AFTER INSERT ON public.reaction
  FOR EACH ROW EXECUTE FUNCTION public.notify_reaction_recebida();
```

- [ ] **Step 2: `010_connection_seen.sql`**

```sql
CREATE TABLE IF NOT EXISTS public.connection_seen (
  observador_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  observado_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (observador_id, observado_id)
);

ALTER TABLE public.connection_seen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "connection_seen_select_own" ON public.connection_seen
  FOR SELECT TO authenticated USING (observador_id = auth.uid());

CREATE POLICY "connection_seen_insert_own" ON public.connection_seen
  FOR INSERT TO authenticated WITH CHECK (observador_id = auth.uid());
```

- [ ] **Step 3: Aplicar**

```bash
supabase db push
```

- [ ] **Step 4: `app/src/components/NotificationBell.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { useFlag } from '@/lib/useFlag';

export function NotificationBell() {
  const { session } = useAuth();
  const enabled = useFlag('notifications');
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifs } = useQuery({
    queryKey: ['notifications', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification')
        .select('id, tipo, payload, lida_em, created_at')
        .eq('destinatario_id', session!.user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
    enabled: !!session && enabled,
  });

  useEffect(() => {
    if (!session || !enabled) return;
    const ch = supabase
      .channel(`notif:${session.user.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notification', filter: `destinatario_id=eq.${session.user.id}` },
        () => qc.invalidateQueries({ queryKey: ['notifications', session.user.id] })
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session, enabled, qc]);

  if (!enabled) return null;

  const unread = notifs?.filter(n => !n.lida_em).length ?? 0;

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2">
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-terra text-areia text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-carvao/20 rounded-card shadow-lg z-50">
          {(!notifs || notifs.length === 0) && <p className="p-3 text-sm opacity-60">Sem notificações.</p>}
          {notifs?.map(n => (
            <div key={n.id} className={`p-3 border-b border-carvao/10 text-sm ${!n.lida_em ? 'bg-areia' : ''}`}>
              <span className="text-xs opacity-50">{new Date(n.created_at).toLocaleString('pt-BR')}</span>
              <p>{describeNotif(n.tipo)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function describeNotif(tipo: string): string {
  switch (tipo) {
    case 'post_comentado': return 'Alguém comentou em seu post.';
    case 'reaction_recebida': return 'Você recebeu uma reação.';
    case 'match_sugerido': return 'Nova conexão sugerida no Match.';
    case 'challenge_progresso': return 'Você avançou em um desafio.';
    default: return 'Notificação.';
  }
}
```

- [ ] **Step 5: Adicionar `<NotificationBell />` no header global** (criar `<TopBar />` em `App.tsx` se ainda não existir).

- [ ] **Step 6: Smoke test**

Ativar `notifications=true`. De outra conta (ou anônimo via Studio), inserir um `comment` ou `reaction` em um post seu. Ver badge aparecer em < 2s.

- [ ] **Step 7: Commit**

```bash
cd C:\Users\Samsung\projetos\vila-viva
git add app/supabase/migrations/009_notification.sql app/supabase/migrations/010_connection_seen.sql app/src/components/NotificationBell.tsx app/src/App.tsx
git commit -m "feat(notifications): triggers comment/reaction + bell com Realtime"
```

---

## Task 24: Migrations 011/012 — `challenge` + `challenge_progress` + Desafio piloto

**Files:**
- Create: `app/supabase/migrations/011_challenge.sql`
- Create: `app/supabase/migrations/012_challenge_progress.sql`
- Create: `app/src/routes/Desafios.tsx`
- Create: `app/src/domain/challengeProgress.ts`
- Create: `app/tests/domain/challengeProgress.test.ts`
- Modify: `app/src/App.tsx`

- [ ] **Step 1: `011_challenge.sql`**

```sql
CREATE TABLE IF NOT EXISTS public.challenge (
  slug TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  criterio_meta JSONB NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.challenge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenge_select_authenticated" ON public.challenge FOR SELECT TO authenticated USING (true);

INSERT INTO public.challenge (slug, titulo, descricao, criterio_meta) VALUES (
  'conectar-aliados-distantes',
  'Conectar Aliados Distantes',
  'Comente em ao menos 3 posts de pessoas de arquétipos diferentes do seu.',
  '{"tipo":"comments_diferentes_agentes","minimo":3}'::jsonb
) ON CONFLICT (slug) DO NOTHING;
```

- [ ] **Step 2: `012_challenge_progress.sql`**

```sql
CREATE TABLE IF NOT EXISTS public.challenge_progress (
  profile_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  challenge_slug TEXT NOT NULL REFERENCES public.challenge(slug) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'em_progresso' CHECK (estado IN ('nao_iniciado', 'em_progresso', 'concluido')),
  contador INT NOT NULL DEFAULT 0,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  concluido_em TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (profile_id, challenge_slug)
);

ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenge_progress_select_own" ON public.challenge_progress
  FOR SELECT TO authenticated USING (profile_id = auth.uid());

-- Recompute via trigger on comment insert
CREATE OR REPLACE FUNCTION public.recompute_conectar_aliados()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_meu_agente TEXT;
  v_count INT;
BEGIN
  SELECT agente INTO v_meu_agente FROM public.profile WHERE id = NEW.autor_id;

  SELECT COUNT(DISTINCT pp.agente) INTO v_count
  FROM public.comment c
  JOIN public.post p ON p.id = c.post_id
  JOIN public.profile pp ON pp.id = p.autor_id
  WHERE c.autor_id = NEW.autor_id
    AND pp.agente != v_meu_agente
    AND p.autor_id != NEW.autor_id;

  INSERT INTO public.challenge_progress (profile_id, challenge_slug, contador, estado, concluido_em)
  VALUES (NEW.autor_id, 'conectar-aliados-distantes', v_count,
          CASE WHEN v_count >= 3 THEN 'concluido' ELSE 'em_progresso' END,
          CASE WHEN v_count >= 3 THEN NOW() ELSE NULL END)
  ON CONFLICT (profile_id, challenge_slug) DO UPDATE SET
    contador = EXCLUDED.contador,
    estado = EXCLUDED.estado,
    concluido_em = CASE WHEN EXCLUDED.estado = 'concluido' AND challenge_progress.concluido_em IS NULL THEN NOW() ELSE challenge_progress.concluido_em END,
    updated_at = NOW();

  IF v_count >= 3 THEN
    INSERT INTO public.notification (destinatario_id, tipo, payload)
    VALUES (NEW.autor_id, 'challenge_progresso',
            jsonb_build_object('challenge_slug', 'conectar-aliados-distantes', 'estado', 'concluido'));
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER comment_recompute_challenge
  AFTER INSERT ON public.comment
  FOR EACH ROW EXECUTE FUNCTION public.recompute_conectar_aliados();
```

- [ ] **Step 3: TDD domain (regras puras de progresso)**

`app/tests/domain/challengeProgress.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { describeChallengeState, progressPercent } from '@/domain/challengeProgress';

describe('challengeProgress', () => {
  it('describe estado em PT-BR', () => {
    expect(describeChallengeState('nao_iniciado')).toBe('Não iniciado');
    expect(describeChallengeState('em_progresso')).toBe('Em progresso');
    expect(describeChallengeState('concluido')).toBe('Concluído');
  });

  it('progressPercent calcula 0..100 baseado em contador e meta', () => {
    expect(progressPercent(0, 3)).toBe(0);
    expect(progressPercent(1, 3)).toBe(33);
    expect(progressPercent(2, 3)).toBe(67);
    expect(progressPercent(3, 3)).toBe(100);
    expect(progressPercent(5, 3)).toBe(100); // cap
  });

  it('progressPercent retorna 0 se meta é 0', () => {
    expect(progressPercent(0, 0)).toBe(0);
  });
});
```

Implementar `app/src/domain/challengeProgress.ts`:

```typescript
export type ChallengeEstado = 'nao_iniciado' | 'em_progresso' | 'concluido';

export function describeChallengeState(e: ChallengeEstado): string {
  return { nao_iniciado: 'Não iniciado', em_progresso: 'Em progresso', concluido: 'Concluído' }[e];
}

export function progressPercent(contador: number, meta: number): number {
  if (meta <= 0) return 0;
  return Math.min(100, Math.round((contador / meta) * 100));
}
```

Rodar testes → verdes.

- [ ] **Step 4: Rota `app/src/routes/Desafios.tsx`**

```tsx
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { useFlag } from '@/lib/useFlag';
import { describeChallengeState, progressPercent, type ChallengeEstado } from '@/domain/challengeProgress';

export default function Desafios() {
  const enabled = useFlag('challenge_piloto');
  const { session } = useAuth();

  const { data: challenges } = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const { data, error } = await supabase.from('challenge').select('slug, titulo, descricao, criterio_meta').eq('ativo', true);
      if (error) throw error;
      return data;
    },
    enabled,
  });

  const { data: progress } = useQuery({
    queryKey: ['challenge_progress', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_progress')
        .select('challenge_slug, estado, contador')
        .eq('profile_id', session!.user.id);
      if (error) throw error;
      return Object.fromEntries(data.map(p => [p.challenge_slug, p]));
    },
    enabled: !!session && enabled,
  });

  if (!enabled) return <Navigate to="/" replace />;

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-3">
      <h1 className="font-display text-2xl text-terra">Desafios</h1>
      {challenges?.map(ch => {
        const p = progress?.[ch.slug];
        const meta = (ch.criterio_meta as { minimo: number }).minimo;
        const pct = progressPercent(p?.contador ?? 0, meta);
        return (
          <article key={ch.slug} className="p-4 rounded-card bg-white border border-carvao/10">
            <h3 className="font-display text-lg text-terra">{ch.titulo}</h3>
            <p className="text-sm opacity-70 mt-1">{ch.descricao}</p>
            <div className="mt-3">
              <div className="h-2 bg-carvao/10 rounded-full overflow-hidden">
                <div className="h-full bg-mata" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs opacity-60 mt-1">
                {p?.contador ?? 0} / {meta} · {describeChallengeState((p?.estado ?? 'nao_iniciado') as ChallengeEstado)}
              </p>
            </div>
          </article>
        );
      })}
    </main>
  );
}
```

- [ ] **Step 5: Rota `/desafios` em `App.tsx`**

- [ ] **Step 6: Smoke test**

Aplicar migrations. Ativar `challenge_piloto=true`. Em duas contas com agentes diferentes, comentar em posts mútuos. Acompanhar progresso atualizar de 0/3 a 3/3 → "Concluído", e notificação chegar.

- [ ] **Step 7: Commit**

```bash
cd C:\Users\Samsung\projetos\vila-viva
git add app/supabase/migrations/011_challenge.sql app/supabase/migrations/012_challenge_progress.sql app/src/domain/challengeProgress.ts app/tests/domain/challengeProgress.test.ts app/src/routes/Desafios.tsx app/src/App.tsx
git commit -m "feat(desafios): Conectar Aliados Distantes com trigger de progresso"
```

---

## Task 25: PostHog + funnel completo

**Files:**
- Create: `app/src/lib/posthog.ts`
- Modify: `app/src/main.tsx`
- Modify: pontos de captura nos componentes (Onboarding, PostCreator, ReactionBar, Match, NotificationBell)

- [ ] **Step 1: `app/src/lib/posthog.ts`**

```typescript
import posthog from 'posthog-js';

export function initPostHog() {
  if (import.meta.env.MODE !== 'production') return;
  const key = import.meta.env.VITE_POSTHOG_KEY;
  const host = import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com';
  if (!key) return;

  posthog.init(key, {
    api_host: host,
    capture_pageview: true,
    capture_pageleave: true,
    disable_session_recording: true,
  });
}

export function track(event: string, props?: Record<string, unknown>) {
  if (import.meta.env.MODE !== 'production') return;
  posthog.capture(event, props);
}

export function identify(userId: string, props?: Record<string, unknown>) {
  if (import.meta.env.MODE !== 'production') return;
  posthog.identify(userId, props);
}
```

- [ ] **Step 2: Inicializar em `main.tsx`**

```tsx
import { initPostHog } from '@/lib/posthog';
initPostHog();
```

- [ ] **Step 3: Identify ao logar — `useAuth.ts`**

No `useEffect` quando session muda:

```typescript
import { identify } from './posthog';
// dentro do useEffect:
if (s?.user) identify(s.user.id, { email: s.user.email });
```

- [ ] **Step 4: Capturas chave**

- `Onboarding.tsx` no `onSuccess` do mutate: `track('onboarding_completed')`
- `PostCreator.tsx` no `onSuccess`: `track('post_created', { tipo })`
- `ReactionBar.tsx` no `mutationFn`: `track('reaction_added', { tipo, post_id: postId })`
- `CommentList.tsx`: `track('comment_posted', { post_id: postId })`
- `ShareWaButton.tsx` no click: `track('share_wa_clicked', { post_id: postId })`
- `Match.tsx` no `onSuccess`: `track('match_viewed', { count: data.length })`
- `MatchCard.tsx` no click: `track('match_clicked', { profile_id })`

- [ ] **Step 5: Smoke test**

Após deploy, percorrer o fluxo. No painel PostHog, ver eventos chegando + funnel `signup → onboarding → primeiro_post → primeiro_match`.

- [ ] **Step 6: Commit**

```bash
cd C:\Users\Samsung\projetos\vila-viva
git add app/src/lib/posthog.ts app/src/main.tsx app/src/lib/useAuth.ts app/src/routes app/src/components
git commit -m "feat(analytics): PostHog completo com identify e 7 eventos do funnel"
```

---

## Task 26: Playwright smoke test E2E

**Files:**
- Create: `app/tests/e2e/critical-flow.spec.ts`
- Create: `app/playwright.config.ts`
- Modify: `app/package.json`

- [ ] **Step 1: Instalar**

```bash
cd C:\Users\Samsung\projetos\vila-viva\app
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: `app/playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
    headless: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'iphone', use: { ...devices['iPhone 13'] } },
  ],
});
```

- [ ] **Step 3: Smoke test crítico — `app/tests/e2e/critical-flow.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Vila Viva Light — fluxo crítico', () => {
  test('login form aparece e aceita e-mail', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Vila Viva')).toBeVisible();
    await page.getByPlaceholder('seu@email.com').fill('eciocesario@gmail.com');
    await page.getByRole('button', { name: /Receber link/i }).click();
    // Não esperamos magic link em e2e — só validamos UX de envio
    await expect(page.getByText(/Link enviado|Enviando/i)).toBeVisible({ timeout: 5000 });
  });

  test('página de privacidade carrega', async ({ page }) => {
    await page.goto('/privacidade');
    await expect(page.getByText('Política de privacidade')).toBeVisible();
    await expect(page.getByText(/stakeholders convidados/i)).toBeVisible();
  });
});
```

- [ ] **Step 4: Adicionar script em `package.json`**

```json
{
  "scripts": {
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 5: Rodar local**

```bash
npm run dev &
npm run test:e2e
```

Expected: 4 testes verdes (2 navegadores × 2 testes).

- [ ] **Step 6: CI**

Adicionar job em `.github/workflows/ci.yml`:

```yaml
  e2e:
    needs: test
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: app } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm', cache-dependency-path: app/package-lock.json }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npm run preview &
      - run: npx wait-on http://localhost:4173
      - run: PLAYWRIGHT_BASE_URL=http://localhost:4173 npm run test:e2e
```

- [ ] **Step 7: Commit**

```bash
cd C:\Users\Samsung\projetos\vila-viva
git add app/playwright.config.ts app/tests/e2e app/package.json .github/workflows/ci.yml
git commit -m "test(e2e): Playwright smoke test do fluxo crítico em chromium + iphone"
```

---

## Task 27: Bug-pass + Lighthouse + cleanup

**Files:**
- Modify: vários, conforme bugs encontrados

- [ ] **Step 1: Bug-pass manual no iPhone real**

Abrir URL Vercel no app Documents (Readdle) no iPhone. Percorrer 4 fluxos:
1. Magic link → onboarding
2. Criar post de cada tipo + reagir + comentar + share WA
3. Match: buscar, filtrar, abrir perfil, editar próprio perfil
4. Desafio: comentar em 3 posts de agentes diferentes, ver desafio concluir

Anotar todos os bugs em [`docs/superpowers/reports/2026-XX-XX-bug-pass-sem2.md`](#) (criar arquivo se necessário).

- [ ] **Step 2: Corrigir bugs P0 e P1 da lista**

Cada bug vira 1 commit pequeno.

- [ ] **Step 3: Rodar Lighthouse mobile**

```bash
cd C:\Users\Samsung\projetos\vila-viva\app
npx lighthouse https://vila-viva-light.vercel.app --preset=desktop --output=html --output-path=lighthouse-desktop.html
npx lighthouse https://vila-viva-light.vercel.app --emulated-form-factor=mobile --output=html --output-path=lighthouse-mobile.html
```

Alvo informal: ≥ 80 em performance, accessibility, best-practices. Não bloqueante.

- [ ] **Step 4: Commit final da semana 2**

```bash
cd C:\Users\Samsung\projetos\vila-viva
git add app/
git commit -m "chore: bug-pass Semana 2 + Lighthouse mobile ≥ 80"
git push origin master
```

- [ ] **Step 5: Destravar flags para piloto stakeholder**

No Supabase Studio, executar:

```sql
UPDATE feature_flag SET enabled = true WHERE key IN (
  'feed_create_outros', 'reactions', 'comments', 'share_wa',
  'match_pessoas', 'profile_edit', 'notifications', 'challenge_piloto'
);
```

Adicionar e-mails dos stakeholders:

```sql
INSERT INTO allowed_email (email, added_by) VALUES
  ('stakeholder1@email.com', 'eciocesario'),
  ('stakeholder2@email.com', 'eciocesario');
```

Enviar convite por WhatsApp com a URL e instrução "olha sua caixa de e-mail".

---

## Encerramento

Ao concluir as 27 tasks, a Vila Viva Light está no ar, F2a do plano v1.2 implementada, stakeholders convidados podem percorrer todos os fluxos. O código é o que vira o piloto formal em Junho W3 quando a janela do plano técnico abrir; daí em diante, a continuação é F2b (Vagas, LGPD endpoints, PWA cache, e-mail) seguindo o §6.F2b.

**Próximo plano (após Sem 2):** `2026-06-XX-vila-viva-f2b-mvp-completo.md` — entra quando este código tiver passado pelos critérios de "go-live 1" do plano v1.2.
