CREATE TABLE IF NOT EXISTS public.notification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('post_comentado', 'reaction_recebida', 'match_sugerido', 'challenge_progresso')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  lida_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notification_dest_unread_idx ON public.notification (destinatario_id, lida_em) WHERE lida_em IS NULL;
CREATE INDEX notification_dest_created_idx ON public.notification (destinatario_id, created_at DESC);

ALTER TABLE public.notification ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_select_own" ON public.notification
  FOR SELECT TO authenticated USING (destinatario_id = auth.uid());

CREATE POLICY "notification_update_own" ON public.notification
  FOR UPDATE TO authenticated USING (destinatario_id = auth.uid()) WITH CHECK (destinatario_id = auth.uid());

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification;

-- Trigger: ao receber comment em post, notifica autor do post
CREATE OR REPLACE FUNCTION public.notify_post_commented()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_autor_post UUID;
BEGIN
  SELECT autor_id INTO v_autor_post FROM public.post WHERE id = NEW.post_id;
  IF v_autor_post IS NOT NULL AND v_autor_post != NEW.autor_id THEN
    INSERT INTO public.notification (destinatario_id, tipo, payload)
    VALUES (v_autor_post, 'post_comentado',
      jsonb_build_object('post_id', NEW.post_id, 'comment_id', NEW.id, 'autor_id', NEW.autor_id));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS comment_notify ON public.comment;
CREATE TRIGGER comment_notify
  AFTER INSERT ON public.comment
  FOR EACH ROW EXECUTE FUNCTION public.notify_post_commented();

-- Trigger: ao receber reaction, notifica autor
CREATE OR REPLACE FUNCTION public.notify_reaction_recebida()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_autor_post UUID;
BEGIN
  SELECT autor_id INTO v_autor_post FROM public.post WHERE id = NEW.post_id;
  IF v_autor_post IS NOT NULL AND v_autor_post != NEW.autor_id THEN
    INSERT INTO public.notification (destinatario_id, tipo, payload)
    VALUES (v_autor_post, 'reaction_recebida',
      jsonb_build_object('post_id', NEW.post_id, 'autor_id', NEW.autor_id, 'tipo_reacao', NEW.tipo));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reaction_notify ON public.reaction;
CREATE TRIGGER reaction_notify
  AFTER INSERT ON public.reaction
  FOR EACH ROW EXECUTE FUNCTION public.notify_reaction_recebida();
