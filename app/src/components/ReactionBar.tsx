import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { useFlag } from '@/lib/useFlag';
import { track } from '@/lib/posthog';

const REACOES = [
  { tipo: 'coracao', emoji: '🫶' },
  { tipo: 'mao', emoji: '🤝' },
  { tipo: 'semente', emoji: '🌱' },
  { tipo: 'fogo', emoji: '🔥' },
] as const;

type TipoReacao = typeof REACOES[number]['tipo'];

export function ReactionBar({ postId }: { postId: string }) {
  const { session } = useAuth();
  const enabled = useFlag('reactions');
  const qc = useQueryClient();

  const { data: reactions } = useQuery({
    queryKey: ['reactions', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reaction')
        .select('tipo, autor_id')
        .eq('post_id', postId);
      if (error) throw error;
      return data;
    },
    enabled,
  });

  const toggle = useMutation({
    mutationFn: async (tipo: TipoReacao) => {
      const mine = reactions?.find((r) => r.tipo === tipo && r.autor_id === session!.user.id);
      if (mine) {
        await supabase.from('reaction').delete().eq('post_id', postId).eq('autor_id', session!.user.id).eq('tipo', tipo);
      } else {
        await supabase.from('reaction').insert({ post_id: postId, autor_id: session!.user.id, tipo });
      }
    },
    onMutate: async (tipo) => {
      await qc.cancelQueries({ queryKey: ['reactions', postId] });
      const prev = qc.getQueryData<{ tipo: string; autor_id: string }[]>(['reactions', postId]);
      const mine = prev?.find((r) => r.tipo === tipo && r.autor_id === session!.user.id);
      qc.setQueryData(['reactions', postId], (old: { tipo: string; autor_id: string }[] = []) =>
        mine
          ? old.filter((r) => !(r.tipo === tipo && r.autor_id === session!.user.id))
          : [...old, { tipo, autor_id: session!.user.id }]
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['reactions', postId], ctx.prev);
    },
    onSuccess: (_data, tipo) => {
      track('reaction_added', { tipo, post_id: postId });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['reactions', postId] }),
  });

  if (!enabled) return null;

  return (
    <div className="mt-3 flex gap-2">
      {REACOES.map((r) => {
        const count = reactions?.filter((x) => x.tipo === r.tipo).length ?? 0;
        const mine = reactions?.some((x) => x.tipo === r.tipo && x.autor_id === session?.user.id);
        return (
          <button
            key={r.tipo}
            onClick={() => toggle.mutate(r.tipo)}
            className={`px-2 py-1 rounded-full text-sm ${
              mine ? 'bg-terra/10' : 'bg-white border border-carvao/10'
            }`}
          >
            {r.emoji} {count > 0 && count}
          </button>
        );
      })}
    </div>
  );
}
