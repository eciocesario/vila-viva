import { useState, useDeferredValue, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useFlag } from '@/lib/useFlag';
import { useOnlineStatus } from '@/lib/useOnlineStatus';
import { PERFIS_ONBOARDING, PERFIL_LABELS } from '@/domain/onboardingValidation';
import { MatchCard, type MatchResult } from '@/components/MatchCard';
import { OfflineNotice } from '@/components/OfflineNotice';
import { track } from '@/lib/posthog';

export default function Match() {
  const enabled = useFlag('match_pessoas');
  const online = useOnlineStatus();
  const [search, setSearch] = useState('');
  const [perfilFilter, setPerfilFilter] = useState<string>('');
  const deferredSearch = useDeferredValue(search);

  const { data, isLoading, error } = useQuery({
    queryKey: ['match', deferredSearch, perfilFilter],
    queryFn: async (): Promise<MatchResult[]> => {
      const { data, error } = await supabase.functions.invoke('match-engine', {
        body: {
          search: deferredSearch || undefined,
          perfilFilter: perfilFilter || undefined,
          limit: 20,
        },
      });
      if (error) throw error;
      return data as MatchResult[];
    },
    enabled,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (data) track('match_viewed', { count: data.length });
  }, [data]);

  if (!enabled) return <Navigate to="/" replace />;

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="font-display text-2xl text-terra mb-4">Pessoas</h1>

      <input
        type="search"
        placeholder="Busca por nome…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 rounded-soft border border-carvao/20 bg-white mb-3"
      />

      <div className="flex gap-2 flex-wrap mb-4">
        <button
          onClick={() => setPerfilFilter('')}
          className={`px-2.5 py-1 rounded-full text-xs ${
            perfilFilter === '' ? 'bg-terra text-areia' : 'bg-white border border-carvao/20'
          }`}
        >
          Todos
        </button>
        {PERFIS_ONBOARDING.map((p) => (
          <button
            key={p}
            onClick={() => setPerfilFilter(p)}
            className={`px-2.5 py-1 rounded-full text-xs ${
              perfilFilter === p ? 'bg-terra text-areia' : 'bg-white border border-carvao/20'
            }`}
          >{PERFIL_LABELS[p]}</button>
        ))}
      </div>

      {isLoading && <p className="text-sm opacity-60">Buscando…</p>}
      {error &&
        (online ? (
          <p className="text-sm text-terra">
            Erro ao buscar pessoas: {error instanceof Error ? error.message : 'Tente novamente.'}
          </p>
        ) : (
          <OfflineNotice />
        ))}
      <div className="space-y-3">
        {data?.map((m) => <MatchCard key={m.id} m={m} />)}
      </div>
      {!isLoading && !error && data?.length === 0 && (
        <p className="text-sm opacity-60 text-center py-8">Nenhum resultado encontrado.</p>
      )}
    </main>
  );
}
