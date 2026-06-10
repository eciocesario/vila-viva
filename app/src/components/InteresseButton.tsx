import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { track } from '@/lib/posthog';
import { useAuth } from '@/lib/useAuth';

export function InteresseButton({
  vagaId,
  autorId,
  countServer,
}: {
  vagaId: string;
  autorId: string;
  countServer: number;
}) {
  const { session } = useAuth();
  const qc = useQueryClient();
  const isAutor = session?.user.id === autorId;
  const [optimisticDelta, setOptimisticDelta] = useState(0);

  const { data: mine, isLoading: mineLoading } = useQuery({
    queryKey: ['vaga_interesse_mine', vagaId, session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vaga_interesse')
        .select('vaga_id')
        .eq('vaga_id', vagaId)
        .eq('interessado_id', session!.user.id)
        .maybeSingle();
      if (error) throw error;
      return data !== null;
    },
    enabled: !!session && !isAutor,
  });

  // Quando o countServer atualiza (após refetch da vaga pelo trigger), o servidor
  // já reflete o estado real — zera o delta otimista. Sincronizar estado local
  // com um valor externo que mudou é uso legítimo do effect.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOptimisticDelta(0);
  }, [countServer]);

  const toggle = useMutation({
    mutationFn: async () => {
      if (mine) {
        const { error } = await supabase
          .from('vaga_interesse')
          .delete()
          .eq('vaga_id', vagaId)
          .eq('interessado_id', session!.user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vaga_interesse')
          .insert({ vaga_id: vagaId, interessado_id: session!.user.id });
        if (error) throw error;
      }
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['vaga_interesse_mine', vagaId, session?.user.id] });
      const prev = qc.getQueryData<boolean>(['vaga_interesse_mine', vagaId, session?.user.id]);
      qc.setQueryData(['vaga_interesse_mine', vagaId, session?.user.id], !prev);
      // Ajuste otimista no contador
      setOptimisticDelta(prev ? -1 : 1);
      track('vaga_interesse_clicked', { vaga_id: vagaId, acao: !prev ? 'add' : 'remove' });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) {
        qc.setQueryData(['vaga_interesse_mine', vagaId, session?.user.id], ctx.prev);
      }
      setOptimisticDelta(0);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['vaga_interesse_mine', vagaId, session?.user.id] });
      void qc.invalidateQueries({ queryKey: ['vaga', vagaId] });
      void qc.invalidateQueries({ queryKey: ['vagas'] });
    },
  });

  if (isAutor) {
    return (
      <button
        disabled
        className="w-full px-4 py-3 rounded-soft bg-carvao/10 text-carvao/50 text-sm cursor-not-allowed"
      >
        Você criou esta vaga
      </button>
    );
  }

  const displayCount = Math.max(0, countServer + optimisticDelta);

  return (
    <button
      onClick={() => toggle.mutate()}
      disabled={toggle.isPending || mineLoading}
      className={`w-full px-4 py-3 rounded-soft font-medium ${
        mine ? 'bg-mata text-areia' : 'bg-terra text-areia'
      } disabled:opacity-50`}
    >
      {mine ? 'Você se interessou ✓' : 'Tenho interesse'}
      <span className="ml-2 opacity-80">({displayCount})</span>
    </button>
  );
}
