import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type Skill = { id: string; slug: string; rotulo: string; categoria: string };

export function VagaSkillSelector({
  selected,
  onChange,
}: {
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const { data: skills, isLoading } = useQuery({
    queryKey: ['skill_catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skill')
        .select('id, slug, rotulo, categoria')
        .order('rotulo');
      if (error) throw error;
      return data as Skill[];
    },
  });

  if (isLoading) return <p className="text-xs opacity-60">Carregando habilidades…</p>;

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {skills?.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => toggle(s.id)}
          className={`px-2 py-1 rounded-full text-xs ${
            selected.has(s.id) ? 'bg-mata text-areia' : 'bg-white border border-carvao/20'
          }`}
        >
          {s.rotulo}
        </button>
      ))}
    </div>
  );
}
