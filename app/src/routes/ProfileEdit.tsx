import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { useFlag } from '@/lib/useFlag';
import { PERFIS } from '@/domain/onboardingValidation';

export default function ProfileEdit() {
  const enabled = useFlag('profile_edit');
  const { session } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: profile, isLoading: loadingP } = useQuery({
    queryKey: ['profile', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile')
        .select('*')
        .eq('id', session!.user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!session && enabled,
  });

  const { data: allSkills } = useQuery({
    queryKey: ['skill_catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('skill')
        .select('id, slug, rotulo, categoria')
        .order('rotulo');
      if (error) throw error;
      return data;
    },
    enabled,
  });

  const { data: mySkills } = useQuery({
    queryKey: ['my_skills', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_skill')
        .select('skill_id, intencao')
        .eq('profile_id', session!.user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!session && enabled,
  });

  const [nome, setNome] = useState('');
  const [perfilTipo, setPerfilTipo] = useState('');
  const [casa, setCasa] = useState('');
  const [intencao, setIntencao] = useState('');
  const [bio, setBio] = useState('');
  const [oferece, setOferece] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (profile) {
      setNome(profile.nome ?? '');
      setPerfilTipo(profile.perfil_tipo ?? '');
      setCasa(profile.casa ?? '');
      setIntencao(profile.intencao ?? '');
      setBio(profile.bio ?? '');
    }
    if (mySkills) {
      setOferece(
        new Set(mySkills.filter((s) => s.intencao === 'oferece').map((s) => s.skill_id)),
      );
      setBusca(
        new Set(mySkills.filter((s) => s.intencao === 'busca').map((s) => s.skill_id)),
      );
    }
  }, [profile, mySkills]);

  const save = useMutation({
    mutationFn: async () => {
      const { error: e1 } = await supabase
        .from('profile')
        .update({
          nome,
          perfil_tipo: perfilTipo,
          casa: casa || null,
          intencao: intencao || null,
          bio: bio || null,
        })
        .eq('id', session!.user.id);
      if (e1) throw e1;

      // Reset profile_skill: delete all + reinsert
      await supabase.from('profile_skill').delete().eq('profile_id', session!.user.id);

      const rows = [
        ...Array.from(oferece).map((skill_id) => ({
          profile_id: session!.user.id,
          skill_id,
          intencao: 'oferece' as const,
          nivel: 'intermediario' as const,
        })),
        ...Array.from(busca).map((skill_id) => ({
          profile_id: session!.user.id,
          skill_id,
          intencao: 'busca' as const,
          nivel: null,
        })),
      ];
      if (rows.length > 0) {
        const { error: e2 } = await supabase.from('profile_skill').insert(rows);
        if (e2) throw e2;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['my_skills'] });
      nav(`/profile/${session!.user.id}`);
    },
  });

  if (!enabled) return <Navigate to="/" replace />;
  if (loadingP) return <main className="p-6">Carregando…</main>;

  function toggle(
    set: Set<string>,
    setSet: (s: Set<string>) => void,
    id: string,
  ) {
    const n = new Set(set);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setSet(n);
  }

  return (
    <main className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="font-display text-2xl text-terra">Editar perfil</h1>

      <label className="block">
        <span className="text-xs opacity-70">Nome</span>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full px-3 py-2 rounded-soft border border-carvao/20 bg-white"
        />
      </label>

      <label className="block">
        <span className="text-xs opacity-70">Perfil</span>
        <select
          value={perfilTipo}
          onChange={(e) => setPerfilTipo(e.target.value)}
          className="w-full px-3 py-2 rounded-soft border border-carvao/20 bg-white"
        >
          {PERFIS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs opacity-70">Casa</span>
        <input
          value={casa}
          onChange={(e) => setCasa(e.target.value)}
          className="w-full px-3 py-2 rounded-soft border border-carvao/20 bg-white"
        />
      </label>

      <label className="block">
        <span className="text-xs opacity-70">Intenção (até 280)</span>
        <textarea
          value={intencao}
          onChange={(e) => setIntencao(e.target.value)}
          maxLength={280}
          rows={2}
          className="w-full px-3 py-2 rounded-soft border border-carvao/20 bg-white"
        />
      </label>

      <label className="block">
        <span className="text-xs opacity-70">Bio</span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 rounded-soft border border-carvao/20 bg-white"
        />
      </label>

      <div>
        <span className="text-xs opacity-70">Habilidades que ofereço</span>
        <div className="flex gap-1 flex-wrap mt-1">
          {allSkills?.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(oferece, setOferece, s.id)}
              className={`px-2 py-1 rounded-full text-xs ${
                oferece.has(s.id)
                  ? 'bg-mata text-areia'
                  : 'bg-white border border-carvao/20'
              }`}
            >
              {s.rotulo}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="text-xs opacity-70">Habilidades que busco</span>
        <div className="flex gap-1 flex-wrap mt-1">
          {allSkills?.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(busca, setBusca, s.id)}
              className={`px-2 py-1 rounded-full text-xs ${
                busca.has(s.id)
                  ? 'bg-terra text-areia'
                  : 'bg-white border border-carvao/20'
              }`}
            >
              {s.rotulo}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => save.mutate()}
        disabled={save.isPending}
        className="w-full px-4 py-3 rounded-soft bg-terra text-areia font-medium disabled:opacity-50"
      >
        {save.isPending ? 'Salvando…' : 'Salvar'}
      </button>

      {save.error && (
        <p className="text-sm text-terra">
          {(save.error as Error).message}
        </p>
      )}
    </main>
  );
}
