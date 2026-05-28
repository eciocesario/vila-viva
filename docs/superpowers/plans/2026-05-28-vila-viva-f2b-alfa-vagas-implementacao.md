# Vila Viva F2b-α · Vagas — Plano de Implementação

> **Para workers agentes:** SUB-SKILL OBRIGATÓRIA: Use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para executar este plano tarefa por tarefa. Passos usam sintaxe checkbox (`- [ ]`) para rastreamento.

**Goal:** Implementar Vagas (Voluntariado + Remunerado) na Vila Viva Light com fluxo "Tenho interesse" + share WhatsApp, sem prazo definido (iterativo em 5 fases).

**Architecture:** Reaproveitamento integral dos padrões do Light. 3 tabelas Postgres novas (`vaga`, `vaga_skill`, `vaga_interesse`) + 2 triggers (count + notify) + 1 feature flag. 3 rotas novas + 4 componentes novos + 1 domain module com TDD. Zero Edge Function nova — tudo via PostgREST + RLS.

**Tech Stack:** React 18 · Vite · TypeScript strict · Tailwind · TanStack Query · Supabase (Postgres + Auth + Realtime) · Vercel · Vitest

**Spec de referência:** [`docs/superpowers/specs/2026-05-28-vila-viva-f2b-alfa-vagas-design.md`](../specs/2026-05-28-vila-viva-f2b-alfa-vagas-design.md)

**Root do projeto:** `C:\Users\Samsung\projetos\vila-viva\` · **Código novo em:** `app/`

---

## Estrutura de arquivos

**Arquivos a criar:**
- `app/supabase/migrations/015_vaga.sql`
- `app/supabase/migrations/016_vaga_skill.sql`
- `app/supabase/migrations/017_vaga_interesse.sql`
- `app/supabase/migrations/018_feature_flag_vagas.sql`
- `app/src/domain/vagaTypes.ts`
- `app/tests/domain/vagaTypes.test.ts`
- `app/src/components/VagaCard.tsx`
- `app/src/components/VagaSkillSelector.tsx`
- `app/src/components/VagaCreator.tsx`
- `app/src/components/InteresseButton.tsx`
- `app/src/routes/Vagas.tsx`
- `app/src/routes/VagaDetail.tsx`
- `app/src/routes/VagaInteressados.tsx`

**Arquivos a modificar:**
- `app/src/lib/database.types.ts` (regenerado após migrations)
- `app/supabase/seed.sql` (acrescenta bloco de 8 vagas + interesses zerados)
- `app/src/components/AppLayout.tsx` (adiciona NavLink "Vagas")
- `app/src/components/NotificationBell.tsx` (case novo `vaga_interesse_recebido` em `describeNotif`)
- `app/src/App.tsx` (wire 3 rotas novas dentro do AppLayout)

---

# FASE 1 — Schema + seeds + domain TDD

## Task 1: Migration 015 — `vaga` + RLS + triggers

**Files:**
- Create: `app/supabase/migrations/015_vaga.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```sql
-- 015_vaga.sql
-- Tabela vaga: oportunidades de voluntariado ou remunerado publicadas pelos usuários.

CREATE TABLE IF NOT EXISTS public.vaga (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('voluntariado', 'remunerado')),
  titulo TEXT NOT NULL CHECK (length(titulo) BETWEEN 3 AND 80),
  descricao TEXT NOT NULL CHECK (length(descricao) BETWEEN 10 AND 2000),
  local TEXT,
  periodo TEXT,
  valor_remuneracao TEXT,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada')),
  count_interesses INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX vaga_status_created_idx ON public.vaga (status, created_at DESC);
CREATE INDEX vaga_autor_idx ON public.vaga (autor_id);
CREATE INDEX vaga_tipo_idx ON public.vaga (tipo);

ALTER TABLE public.vaga ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vaga_select_authenticated" ON public.vaga
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "vaga_insert_own" ON public.vaga
  FOR INSERT TO authenticated WITH CHECK (autor_id = auth.uid());

CREATE POLICY "vaga_update_own" ON public.vaga
  FOR UPDATE TO authenticated USING (autor_id = auth.uid()) WITH CHECK (autor_id = auth.uid());

CREATE POLICY "vaga_delete_own" ON public.vaga
  FOR DELETE TO authenticated USING (autor_id = auth.uid());

-- updated_at trigger (reusa tg_set_updated_at de 001_profile.sql)
DROP TRIGGER IF EXISTS vaga_updated_at ON public.vaga;
CREATE TRIGGER vaga_updated_at
  BEFORE UPDATE ON public.vaga
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
```

- [ ] **Step 2: Aplicar migration**

```bash
cd C:/Users/Samsung/projetos/vila-viva/app
supabase db push
```

Expected: `Applied migration 015_vaga.sql`

- [ ] **Step 3: Verificar no Supabase Studio**

Abrir https://supabase.com/dashboard/project/agzldrdonirirftgvdfl/database/tables. Conferir que `vaga` existe com 12 colunas, 3 indexes, RLS habilitada.

- [ ] **Step 4: Commit**

```bash
cd C:/Users/Samsung/projetos/vila-viva
git add app/supabase/migrations/015_vaga.sql
git commit -m "feat(db): migration 015 — tabela vaga com RLS"
```

---

## Task 2: Migration 016 — `vaga_skill` + RLS

**Files:**
- Create: `app/supabase/migrations/016_vaga_skill.sql`

- [ ] **Step 1: Criar arquivo**

```sql
-- 016_vaga_skill.sql
-- N:N entre vaga e skill (catálogo existente).

CREATE TABLE IF NOT EXISTS public.vaga_skill (
  vaga_id UUID NOT NULL REFERENCES public.vaga(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skill(id) ON DELETE CASCADE,
  PRIMARY KEY (vaga_id, skill_id)
);

CREATE INDEX vaga_skill_skill_idx ON public.vaga_skill (skill_id);

ALTER TABLE public.vaga_skill ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vaga_skill_select_authenticated" ON public.vaga_skill
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "vaga_skill_insert_autor" ON public.vaga_skill
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.vaga WHERE id = vaga_id AND autor_id = auth.uid())
  );

CREATE POLICY "vaga_skill_delete_autor" ON public.vaga_skill
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.vaga WHERE id = vaga_id AND autor_id = auth.uid())
  );
```

- [ ] **Step 2: Aplicar + commit**

```bash
cd C:/Users/Samsung/projetos/vila-viva/app
supabase db push
cd ..
git add app/supabase/migrations/016_vaga_skill.sql
git commit -m "feat(db): migration 016 — vaga_skill N:N com RLS por autor"
```

---

## Task 3: Migration 017 — `vaga_interesse` + 2 triggers + ALTER notification

**Files:**
- Create: `app/supabase/migrations/017_vaga_interesse.sql`

