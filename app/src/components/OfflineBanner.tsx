import { useOnlineStatus } from '@/lib/useOnlineStatus';

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div
      role="status"
      className="bg-carvao text-areia text-xs text-center py-1 px-4"
    >
      Você está offline — mostrando a última versão
    </div>
  );
}
