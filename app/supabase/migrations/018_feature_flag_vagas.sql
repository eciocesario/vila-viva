-- 018_feature_flag_vagas.sql
-- Novo feature flag 'vagas' default false; destravar via Studio quando pronto.

INSERT INTO public.feature_flag (key, enabled) VALUES ('vagas', false)
  ON CONFLICT (key) DO NOTHING;
