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