- [ ] **Step 1: Criar arquivo**

```sql
-- 017_vaga_interesse.sql
-- Quem clicou "Tenho interesse" + 2 triggers (count + notify) + ALTER notification.

CREATE TABLE IF NOT EXISTS public.vaga_interesse (
  vaga_id UUID NOT NULL REFERENCES public.vaga(id) ON DELETE CASCADE,
  interessado_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (vaga_id, interessado_id)
);

CREATE INDEX vaga_interesse_interessado_idx ON public.vaga_interesse (interessado_id);

ALTER TABLE public.vaga_interesse ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vaga_interesse_select_own_or_autor" ON public.vaga_interesse
  FOR SELECT TO authenticated USING (
    interessado_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.vaga WHERE id = vaga_id AND autor_id = auth.uid())
  );

CREATE POLICY "vaga_interesse_insert_own" ON public.vaga_interesse
  FOR INSERT TO authenticated WITH CHECK (interessado_id = auth.uid());

CREATE POLICY "vaga_interesse_delete_own" ON public.vaga_interesse
  FOR DELETE TO authenticated USING (interessado_id = auth.uid());

-- Trigger 1: manter vaga.count_interesses sincronizado (atomic)
CREATE OR REPLACE FUNCTION public.tg_vaga_interesse_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.vaga SET count_interesses = count_interesses + 1 WHERE id = NEW.vaga_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.vaga SET count_interesses = GREATEST(count_interesses - 1, 0) WHERE id = OLD.vaga_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS vaga_interesse_count_trigger ON public.vaga_interesse;
CREATE TRIGGER vaga_interesse_count_trigger
  AFTER INSERT OR DELETE ON public.vaga_interesse
  FOR EACH ROW EXECUTE FUNCTION public.tg_vaga_interesse_count();

-- Trigger 2: notificar autor da vaga quando alguém demonstra interesse
CREATE OR REPLACE FUNCTION public.tg_vaga_interesse_notify()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_autor_id UUID;
BEGIN
  SELECT autor_id INTO v_autor_id FROM public.vaga WHERE id = NEW.vaga_id;
  IF v_autor_id IS NOT NULL AND v_autor_id != NEW.interessado_id THEN
    INSERT INTO public.notification (destinatario_id, tipo, payload)
    VALUES (v_autor_id, 'vaga_interesse_recebido',
      jsonb_build_object('vaga_id', NEW.vaga_id, 'interessado_id', NEW.interessado_id));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vaga_interesse_notify_trigger ON public.vaga_interesse;
CREATE TRIGGER vaga_interesse_notify_trigger
  AFTER INSERT ON public.vaga_interesse
  FOR EACH ROW EXECUTE FUNCTION public.tg_vaga_interesse_notify();

-- ALTER constraint em notification para incluir o novo tipo
ALTER TABLE public.notification DROP CONSTRAINT IF EXISTS notification_tipo_check;
ALTER TABLE public.notification ADD CONSTRAINT notification_tipo_check
  CHECK (tipo IN (
    'post_comentado', 'reaction_recebida', 'match_sugerido',
    'challenge_progresso', 'vaga_interesse_recebido'
  ));
```

- [ ] **Step 2: Aplicar + commit**

```bash
cd C:/Users/Samsung/projetos/vila-viva/app
supabase db push
cd ..
git add app/supabase/migrations/017_vaga_interesse.sql
git commit -m "feat(db): migration 017 — vaga_interesse + count + notify triggers"
```

---

## Task 4: Migration 018 — feature flag `vagas`

**Files:**
- Create: `app/supabase/migrations/018_feature_flag_vagas.sql`

- [ ] **Step 1: Criar arquivo**

```sql
-- 018_feature_flag_vagas.sql
-- Novo feature flag 'vagas' default false; destravar via Studio quando pronto.

INSERT INTO public.feature_flag (key, enabled) VALUES ('vagas', false)
  ON CONFLICT (key) DO NOTHING;
```

- [ ] **Step 2: Aplicar + commit**

```bash
cd C:/Users/Samsung/projetos/vila-viva/app
supabase db push
cd ..
git add app/supabase/migrations/018_feature_flag_vagas.sql
git commit -m "feat(db): migration 018 — feature flag vagas (default off)"
```

---

## Task 5: Regenerar `database.types.ts`

**Files:**
- Modify: `app/src/lib/database.types.ts`

- [ ] **Step 1: Regenerar**

```bash
cd C:/Users/Samsung/projetos/vila-viva/app
supabase gen types typescript --linked 2>/dev/null > src/lib/database.types.ts
```

- [ ] **Step 2: Verificar conteúdo**

```bash
grep -c "vaga" src/lib/database.types.ts
```

Expected: 10+ matches (referências a vaga, vaga_skill, vaga_interesse).

- [ ] **Step 3: Confirmar typecheck**

```bash
npm run typecheck
```

Expected: 0 erros.

- [ ] **Step 4: Commit**

```bash
cd C:/Users/Samsung/projetos/vila-viva
git add app/src/lib/database.types.ts
git commit -m "chore: regenera database.types.ts com vaga + vaga_skill + vaga_interesse"
```

---

## Task 6: Domain `vagaTypes` (TDD)

**Files:**
- Create: `app/tests/domain/vagaTypes.test.ts`
- Create: `app/src/domain/vagaTypes.ts`

- [ ] **Step 1: Escrever teste primeiro**

`app/tests/domain/vagaTypes.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { VAGA_TIPOS, isVagaTipo, vagaTipoLabel } from '@/domain/vagaTypes';

describe('vagaTypes', () => {
  it('lista 2 tipos', () => {
    expect(VAGA_TIPOS).toHaveLength(2);
    expect(VAGA_TIPOS).toContain('voluntariado');
    expect(VAGA_TIPOS).toContain('remunerado');
  });

  it('isVagaTipo aceita valores válidos e rejeita inválidos', () => {
    expect(isVagaTipo('voluntariado')).toBe(true);
    expect(isVagaTipo('remunerado')).toBe(true);
    expect(isVagaTipo('foo')).toBe(false);
    expect(isVagaTipo('')).toBe(false);
  });

  it('vagaTipoLabel retorna PT-BR', () => {
    expect(vagaTipoLabel('voluntariado')).toBe('Voluntariado');
    expect(vagaTipoLabel('remunerado')).toBe('Remunerado');
  });
});
```

- [ ] **Step 2: Rodar — esperar FAIL**

```bash
cd C:/Users/Samsung/projetos/vila-viva/app
npm run test -- vagaTypes
```

Expected: erro de import (módulo não existe).

- [ ] **Step 3: Implementar**

`app/src/domain/vagaTypes.ts`:

```typescript
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
```

- [ ] **Step 4: Rodar — esperar PASS**

```bash
npm run test
```

