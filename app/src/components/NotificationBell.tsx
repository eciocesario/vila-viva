import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';
import { useFlag } from '@/lib/useFlag';

export function NotificationBell() {
  const { session } = useAuth();
  const enabled = useFlag('notifications');
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notifs } = useQuery({
    queryKey: ['notifications', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification')
        .select('id, tipo, payload, lida_em, created_at')
        .eq('destinatario_id', session!.user.id)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
    enabled: !!session && enabled,
    staleTime: 0,                  // always considered stale; refetch eagerly
    refetchOnWindowFocus: true,    // refresh quando volta a focar a aba
    refetchInterval: 30_000,       // fallback polling 30s caso Realtime caia
  });

  const markAllRead = useMutation({
    mutationFn: async (unreadIds: string[]) => {
      if (unreadIds.length === 0) return;
      const { error } = await supabase
        .from('notification')
        .update({ lida_em: new Date().toISOString() })
        .in('id', unreadIds);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications', session?.user.id] });
    },
  });

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && notifs) {
      const unreadIds = notifs.filter((n) => !n.lida_em).map((n) => n.id);
      if (unreadIds.length > 0) markAllRead.mutate(unreadIds);
    }
  }

  useEffect(() => {
    if (!session || !enabled) return;
    const ch = supabase
      .channel(`notif:${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification',
          filter: `destinatario_id=eq.${session.user.id}`,
        },
        () => qc.invalidateQueries({ queryKey: ['notifications', session.user.id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [session, enabled, qc]);

  if (!enabled) return null;

  const unread = notifs?.filter((n) => !n.lida_em).length ?? 0;

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 text-carvao/70 hover:text-terra transition-colors"
        aria-label={`Notificações${unread > 0 ? ` (${unread} não lidas)` : ''}`}
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-terra text-areia text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-carvao/20 rounded-card shadow-lg z-50">
          {(!notifs || notifs.length === 0) && (
            <p className="p-3 text-sm opacity-60">Sem notificações.</p>
          )}
          {notifs?.map((n) => (
            <div
              key={n.id}
              className={`p-3 border-b border-carvao/10 text-sm ${!n.lida_em ? 'bg-areia' : ''}`}
            >
              <span className="text-xs opacity-50">
                {new Date(n.created_at).toLocaleString('pt-BR')}
              </span>
              <p>{describeNotif(n.tipo)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function describeNotif(tipo: string): string {
  switch (tipo) {
    case 'post_comentado':
      return 'Alguém comentou em seu post.';
    case 'reaction_recebida':
      return 'Você recebeu uma reação.';
    case 'match_sugerido':
      return 'Nova conexão sugerida no Match.';
    case 'challenge_progresso':
      return 'Você avançou em um desafio.';
    case 'vaga_interesse_recebido':
      return 'Alguém demonstrou interesse na sua vaga.';
    default:
      return 'Notificação.';
  }
}
