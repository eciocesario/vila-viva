# Vila Viva — F2b-γ: PWA + Leitura Offline (Design)

**Data:** 2026-06-09
**Status:** Aprovado para planejamento
**Pacote:** F2b-γ (terceira onda do F2b)

## Contexto e motivação

A Ecovila Piracanga tem sinal de internet instável. Hoje o Vila Viva
(`https://app-vila-viva.vercel.app`) é uma SPA pura: sem sinal, não abre. Esta
onda transforma o app em **PWA instalável com leitura offline** do conteúdo já
carregado, pra que a comunidade consiga abrir o app e ler Feed + Vagas mesmo sem
conexão.

## Escopo (acordado)

**Dentro:**
- App **instalável** (ícone na tela inicial, abre em modo standalone).
- **Leitura offline** de **Feed** (posts já vistos) e **Vagas** (lista + detalhes
  já carregados).
- **Banner discreto** quando offline, mostrando que o conteúdo é a última versão.
- **Prompt de instalação customizado**, com tratamento especial pra iOS Safari.

**Fora (YAGNI / ondas futuras):**
- Escrita offline (postar, reagir, comentar com fila de sync) — explicitamente
  descartado.
- Cache offline de perfis e de imagens/avatares.
- Background sync, push notifications.

## Arquitetura

Duas camadas independentes e bem isoladas. A fronteira é deliberada: nenhum dado
do Supabase passa pelo service worker, eliminando risco de RLS/vazamento entre
contas num aparelho compartilhado.

### Camada 1 — App shell (Service Worker)

- `vite-plugin-pwa` (Workbox) gera e registra o SW.
- **Pré-cacheia apenas assets do build** (HTML, JS, CSS, ícones, SVGs).
- `registerType: 'autoUpdate'` — quando há deploy novo, o SW atualiza e o app
  pega a versão nova na próxima carga. (Decisão: simplicidade sobre controle fino;
  toast de "nova versão" fica como possível refino futuro.)
- `devOptions.enabled: false` — SW **desligado em dev** pra não interferir em
  HMR e na suíte de testes.
- **Não** intercepta nenhuma chamada de rede do Supabase (sem runtime caching de
  API no SW).

### Camada 2 — Dados (TanStack Query persistido)

- `@tanstack/react-query-persist-client` + persister **assíncrono em IndexedDB**
  (`idb-keyval`). IndexedDB, não localStorage, pra evitar o limite de ~5MB e o
  bloqueio síncrono.
- **Comportamento network-first automático:** as queries continuam tentando a
  rede primeiro (`staleTime: 60_000` já existente); offline, caem no cache
  persistido — sem código de fallback manual.
- **Whitelist de persistência** via `shouldDehydrateQuery`: persiste **somente**
  as queryKeys `['feed']`, `['vagas']` e `['vaga', <id>]`. Todo o resto
  (perfis, comentários, reactions, notificações, etc.) **não** é persistido.
- `maxAge: 24 * 60 * 60 * 1000` (24h) — cache mais velho que isso é descartado.
- `buster: <versão do app>` — um novo deploy invalida o cache persistido antigo
  automaticamente.
- **Limpeza no logout:** ao deslogar, chamar `removeClient()` do persister +
  `queryClient.clear()`. Crítico pra cenário de iPhone compartilhado entre
  moradores.

## Componentes

| Unidade | Responsabilidade | Depende de |
|---|---|---|
| `vite.config.ts` (plugin PWA) | Manifest + geração/registro do SW | vite-plugin-pwa |
| `src/lib/persistQuery.ts` | Cria persister IndexedDB + config (whitelist, maxAge, buster) | idb-keyval, persist-client |
| `src/main.tsx` | Troca `QueryClientProvider` por `PersistQueryClientProvider` | persistQuery.ts |
| `src/lib/useOnlineStatus.ts` | Hook: status online/offline reativo | eventos `online`/`offline` |
| `src/components/OfflineBanner.tsx` | Faixa discreta no topo quando offline | useOnlineStatus |
| `src/lib/useInstallPrompt.ts` | Captura `beforeinstallprompt`; detecta iOS/standalone; flag dismiss | localStorage |
| `src/components/InstallPrompt.tsx` | Convite de instalação (Android/Chrome) + instrução iOS | useInstallPrompt |
| `src/components/AppLayout.tsx` | Hospeda `OfflineBanner` e `InstallPrompt` | ambos |
| `public/` ícones | 192×192, 512×512, maskable | gerados da marca |

