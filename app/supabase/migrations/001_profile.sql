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

DROP TRIGGER IF EXISTS profile_updated_at ON public.profile;
CREATE TRIGGER profile_updated_at
  BEFORE UPDATE ON public.profile
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
