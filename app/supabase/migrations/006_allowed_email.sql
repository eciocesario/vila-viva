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
