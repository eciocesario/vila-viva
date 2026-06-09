# F2b-γ — PWA + Leitura Offline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o Vila Viva Light numa PWA instalável que abre e mostra Feed + Vagas offline.

**Architecture:** Duas camadas isoladas — (1) Service Worker via `vite-plugin-pwa` pré-cacheia só o app shell estático; (2) dados (Feed/Vagas) persistidos pelo TanStack Query em IndexedDB. Nenhum dado do Supabase passa pelo SW.

**Tech Stack:** React 19, Vite 8, TanStack Query 5, `vite-plugin-pwa` (Workbox), `@tanstack/react-query-persist-client` + `@tanstack/query-async-storage-persister`, `idb-keyval`, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-06-09-vila-viva-f2b-gamma-pwa-offline-design.md`

**Convenções do projeto (importante):**
- Comandos rodam a partir de `C:/Users/Samsung/projetos/vila-viva/app`.
- Testes unitários: `npm run test` (vitest). E2E: `npm run test:e2e`.
- Cores da marca: terra `#B85C2A`, areia `#F7F2EA`, carvão `#1E2B20`.
- TS estrito (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- Testes novos de unidade vão em `tests/unit/`.

---

## Task 1: Instalar dependências

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Instalar libs de runtime e dev**

Run:
```bash
npm install @tanstack/react-query-persist-client @tanstack/query-async-storage-persister idb-keyval
npm install -D vite-plugin-pwa
```

- [ ] **Step 2: Verificar que entraram no package.json**

Run: `node -e "const p=require('./package.json');const a={...p.dependencies,...p.devDependencies};console.log(['@tanstack/react-query-persist-client','@tanstack/query-async-storage-persister','idb-keyval','vite-plugin-pwa'].map(k=>k+': '+(a[k]||'MISSING')).join('\n'))"`
Expected: nenhuma linha com `MISSING`.

- [ ] **Step 3: Garantir que a suíte atual continua verde**

Run: `npm run test`
Expected: 35 passing.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "build(pwa): add vite-plugin-pwa + query persistence deps"
```

---

## Task 2: Configurar vite-plugin-pwa (manifest + service worker)

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Adicionar o plugin VitePWA com manifest e precache**

Substituir o conteúdo de `vite.config.ts` por:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // registramos manualmente em main.tsx (Task 12) — evita registro duplicado
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      devOptions: {
        enabled: false, // SW desligado em dev (não interfere em HMR nem nos testes)
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        // NÃO cacheamos respostas do Supabase aqui — dados ficam no TanStack Query.
      },
      manifest: {
        name: 'Vila Viva',
        short_name: 'Vila Viva',
        description: 'Plataforma comunitária da Ecovila Piracanga',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#F7F2EA',
        theme_color: '#B85C2A',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['node_modules', 'dist', 'tests/e2e/**'],
  },
});
```

- [ ] **Step 2: Verificar que o build gera o service worker e o manifest**

Run: `npm run build && ls dist/sw.js dist/manifest.webmanifest`
Expected: ambos os arquivos existem (o build pode warnar sobre ícones ausentes — resolvido na Task 3).

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "feat(pwa): configure vite-plugin-pwa with manifest and shell precache"
```

---

## Task 3: Gerar ícones PWA

**Files:**
- Create: `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/maskable-icon-512x512.png`, `public/apple-touch-icon-180x180.png`

- [ ] **Step 1: Gerar os ícones a partir do SVG da marca**

Run:
```bash
npx @vite-pwa/assets-generator --preset minimal-2023 public/favicon.svg
```
Expected: cria `public/pwa-64x64.png`, `public/pwa-192x192.png`, `public/pwa-512x512.png`, `public/maskable-icon-512x512.png`, `public/apple-touch-icon-180x180.png`.

> Se o `favicon.svg` for pequeno/abstrato demais e os ícones saírem ruins, gerar a partir de uma arte quadrada de ≥512px (ex.: exportar do material de marca em `docs/`) e re-rodar apontando pra ela.

- [ ] **Step 2: Confirmar os arquivos exigidos pelo manifest**

Run: `ls public/pwa-192x192.png public/pwa-512x512.png public/maskable-icon-512x512.png public/apple-touch-icon-180x180.png`
Expected: os 4 arquivos existem.

- [ ] **Step 3: Build limpo (sem warning de ícone ausente)**

Run: `npm run build`
Expected: build conclui sem erros referentes a ícones.

- [ ] **Step 4: Commit**

```bash
git add public/pwa-64x64.png public/pwa-192x192.png public/pwa-512x512.png public/maskable-icon-512x512.png public/apple-touch-icon-180x180.png
git commit -m "feat(pwa): add app icons (192/512/maskable/apple-touch)"
```

---

## Task 4: Hook `useOnlineStatus`

**Files:**
- Create: `src/lib/useOnlineStatus.ts`
- Test: `tests/unit/useOnlineStatus.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/unit/useOnlineStatus.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from '@/lib/useOnlineStatus';

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true });
}

