-- 011_challenge.sql
-- Tabela challenge: desafios piloto

CREATE TABLE IF NOT EXISTS public.challenge (
  slug TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  criterio_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.challenge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenge_select_authenticated" ON public.challenge
  FOR SELECT TO authenticated USING (true);

-- Seed: desafio piloto "Conectar Aliados Distantes"
INSERT INTO public.challenge (slug, titulo, descricao, criterio_meta)
VALUES (
  'conectar-aliados-distantes',
  'Conectar Aliados Distantes',
  'Comente em ao menos 3 posts de pessoas de arquétipos diferentes do seu.',
  '{"tipo":"comments_diferentes_agentes","minimo":3}'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
