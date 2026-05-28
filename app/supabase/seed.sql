-- app/supabase/seed.sql
-- 14 perfis fictícios baseados nos 14 perfis canônicos do v3.3.
-- Distribuição: 2 cultivadores, 2 guardiões, 2 aliados, 1 prof_remoto,
-- 1 trabalhador_regiao, 1 polinizador, 1 semente, 1 embaixador, 1 aliado_externo,
-- 1 org_local, 1 org_comunitaria, 1 gt_coletivo. Total 14.
-- Pulamos governanca, org_parceira, observador para evitar simular instituições
-- num ambiente de teste de stakeholders.

-- Allowlist temp (necessária para o trigger enforce_email_allowlist permitir o INSERT em auth.users)
INSERT INTO public.allowed_email (email, added_by) VALUES
  ('aurora@seed.vilaviva.local', 'seed-temp'),
  ('benjamim@seed.vilaviva.local', 'seed-temp'),
  ('celeste@seed.vilaviva.local', 'seed-temp'),
  ('dario@seed.vilaviva.local', 'seed-temp'),
  ('elis@seed.vilaviva.local', 'seed-temp'),
  ('fabio@seed.vilaviva.local', 'seed-temp'),
  ('gisele@seed.vilaviva.local', 'seed-temp'),
  ('helio@seed.vilaviva.local', 'seed-temp'),
  ('iara@seed.vilaviva.local', 'seed-temp'),
  ('joaquim@seed.vilaviva.local', 'seed-temp'),
  ('katia@seed.vilaviva.local', 'seed-temp'),
  ('lucas@seed.vilaviva.local', 'seed-temp'),
  ('marina@seed.vilaviva.local', 'seed-temp'),
  ('nuno@seed.vilaviva.local', 'seed-temp')
ON CONFLICT (email) DO NOTHING;

-- 14 perfis fictícios (UUIDs estáveis, formato 8-4-4-4-12 hex)
DO $$
DECLARE
  v_users RECORD;
BEGIN
  FOR v_users IN (
    SELECT * FROM (VALUES
      ('00000000-0000-0000-0000-000000000001'::uuid, 'aurora@seed.vilaviva.local',   'Aurora Pelegrini',    'cultivador',         'Casa do Vento',  'Cuidar da terra e fortalecer redes entre moradores.'),
      ('00000000-0000-0000-0000-000000000002'::uuid, 'benjamim@seed.vilaviva.local', 'Benjamim Lobato',     'guardiao',           'Casa do Sol',    'Acolher quem chega e zelar pelo território.'),
      ('00000000-0000-0000-0000-000000000003'::uuid, 'celeste@seed.vilaviva.local',  'Celeste Andrade',     'aliado',             'Casa da Lua',    'Apoiar remotamente os projetos da vila.'),
      ('00000000-0000-0000-0000-000000000004'::uuid, 'dario@seed.vilaviva.local',    'Dário Mendes',        'prof_remoto',        'Casa da Mata',   'Trabalhar daqui sem perder vínculo com a vila.'),
      ('00000000-0000-0000-0000-000000000005'::uuid, 'elis@seed.vilaviva.local',     'Elis Castanho',       'trabalhador_regiao', 'Casa do Rio',    'Movimentar o turismo da região com regeneração.'),
      ('00000000-0000-0000-0000-000000000006'::uuid, 'fabio@seed.vilaviva.local',    'Fábio Sereno',        'polinizador',        NULL,             'Visitar várias vezes ao ano e plantar conexões.'),
      ('00000000-0000-0000-0000-000000000007'::uuid, 'gisele@seed.vilaviva.local',   'Gisele Tavares',      'semente',            'Casa do Vento',  'Aprender com quem já caminhou e criar raízes.'),
      ('00000000-0000-0000-0000-000000000008'::uuid, 'helio@seed.vilaviva.local',    'Hélio Borges',        'embaixador',         NULL,             'Levar Piracanga para fora e trazer parcerias.'),
      ('00000000-0000-0000-0000-000000000009'::uuid, 'iara@seed.vilaviva.local',     'Iara Vargas',         'aliado_externo',     NULL,             'Cuidar da bacia hidrográfica de fora da vila.'),
      ('00000000-0000-0000-0000-00000000000a'::uuid, 'joaquim@seed.vilaviva.local',  'Joaquim Reis',        'org_local',          'Casa da Mata',   'Empreendimento de bioconstrução local.'),
      ('00000000-0000-0000-0000-00000000000b'::uuid, 'katia@seed.vilaviva.local',    'Kátia Munduruku',     'org_comunitaria',    'Casa do Rio',    'Instituto sem fins lucrativos de educação.'),
      ('00000000-0000-0000-0000-00000000000c'::uuid, 'lucas@seed.vilaviva.local',    'Lucas Caetano',       'gt_coletivo',        'Casa da Terra',  'Grupo de trabalho de comunicação comunitária.'),
      ('00000000-0000-0000-0000-00000000000d'::uuid, 'marina@seed.vilaviva.local',   'Marina Albuquerque',  'cultivador',         'Casa do Vento',  'Mãos na terra, fazer barro e teias.'),
      ('00000000-0000-0000-0000-00000000000e'::uuid, 'nuno@seed.vilaviva.local',     'Nuno Cassiano',       'guardiao',           'Casa do Sol',    'Visão de longo prazo para a vila e suas casas.')
    ) AS u(id, email, nome, perfil_tipo, casa, intencao)
  ) LOOP
    INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at, raw_user_meta_data)
    VALUES (v_users.id, v_users.email, NOW(), NOW(), NOW(), jsonb_build_object('nome', v_users.nome, 'seed', true))
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.profile (id, nome, perfil_tipo, casa, intencao, onboarding_completed_at)
    VALUES (v_users.id, v_users.nome, v_users.perfil_tipo, v_users.casa, v_users.intencao, NOW())
    ON CONFLICT (id) DO UPDATE SET
      nome = EXCLUDED.nome,
      perfil_tipo = EXCLUDED.perfil_tipo,
      casa = EXCLUDED.casa,
      intencao = EXCLUDED.intencao,
      onboarding_completed_at = EXCLUDED.onboarding_completed_at;
  END LOOP;
