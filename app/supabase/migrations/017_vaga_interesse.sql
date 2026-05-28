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