Expected: 23/23 tests passing (20 atuais + 3 novos).

- [ ] **Step 5: Commit**

```bash
cd C:/Users/Samsung/projetos/vila-viva
git add app/src/domain/vagaTypes.ts app/tests/domain/vagaTypes.test.ts
git commit -m "feat(domain): vagaTypes com 2 tipos + label PT-BR (TDD)"
```

---

## Task 7: Seeds — 8 vagas fictícias

**Files:**
- Modify: `app/supabase/seed.sql`

- [ ] **Step 1: Ler arquivo existente**

Ler `app/supabase/seed.sql` para entender a estrutura atual (15 perfis seed + 25 posts) — não vamos alterar isso, só acrescentar bloco novo no final.

- [ ] **Step 2: Acrescentar bloco no final de `seed.sql`**

Antes da linha `DELETE FROM public.allowed_email WHERE added_by = 'seed-temp'...` (cleanup), inserir:

```sql
-- Seed de 8 vagas (4 voluntariado + 4 remunerado) atribuídas 1:1 aos primeiros
-- 8 seed users (ordenados por id). Cada vaga ganha 1-3 skills aleatórios.
WITH numbered_profiles AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM public.profile
  WHERE id IN (SELECT id FROM auth.users WHERE email LIKE '%@seed.vilaviva.local')
  LIMIT 8
),
vaga_data AS (
  SELECT * FROM (VALUES
    (1, 'voluntariado', 'Ajuda pra carregar caminhão de mudas',  'Sábado de manhã, trago 200 mudas de cacau pra plantar. Preciso de 3-4 pessoas.', 'Casa da Mata',        'Sábado 8h-12h',     NULL),
    (2, 'voluntariado', 'Mediação de Reunião Casa do Vento',     'Reunião comunitária na próxima quarta, preciso de alguém pra facilitar.',         'Casa do Vento',       'Quarta 19h-21h',    NULL),
    (3, 'voluntariado', 'Tradução de carta pra parceria BIOMAS', 'Carta de 1 página em inglês pra parceria com o Painel Biomas.',                   'Remoto',              'Até dia 30',        NULL),
    (4, 'voluntariado', 'Acompanhar visita de pesquisador',      'Pesquisador da UFBA vem semana que vem, alguém que conhece a vila pra tour.',      'Vila Viva',           'Próxima semana',    NULL),
    (5, 'remunerado',   'Aulas de inglês 2x/sem',                'Procuro professor/a de inglês pra meu filho de 12 anos. Duas vezes por semana, 1h.','Casa do Sol',         'Semanal ongoing',   'R$ 120/aula'),
    (6, 'remunerado',   'Manutenção elétrica casa',              'Casa precisa revisão elétrica completa, ~2 dias de serviço.',                      'Casa do Rio',         'Próximo mês',       'A combinar'),
    (7, 'remunerado',   'Diarista 1x/sem',                       'Limpeza geral 4h, uma vez por semana.',                                             'Casa da Terra',       'Sextas 8h-12h',     'R$ 150 + transporte'),
    (8, 'remunerado',   'Aula de yoga semanal',                  'Yoga ao ar livre, sábado de manhã, grupo de 5-8 pessoas.',                         'Centro comunitário',  'Sábados 7h-8h',     'R$ 60/aula')
  ) AS v(rn, tipo, titulo, descricao, local, periodo, valor_remuneracao)
),
inserted_vagas AS (
  INSERT INTO public.vaga (autor_id, tipo, titulo, descricao, local, periodo, valor_remuneracao)
  SELECT np.id, vd.tipo, vd.titulo, vd.descricao, vd.local, vd.periodo, vd.valor_remuneracao
  FROM numbered_profiles np
  JOIN vaga_data vd ON vd.rn = np.rn
  RETURNING id
)
-- Para cada vaga inserida, vincular 1-3 skills aleatórios do catálogo
INSERT INTO public.vaga_skill (vaga_id, skill_id)
SELECT iv.id, s.id
FROM inserted_vagas iv
CROSS JOIN LATERAL (
  SELECT id FROM public.skill ORDER BY random() LIMIT (1 + (random() * 2)::int)
) AS s;
```

> **Pareamento 1:1 garantido pelo `ROW_NUMBER()`** — 1 vaga por seed user, ordenado por id. Idempotência: rodar duas vezes cria 8 vagas a mais (não há unique constraint pra prevenir; aceita-se pra seed que roda uma vez).

- [ ] **Step 3: Aplicar seed**

```bash
cd C:/Users/Samsung/projetos/vila-viva/app
supabase db query --linked -f supabase/seed.sql
```

- [ ] **Step 4: Verificar**

```bash
supabase db query --linked "SELECT COUNT(*) AS vagas FROM public.vaga; SELECT COUNT(*) AS vaga_skills FROM public.vaga_skill;"
```

Expected: vagas = 8, vaga_skills = entre 8 e 24 (1-3 por vaga).

- [ ] **Step 5: Commit**

```bash
cd C:/Users/Samsung/projetos/vila-viva
git add app/supabase/seed.sql
git commit -m "feat(db): seed de 8 vagas fictícias com skills aleatórios"
```

---

# FASE 2 — Listagem read-only

## Task 8: `VagaSkillSelector` component (multi-select chips)

**Files:**
- Create: `app/src/components/VagaSkillSelector.tsx`

- [ ] **Step 1: Criar componente**

```tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type Skill = { id: string; slug: string; rotulo: string; categoria: string };

export function VagaSkillSelector({
  selected,
  onChange,
}: {
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const { data: skills, isLoading } = useQuery({
    queryKey: ['skill_catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skill')
        .select('id, slug, rotulo, categoria')
        .order('rotulo');
      if (error) throw error;
      return data as Skill[];
    },
  });

  if (isLoading) return <p className="text-xs opacity-60">Carregando habilidades…</p>;

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {skills?.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => toggle(s.id)}
          className={`px-2 py-1 rounded-full text-xs ${
            selected.has(s.id) ? 'bg-mata text-areia' : 'bg-white border border-carvao/20'
          }`}
        >
          {s.rotulo}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

```bash
cd C:/Users/Samsung/projetos/vila-viva/app
npm run typecheck
```

Expected: 0 erros.

- [ ] **Step 3: Commit**

```bash
cd C:/Users/Samsung/projetos/vila-viva
git add app/src/components/VagaSkillSelector.tsx
git commit -m "feat(vagas): VagaSkillSelector — chips multi-select reutilizável"
```

---

## Task 9: `VagaCard` component

**Files:**
- Create: `app/src/components/VagaCard.tsx`

- [ ] **Step 1: Criar componente**

```tsx
import { Link } from 'react-router-dom';
import { vagaTipoLabel, type VagaTipo } from '@/domain/vagaTypes';
import { PERFIL_LABELS, type Perfil } from '@/domain/onboardingValidation';

