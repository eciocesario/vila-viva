-- 012_challenge_progress.sql
-- Tabela challenge_progress + trigger de recomputo

CREATE TABLE IF NOT EXISTS public.challenge_progress (
  profile_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  challenge_slug TEXT NOT NULL REFERENCES public.challenge(slug) ON DELETE CASCADE,
  estado TEXT NOT NULL DEFAULT 'nao_iniciado'
    CHECK (estado IN ('nao_iniciado', 'em_progresso', 'concluido')),
  contador INT NOT NULL DEFAULT 0,
  concluido_em TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (profile_id, challenge_slug)
);

CREATE INDEX challenge_progress_profile_idx ON public.challenge_progress (profile_id);

ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "challenge_progress_select_own" ON public.challenge_progress
  FOR SELECT TO authenticated USING (profile_id = auth.uid());

-- Trigger updated_at
DROP TRIGGER IF EXISTS challenge_progress_updated_at ON public.challenge_progress;
CREATE TRIGGER challenge_progress_updated_at
  BEFORE UPDATE ON public.challenge_progress
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Function: recompute_conectar_aliados
-- Conta arquétipos DISTINTOS de autores de posts comentados pelo usuário,
-- excluindo: posts próprios e posts de mesmo agente.
CREATE OR REPLACE FUNCTION public.recompute_conectar_aliados()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_meu_agente   TEXT;
  v_count        INT;
  v_estado_atual TEXT;
  v_challenge    TEXT := 'conectar-aliados-distantes';
BEGIN
  -- Agente do autor do comentário
  SELECT agente INTO v_meu_agente FROM public.profile WHERE id = NEW.autor_id;

  -- Conta arquétipos distintos de autores de posts comentados
  -- (posts de agentes DIFERENTES do meu, e que não são meus próprios posts)
  SELECT COUNT(DISTINCT pp.agente) INTO v_count
  FROM public.comment c
  JOIN public.post p ON p.id = c.post_id
  JOIN public.profile pp ON pp.id = p.autor_id
  WHERE c.autor_id = NEW.autor_id
    AND p.autor_id != NEW.autor_id
    AND pp.agente != v_meu_agente;

  -- Lê estado atual
  SELECT estado INTO v_estado_atual
  FROM public.challenge_progress
  WHERE profile_id = NEW.autor_id AND challenge_slug = v_challenge;

  -- Upsert do progresso (não retrocede de 'concluido')
  INSERT INTO public.challenge_progress (profile_id, challenge_slug, estado, contador)
  VALUES (
    NEW.autor_id,
    v_challenge,
    CASE
      WHEN v_count >= 3 THEN 'concluido'
      WHEN v_count > 0  THEN 'em_progresso'
      ELSE 'nao_iniciado'
    END,
    v_count
  )
  ON CONFLICT (profile_id, challenge_slug) DO UPDATE
    SET contador   = EXCLUDED.contador,
        estado     = CASE
                       WHEN challenge_progress.estado = 'concluido' THEN 'concluido'
                       ELSE EXCLUDED.estado
                     END,
        concluido_em = CASE
                         WHEN challenge_progress.estado != 'concluido'
                              AND EXCLUDED.estado = 'concluido'
                         THEN NOW()
                         ELSE challenge_progress.concluido_em
                       END,
        updated_at = NOW();

  -- Notificação apenas na PRIMEIRA conclusão
  -- (v_estado_atual is NULL ou != 'concluido' significa que ainda não havia concluído)
  IF v_count >= 3 AND (v_estado_atual IS NULL OR v_estado_atual != 'concluido') THEN
    INSERT INTO public.notification (destinatario_id, tipo, payload)
    VALUES (
      NEW.autor_id,
      'challenge_progresso',
      jsonb_build_object(
        'challenge_slug', v_challenge,
        'estado', 'concluido',
        'contador', v_count
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS comment_recompute_challenge ON public.comment;
CREATE TRIGGER comment_recompute_challenge
  AFTER INSERT ON public.comment
  FOR EACH ROW EXECUTE FUNCTION public.recompute_conectar_aliados();
