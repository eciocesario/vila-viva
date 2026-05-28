import { Outlet, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { NotificationBell } from './NotificationBell';
import { useFlag } from '@/lib/useFlag';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/useAuth';

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'text-terra font-medium' : 'text-carvao/60 hover:text-terra';

export function AppLayout() {
  const vagasFlag = useFlag('vagas');
  const { session } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['profile_nav', session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile')
        .select('nome')
        .eq('id', session!.user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!session,
    staleTime: 60_000,
  });

  const firstName = profile?.nome?.split(' ')[0] ?? '…';

  return (
    <>
      <header className="sticky top-0 bg-areia/80 backdrop-blur border-b border-carvao/10 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-2">
          <nav className="flex gap-4 text-sm">
            <NavLink to="/" end className={navClass}>
              Feed
            </NavLink>
            <NavLink to="/match" className={navClass}>
              Pessoas
            </NavLink>
            {vagasFlag && <NavLink to="/vagas" className={navClass}>Vagas</NavLink>}
            <NavLink to="/desafios" className={navClass}>Desafios</NavLink>
          </nav>
          <div className="flex items-center gap-2">
            {session && (
              <NavLink
                to={`/profile/${session.user.id}`}
                className="text-xs text-carvao/70 hover:text-terra"
                title="Meu perfil"
              >
                {firstName}
              </NavLink>
            )}
            <NotificationBell />
          </div>
        </div>
      </header>
      <Outlet />
    </>
  );
}