export type VagaCardData = {
  id: string;
  tipo: VagaTipo;
  titulo: string;
  count_interesses: number;
  created_at: string;
  autor: { id: string; nome: string; perfil_tipo: string };
  skills?: { rotulo: string }[];
};

const TIPO_BG: Record<VagaTipo, string> = {
  voluntariado: 'bg-mata/10',
  remunerado: 'bg-yellow-100',
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days === 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 7) return `há ${days} dias`;
  if (days < 30) return `há ${Math.floor(days / 7)} semanas`;
  return `há ${Math.floor(days / 30)} meses`;
}

export function VagaCard({ vaga }: { vaga: VagaCardData }) {
  return (
    <Link
      to={`/vagas/${vaga.id}`}
      className={`block p-4 rounded-card border border-carvao/10 hover:border-mata ${TIPO_BG[vaga.tipo]}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider opacity-60">
          {vagaTipoLabel(vaga.tipo)}
        </span>
        <span className="text-xs opacity-50">{timeAgo(vaga.created_at)}</span>
      </div>
      <h3 className="font-display text-lg text-terra mb-1">{vaga.titulo}</h3>
      <p className="text-xs opacity-70 mb-2">
        {vaga.autor.nome} · {PERFIL_LABELS[vaga.autor.perfil_tipo as Perfil] ?? vaga.autor.perfil_tipo}
      </p>
      {vaga.skills && vaga.skills.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-2">
          {vaga.skills.slice(0, 3).map((s, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full bg-white text-xs">
              {s.rotulo}
            </span>
          ))}
        </div>
      )}
      <p className="text-xs opacity-60">{vaga.count_interesses} interessado(s)</p>
    </Link>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

```bash
npm run typecheck
```

Expected: 0 erros.

- [ ] **Step 3: Commit**

```bash
cd C:/Users/Samsung/projetos/vila-viva
git add app/src/components/VagaCard.tsx
git commit -m "feat(vagas): VagaCard com tipo, autor, skills e contador de interesses"
```

---

## Task 10: `Vagas.tsx` route (tabs + filter + list)

**Files:**
- Create: `app/src/routes/Vagas.tsx`

- [ ] **Step 1: Criar route**

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useFlag } from '@/lib/useFlag';
import { VAGA_TIPOS, vagaTipoLabel, type VagaTipo } from '@/domain/vagaTypes';
import { VagaCard, type VagaCardData } from '@/components/VagaCard';
import { VagaSkillSelector } from '@/components/VagaSkillSelector';

export default function Vagas() {
  const enabled = useFlag('vagas');
  const [tipo, setTipo] = useState<VagaTipo>('voluntariado');
  const [skillFilter, setSkillFilter] = useState<Set<string>>(new Set());

  const skillIds = Array.from(skillFilter);

  const { data, isLoading } = useQuery({
    queryKey: ['vagas', tipo, skillIds.sort().join(',')],
    queryFn: async () => {
      let query = supabase
        .from('vaga')
        .select(`
          id, tipo, titulo, count_interesses, created_at,
          autor:profile!autor_id(id, nome, perfil_tipo),
          skills:vaga_skill(skill:skill_id(rotulo))
        `)
        .eq('status', 'aberta')
        .eq('tipo', tipo)
        .order('created_at', { ascending: false })
        .limit(50);

      if (skillIds.length > 0) {
        // Filtro por skill: subquery via .in() em vaga_id
        const { data: vagaIds } = await supabase
          .from('vaga_skill')
          .select('vaga_id')
          .in('skill_id', skillIds);
        const ids = (vagaIds ?? []).map((r) => r.vaga_id);
        if (ids.length === 0) return [];
        query = query.in('id', ids);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Normalizar shape do join skills (array de { skill: { rotulo } }) → array de { rotulo }
      type RawRow = {
        id: string; tipo: VagaTipo; titulo: string;
        count_interesses: number; created_at: string;
        autor: { id: string; nome: string; perfil_tipo: string };
        skills: { skill: { rotulo: string } | null }[];
      };
      return (data as unknown as RawRow[]).map((v) => ({
        ...v,
        skills: v.skills.map((s) => ({ rotulo: s.skill?.rotulo ?? '' })).filter((s) => s.rotulo),
      })) as VagaCardData[];
    },
    enabled,
  });

  if (!enabled) return <Navigate to="/" replace />;

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="font-display text-2xl text-terra mb-4 px-2">Vagas</h1>

      <div className="flex gap-2 mb-4">
        {VAGA_TIPOS.map((t) => (
          <button
            key={t}
            onClick={() => setTipo(t)}
            className={`px-4 py-2 rounded-soft text-sm font-medium ${
              tipo === t ? 'bg-terra text-areia' : 'bg-white border border-carvao/20'
            }`}
          >
            {vagaTipoLabel(t)}
          </button>
        ))}
      </div>

      <details className="mb-4">
        <summary className="text-sm opacity-70 cursor-pointer">Filtrar por habilidades</summary>
        <div className="mt-2">
          <VagaSkillSelector selected={skillFilter} onChange={setSkillFilter} />
        </div>
      </details>

      {isLoading && <p>Carregando…</p>}
      <div className="space-y-3">
        {data?.map((v) => <VagaCard key={v.id} vaga={v} />)}
      </div>
      {data && data.length === 0 && (
        <p className="text-sm opacity-60 mt-6 text-center">
          Nenhuma vaga encontrada nesse tipo/filtro.
        </p>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Verificar typecheck**

```bash
npm run typecheck
```

Expected: 0 erros.

- [ ] **Step 3: Commit** (será wireada em App.tsx na próxima task)

```bash
cd C:/Users/Samsung/projetos/vila-viva
git add app/src/routes/Vagas.tsx
git commit -m "feat(vagas): rota /vagas com 2 abas + filtro multi-skill"
```

---

## Task 11: AppLayout NavLink + wire route em App.tsx

**Files:**
- Modify: `app/src/components/AppLayout.tsx`
- Modify: `app/src/App.tsx`

- [ ] **Step 1: Ler AppLayout atual**

```bash
cat C:/Users/Samsung/projetos/vila-viva/app/src/components/AppLayout.tsx
```

Identifique a posição da NavLink "Pessoas" e adicione "Vagas" entre ela e "Desafios":

- [ ] **Step 2: Editar AppLayout.tsx**

Localize a `<nav>` e adicione a nova NavLink entre Pessoas e Desafios:

```tsx
<NavLink to="/match" className={navClass}>Pessoas</NavLink>
<NavLink to="/vagas" className={navClass}>Vagas</NavLink>
<NavLink to="/desafios" className={navClass}>Desafios</NavLink>
```

- [ ] **Step 3: Editar App.tsx para adicionar rota**

Adicionar import:

```tsx
import Vagas from '@/routes/Vagas';
```

Dentro do grupo de rotas envolvidas pelo `<AppLayout />`, adicionar:

```tsx
<Route path="/vagas" element={session ? <Vagas /> : <Navigate to="/login" replace />} />
```

- [ ] **Step 4: Verificar build**

```bash
cd C:/Users/Samsung/projetos/vila-viva/app
npm run typecheck && npm run build
```

Expected: 0 erros.

- [ ] **Step 5: Smoke local**

Temporariamente destrava a flag via Studio SQL:

```sql
UPDATE feature_flag SET enabled = true WHERE key = 'vagas';
```

`npm run dev` → acessa `/vagas` → deve ver as 8 seed vagas. Click em tabs e chips para filtrar.

Reverte flag:

```sql
UPDATE feature_flag SET enabled = false WHERE key = 'vagas';
```

- [ ] **Step 6: Commit**

```bash
cd C:/Users/Samsung/projetos/vila-viva
git add app/src/components/AppLayout.tsx app/src/App.tsx
git commit -m "feat(vagas): NavLink Vagas + wire rota em App.tsx"
```

---

# FASE 3 — Detalhe + Interesse

## Task 12: `InteresseButton` component

**Files:**
- Create: `app/src/components/InteresseButton.tsx`

- [ ] **Step 1: Criar componente com optimistic UI**

```tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';

export function InteresseButton({
  vagaId,
  autorId,
  countServer,
}: {
  vagaId: string;
  autorId: string;
  countServer: number;
}) {
  const { session } = useAuth();
  const qc = useQueryClient();
  const isAutor = session?.user.id === autorId;

  const { data: mine } = useQuery({
    queryKey: ['vaga_interesse_mine', vagaId, session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vaga_interesse')
        .select('vaga_id')
        .eq('vaga_id', vagaId)
        .eq('interessado_id', session!.user.id)
        .maybeSingle();
      if (error) throw error;
      return data !== null;
    },
    enabled: !!session && !isAutor,
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (mine) {
        const { error } = await supabase
          .from('vaga_interesse')
          .delete()
          .eq('vaga_id', vagaId)
          .eq('interessado_id', session!.user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vaga_interesse')
          .insert({ vaga_id: vagaId, interessado_id: session!.user.id });
        if (error) throw error;
      }
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['vaga_interesse_mine', vagaId, session?.user.id] });
      const prev = qc.getQueryData<boolean>(['vaga_interesse_mine', vagaId, session?.user.id]);
      qc.setQueryData(['vaga_interesse_mine', vagaId, session?.user.id], !prev);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) {
        qc.setQueryData(['vaga_interesse_mine', vagaId, session?.user.id], ctx.prev);
      }
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['vaga_interesse_mine', vagaId, session?.user.id] });
      void qc.invalidateQueries({ queryKey: ['vaga', vagaId] });
      void qc.invalidateQueries({ queryKey: ['vagas'] });
    },
  });

  if (isAutor) {
    return (
      <button
        disabled
        className="w-full px-4 py-3 rounded-soft bg-carvao/10 text-carvao/50 text-sm cursor-not-allowed"
      >
        Você criou esta vaga
      </button>
    );
  }

  return (
    <button
      onClick={() => toggle.mutate()}
      disabled={toggle.isPending}
      className={`w-full px-4 py-3 rounded-soft font-medium ${
        mine ? 'bg-mata text-areia' : 'bg-terra text-areia'
      } disabled:opacity-50`}
    >
      {mine ? 'Você se interessou ✓' : 'Tenho interesse'}
      <span className="ml-2 opacity-80">({countServer + (mine && countServer === 0 ? 1 : 0)})</span>
    </button>
  );
}
```

> Nota: o contador exibido usa `countServer` direto (do row vaga). Para reflexão imediata após toggle, o `onSettled` invalida `['vaga', vagaId]` que re-fetcha o row atualizado pelo trigger.

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
cd C:/Users/Samsung/projetos/vila-viva
git add app/src/components/InteresseButton.tsx
git commit -m "feat(vagas): InteresseButton com optimistic UI (toggle + count)"
```

