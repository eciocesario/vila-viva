import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import Login from '@/routes/Login';
import Onboarding from '@/routes/Onboarding';

export default function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center">Carregando…</main>;
  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={session ? <Home /> : <Navigate to="/login" replace />} />
      <Route path="/privacidade" element={<Privacidade />} />
    </Routes>
  );
}

function Home() {
  const { session, signOut } = useAuth();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile')
        .select('onboarding_completed_at, nome, agente')
        .eq('id', session!.user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!session,
  });

  if (isLoading) return <main className="p-6">Carregando…</main>;

  if (!profile?.onboarding_completed_at) return <Onboarding />;

  return (
    <main className="p-6">
      <h1 className="font-display text-3xl text-terra">Olá, {profile.nome}</h1>
      <p className="mt-2">Feed virá na Task 12.</p>
      <button onClick={signOut} className="mt-4 text-sm underline">Sair</button>
    </main>
  );
}

function Privacidade() {
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="font-display text-2xl text-terra mb-4">Política de privacidade</h1>
      <p className="mb-3">
        Este é um ambiente de testes restrito a stakeholders convidados pela Ecovila Piracanga.
      </p>
      <p className="mb-3">
        Os dados visíveis (perfis, posts, conexões) são em sua maioria fictícios. Seu e-mail é
        usado apenas para autenticação via magic link, não é compartilhado, não é usado para
        marketing.
      </p>
      <p>
        Você pode pedir exclusão a qualquer momento por e-mail a <a className="underline" href="mailto:eciocesario@gmail.com">eciocesario@gmail.com</a>.
      </p>
    </main>
  );
}
