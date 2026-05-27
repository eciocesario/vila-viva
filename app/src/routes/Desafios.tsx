import { Navigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useFlag } from '@/lib/useFlag';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import { describeChallengeState, progressPercent } from '@/domain/challengeProgress';
import type { ChallengeEstado } from '@/domain/challengeProgress';

export default function Desafios() {
  const flagOn = useFlag('challenge_piloto');
  const { session } = useAuth();

  const { data: challenges, isLoading: loadingChallenges } = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge')
        .select('*')
        .eq('ativo', true)
        .order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: flagOn,
  });

  const { data: progressList, isLoading: loadingProgress } = useQuery({
    queryKey: ['challenge_progress', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_progress')
        .select('*')
        .eq('profile_id', session!.user.id);
      if (error) throw error;
      return data;
    },
    enabled: flagOn && !!session,
  });

  if (!flagOn) {
    return <Navigate to="/" replace />;
  }

  if (loadingChallenges || loadingProgress) {
    return <main className="p-6">Carregando desafios…</main>;
  }

  // Map progress by challenge_slug for O(1) lookup
  const progressMap = new Map(
    (progressList ?? []).map((p) => [p.challenge_slug, p])
  );

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="font-display text-2xl text-terra">Desafios</h1>

      {(!challenges || challenges.length === 0) && (
        <p className="text-carvao/60">Nenhum desafio ativo no momento.</p>
      )}

      {(challenges ?? []).map((ch) => {
        const progress = progressMap.get(ch.slug);
        const estado = (progress?.estado ?? 'nao_iniciado') as ChallengeEstado;
        const contador = progress?.contador ?? 0;
        const meta = (ch.criterio_meta as { minimo: number }).minimo;
        const pct = progressPercent(contador, meta);

        return (
          <div key={ch.slug} className="bg-white rounded-xl shadow-sm p-5 space-y-3">
            <h2 className="font-display text-lg text-carvao">{ch.titulo}</h2>
            <p className="text-sm text-carvao/80">{ch.descricao}</p>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="h-2 bg-carvao/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-mata rounded-full transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-carvao/60">
                {contador} / {meta} · {describeChallengeState(estado)}
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-carvao/10 text-xs opacity-70">
              <p className="mb-2">
                💡 Para avançar, comente em posts do Feed de pessoas com arquétipos diferentes do seu.
              </p>
              <Link to="/" className="inline-block text-terra hover:underline">
                Ir para o Feed →
              </Link>
            </div>
          </div>
        );
      })}
    </main>
  );
}