---

## Task 13: `VagaDetail.tsx` route

**Files:**
- Create: `app/src/routes/VagaDetail.tsx`

- [ ] **Step 1: Criar route**

```tsx
import { useParams, Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useFlag } from '@/lib/useFlag';
import { useAuth } from '@/lib/useAuth';
import { vagaTipoLabel, type VagaTipo } from '@/domain/vagaTypes';
import { PERFIL_LABELS, type Perfil } from '@/domain/onboardingValidation';
import { InteresseButton } from '@/components/InteresseButton';
import { ShareWaButton } from '@/components/ShareWaButton';

export default function VagaDetail() {
  const enabled = useFlag('vagas');
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();

  const { data: vaga, isLoading, error } = useQuery({
    queryKey: ['vaga', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vaga')
        .select(`
          id, tipo, titulo, descricao, local, periodo, valor_remuneracao,
          status, count_interesses, created_at, autor_id,
          autor:profile!autor_id(id, nome, perfil_tipo, casa),
          skills:vaga_skill(skill:skill_id(rotulo))
        `)
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && enabled,
  });

  if (!enabled) return <Navigate to="/" replace />;
  if (isLoading) return <main className="p-6">Carregando…</main>;
  if (error || !vaga) return <main className="p-6 text-terra">Vaga não encontrada.</main>;

  type Autor = { id: string; nome: string; perfil_tipo: string; casa: string | null };
  const autor = vaga.autor as unknown as Autor;
  const skills = (vaga.skills as { skill: { rotulo: string } | null }[])
    .map((s) => s.skill?.rotulo).filter(Boolean) as string[];
  const isAutor = session?.user.id === vaga.autor_id;

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider opacity-60">
          {vagaTipoLabel(vaga.tipo as VagaTipo)}
        </span>
        {vaga.status === 'fechada' && (
          <span className="text-xs px-2 py-1 rounded-full bg-carvao/20">Fechada</span>
        )}
      </div>

      <h1 className="font-display text-3xl text-terra">{vaga.titulo}</h1>

      <p className="text-sm">
        <Link to={`/profile/${autor.id}`} className="text-terra hover:underline">
          {autor.nome}
        </Link>{' '}
        · {PERFIL_LABELS[autor.perfil_tipo as Perfil] ?? autor.perfil_tipo}
        {autor.casa && ` · ${autor.casa}`}
      </p>

      <p className="whitespace-pre-wrap leading-relaxed">{vaga.descricao}</p>

      {(vaga.local || vaga.periodo || vaga.valor_remuneracao) && (
        <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-sm bg-white/60 rounded-soft p-3">
          {vaga.local && (<><dt className="opacity-60">Local</dt><dd>{vaga.local}</dd></>)}
          {vaga.periodo && (<><dt className="opacity-60">Período</dt><dd>{vaga.periodo}</dd></>)}
          {vaga.valor_remuneracao && (<><dt className="opacity-60">Valor</dt><dd>{vaga.valor_remuneracao}</dd></>)}
        </dl>
      )}

      {skills.length > 0 && (
        <div>
          <p className="text-xs opacity-60 mb-1">Habilidades requeridas</p>
          <div className="flex gap-1 flex-wrap">
            {skills.map((r) => (
              <span key={r} className="px-2 py-1 rounded-full bg-mata/10 text-xs">{r}</span>
            ))}
          </div>
        </div>
      )}

      {vaga.status === 'aberta' && (
        <InteresseButton vagaId={vaga.id} autorId={vaga.autor_id} countServer={vaga.count_interesses} />
      )}

      <ShareWaButton
        postId={vaga.id}
        titulo={vaga.titulo}
        autorNome={autor.nome}
      />

      {isAutor && (
        <div className="pt-4 border-t border-carvao/10 space-y-2">
          <Link
            to={`/vagas/${vaga.id}/interessados`}
            className="block w-full px-4 py-2 rounded-soft border border-carvao/20 text-center text-sm"
          >
            Ver interessados ({vaga.count_interesses})
          </Link>
        </div>
      )}
    </main>
  );
}
```

