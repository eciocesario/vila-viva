import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { identify } from './posthog';
import { queryClient } from './queryClient';
import { clearPersistedCache } from './persistQuery';

interface AuthValue {
  session: Session | null;
  loading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

/**
 * Fonte ÚNICA de sessão para todo o app. Sem provider compartilhado, cada
 * componente que chamava useAuth() resolvia a sessão de forma assíncrona e
 * independente — gerando estados inconsistentes (ex: AppLayout com sessão e
 * Profile sem, fazendo o botão "Sair" sumir até dar reload).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        identify(data.session.user.id, { email: data.session.user.email });
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) identify(s.user.id, { email: s.user.email });
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  }

  async function signOut() {
    await supabase.auth.signOut();
    queryClient.clear();
    await clearPersistedCache();
  }

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  }
  return ctx;
}
