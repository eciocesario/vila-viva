import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useFlag } from '@/lib/useFlag';
import { VAGA_TIPOS, vagaTipoLabel, type VagaTipo } from '@/domain/vagaTypes';
import { VagaCard, type VagaCardData } from '@/components/VagaCard';
import { VagaSkillSelector } from '@/components/VagaSkillSelector';

export default function Vagas() {
  const enabled = useFlag('vagas');
  const [tipo, setTipo] = useState<VagaTipo>('voluntariado');
  const [skillFilter, setSkillFilter] = useState<Set<string>>(new Set());

  const skillIds = Array.from(skillFilter);
  const skillIdsSortedKey = [...skillIds].sort().join(',');

  const { data, isLoading } = useQuery({
    queryKey: ['vagas', tipo, skillIdsSortedKey],
    queryFn: async () => {
      let query = supabase
        .from('vaga')
        .select(`
          id, tipo, titulo, count_interesses, created_at,
          autor:profile!autor_id(id, nome, perfil_tipo),
          skills:vaga_skill(skill:skill_id(rotulo))
        `)
        .eq('status', 'aberta')
        .eq('tipo', tipo)
        .order('created_at', { ascending: false })
        .limit(50);

      if (skillIds.length > 0) {
        // Filtro por skill: subquery via .in() em vaga_id
        const { data: vagaIds } = await supabase
          .from('vaga_skill')
          .select('vaga_id')
          .in('skill_id', skillIds);
        const ids = (vagaIds ?? []).map((r) => r.vaga_id);
        if (ids.length === 0) return [];
        query = query.in('id', ids);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Normalizar shape do join skills (array de { skill: { rotulo } }) → array de { rotulo }
      type RawRow = {
        id: string; tipo: VagaTipo; titulo: string;
        count_interesses: number; created_at: string;
        autor: { id: string; nome: string; perfil_tipo: string };
        skills: { skill: { rotulo: string } | null }[];
      };
      return (data as unknown as RawRow[]).map((v) => ({
        ...v,
        skills: v.skills.map((s) => ({ rotulo: s.skill?.rotulo ?? '' })).filter((s) => s.rotulo),
      })) as VagaCardData[];
    },
    enabled,
  });

  if (!enabled) return <Navigate to="/" replace />;

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="font-display text-2xl text-terra mb-4 px-2">Vagas</h1>

      <div className="flex gap-2 mb-4">
        {VAGA_TIPOS.map((t) => (
          <button
            key={t}
            onClick={() => setTipo(t)}
            className={`px-4 py-2 rounded-soft text-sm font-medium ${
              tipo === t ? 'bg-terra text-areia' : 'bg-white border border-carvao/20'
            }`}
          >
            {vagaTipoLabel(t)}
          </button>
        ))}
      </div>

      <details className="mb-4">
        <summary className="text-sm opacity-70 cursor-pointer">Filtrar por habilidades</summary>
        <div className="mt-2">
          <VagaSkillSelector selected={skillFilter} onChange={setSkillFilter} />
        </div>
      </details>

      {isLoading && <p>Carregando…</p>}
      <div className="space-y-3">
        {data?.map((v) => <VagaCard key={v.id} vaga={v} />)}
      </div>
      {data && data.length === 0 && (
        <p className="text-sm opacity-60 mt-6 text-center">
          Nenhuma vaga encontrada nesse tipo/filtro.
        </p>
      )}
    </main>
  );
}