> Nota: `ShareWaButton` foi escrito para posts (passa `postId` que vira `/post/${id}` na URL). Aqui passamos o vagaId, mas a URL gerada será `/post/${id}` (incorreta). Vamos generalizar o componente na Task 14b OU criar um novo VagaShareButton. Mais simples: criar `VagaShareButton` local que gera a URL correta `/vagas/${id}`.

- [ ] **Step 2: Criar componente local VagaShareButton (inline ou em Components)**

Substituir o uso de `ShareWaButton` por inline (mais simples):

Trocar o bloco:

```tsx
<ShareWaButton ... />
```

Por:

```tsx
{(() => {
  const url = `${window.location.origin}/vagas/${vaga.id}`;
  const text = `"${vaga.titulo}" — vaga de ${autor.nome} na Vila Viva: ${url}`;
  return (
    <a
      href={`https://wa.me/?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-mata/10 text-mata"
    >
      Compartilhar no WhatsApp
    </a>
  );
})()}
```

Remova o import de `ShareWaButton` no topo do arquivo.

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit (route será wireada na Task 15)**

```bash
cd C:/Users/Samsung/projetos/vila-viva
git add app/src/routes/VagaDetail.tsx
git commit -m "feat(vagas): VagaDetail com botão interesse, skills, share inline"
```

---

## Task 14: NotificationBell — case `vaga_interesse_recebido`

**Files:**
- Modify: `app/src/components/NotificationBell.tsx`

- [ ] **Step 1: Ler arquivo atual e localizar `describeNotif`**

- [ ] **Step 2: Adicionar case**

No switch dentro de `describeNotif`, adicionar:

```typescript
case 'vaga_interesse_recebido':
  return 'Alguém demonstrou interesse na sua vaga.';
```

Localizar imediatamente antes do `default:` para manter ordem alfabética/lógica não importa, mas insira antes do `default` para que o case execute corretamente.

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
cd C:/Users/Samsung/projetos/vila-viva
git add app/src/components/NotificationBell.tsx
git commit -m "feat(vagas): NotificationBell trata vaga_interesse_recebido"
```

---

## Task 15: Wire rota /vagas/:id em App.tsx

**Files:**
- Modify: `app/src/App.tsx`

- [ ] **Step 1: Adicionar import**

```tsx
import VagaDetail from '@/routes/VagaDetail';
```

- [ ] **Step 2: Adicionar rota dentro do AppLayout**

Logo abaixo da rota `/vagas` adicionada na Task 11:

```tsx
<Route path="/vagas/:id" element={session ? <VagaDetail /> : <Navigate to="/login" replace />} />
```

- [ ] **Step 3: Build**

```bash
cd C:/Users/Samsung/projetos/vila-viva/app
npm run typecheck && npm run build
```

Expected: 0 erros.

- [ ] **Step 4: Smoke local**

Destrava flag → `npm run dev` → vai em /vagas → click em uma vaga → vê detalhe → click "Tenho interesse" → contador sobe → NotificationBell de outro usuário (autor) recebe.

- [ ] **Step 5: Commit**

```bash
cd C:/Users/Samsung/projetos/vila-viva
git add app/src/App.tsx
git commit -m "feat(vagas): wire rota /vagas/:id em App.tsx"
```

---

# FASE 4 — Criar vaga

## Task 16: `VagaCreator` component (FAB + bottom-sheet)

**Files:**
- Create: `app/src/components/VagaCreator.tsx`

- [ ] **Step 1: Criar componente**

```tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { useFlag } from '@/lib/useFlag';
import { VAGA_TIPOS, vagaTipoLabel, type VagaTipo } from '@/domain/vagaTypes';
import { VagaSkillSelector } from './VagaSkillSelector';

export function VagaCreator() {
  const { session } = useAuth();
  const enabled = useFlag('vagas');
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<VagaTipo>('voluntariado');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [local, setLocal] = useState('');
  const [periodo, setPeriodo] = useState('');
  const [valor, setValor] = useState('');
  const [skills, setSkills] = useState<Set<string>>(new Set());

  const create = useMutation({
    mutationFn: async () => {
      const tituloT = titulo.trim();
      const descT = descricao.trim();
      if (tituloT.length < 3 || tituloT.length > 80) throw new Error('Título precisa ter 3-80 caracteres.');
      if (descT.length < 10 || descT.length > 2000) throw new Error('Descrição precisa ter 10-2000 caracteres.');

      const { data: vagaRow, error: e1 } = await supabase
        .from('vaga')
        .insert({
          autor_id: session!.user.id,
          tipo,
          titulo: tituloT,
          descricao: descT,
          local: local.trim() || null,
          periodo: periodo.trim() || null,
          valor_remuneracao: tipo === 'remunerado' && valor.trim() ? valor.trim() : null,
        })
        .select('id')
        .single();
      if (e1) throw e1;

      if (skills.size > 0 && vagaRow) {
        const rows = Array.from(skills).map((skill_id) => ({ vaga_id: vagaRow.id, skill_id }));
        const { error: e2 } = await supabase.from('vaga_skill').insert(rows);
        if (e2) throw e2;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vagas'] });
      setOpen(false);
      setTitulo('');
      setDescricao('');
      setLocal('');
      setPeriodo('');
      setValor('');
      setSkills(new Set());
    },
  });

  if (!enabled) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-terra text-areia text-3xl shadow-lg z-40"
        aria-label="Criar vaga"
      >
        +
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-carvao/40 flex items-end z-50"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full bg-areia rounded-t-card p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-xl text-terra mb-3">Nova vaga</h3>

            <label className="block text-xs opacity-70 mb-1">Tipo</label>
            <div className="flex gap-2 mb-4">
              {VAGA_TIPOS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`px-3 py-1.5 rounded-full text-sm ${
                    tipo === t ? 'bg-terra text-areia' : 'bg-white border border-carvao/20'
                  }`}
                >
                  {vagaTipoLabel(t)}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Título (3-80 caracteres)"
              maxLength={80}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-4 py-2 rounded-soft border border-carvao/20 bg-white mb-2"
            />

            <textarea
              placeholder="Descreva a vaga (10-2000 caracteres)"
              maxLength={2000}
              rows={5}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-4 py-2 rounded-soft border border-carvao/20 bg-white mb-2"
            />

            <input
              type="text"
              placeholder="Local (opcional)"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              className="w-full px-4 py-2 rounded-soft border border-carvao/20 bg-white mb-2"
            />

            <input
              type="text"
              placeholder="Período (opcional, ex: Sábado 8h-12h)"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="w-full px-4 py-2 rounded-soft border border-carvao/20 bg-white mb-2"
            />

            {tipo === 'remunerado' && (
              <input
                type="text"
                placeholder="Valor (opcional, ex: R$ 120/aula)"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full px-4 py-2 rounded-soft border border-carvao/20 bg-white mb-2"
              />
            )}

            <label className="block text-xs opacity-70 mb-1 mt-3">Habilidades requeridas</label>
            <VagaSkillSelector selected={skills} onChange={setSkills} />

            {create.error && (
              <p className="mt-3 text-sm text-terra">{(create.error as Error).message}</p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-soft border border-carvao/20"
              >
                Cancelar
              </button>
              <button
                onClick={() => create.mutate()}
                disabled={create.isPending || !titulo.trim() || !descricao.trim()}
                className="flex-1 px-4 py-2 rounded-soft bg-terra text-areia disabled:opacity-50"
              >
                {create.isPending ? 'Publicando…' : 'Publicar vaga'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
cd C:/Users/Samsung/projetos/vila-viva
git add app/src/components/VagaCreator.tsx
git commit -m "feat(vagas): VagaCreator com FAB + bottom-sheet + insert 2-step (vaga + skills)"
```

---

## Task 17: Embed `VagaCreator` em `Vagas.tsx`

**Files:**
- Modify: `app/src/routes/Vagas.tsx`

- [ ] **Step 1: Adicionar import**

No topo de `Vagas.tsx`:

```tsx
import { VagaCreator } from '@/components/VagaCreator';
```

- [ ] **Step 2: Inserir no return**

Antes do fechamento `</main>`:

```tsx
<VagaCreator />
```

- [ ] **Step 3: Smoke local**

`npm run dev` → /vagas → click FAB → preenche → publica → ver no topo da lista.

- [ ] **Step 4: Commit**

```bash
cd C:/Users/Samsung/projetos/vila-viva
git add app/src/routes/Vagas.tsx
git commit -m "feat(vagas): embed VagaCreator na rota /vagas"
```

---

# FASE 5 — Author tools + go-live

## Task 18: `VagaInteressados.tsx` route

**Files:**
- Create: `app/src/routes/VagaInteressados.tsx`

- [ ] **Step 1: Criar route**

```tsx
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { useFlag } from '@/lib/useFlag';
import { PERFIL_LABELS, type Perfil } from '@/domain/onboardingValidation';

export default function VagaInteressados() {
  const enabled = useFlag('vagas');
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();

  const { data: vaga } = useQuery({
    queryKey: ['vaga_meta', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vaga')
        .select('id, titulo, autor_id')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && enabled,
  });

  const { data: interessados, isLoading } = useQuery({
    queryKey: ['vaga_interessados', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vaga_interesse')
        .select(`
          created_at,
          interessado:profile!interessado_id(id, nome, perfil_tipo, casa)
        `)
        .eq('vaga_id', id!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      type Row = { created_at: string; interessado: { id: string; nome: string; perfil_tipo: string; casa: string | null } };
      return data as unknown as Row[];
    },
    enabled: !!id && enabled && !!vaga && vaga.autor_id === session?.user.id,
  });

  if (!enabled) return <Navigate to="/" replace />;
  if (vaga && vaga.autor_id !== session?.user.id) return <Navigate to={`/vagas/${id}`} replace />;
  if (isLoading) return <main className="p-6">Carregando…</main>;

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-4">
      <Link to={`/vagas/${id}`} className="text-sm text-terra hover:underline">
        ← Voltar para vaga
      </Link>
      <h1 className="font-display text-2xl text-terra">
        Interessados em "{vaga?.titulo ?? '…'}"
      </h1>

      {interessados?.length === 0 && (
        <p className="text-sm opacity-60">Ninguém se interessou ainda.</p>
      )}

      <ul className="space-y-2">
        {interessados?.map((r) => (
          <li key={r.interessado.id}>
            <Link
              to={`/profile/${r.interessado.id}`}
              className="block p-3 rounded-card bg-white border border-carvao/10 hover:border-mata"
            >
              <p className="font-medium text-terra">{r.interessado.nome}</p>
              <p className="text-xs opacity-70">
                {PERFIL_LABELS[r.interessado.perfil_tipo as Perfil] ?? r.interessado.perfil_tipo}
                {r.interessado.casa && ` · ${r.interessado.casa}`}
              </p>
              <p className="text-xs opacity-50 mt-1">
                interessou-se em {new Date(r.created_at).toLocaleString('pt-BR')}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit (route será wireada na Task 20)**

```bash
cd C:/Users/Samsung/projetos/vila-viva
git add app/src/routes/VagaInteressados.tsx
git commit -m "feat(vagas): VagaInteressados — lista privada visível só pelo autor"
```

---

## Task 19: Botão "Fechar vaga" no VagaDetail

**Files:**
- Modify: `app/src/routes/VagaDetail.tsx`

- [ ] **Step 1: Adicionar useMutation**

No topo do componente, antes do return, adicionar:

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
// (já tem useQuery; se já tem useQueryClient não duplica)

// ... dentro do componente:
const qc = useQueryClient();
const fechar = useMutation({
  mutationFn: async () => {
    const { error } = await supabase
      .from('vaga')
      .update({ status: 'fechada' })
      .eq('id', vaga!.id);
    if (error) throw error;
  },
  onSuccess: () => {
    void qc.invalidateQueries({ queryKey: ['vaga', vaga!.id] });
    void qc.invalidateQueries({ queryKey: ['vagas'] });
  },
});
```

- [ ] **Step 2: Adicionar botão dentro do bloco `isAutor`**

Localizar o bloco `{isAutor && (` (que tem o link "Ver interessados") e adicionar o segundo botão:

