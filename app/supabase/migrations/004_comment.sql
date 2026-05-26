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

DROP TRIGGER IF EXISTS comment_updated_at ON public.comment;
CREATE TRIGGER comment_updated_at
  BEFORE UPDATE ON public.comment
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
