import { useInstallPrompt } from '@/lib/useInstallPrompt';

export function InstallPrompt() {
  const { visible, isIOS, install, dismiss } = useInstallPrompt();
  if (!visible) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 max-w-md mx-auto bg-areia border border-carvao/15 rounded-xl shadow-lg p-4 z-40">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm text-carvao">
          {isIOS ? (
            <p>
              Instale o Vila Viva: toque em <strong>Compartilhar ⬆️</strong> e depois em{' '}
              <strong>Adicionar à Tela de Início</strong>.
            </p>
          ) : (
            <p>Instale o Vila Viva na sua tela inicial pra acessar mais rápido, mesmo offline.</p>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="Dispensar"
          className="text-carvao/40 hover:text-carvao text-lg leading-none"
        >
          ×
        </button>
      </div>
      {!isIOS && (
        <button
          onClick={install}
          className="mt-3 w-full bg-terra text-areia rounded-lg py-2 text-sm font-medium"
        >
          Instalar
        </button>
      )}
    </div>
  );
}
