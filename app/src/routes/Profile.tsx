import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { PERFIL_LABELS, type Perfil } from '@/domain/onboardingValidation';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
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

  if (isLoading) return <main className="p-6">Carregando…</main>;
  if (error || !data) return <main className="p-6 text-terra">Perfil não encontrado.</main>;

  const isOwn = session?.user.id === data.id;

  return (
    <main className="max-w-md mx-auto p-6">
      <div className="flex items-start justify-between">
        <h1 className="font-display text-3xl text-terra">{data.nome}</h1>
        {isOwn && (
          <Link
            to="/profile/me/edit"
            className="text-sm text-carvao/60 hover:text-terra underline"
          >
            Editar perfil
          </Link>
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
    </main>
  );
}
