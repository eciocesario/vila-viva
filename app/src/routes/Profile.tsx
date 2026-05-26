import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ['profile', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile')
        .select('id, nome, agente, casa, intencao, bio, foto_url')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) return <main className="p-6">Carregando…</main>;
  if (error || !data) return <main className="p-6 text-terra">Perfil não encontrado.</main>;

  return (
    <main className="max-w-md mx-auto p-6">
      <h1 className="font-display text-3xl text-terra">{data.nome}</h1>
      <p className="text-sm opacity-70 mt-1">
        {data.agente} {data.casa ? `· ${data.casa}` : ''}
      </p>
      {data.intencao && (
        <blockquote className="mt-4 italic border-l-4 border-mata pl-3">
          {data.intencao}
        </blockquote>
      )}
      {data.bio && (
        <p className="mt-4 whitespace-pre-wrap">{data.bio}</p>
      )}
    </main>
  );
}
