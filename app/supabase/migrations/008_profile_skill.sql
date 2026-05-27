CREATE TABLE IF NOT EXISTS public.profile_skill (
  profile_id UUID NOT NULL REFERENCES public.profile(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skill(id) ON DELETE CASCADE,
  intencao TEXT NOT NULL CHECK (intencao IN ('oferece', 'busca')),
  nivel TEXT CHECK (nivel IN ('iniciante', 'intermediario', 'avancado')),
  PRIMARY KEY (profile_id, skill_id, intencao)
);

CREATE INDEX profile_skill_profile_idx ON public.profile_skill (profile_id);
CREATE INDEX profile_skill_skill_idx ON public.profile_skill (skill_id);

ALTER TABLE public.profile_skill ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_skill_select_authenticated" ON public.profile_skill
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "profile_skill_insert_own" ON public.profile_skill
  FOR INSERT TO authenticated WITH CHECK (profile_id = auth.uid());

CREATE POLICY "profile_skill_delete_own" ON public.profile_skill
  FOR DELETE TO authenticated USING (profile_id = auth.uid());

-- Seed: distribuir 4 skills oferece + 2 busca por perfil-seed
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
