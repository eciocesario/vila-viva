import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Dispensar é por SESSÃO (sessionStorage), não permanente: fechar o banner
// esconde só na sessão atual; ao reabrir o app ele volta, até a pessoa instalar
// (aí roda em standalone e o banner não aparece mais).
const DISMISS_KEY = 'vila-viva-install-dismissed';
const VISITS_KEY = 'vila-viva-visits';

export function detectIOS(ua: string): boolean {
  return /iphone|ipad|ipod/i.test(ua);
}

export function shouldShowPrompt(opts: {
  visits: number;
  dismissed: boolean;
  standalone: boolean;
}): boolean {
  if (opts.standalone || opts.dismissed) return false;
  return opts.visits >= 2;
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function bumpVisits(): number {
  const current = Number(localStorage.getItem(VISITS_KEY) ?? '0') + 1;
  localStorage.setItem(VISITS_KEY, String(current));
  return current;
}

interface InstallPromptState {
  visible: boolean;
  isIOS: boolean;
  install: () => void;
  dismiss: () => void;
}

export function useInstallPrompt(): InstallPromptState {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const isIOS = detectIOS(window.navigator.userAgent);

  useEffect(() => {
    const visits = bumpVisits();
    const dismissed = sessionStorage.getItem(DISMISS_KEY) === '1';
    const standalone = isStandalone();

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // iOS não dispara beforeinstallprompt — decide na hora.
    if (shouldShowPrompt({ visits, dismissed, standalone })) {
      setVisible(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  }

  function install() {
    if (deferred) {
      void deferred.prompt();
    }
    dismiss();
  }

  return { visible, isIOS, install, dismiss };
}
