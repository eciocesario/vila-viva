-- 014_perfil_taxonomy_v33.sql
-- Substitui valores antigos de perfil_tipo (tecedor, curador, ...) pelos 15 perfis
-- canônicos da apresentação v3.3 (docs/vila_viva_v3_3.pdf pp.07-08).
-- Os 15 perfis: cultivador, guardiao, aliado, prof_remoto, trabalhador_regiao,
-- polinizador, semente, embaixador, aliado_externo, org_local, org_comunitaria,
-- gt_coletivo, governanca, org_parceira, observador.

-- 1. Drop trigger temporariamente para evitar cascata durante limpeza
DROP TRIGGER IF EXISTS comment_recompute_challenge ON public.comment;

-- 2. Drop CHECK constraint atual para podermos limpar
ALTER TABLE public.profile DROP CONSTRAINT IF EXISTS profile_perfil_tipo_check;

-- 3. Limpar seeds antigos (cascateia para posts, reactions, comments, profile_skill, etc)
DELETE FROM auth.users WHERE email LIKE '%@seed.vilaviva.local';

-- 4. Resetar perfil_tipo dos usuários reais remanescentes para 'cultivador' (default sensato).
-- Os usuários podem editar em /profile/me/edit depois.
UPDATE public.profile SET perfil_tipo = 'cultivador';

-- 5. Adicionar nova CHECK constraint com os 15 valores canônicos
ALTER TABLE public.profile
  ADD CONSTRAINT profile_perfil_tipo_check
  CHECK (perfil_tipo IN (
    'cultivador', 'guardiao', 'aliado', 'prof_remoto', 'trabalhador_regiao',
    'polinizador', 'semente', 'embaixador', 'aliado_externo',
    'org_local', 'org_comunitaria', 'gt_coletivo', 'governanca',
    'org_parceira', 'observador'
  ));

-- 6. Atualizar handle_new_user para usar 'cultivador' como default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profile (id, nome, perfil_tipo)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', 'Sem nome'), 'cultivador');
  RETURN NEW;
END;
$$;

-- 7. Recriar trigger comment_recompute_challenge (a função em si não muda)
DROP TRIGGER IF EXISTS comment_recompute_challenge ON public.comment;
CREATE TRIGGER comment_recompute_challenge
  AFTER INSERT ON public.comment
  FOR EACH ROW EXECUTE FUNCTION public.recompute_conectar_aliados();
