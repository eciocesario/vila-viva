import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { FeedCard, type FeedCardData } from '@/components/FeedCard';
import { PostCreator } from '@/components/PostCreator';

export default function Feed() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post')
        .select('id, tipo, titulo, corpo, created_at, autor:profile!autor_id(id, nome, perfil_tipo)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as FeedCardData[];
    },
  });

  if (isLoading) return <main className="p-6">Carregando feed…</main>;
  if (error) return <main className="p-6 text-terra">Erro: {String(error)}</main>;

  return (
    <main className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="font-display text-2xl text-terra px-2">Feed</h1>
      {data?.map((p) => <FeedCard key={p.id} post={p} />)}
      <PostCreator />
    </main>
  );
}
