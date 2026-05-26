-- app/supabase/seed.sql
-- 15 perfis fictícios (auth.users + profile)
-- Usuários fictícios são criados via auth.users + profile diretamente,
-- evitando o trigger handle_new_user (já que rodamos como service_role).
-- Usa ON CONFLICT DO UPDATE para garantir que os valores do seed sobrescrevam
-- os defaults inseridos pelo trigger on_auth_user_created.
--
-- Nota: os e-mails de seed são inseridos temporariamente em allowed_email
-- para satisfazer o trigger enforce_email_allowlist, e depois removidos.

DO $$
DECLARE
  v_users RECORD;
  seed_emails TEXT[] := ARRAY[
    'aurora@seed.vilaviva.local',
    'benjamim@seed.vilaviva.local',
    'celeste@seed.vilaviva.local',
    'dario@seed.vilaviva.local',
    'elis@seed.vilaviva.local',
    'fabio@seed.vilaviva.local',
    'gisele@seed.vilaviva.local',
    'helio@seed.vilaviva.local',
    'iara@seed.vilaviva.local',
    'joaquim@seed.vilaviva.local',
    'katia@seed.vilaviva.local',
    'lucas@seed.vilaviva.local',
    'marina@seed.vilaviva.local',
    'nuno@seed.vilaviva.local',
    'olivia@seed.vilaviva.local'
  ];
BEGIN
  -- 1. Permitir temporariamente os e-mails de seed
  INSERT INTO public.allowed_email (email, added_by)
  SELECT unnest(seed_emails), 'seed-temp'
  ON CONFLICT (email) DO NOTHING;

  -- 2. Inserir usuários fictícios
  FOR v_users IN (
    SELECT * FROM (VALUES
      (gen_random_uuid(), 'aurora@seed.vilaviva.local',  'Aurora Pelegrini',  'tecedor',      'Casa do Vento',   'Tecer redes entre pessoas e propósitos.'),
      (gen_random_uuid(), 'benjamim@seed.vilaviva.local','Benjamim Lobato',   'curador',      'Casa do Sol',     'Cuidar de espaços e ritmos.'),
      (gen_random_uuid(), 'celeste@seed.vilaviva.local', 'Celeste Andrade',   'mediador',     'Casa da Lua',     'Pontear conflitos com presença.'),
      (gen_random_uuid(), 'dario@seed.vilaviva.local',   'Dário Mendes',      'guardian',     'Casa da Mata',    'Guardar a mata e o saber dela.'),
      (gen_random_uuid(), 'elis@seed.vilaviva.local',    'Elis Castanho',     'sonhador',     'Casa do Rio',     'Imaginar futuros possíveis.'),
      (gen_random_uuid(), 'fabio@seed.vilaviva.local',   'Fábio Sereno',      'praticante',   'Casa da Terra',   'Pôr mão na massa, todo dia.'),
      (gen_random_uuid(), 'gisele@seed.vilaviva.local',  'Gisele Tavares',    'aprendiz',     'Casa do Vento',   'Aprender com quem caminhou antes.'),
      (gen_random_uuid(), 'helio@seed.vilaviva.local',   'Hélio Borges',      'guia',         'Casa do Sol',     'Acompanhar grupos pela terra.'),
      (gen_random_uuid(), 'iara@seed.vilaviva.local',    'Iara Vargas',       'tradutor',     'Casa da Lua',     'Traduzir entre saberes e linguagens.'),
      (gen_random_uuid(), 'joaquim@seed.vilaviva.local', 'Joaquim Reis',      'semeador',     'Casa da Mata',    'Plantar futuros — literalmente.'),
      (gen_random_uuid(), 'katia@seed.vilaviva.local',   'Kátia Munduruku',   'pesquisador',  'Casa do Rio',     'Investigar a biodiversidade local.'),
      (gen_random_uuid(), 'lucas@seed.vilaviva.local',   'Lucas Caetano',     'comunicador',  'Casa da Terra',   'Contar histórias da vila.'),
      (gen_random_uuid(), 'marina@seed.vilaviva.local',  'Marina Albuquerque','artesao',      'Casa do Vento',   'Fazer com as mãos, em barro e linho.'),
      (gen_random_uuid(), 'nuno@seed.vilaviva.local',    'Nuno Cassiano',     'visionario',   'Casa do Sol',     'Enxergar o todo, propor o novo.'),
      (gen_random_uuid(), 'olivia@seed.vilaviva.local',  'Olívia Quitéria',   'tecedor',      'Casa da Lua',     'Conectar visitantes ao território.')
    ) AS u(id, email, nome, agente, casa, intencao)
  ) LOOP
    -- Criar entry em auth.users (trigger enforce_email_allowlist agora passa)
    INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
    VALUES (v_users.id, v_users.email, NOW(), NOW(), NOW(), jsonb_build_object('nome', v_users.nome, 'seed', true))
    ON CONFLICT (id) DO NOTHING;

    -- Usar DO UPDATE para garantir que agente/casa/intencao do seed sobrescrevam
    -- os defaults inseridos automaticamente pelo trigger on_auth_user_created
    INSERT INTO public.profile (id, nome, agente, casa, intencao, onboarding_completed_at)
    VALUES (v_users.id, v_users.nome, v_users.agente, v_users.casa, v_users.intencao, NOW())
    ON CONFLICT (id) DO UPDATE SET
      nome = EXCLUDED.nome,
      agente = EXCLUDED.agente,
      casa = EXCLUDED.casa,
      intencao = EXCLUDED.intencao,
      onboarding_completed_at = NOW();
  END LOOP;

  -- 3. Remover e-mails temporários de seed da allowlist
  DELETE FROM public.allowed_email WHERE added_by = 'seed-temp';
END $$;

-- 25 posts iniciais distribuídos entre os 5 tipos
INSERT INTO public.post (autor_id, tipo, titulo, corpo, created_at)
SELECT
  p.id,
  posts.tipo,
  posts.titulo,
  posts.corpo,
  NOW() - (posts.dias_atras || ' days')::interval
FROM public.profile p
JOIN LATERAL (VALUES
  ('historia',  'O dia que choveu de lado',          'Ontem o vento veio do mar e a chuva entrou pelas frestas. A casa cheirou a terra molhada por 3 horas.', 1),
  ('pedido',    'Procuro uma escada de 5m',          'Vou colher coco amanhã cedo, alguém empresta?', 1),
  ('projeto',   'Horta sintrópica na Casa do Vento', 'Começamos em junho. Quem quer participar?', 2),
  ('evento',    'Roda de violão sábado',             'Às 19h no centro comunitário. Tragam o instrumento.', 2),
  ('conquista', 'Primeira muda de cacau brotou',     'Depois de 8 meses, ela apareceu.', 3)
) AS posts(tipo, titulo, corpo, dias_atras) ON true
WHERE p.agente IN ('tecedor', 'curador', 'mediador', 'guardian', 'sonhador')
LIMIT 25;
