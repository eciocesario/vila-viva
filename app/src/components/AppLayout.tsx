import { Outlet, NavLink } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'text-terra font-medium' : 'text-carvao/60 hover:text-terra';

export function AppLayout() {
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
            <NavLink to="/desafios" className={navClass}>Desafios</NavLink>
          </nav>
          <NotificationBell />
        </div>
      </header>
      <Outlet />
    </>
  );
}
