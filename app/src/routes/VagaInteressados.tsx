import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { useFlag } from '@/lib/useFlag';
import { PERFIL_LABELS, type Perfil } from '@/domain/onboardingValidation';

export default function VagaInteressados() {
  const enabled = useFlag('vagas');
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();

  const { data: vaga } = useQuery({
    queryKey: ['vaga_meta', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vaga')
        .select('id, titulo, autor_id')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && enabled,
  });

  const { data: interessados, isLoading } = useQuery({
    queryKey: ['vaga_interessados', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vaga_interesse')
        .select(`
          created_at,
          interessado:profile!interessado_id(id, nome, perfil_tipo, casa)
        `)
        .eq('vaga_id', id!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      type Row = { created_at: string; interessado: { id: string; nome: string; perfil_tipo: string; casa: string | null } };
      return data as unknown as Row[];
    },
    enabled: !!id && enabled && !!vaga && vaga.autor_id === session?.user.id,
  });

  if (!enabled) return <Navigate to="/" replace />;
  if (vaga && vaga.autor_id !== session?.user.id) return <Navigate to={`/vagas/${id}`} replace />;
  if (isLoading) return <main className="p-6">Carregando…</main>;

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-4">
      <Link to={`/vagas/${id}`} className="text-sm text-terra hover:underline">
        ← Voltar para vaga
      </Link>
      <h1 className="font-display text-2xl text-terra">
        Interessados em "{vaga?.titulo ?? '…'}"
      </h1>

      {interessados?.length === 0 && (
        <p className="text-sm opacity-60">Ninguém se interessou ainda.</p>
      )}

      <ul className="space-y-2">
        {interessados?.map((r) => (
          <li key={r.interessado.id}>
            <Link
              to={`/profile/${r.interessado.id}`}
              className="block p-3 rounded-card bg-white border border-carvao/10 hover:border-mata"
            >
              <p className="font-medium text-terra">{r.interessado.nome}</p>
              <p className="text-xs opacity-70">
                {PERFIL_LABELS[r.interessado.perfil_tipo as Perfil] ?? r.interessado.perfil_tipo}
                {r.interessado.casa && ` · ${r.interessado.casa}`}
              </p>
              <p className="text-xs opacity-50 mt-1">
                interessou-se em {new Date(r.created_at).toLocaleString('pt-BR')}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
