import { Outlet, Link } from 'react-router-dom';
import { NotificationBell } from './NotificationBell';

export function AppLayout() {
  return (
    <>
      <header className="sticky top-0 bg-areia/80 backdrop-blur border-b border-carvao/10 z-30">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-2">
          <nav className="flex gap-4 text-sm">
            <Link to="/" className="text-terra font-medium">
              Feed
            </Link>
            <Link to="/match" className="text-carvao/60 hover:text-terra">
              Pessoas
            </Link>
            <Link to="/desafios" className="text-carvao/60 hover:text-terra">Desafios</Link>
          </nav>
          <NotificationBell />
        </div>
      </header>
      <Outlet />
    </>
  );
}
