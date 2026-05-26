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

DROP TRIGGER IF EXISTS feature_flag_updated_at ON public.feature_flag;
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
