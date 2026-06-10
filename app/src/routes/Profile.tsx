import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import { OfflineNotice } from '@/components/OfflineNotice';
import { PERFIL_LABELS, type Perfil } from '@/domain/onboardingValidation';
import { calcularSementes, type SementesCounts } from '@/domain/sementes';
import { badgesDesbloqueados } from '@/domain/badges';
import { SementesDisplay } from '@/components/SementesDisplay';
import { BadgesGrid } from '@/components/BadgesGrid';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { session, signOut } = useAuth();
  const online = useOnlineStatus();
  const { data, isLoading, error } = useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile')
        .select('id, nome, perfil_tipo, casa, intencao, bio, foto_url')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: postCounts } = useQuery({
    queryKey: ['profile_post_counts', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post')
        .select('tipo')
        .eq('autor_id', id!);
      if (error) throw error;
      const counts: SementesCounts = {
        historia: 0,
        pedido: 0,
        evento: 0,
        projeto: 0,
        conquista: 0,
        vaga: 0,
      };
      for (const p of data) {
        const t = p.tipo as keyof SementesCounts;
        if (t in counts) counts[t]++;
      }
      return counts;
    },
    enabled: !!id,
  });

  const { data: vagaCounts } = useQuery({
    queryKey: ['profile_vaga_counts', id],
    queryFn: async () => {
      const [
        { count: vagas_criadas, error: e1 },
        { count: vaga_interesses, error: e2 },
      ] = await Promise.all([
        supabase.from('vaga').select('*', { count: 'exact', head: true }).eq('autor_id', id!),
        supabase
          .from('vaga_interesse')
          .select('*', { count: 'exact', head: true })
          .eq('interessado_id', id!),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return {
        vaga: vagas_criadas ?? 0,
        vaga_interesse: vaga_interesses ?? 0,
      };
    },
    enabled: !!id,
  });

  if (isLoading) return <main className="p-6">Carregando…</main>;
  if (error || !data) {
    return online ? (
      <main className="p-6 text-terra">Perfil não encontrado.</main>
    ) : (
      <main className="p-6">
        <OfflineNotice />
      </main>
    );
  }

  const isOwn = session?.user.id === data.id;

  const sementesTotal =
    postCounts && vagaCounts
      ? calcularSementes({ ...postCounts, vaga: vagaCounts.vaga })
      : null;

  const unlocked =
    postCounts && vagaCounts
      ? badgesDesbloqueados({
          projeto: postCounts.projeto,
          conquista: postCounts.conquista,
          vaga_interesse: vagaCounts.vaga_interesse,
        })
      : null;

  return (
    <main className="max-w-md mx-auto p-6">
      <div className="flex items-start justify-between">
        <h1 className="font-display text-3xl text-terra">{data.nome}</h1>
        {isOwn && (
          <div className="flex flex-col items-end gap-2">
            <Link
              to="/profile/me/edit"
              className="text-sm text-carvao/60 hover:text-terra underline"
            >
              Editar perfil
            </Link>
            <button
              onClick={async () => {
                if (confirm('Sair da Vila Viva?')) {
                  await signOut();
                  // session becomes null → AppLayout redirects to /login
                }
              }}
              className="px-4 py-1.5 rounded-soft border border-terra/40 text-terra text-sm"
            >
              Sair
            </button>
          </div>
        )}
      </div>
      <p className="text-sm opacity-70 mt-1">
        {PERFIL_LABELS[data.perfil_tipo as Perfil] ?? data.perfil_tipo} {data.casa ? `· ${data.casa}` : ''}
      </p>
      {data.intencao && (
        <blockquote className="mt-4 italic border-l-4 border-mata pl-3">
          {data.intencao}
        </blockquote>
      )}
      {data.bio && (
        <p className="mt-4 whitespace-pre-wrap">{data.bio}</p>
      )}
      {(sementesTotal !== null || (unlocked && unlocked.length > 0)) && (
        <div className="pt-4 border-t border-carvao/10 space-y-4">
          {sementesTotal !== null && <SementesDisplay total={sementesTotal} />}
          {unlocked && <BadgesGrid unlocked={unlocked} />}
        </div>
      )}
    </main>
  );
}