END $$;

-- 25 posts iniciais distribuídos entre os 5 tipos, datados nos últimos 14 dias
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
WHERE p.perfil_tipo IN ('cultivador', 'guardiao', 'aliado', 'prof_remoto', 'trabalhador_regiao')
LIMIT 25;

-- Reseed profile_skill para os 14 seeds
DO $$
DECLARE
  v_profile RECORD;
  v_skill RECORD;
BEGIN
  FOR v_profile IN (SELECT id FROM public.profile WHERE id IN (SELECT id FROM auth.users WHERE email LIKE '%@seed.vilaviva.local')) LOOP
    FOR v_skill IN (SELECT id FROM public.skill ORDER BY random() LIMIT 4) LOOP
      INSERT INTO public.profile_skill (profile_id, skill_id, intencao, nivel)
      VALUES (v_profile.id, v_skill.id, 'oferece', 'intermediario')
      ON CONFLICT DO NOTHING;
    END LOOP;
    FOR v_skill IN (SELECT id FROM public.skill ORDER BY random() LIMIT 2) LOOP
      INSERT INTO public.profile_skill (profile_id, skill_id, intencao, nivel)
      VALUES (v_profile.id, v_skill.id, 'busca', NULL)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Seed de 8 vagas (4 voluntariado + 4 remunerado) atribuídas 1:1 aos primeiros
-- 8 seed users (ordenados por id). Cada vaga ganha 1-3 skills aleatórios.
WITH numbered_profiles AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
  FROM public.profile
  WHERE id IN (SELECT id FROM auth.users WHERE email LIKE '%@seed.vilaviva.local')
  LIMIT 8
),
vaga_data AS (
  SELECT * FROM (VALUES
    (1, 'voluntariado', 'Ajuda pra carregar caminhão de mudas',  'Sábado de manhã, trago 200 mudas de cacau pra plantar. Preciso de 3-4 pessoas.', 'Casa da Mata',        'Sábado 8h-12h',     NULL::text),
    (2, 'voluntariado', 'Mediação de Reunião Casa do Vento',     'Reunião comunitária na próxima quarta, preciso de alguém pra facilitar.',         'Casa do Vento',       'Quarta 19h-21h',    NULL::text),
    (3, 'voluntariado', 'Tradução de carta pra parceria BIOMAS', 'Carta de 1 página em inglês pra parceria com o Painel Biomas.',                   'Remoto',              'Até dia 30',        NULL::text),
    (4, 'voluntariado', 'Acompanhar visita de pesquisador',      'Pesquisador da UFBA vem semana que vem, alguém que conhece a vila pra tour.',      'Vila Viva',           'Próxima semana',    NULL::text),
    (5, 'remunerado',   'Aulas de inglês 2x/sem',                'Procuro professor/a de inglês pra meu filho de 12 anos. Duas vezes por semana, 1h.','Casa do Sol',         'Semanal ongoing',   'R$ 120/aula'),
    (6, 'remunerado',   'Manutenção elétrica casa',              'Casa precisa revisão elétrica completa, ~2 dias de serviço.',                      'Casa do Rio',         'Próximo mês',       'A combinar'),
    (7, 'remunerado',   'Diarista 1x/sem',                       'Limpeza geral 4h, uma vez por semana.',                                             'Casa da Terra',       'Sextas 8h-12h',     'R$ 150 + transporte'),
    (8, 'remunerado',   'Aula de yoga semanal',                  'Yoga ao ar livre, sábado de manhã, grupo de 5-8 pessoas.',                         'Centro comunitário',  'Sábados 7h-8h',     'R$ 60/aula')
  ) AS v(rn, tipo, titulo, descricao, local, periodo, valor_remuneracao)
),
inserted_vagas AS (
  INSERT INTO public.vaga (autor_id, tipo, titulo, descricao, local, periodo, valor_remuneracao)
  SELECT np.id, vd.tipo, vd.titulo, vd.descricao, vd.local, vd.periodo, vd.valor_remuneracao
  FROM numbered_profiles np
  JOIN vaga_data vd ON vd.rn = np.rn
  RETURNING id
)
-- Para cada vaga inserida, vincular 1-3 skills aleatórios do catálogo
INSERT INTO public.vaga_skill (vaga_id, skill_id)
SELECT iv.id, s.id
FROM inserted_vagas iv
CROSS JOIN LATERAL (
  SELECT id FROM public.skill ORDER BY random() LIMIT (1 + (random() * 3)::int)
) AS s;

-- Cleanup allowlist temp
DELETE FROM public.allowed_email
WHERE added_by = 'seed-temp' AND email LIKE '%@seed.vilaviva.local';
