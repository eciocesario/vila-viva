-- 019_vaga_length_checks.sql
-- Adiciona length CHECKs em periodo e valor_remuneracao (proteção contra abuso).

ALTER TABLE public.vaga ADD CONSTRAINT vaga_periodo_length_check
  CHECK (periodo IS NULL OR length(periodo) <= 100);

ALTER TABLE public.vaga ADD CONSTRAINT vaga_valor_remuneracao_length_check
  CHECK (valor_remuneracao IS NULL OR length(valor_remuneracao) <= 100);
