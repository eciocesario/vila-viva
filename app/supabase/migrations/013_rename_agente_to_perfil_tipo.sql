-- 013_rename_agente_to_perfil_tipo.sql
-- Renomeia profile.agente → profile.perfil_tipo (unificação de vocabulário)
-- Os 14 valores permanecem iguais; só o nome da coluna e da constraint mudam.

ALTER TABLE public.profile RENAME COLUMN agente TO perfil_tipo;

-- Postgres preserva a CHECK constraint no rename, mas o nome dela fica desatualizado.
-- Renomear para consistência.
ALTER TABLE public.profile RENAME CONSTRAINT profile_agente_check TO profile_perfil_tipo_check;

-- handle_new_user precisa referenciar a nova coluna
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profile (id, nome, perfil_tipo)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', 'Sem nome'), 'aprendiz');
  RETURN NEW;
END;
$$;

-- recompute_conectar_aliados referencia agente — atualizar para perfil_tipo
CREATE OR REPLACE FUNCTION public.recompute_conectar_aliados()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_meu_perfil   TEXT;
  v_count        INT;
  v_estado_atual TEXT;
  v_challenge    TEXT := 'conectar-aliados-distantes';
BEGIN
  -- Perfil do autor do comentário
  SELECT perfil_tipo INTO v_meu_perfil FROM public.profile WHERE id = NEW.autor_id;

  -- Conta perfis distintos de autores de posts comentados
  -- (posts de perfis DIFERENTES do meu, e que não são meus próprios posts)
  SELECT COUNT(DISTINCT pp.perfil_tipo) INTO v_count
  FROM public.comment c
  JOIN public.post p ON p.id = c.post_id
  JOIN public.profile pp ON pp.id = p.autor_id
  WHERE c.autor_id = NEW.autor_id
    AND p.autor_id != NEW.autor_id
    AND pp.perfil_tipo != v_meu_perfil;

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