```tsx
{isAutor && (
  <div className="pt-4 border-t border-carvao/10 space-y-2">
    <Link
      to={`/vagas/${vaga.id}/interessados`}
      className="block w-full px-4 py-2 rounded-soft border border-carvao/20 text-center text-sm"
    >
      Ver interessados ({vaga.count_interesses})
    </Link>
    {vaga.status === 'aberta' && (
      <button
        onClick={() => {
          if (confirm('Fechar a vaga? Ela some da lista pública.')) fechar.mutate();
        }}
        disabled={fechar.isPending}
        className="w-full px-4 py-2 rounded-soft border border-terra/40 text-terra text-sm disabled:opacity-50"
      >
        {fechar.isPending ? 'Fechando…' : 'Fechar vaga'}
      </button>
    )}
  </div>
)}
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 4: Commit**

```bash
cd C:/Users/Samsung/projetos/vila-viva
git add app/src/routes/VagaDetail.tsx
git commit -m "feat(vagas): botão Fechar vaga visível só ao autor"
```

---

## Task 20: Wire `/vagas/:id/interessados` + tracking PostHog + deploy

**Files:**
- Modify: `app/src/App.tsx`
- Modify: `app/src/components/VagaCreator.tsx`
- Modify: `app/src/components/InteresseButton.tsx`
- Modify: `app/src/routes/VagaDetail.tsx`

- [ ] **Step 1: Adicionar rota em App.tsx**

```tsx
import VagaInteressados from '@/routes/VagaInteressados';

// dentro do AppLayout:
<Route
  path="/vagas/:id/interessados"
  element={session ? <VagaInteressados /> : <Navigate to="/login" replace />}
/>
```

- [ ] **Step 2: Instrumentar PostHog em `VagaCreator.tsx`**

Adicionar import no topo:

```tsx
import { track } from '@/lib/posthog';
```

No `create.onSuccess` (antes dos resets de estado), adicionar:

```tsx
track('vaga_created', { tipo });
```

- [ ] **Step 3: Instrumentar PostHog em `InteresseButton.tsx`**

Adicionar import + chamada no `toggle.onMutate` (após o setQueryData):

```tsx
import { track } from '@/lib/posthog';
// ...
track('vaga_interesse_clicked', { vaga_id: vagaId, acao: !prev ? 'add' : 'remove' });
```

- [ ] **Step 4: Instrumentar PostHog em `VagaDetail.tsx`** (share + close)

No anchor `wa.me`, adicionar `onClick`:

```tsx
onClick={() => track('vaga_share_wa_clicked', { vaga_id: vaga.id })}
```

No `fechar.onSuccess`:

```tsx
track('vaga_closed', { vaga_id: vaga!.id });
```

Adicionar `import { track } from '@/lib/posthog';` no topo.

- [ ] **Step 5: Build + test**

```bash
cd C:/Users/Samsung/projetos/vila-viva/app
npm run typecheck && npm run build && npm run test
```

Expected: 23/23 tests passing, 0 build errors.

- [ ] **Step 6: Deploy**

```bash
cd C:/Users/Samsung/projetos/vila-viva/app
vercel --prod --yes 2>&1 | tail -5
```

Expected: "Ready" + production URL.

- [ ] **Step 7: Destrava flag para stakeholders**

No Supabase Studio (SQL Editor):

```sql
UPDATE feature_flag SET enabled = true WHERE key = 'vagas';
```

- [ ] **Step 8: Commit + push**

```bash
cd C:/Users/Samsung/projetos/vila-viva
git add app/src/App.tsx app/src/components/VagaCreator.tsx app/src/components/InteresseButton.tsx app/src/routes/VagaDetail.tsx
git commit -m "feat(vagas): wire /vagas/:id/interessados + tracking PostHog (4 eventos)"
git push origin master 2>&1 | tail -3
```

---

## Task 21: Bug-pass do iPhone (manual)

**Files:**
- Nenhum (manual)

- [ ] **Step 1: Abrir produção no iPhone**

Acessar `https://app-vila-viva.vercel.app/vagas` via app Documents (Readdle) ou Safari.

- [ ] **Step 2: Percorrer 5 fluxos**

1. Lista de vagas — abrir, alternar tab Voluntariado/Remunerado, expandir filtro de habilidades, marcar 1-2 chips, ver lista filtrar.
2. Detalhe — click numa vaga, ver layout, click no nome do autor (vai para `/profile/:id`), voltar.
3. Tenho interesse — click no botão, ver contador subir; click de novo, ver descer (toggle).
4. Notificação — em outra conta (incognito ou segundo browser), demonstre interesse numa vaga sua. Voltar pra primeira conta, ver badge no sino.
5. Criar — FAB → criar vaga voluntariado + criar vaga remunerada (valor preenche). Ver no topo da lista.
6. Autor — abrir uma vaga sua, ver "Ver interessados (X)" e "Fechar vaga". Click em "Ver interessados", confere lista.
7. Fechar — click "Fechar vaga", confirma, ver some da lista pública. Mas detalhe via URL direto ainda mostra a vaga com status fechada.

Anotar tudo que parecer estranho.

- [ ] **Step 3: Bugs encontrados viram tasks novas**

Se nada apareceu, F2b-α está completa. Se aparecer, criar tasks de fix.

---

# Resumo de tasks

| Task | Fase | O que faz |
|---|---|---|
| 1 | 1 | Migration 015 (vaga + RLS + triggers) |
| 2 | 1 | Migration 016 (vaga_skill + RLS) |
| 3 | 1 | Migration 017 (vaga_interesse + 2 triggers + ALTER notification) |
| 4 | 1 | Migration 018 (feature flag) |
| 5 | 1 | Regenerar database.types.ts |
| 6 | 1 | Domain vagaTypes (TDD) |
| 7 | 1 | Seeds — 8 vagas |
| 8 | 2 | VagaSkillSelector |
| 9 | 2 | VagaCard |
| 10 | 2 | Vagas.tsx (route) |
| 11 | 2 | AppLayout NavLink + wire /vagas |
| 12 | 3 | InteresseButton |
| 13 | 3 | VagaDetail.tsx |
| 14 | 3 | NotificationBell describeNotif case |
| 15 | 3 | Wire /vagas/:id |
| 16 | 4 | VagaCreator |
| 17 | 4 | Embed em Vagas.tsx |
| 18 | 5 | VagaInteressados.tsx |
| 19 | 5 | Botão Fechar vaga |
| 20 | 5 | Wire /vagas/:id/interessados + PostHog + deploy |
| 21 | 5 | Bug-pass manual iPhone |

**Total:** 21 tasks. Estimativa: ~15-20 commits no master.

**Convidar stakeholders ao fim da Fase 5:** allow-list + URL + WhatsApp como no Light.
