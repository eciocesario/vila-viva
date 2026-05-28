-- 016_vaga_skill.sql
-- N:N entre vaga e skill (catálogo existente).

CREATE TABLE IF NOT EXISTS public.vaga_skill (
  vaga_id UUID NOT NULL REFERENCES public.vaga(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skill(id) ON DELETE CASCADE,
  PRIMARY KEY (vaga_id, skill_id)
);

CREATE INDEX vaga_skill_skill_idx ON public.vaga_skill (skill_id);

ALTER TABLE public.vaga_skill ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vaga_skill_select_authenticated" ON public.vaga_skill
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "vaga_skill_insert_autor" ON public.vaga_skill
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.vaga WHERE id = vaga_id AND autor_id = auth.uid())
  );

CREATE POLICY "vaga_skill_delete_autor" ON public.vaga_skill
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.vaga WHERE id = vaga_id AND autor_id = auth.uid())
  );
