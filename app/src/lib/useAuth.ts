import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { identify } from './posthog';
import { queryClient } from './queryClient';
import { clearPersistedCache } from './persistQuery';

export function useAuth() {
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

  return { session, loading, signIn, signOut };
}
