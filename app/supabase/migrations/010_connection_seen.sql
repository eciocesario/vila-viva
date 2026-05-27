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
