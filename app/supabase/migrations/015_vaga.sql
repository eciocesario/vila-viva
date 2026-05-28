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
