import { useAuth } from '@/lib/useAuth';
import { useFlags } from '@/lib/useFlag';
import { ADMIN_EMAILS } from '@/lib/admins';
import { Navigate } from 'react-router-dom';

export default function AdminFlags() {
  const { session } = useAuth();
  const { data: flags, isLoading } = useFlags();

  if (!session || !ADMIN_EMAILS.has(session.user.email ?? '')) {
    return <Navigate to="/" replace />;
  }
  if (isLoading) return <main className="p-6">Carregando…</main>;

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="font-display text-2xl text-terra mb-4">Feature flags</h1>
      <p className="text-sm opacity-70 mb-4">
        Estas flags são lidas pelo frontend. Para alternar valores, use o Supabase Studio
        (SQL Editor) — o frontend não tem permissão de UPDATE.
      </p>
      <ul className="space-y-2">
        {flags && Object.entries(flags).map(([key, enabled]) => (
          <li key={key} className="flex items-center justify-between py-2 border-b border-carvao/10">
            <code>{key}</code>
            <span className={enabled ? 'text-mata' : 'opacity-50'}>
              {enabled ? '✓ on' : '✗ off'}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