## Fluxo de dados

1. **Online, normal:** query busca no Supabase, popula o cache, persiste no
   IndexedDB (se estiver na whitelist).
2. **Abertura offline:** SW serve o app shell do precache → app monta →
   `PersistQueryClientProvider` reidrata o cache do IndexedDB → Feed e Vagas
   renderizam com a última versão → `useOnlineStatus` detecta offline →
   `OfflineBanner` aparece.
3. **Sinal volta:** evento `online` → banner some → queries refazem fetch
   (refetch on reconnect) → cache e UI atualizam.
4. **Logout:** persister e queryClient são limpos; próximo usuário não vê dados
   do anterior.

## UX

### Banner offline
Faixa fina e discreta no topo do `AppLayout`: *"Você está offline — mostrando a
última versão"*. Aparece/some automaticamente com o status de conexão. Não
bloqueia interação.

### Prompt de instalação
- **Android/Chrome:** captura `beforeinstallprompt`, suprime o nativo e mostra
  convite próprio ("Instale o Vila Viva na sua tela inicial"). Ao aceitar,
  dispara `prompt()` do evento guardado.
- **iOS Safari:** não há `beforeinstallprompt`. Detecta iOS + não-standalone e
  mostra instrução manual: *"toque em Compartilhar ⬆️ → Adicionar à Tela de
  Início"*.
- **Timing:** só a partir da 2ª visita (não incomodar de cara). Dispensável, com
  flag persistida em localStorage pra não reaparecer.

## Tratamento de erros / edge cases

- **IndexedDB indisponível** (modo privado/quotas): persister falha graciosamente;
  app funciona como SPA online normal (degradação, não crash).
- **`navigator.onLine` mentindo no iOS:** confiar nos eventos `online`/`offline`
  combinados; o banner é dica de UX, não gate funcional — sem dado offline a tela
  só fica vazia (estado já existente hoje).
- **Cache velho após mudança de schema:** o `buster` por versão garante limpeza
  no deploy.
- **Conta compartilhada:** limpeza no logout impede vazamento.

## Estratégia de testes

- **Unit (Vitest, TDD — padrão do projeto):**
  - `useOnlineStatus`: simula eventos `online`/`offline`, valida estado.
  - whitelist de persistência: `shouldDehydrateQuery` aceita feed/vagas e rejeita
    o resto.
  - `useInstallPrompt`: detecção iOS, modo standalone, flag dismiss.
- **E2E (Playwright):** com `context.setOffline(true)`, validar que Feed e Vagas
  renderizam a partir do cache e o banner aparece; ao voltar online, banner some.
- **Manual (iPhone real):** instalar via Safari, abrir em modo avião, confirmar
  leitura de Feed/Vagas e comportamento do prompt.

## Decomposição (~14 tasks)

1. Instalar deps (`vite-plugin-pwa`, `@tanstack/react-query-persist-client`,
   `idb-keyval`).
2. Configurar `vite-plugin-pwa` no `vite.config.ts` (manifest + workbox precache +
   devOptions desligado).
3. Gerar ícones PWA (192/512 + maskable) a partir da marca.
4. `useOnlineStatus` (TDD).
5. `OfflineBanner` (TDD).
6. Plugar `OfflineBanner` no `AppLayout`.
7. `persistQuery.ts` + `PersistQueryClientProvider` no `main.tsx`, com whitelist
   (TDD na lógica de whitelist).
8. `buster`/`maxAge` + limpeza no logout.
9. `useInstallPrompt` + detecção iOS (TDD).
10. `InstallPrompt` UI (Android/Chrome + instrução iOS) (TDD).
11. Plugar `InstallPrompt` + dismiss persistente.
12. SW update handling (`autoUpdate`) + verificação anti-vazamento.
13. Teste E2E offline (Playwright `setOffline`).
14. QA no iPhone + deploy (`vercel --prod`).

## Critérios de sucesso

- App abre offline e mostra Feed + Vagas da última sessão online.
- App é instalável na tela inicial (Android e iOS).
- Banner offline aparece/some corretamente.
- Sem vazamento de dados entre contas após logout.
- Tests passando (suíte atual 35/35 + novos).
- Custo mantido em US$ 0/mês.