describe('useOnlineStatus', () => {
  afterEach(() => setNavigatorOnline(true));

  it('reflete navigator.onLine inicial', () => {
    setNavigatorOnline(false);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it('vira true no evento online e false no offline', () => {
    setNavigatorOnline(true);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm run test -- useOnlineStatus`
Expected: FAIL — `Cannot find module '@/lib/useOnlineStatus'`.

- [ ] **Step 3: Implementar o hook**

Criar `src/lib/useOnlineStatus.ts`:

```ts
import { useEffect, useState } from 'react';

/**
 * Status de conexão reativo. Combina navigator.onLine (estado inicial) com os
 * eventos online/offline (que são mais confiáveis que o onLine no iOS Safari).
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm run test -- useOnlineStatus`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/useOnlineStatus.ts tests/unit/useOnlineStatus.test.ts
git commit -m "feat(pwa): useOnlineStatus hook (TDD)"
```

---

## Task 5: Componente `OfflineBanner`

**Files:**
- Create: `src/components/OfflineBanner.tsx`
- Test: `tests/unit/OfflineBanner.test.tsx`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/unit/OfflineBanner.test.tsx`:

```tsx
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OfflineBanner } from '@/components/OfflineBanner';

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true });
}

describe('OfflineBanner', () => {
  afterEach(() => setNavigatorOnline(true));

  it('não renderiza nada quando online', () => {
    setNavigatorOnline(true);
    const { container } = render(<OfflineBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra aviso quando offline', () => {
    setNavigatorOnline(false);
    render(<OfflineBanner />);
    expect(screen.getByRole('status')).toHaveTextContent(/offline/i);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm run test -- OfflineBanner`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar o componente**

Criar `src/components/OfflineBanner.tsx`:

```tsx
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
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm run test -- OfflineBanner`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/OfflineBanner.tsx tests/unit/OfflineBanner.test.tsx
git commit -m "feat(pwa): OfflineBanner component (TDD)"
```

---

## Task 6: Plugar `OfflineBanner` no `AppLayout`

**Files:**
- Modify: `src/components/AppLayout.tsx`

- [ ] **Step 1: Importar e renderizar o banner no topo**

Em `src/components/AppLayout.tsx`, adicionar o import no topo (junto aos outros):

```tsx
import { OfflineBanner } from './OfflineBanner';
```

E trocar a abertura do fragmento de retorno. Atual:

```tsx
  return (
    <>
      <header className="sticky top-0 bg-areia/80 backdrop-blur border-b border-carvao/10 z-30">
```

Novo:

```tsx
  return (
    <>
      <OfflineBanner />
      <header className="sticky top-0 bg-areia/80 backdrop-blur border-b border-carvao/10 z-30">
```

- [ ] **Step 2: Verificar typecheck e testes**

Run: `npm run typecheck && npm run test`
Expected: typecheck sem erros; testes passando.

- [ ] **Step 3: Commit**

```bash
git add src/components/AppLayout.tsx
git commit -m "feat(pwa): render OfflineBanner in AppLayout"
```

---

## Task 7: Persistência do TanStack Query (whitelist Feed + Vagas)

**Files:**
- Create: `src/lib/queryClient.ts`
- Create: `src/lib/persistQuery.ts`
- Modify: `src/main.tsx`
- Test: `tests/unit/persistQuery.test.ts`

- [ ] **Step 1: Escrever o teste que falha (lógica de whitelist)**

Criar `tests/unit/persistQuery.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { shouldPersistQuery } from '@/lib/persistQuery';

describe('shouldPersistQuery', () => {
  it('persiste feed, vagas e vaga:id', () => {
    expect(shouldPersistQuery(['feed'])).toBe(true);
    expect(shouldPersistQuery(['vagas'])).toBe(true);
    expect(shouldPersistQuery(['vaga', 'abc-123'])).toBe(true);
  });

  it('NÃO persiste perfis, comentários, reactions, notificações', () => {
    expect(shouldPersistQuery(['profile', 'u1'])).toBe(false);
    expect(shouldPersistQuery(['comments', 'p1'])).toBe(false);
    expect(shouldPersistQuery(['reactions', 'p1'])).toBe(false);
    expect(shouldPersistQuery(['notifications', 'u1'])).toBe(false);
  });

  it('NÃO persiste quando a chave não é string', () => {
    expect(shouldPersistQuery([])).toBe(false);
    expect(shouldPersistQuery([123])).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm run test -- persistQuery`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Extrair o queryClient pra módulo próprio**

Criar `src/lib/queryClient.ts`:

```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000 } },
});
```

- [ ] **Step 4: Implementar persistQuery.ts**

Criar `src/lib/persistQuery.ts`:

```ts
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';
import type { PersistQueryClientOptions } from '@tanstack/react-query-persist-client';

/** queryKeys[0] cujo cache deve sobreviver offline. */
const PERSIST_KEYS: readonly string[] = ['feed', 'vagas', 'vaga'];

/** Bump manual quando uma mudança quebra o shape do cache persistido. */
const CACHE_BUSTER = 'f2b-gamma-1';

const STORAGE_KEY = 'vila-viva-rq-cache';

export function shouldPersistQuery(queryKey: readonly unknown[]): boolean {
  const head = queryKey[0];
  return typeof head === 'string' && PERSIST_KEYS.includes(head);
}

const persister = createAsyncStoragePersister({
  key: STORAGE_KEY,
  storage: {
    getItem: (key: string) => get(key),
    setItem: (key: string, value: string) => set(key, value),
    removeItem: (key: string) => del(key),
  },
});

export const persistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister,
  maxAge: 24 * 60 * 60 * 1000, // 24h
  buster: CACHE_BUSTER,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => shouldPersistQuery(query.queryKey),
  },
};

/** Remove o cache persistido (chamar no logout). */
export async function clearPersistedCache(): Promise<void> {
  await del(STORAGE_KEY);
}
```

- [ ] **Step 5: Trocar o provider em main.tsx**

Substituir o conteúdo de `src/main.tsx` por:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/index.css';
import { initSentry } from '@/lib/sentry';
import { initPostHog } from '@/lib/posthog';
import { queryClient } from '@/lib/queryClient';
import { persistOptions } from '@/lib/persistQuery';

initSentry();
initPostHog();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PersistQueryClientProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 6: Rodar testes e typecheck**

Run: `npm run test -- persistQuery && npm run typecheck`
Expected: teste de persistQuery PASS; typecheck sem erros.

- [ ] **Step 7: Commit**

```bash
git add src/lib/queryClient.ts src/lib/persistQuery.ts src/main.tsx tests/unit/persistQuery.test.ts
git commit -m "feat(pwa): persist feed/vagas query cache to IndexedDB (TDD)"
```

---

## Task 8: Limpar cache persistido no logout

**Files:**
- Modify: `src/lib/useAuth.ts`
- Test: `tests/unit/clearPersistedCache.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/unit/clearPersistedCache.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const delMock = vi.fn(() => Promise.resolve());
vi.mock('idb-keyval', () => ({
  get: vi.fn(() => Promise.resolve(null)),
  set: vi.fn(() => Promise.resolve()),
  del: delMock,
}));

describe('clearPersistedCache', () => {
  beforeEach(() => delMock.mockClear());

  it('remove a chave do cache persistido', async () => {
    const { clearPersistedCache } = await import('@/lib/persistQuery');
    await clearPersistedCache();
    expect(delMock).toHaveBeenCalledWith('vila-viva-rq-cache');
  });
});
```

- [ ] **Step 2: Rodar e confirmar que passa**

Run: `npm run test -- clearPersistedCache`
Expected: PASS (a função já existe da Task 7; este teste trava o contrato da chave).

- [ ] **Step 3: Chamar limpeza no signOut**

Em `src/lib/useAuth.ts`, adicionar os imports no topo:

```ts
import { queryClient } from './queryClient';
import { clearPersistedCache } from './persistQuery';
```

E substituir a função `signOut` atual:

```ts
  async function signOut() {
    await supabase.auth.signOut();
  }
```

por:

```ts
  async function signOut() {
    await supabase.auth.signOut();
    queryClient.clear();
    await clearPersistedCache();
  }
```

- [ ] **Step 4: Rodar testes e typecheck**

Run: `npm run typecheck && npm run test`
Expected: typecheck limpo; todos os testes passando.

- [ ] **Step 5: Commit**

```bash
git add src/lib/useAuth.ts tests/unit/clearPersistedCache.test.ts
git commit -m "feat(pwa): clear persisted cache on logout (anti data-leak)"
```

---

## Task 9: Hook `useInstallPrompt` + detecção iOS

**Files:**
- Create: `src/lib/useInstallPrompt.ts`
- Test: `tests/unit/useInstallPrompt.test.ts`

- [ ] **Step 1: Escrever o teste que falha (funções puras)**

Criar `tests/unit/useInstallPrompt.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { detectIOS, shouldShowPrompt } from '@/lib/useInstallPrompt';

describe('detectIOS', () => {
  it('true pra user agent de iPhone', () => {
    expect(detectIOS('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe(true);
  });
  it('false pra Android', () => {
    expect(detectIOS('Mozilla/5.0 (Linux; Android 14)')).toBe(false);
  });
});

describe('shouldShowPrompt', () => {
  it('mostra a partir da 2ª visita quando não-standalone e não-dispensado', () => {
    expect(shouldShowPrompt({ visits: 2, dismissed: false, standalone: false })).toBe(true);
  });
  it('esconde na 1ª visita', () => {
    expect(shouldShowPrompt({ visits: 1, dismissed: false, standalone: false })).toBe(false);
  });
  it('esconde se já dispensado', () => {
    expect(shouldShowPrompt({ visits: 9, dismissed: true, standalone: false })).toBe(false);
  });
  it('esconde se já instalado (standalone)', () => {
    expect(shouldShowPrompt({ visits: 9, dismissed: false, standalone: true })).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm run test -- useInstallPrompt`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar o hook + funções puras**

Criar `src/lib/useInstallPrompt.ts`:

```ts
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

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
    const dismissed = localStorage.getItem(DISMISS_KEY) === '1';
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
    localStorage.setItem(DISMISS_KEY, '1');
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
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm run test -- useInstallPrompt`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/useInstallPrompt.ts tests/unit/useInstallPrompt.test.ts
git commit -m "feat(pwa): useInstallPrompt hook with iOS detection (TDD)"
```

---

## Task 10: Componente `InstallPrompt`

**Files:**
- Create: `src/components/InstallPrompt.tsx`
- Test: `tests/unit/InstallPrompt.test.tsx`

- [ ] **Step 1: Escrever o teste que falha**

Criar `tests/unit/InstallPrompt.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InstallPrompt } from '@/components/InstallPrompt';
import * as hook from '@/lib/useInstallPrompt';

afterEach(() => vi.restoreAllMocks());

describe('InstallPrompt', () => {
  it('não renderiza quando visible=false', () => {
    vi.spyOn(hook, 'useInstallPrompt').mockReturnValue({
      visible: false, isIOS: false, install: vi.fn(), dismiss: vi.fn(),
    });
    const { container } = render(<InstallPrompt />);
    expect(container).toBeEmptyDOMElement();
  });

  it('mostra botão Instalar no Android/Chrome', () => {
    vi.spyOn(hook, 'useInstallPrompt').mockReturnValue({
      visible: true, isIOS: false, install: vi.fn(), dismiss: vi.fn(),
    });
    render(<InstallPrompt />);
    expect(screen.getByRole('button', { name: /instalar/i })).toBeInTheDocument();
  });

  it('mostra instrução de Compartilhar no iOS', () => {
    vi.spyOn(hook, 'useInstallPrompt').mockReturnValue({
      visible: true, isIOS: true, install: vi.fn(), dismiss: vi.fn(),
    });
    render(<InstallPrompt />);
    expect(screen.getByText(/adicionar à tela de início/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `npm run test -- InstallPrompt`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar o componente**

Criar `src/components/InstallPrompt.tsx`:

```tsx
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
```

- [ ] **Step 4: Rodar e confirmar que passa**

Run: `npm run test -- InstallPrompt`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/InstallPrompt.tsx tests/unit/InstallPrompt.test.tsx
git commit -m "feat(pwa): InstallPrompt component (Android button + iOS instructions) (TDD)"
```

---

## Task 11: Plugar `InstallPrompt` no `AppLayout`

**Files:**
- Modify: `src/components/AppLayout.tsx`

- [ ] **Step 1: Importar e renderizar o prompt**

Em `src/components/AppLayout.tsx`, adicionar o import:

```tsx
import { InstallPrompt } from './InstallPrompt';
```

E adicionar o componente logo antes do fechamento do fragmento. Atual:

```tsx
      <Outlet />
    </>
  );
```

Novo:

```tsx
      <Outlet />
      <InstallPrompt />
    </>
  );
```

- [ ] **Step 2: Verificar typecheck e testes**

Run: `npm run typecheck && npm run test`
Expected: typecheck limpo; todos os testes passando.

- [ ] **Step 3: Commit**

```bash
git add src/components/AppLayout.tsx
git commit -m "feat(pwa): render InstallPrompt in AppLayout"
```

---

## Task 12: Registrar o service worker + tipos do virtual module

**Files:**
- Create: `src/vite-env.d.ts`
- Modify: `src/main.tsx`

- [ ] **Step 1: Adicionar os tipos do client do plugin**

Criar `src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
```

- [ ] **Step 2: Registrar o SW com auto-update no main.tsx**

Em `src/main.tsx`, adicionar logo após os imports existentes:

```ts
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });
```

- [ ] **Step 3: Build e verificar SW + manifest no dist**

Run: `npm run build && ls dist/sw.js dist/manifest.webmanifest dist/pwa-512x512.png`
Expected: os três arquivos existem.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: sem erros (o tipo de `virtual:pwa-register` vem do d.ts).

- [ ] **Step 5: Commit**

```bash
git add src/vite-env.d.ts src/main.tsx
git commit -m "feat(pwa): register service worker with autoUpdate"
```

---

## Task 13: Teste E2E — shell offline

**Files:**
- Create: `tests/e2e/offline-shell.spec.ts`

> **Nota de escopo (sem cap silencioso):** o E2E cobre o que é testável sem auth — o app shell carrega offline (SW serve o `index.html` do precache em vez do erro do navegador). A leitura offline do **Feed/Vagas autenticados** depende de sessão por magic-link, inviável no CI sem bypass de auth; isso é validado na Task 14 (QA manual no iPhone).

- [ ] **Step 1: Escrever o teste E2E**

Criar `tests/e2e/offline-shell.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('PWA — app shell offline', () => {
  test('manifest é servido', async ({ page }) => {
    const res = await page.goto('/manifest.webmanifest');
    expect(res?.ok()).toBeTruthy();
    const body = await res!.json();
    expect(body.name).toBe('Vila Viva');
  });

  test('app shell carrega offline após primeira visita', async ({ page, context }) => {
    // 1ª visita online: registra o SW e popula o precache.
    await page.goto('/');
    await page.waitForFunction(() => navigator.serviceWorker?.controller != null, null, {
      timeout: 15000,
    });

    // Corta a rede e recarrega — o shell deve vir do precache, não do erro do browser.
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('#root')).toBeAttached();
    await expect(page.getByText('Vila Viva')).toBeVisible({ timeout: 10000 });

    await context.setOffline(false);
  });
});
```

- [ ] **Step 2: Rodar contra o build de produção (SW só existe no build)**

Run: `npm run build && npm run preview &` (servidor em background na porta do preview) e então `npm run test:e2e -- offline-shell`.

> Conferir em `playwright.config.ts` qual `baseURL`/`webServer` está configurado. Se ele aponta pro `vite dev` (sem SW), ajustar o `webServer.command` deste run pra `npm run preview` e a porta correspondente, já que o service worker **só é gerado no build de produção** (`devOptions.enabled: false`).

Expected: ambos os testes PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/offline-shell.spec.ts
git commit -m "test(pwa): e2e offline app-shell loads from precache"
```

---

## Task 14: QA manual no iPhone + deploy

**Files:** nenhum (validação + deploy)

- [ ] **Step 1: Deploy de produção**

Run: `npm run build && vercel --prod --yes`
Expected: deploy conclui; URL `https://app-vila-viva.vercel.app` atualizada.

- [ ] **Step 2: Checklist de QA no iPhone (Safari real)**

Validar manualmente:
- [ ] Abrir o app no Safari → após 2 visitas, aparece o card de instalação com a instrução "Compartilhar → Adicionar à Tela de Início".
- [ ] Instalar via Safari; o ícone aparece na tela inicial e abre em modo standalone (sem barra do Safari).
- [ ] Com o app aberto e conteúdo carregado, ativar **Modo Avião** → Feed mostra os posts da última sessão.
- [ ] Navegar pra **Vagas** offline → lista e um detalhe já visitado renderizam.
- [ ] Banner "Você está offline — mostrando a última versão" aparece no topo.
- [ ] Voltar online → banner some; conteúdo atualiza.
- [ ] **Logout e login com outra conta** (`eciomar@gmail.com`) → confirmar que o Feed/Vagas **não** mostram dados em cache da conta anterior.

- [ ] **Step 3: Atualizar a memória do projeto**

Registrar entrega do F2b-γ em `project_vila_viva_light_progresso.md` (features acumuladas, migrations inalteradas, nova contagem de testes, pendências de QA se houver).

---

## Critérios de conclusão do plano

- [ ] App instalável (Android via prompt, iOS via instrução).
- [ ] Feed + Vagas legíveis offline a partir do cache persistido.
- [ ] Banner offline aparece/some conforme conexão.
- [ ] Sem vazamento de dados entre contas após logout.
- [ ] `npm run test` verde (35 herdados + ~6 novos unit) e `npm run test:e2e` verde.
- [ ] Deploy em produção; custo mantido em US$ 0/mês.
