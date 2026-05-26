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

DROP TRIGGER IF EXISTS post_updated_at ON public.post;
CREATE TRIGGER post_updated_at
  BEFORE UPDATE ON public.post
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
