# Vila Viva — Revisão de responsividade, bugs visuais e a11y básica

**Data:** 2026-05-12
**Autor:** Eciocesar Cesário (eciocesario@gmail.com), com Claude (Opus 4.7)
**Arquivo-alvo:** `index.html` (2344 linhas, single-file HTML/CSS/JS inline)
**Status:** Spec aprovada · aguardando plano de implementação

---

## 1. Objetivo & escopo

Elevar `index.html` de "protótipo bonito" para "protótipo que aguenta uso real em celular sem constrangimento", mantendo single-file (compartilhado com stakeholders) e sem refatoração estrutural.

### Dentro do escopo
- **Responsividade mobile 375–430px** (iPhone SE 2 → 15 Pro Max / Android padrão). Telas abaixo de 375 devem apenas não quebrar (graceful degradation).
- **Bugs visuais**: overflow horizontal, sobreposição, z-index, texto cortado, alvos de toque pequenos, animações não-respeitadas.
- **A11y mínimo viável**: liberar zoom, `aria-label` em botões-ícone, foco visível, contraste verificado nos pares críticos, `prefers-reduced-motion`.

### Fora do escopo (vai para o backlog)
- Suporte a tablet/desktop responsivo
- Separar CSS/JS em arquivos
- Refator de IDs minificados ou handlers `onclick` inline (apenas adicionar suporte a teclado nos navegáveis principais)
- WCAG AA completa, leitor de tela, navegação por teclado em todos os fluxos
- Otimização de carregamento (Google Fonts, ordem de scripts)
- Mudanças de UX/redesign

---

## 2. Critérios de severidade

**Alta** (entra no PR desta rodada):
- Quebra layout em 375–430px
- Bloqueia ou degrada significativamente uso por pessoa com deficiência
- Alvo de toque < 32px em controle frequente
- Bug funcional visível

**Média** (backlog próxima onda):
- Imperfeições visuais sem impedir uso
- `prefers-reduced-motion`, foco em controles secundários
- Alvo de toque 32–44px

**Baixa** (backlog mais adiante):
- Polimento, semântica, tipos
- Itens já fora do MVP

Regra de corte: limítrofe entre Alta e Média → classifico como Alta.

---

## 3. Metodologia da auditoria

3 passes:
1. **Tokens globais & meta** — viewport, contrastes de tokens em `:root`, overflow, animações
2. **Componentes transversais** — topbar, bnav, fab, cards, botões-ícone, modais, tooltips
3. **Tela por tela** — splash, login, onboarding, feed, vagas, perfil, match, desafios, dashboard, notifs + overlays

Validação visual final em 3 viewports DevTools (375×667 / 390×844 / 430×932) + Lighthouse Acessibilidade em login e feed.

---

## 4. Estrutura do entregável

1. Este design doc (com tabela de auditoria abaixo)
2. Plano de implementação (próxima skill: `writing-plans`) — tasks agrupadas por afinidade técnica, não 1-task-por-linha
3. `index.html` modificado in-place — single-file preservado
4. Backlog visível (seção 7 abaixo) com ondas sugeridas
5. Relatório de fechamento ao final da execução

---

## 5. Critério de "pronto"

1. Todos os Altos da tabela corrigidos no `index.html` (adiamentos justificados explicitamente)
2. Validação visual manual nos 3 viewports — sem overflow horizontal, sem cobertura indevida
3. Lighthouse Acessibilidade ≥ 90 em login e feed
4. Diff revisado: sem refator oportunista, sem comentário-ruído
5. Relatório de fechamento descrevendo o que entrou e o que foi adiado

Sem TDD automatizado.

---

## 6. Tabela de auditoria

### 6.1 Globais / transversais

| # | Componente | Linha | Achado | Sev | Fix proposto |
|---|---|---|---|---|---|
| G1 | `<meta viewport>` | 5 | `maximum-scale=1` bloqueia zoom do usuário — barreira de acessibilidade | **Alta** | Remover `maximum-scale=1`; manter apenas `width=device-width,initial-scale=1` |
| G2 | `html, body` | 19 | `height:100%` em combinação com `overflow:hidden` causa problemas no iOS quando o teclado virtual abre: viewport encolhe mas a "tela" não acompanha, podendo esconder inputs focados. Em zoom (já liberado por G1), conteúdo fora do `.screen` interno fica inacessível. | **Média** | Trocar `height:100%` por `height:100dvh` (dynamic viewport height) nas declarações `html,body` e `.screen`. Sem necessidade de remover `overflow:hidden`. Backlog se o fix de G1+G3 (zoom + input font-size) já resolver o cenário prático em demos. |
| G3 | Inputs em geral | múltiplas | `font-size:14–15px` causa auto-zoom no iOS Safari ao focar input | **Alta** | Subir `font-size` de `.li`, `.oin`, `.edi`, `.cminp`, `.match-search` para mínimo 16px. Pode usar `@media (pointer:coarse)` se quiser preservar densidade em desktop. |
| G4 | Tokens `:root` | 9–17 | `--ci:#7A8C7C` sobre `--ar:#F7F2EA` ≈ 3.3:1 — abaixo de 4.5:1 WCAG AA para texto normal. Usado em `.csb`, `.ssb`, `.ntm`, `.olab`, etc. (centenas de instâncias) | **Alta** | Escurecer `--ci` para algo como `#5A6E5C` (~4.6:1). Verificar com axe-core. Não criar token novo — substituir o valor. |
| G5 | Botões-ícone (FAB, bnav, tic, ×, search) | múltiplas | Zero `aria-label`. SVGs sem `aria-hidden`. Leitor de tela anuncia botão vazio. | **Alta** | Adicionar `aria-label` aos botões-ícone principais (FAB "Contribuir", × "Fechar", bnav items, sino notificações, search). `aria-hidden="true"` nos SVGs decorativos dentro deles. |
| G6 | Foco visível | global | Apenas `:focus` em inputs muda borda. Botões e divs interativos sem `:focus-visible` outline. | **Alta** | Adicionar regra CSS global `:focus-visible{outline:2px solid var(--v);outline-offset:2px;border-radius:inherit}` e variantes para botões em fundos verdes. |
| G7 | Inputs sem `<label for>` | toda parte | `.ll`, `.olab`, `.edl` são `<div>` posicionados visualmente como label mas não associados via `for`/`id`. Leitor de tela não anuncia. | **Alta** | Converter `<div class="ll/olab/edl">Texto</div>` em `<label class="ll/olab/edl" for="id">Texto</label>` e dar `id` ao input correspondente. Mínimo: telas login + onboarding + edit profile. |
| G8 | Navegáveis em `<div onclick>` | global | `.bni`, `.fch`, `.tic`, `.fab` (já é button), `.agent-sel-card`, `.stag`, `.sri`, `.bdgi`, `.bso2`, `.cst`, `.match-tab`. Não focáveis por teclado, sem semântica. | **Alta (para nav)** / Média (resto) | Mínimo viável MVP: `.bni`, `.tic`, `.tav` viram `<button>` (ou ganham `role="button"` + `tabindex="0"` + handler de Enter/Space). `.fch`, `.match-tab` já são button em algumas telas, padronizar. Demais (`stag`, `bdgi`, etc.) → backlog. |
| G9 | `prefers-reduced-motion` | global | Animações em splash (`si`, `lg`, `dp`), screen-transition (`fu`), badge (`bp`), pulse (`pda`), modals (`fdi`, `su`) sem fallback | **Alta** | Bloco `@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}` |
| G10 | Tooltips `.tb` | 40–44 | Aparecem em `:hover` apenas — touch device não dispara. Em `.ht` que é `<div>`, `:focus` também não dispara (div não foca). Tooltip contém conteúdo informativo (não decorativo). | **Alta** | Mover conteúdo do `.tb` para atributo `title=` no elemento (fallback nativo) E manter o `.tb` visual. Itens críticos (badges, filtros) ganham `aria-label` repetindo o conteúdo. |
| G11 | `.tb` posicionamento | 40 | `width:210px` fixo + `position:absolute` — em itens próximos à borda direita estoura viewport horizontal (375px) | **Alta** | Trocar `width:210px` por `max-width:min(210px,calc(100vw - 32px))` e adicionar `transform: translate(-50%, 0)` clamp ou usar `inset-inline` com `clamp`. Alternativa simples: limitar tooltips a `.ht` com classe especial perto de bordas. |

### 6.2 Componentes

| # | Componente | Linha | Achado | Sev | Fix proposto |
|---|---|---|---|---|---|
| C1 | `.tic` (botões-ícone topbar) | 116 | `width/height:36px` — alvo de toque abaixo de 44px recomendado | **Média** | Aumentar para 40×40 (compromisso com layout) e garantir 44×44 efetivo via `padding`. Backlog se mantiver visual. |
| C2 | `.tav` (avatar topbar com ação) | 117 | 32×32, mas atua como botão (`onclick="goTo('perfil')"`) | **Média** | Aumentar área clicável via `padding` (não tamanho visual). Backlog. |
| C3 | `.shst` (share strip) | 194 | `display:flex` sem `flex-wrap`. Em viewport 375 com texto longo + 2 botões pode cortar "Copiar" à direita | **Alta** | Adicionar `flex-wrap:wrap` no `.shst`, garantir `min-width:0` em `.shst-txt`. |
| C4 | `.bnav` redefinido em cada tela | 7+ blocos | Cada `.screen` redefine `.bnav` inline — em algumas telas o 4º item é "Conexões" (feed, perfil), em outras é "Desafios" (vagas, dashboard, desafios) — usuário perde estado mental | **Média** | MVP: padronizar todas as bnav com a mesma sequência (Vila/Vagas/+/Conexões/Eu) e remover "Desafios" da bnav (acessar via card no feed/bottomsheet). Backlog se mexer demais — mas inconsistência confunde. |
| C5 | `.bni` icon nav | 122–125 | SVG sem `aria-hidden`; texto `<span>` é o label visível. Funcional mas SR lê o emoji-svg twice. | **Média** | `aria-hidden="true"` em todos os SVGs decorativos dentro de `.bni`. |
| C6 | Tooltip em `.ht` sendo `<div>` | global | `.ht:focus .tb` está no CSS mas `<div>` não recebe foco por padrão (linha 44) | **Alta** (junto com G10) | Onde `.ht` está em elemento focável (button, a) já funciona. Onde está em `<div>` decorativo, mover o conteúdo para `title=`. |
| C7 | `.cnt` padding-bottom | 132 / inline | Inconsistência: classe `.cnt` tem `padding-bottom:80px` mas várias telas redefinem inline em vez de usar a classe | **Baixa** | Backlog — funciona. |
| C8 | Animações com `transform:scale(0)` ou `translateY(100%)` | múltiplas keyframes | Sem fallback para reduced motion (coberto por G9), mas além disso pulam de 0 → 1 — em devices fracos podem causar flash | **Baixa** | Backlog. |

### 6.3 Telas específicas

| # | Tela | Linha | Achado | Sev | Fix proposto |
|---|---|---|---|---|---|
| S1 | Splash | 397–405 | Dots animation infinita sem `prefers-reduced-motion` (coberto por G9). SVG do logo sem `aria-label`. | **Baixa** | Splash dura 2.6s e some — SVG decorativo. Adicionar `aria-hidden="true"` no SVG. Cobertura por G9. |
| S2 | Login `<a href="#">` "Esqueci minha senha" | 420 | Link `href="#"` faz scroll-to-top — pequeno bug | **Média** | Trocar por `<button type="button">` ou `href="javascript:void(0)"`. Backlog (não é fluxo crítico de demo). |
| S3 | Login botão "Entrar com WhatsApp" | 429 | Texto sem espaço entre SVG e texto, mas funcional. `<svg>` sem aria-hidden. | **Baixa** | Adicionar `aria-hidden="true"` no SVG. |
| S4 | Onboarding step 2 (`#os2`) | 459 | `agent-selector-grid` em `1fr 1fr` — 2 colunas. Em 375 com cards de texto longo ("Trabalhador da Região") pode encavalar. Verificar visualmente. | **Média** | Garantir `min-width:0` nos cards e `word-wrap:break-word` no `.asc-name`. Se grave, virar `grid-template-columns:repeat(auto-fit,minmax(140px,1fr))`. |
| S5 | Onboarding "Org. Parceira" duplicado | 531 | `<div ... data-agent="embaixador">` aparece duas vezes (linha 495 como "Embaixador/a" e linha 531 como "Org. Parceira") — mesmo key, descrições diferentes — bug funcional: clicar em um vs outro dá o mesmo estado | **Média** | Renomear o segundo para `data-agent="org_parceira"` e adicionar entrada no dicionário `agents{}`. Backlog se conflitante com UX existente. |
| S6 | Feed topbar `.trig` | 596–604 | "18 online" + sino + avatar em row sem `flex-shrink:0` no texto → texto pode quebrar verticalmente em 375 e empurrar avatar | **Alta** | `white-space:nowrap` em "18 online" + `flex-shrink:0` em todos os três filhos de `.trig`. |
| S7 | Feed banner `.csts` | 610–616 | 5 chips em `flex-wrap` — em 375 quebra em múltiplas linhas (esperado), mas o último chip ("⭐ 5 desafios ativos") tem `border:1px solid` enquanto outros não → desalinhamento visual | **Baixa** | Padronizar borda dos chips. Backlog. |
| S8 | Stories `.strsc` | 619–627 | Row scroll horizontal — funcional. Sem indicador de "mais conteúdo à direita". | **Baixa** | Sombra gradient na borda direita como dica. Backlog. |
| S9 | Vagas screen | 786–963 | Sub-tabs (vol/rem) em flex com `border-radius:var(--r2) var(--r2) 0 0` — visualmente ok em 375. SVG do search e itens nav ok. | **OK** | — |
| S10 | Vagas título inline | 796 | `font-family:var(--fd);font-size:22px` inline em vez de heading semântico | **Baixa** | Backlog: usar `<h1>` / `<h2>` nas telas. |
| S11 | Perfil hero `.phero` | 968 | Botões "← Vila" e "✏️ Editar" em `position:absolute;top:16px;right:16px` em row — pode ficar com pouco contraste sobre gradient escuro. Texto "Vila" e "Editar" tem `color:#fff` sobre `rgba(255,255,255,.15)` — ratio ~3.5:1 (texto bold pequeno) | **Média** | Aumentar opacity do bg dos botões para `.25` ou trocar para `var(--ca)/.4`. |
| S12 | Perfil "Cadastrar projeto" | 1148 | Botão "+" `border:1.5px dashed var(--bo);color:var(--ci)` sobre `--ar` — `--ci` mesmo problema de G4 | **Alta (junto com G4)** | Coberto pelo fix de G4. |
| S13 | Match search input | 1207 | `font-size:14px` → iOS zoom (coberto por G3). SVG sem `aria-hidden`. Input com `placeholder` mas sem `aria-label`. | **Alta (G3) + Média (a11y)** | Coberto por G3. Adicionar `aria-label="Buscar"` no input. |
| S14 | Match Pessoa cards | 1247+ | `mc` em flex row com `.mav` + `.mi` (flex:1) + `<button>` — em 375 com nomes longos e tags em wrap, o botão pode acabar empurrado pra baixo da linha de nome. Esperado, ok. | **Baixa** | Verificar visualmente. |
| S15 | Cadastrar Vaga modal | 1907 | Linha 1919: "doo seu tempo" — typo (deveria ser "doe") | **Baixa** | Backlog (correção de copy). |
| S16 | Desafios hero stats | 1572–1585 | 3 stats em row com flex:1 — em 375 cada um ~109px, texto pequeno "desafios ativos" pode truncar com ellipsis ausente | **Baixa** | Adicionar `overflow:hidden;text-overflow:ellipsis;white-space:nowrap` se truncar; senão deixar. |
| S17 | Desafios botão WhatsApp "Convidar" | 1639–1642 | Row com 2 botões `flex:2/flex:1` em 375 — botão direito (WP) pode ficar com texto cortado | **Média** | Reduzir font-size do botão menor para 12px ou empilhar em wrap. |
| S18 | Dashboard `.dhdr` | 1464–1468 | Header verde escuro, "voltar" em `rgba(255,255,255,.55)` — ratio ~4.0:1 sobre `--v` (#1A5C38) | **Média** | Subir opacity para `.75`. |
| S19 | Dashboard `.ag-breakdown` | 1474 | 5 segments em flex-wrap com `min-width:60px` — em 375 quebra em 2 linhas (esperado). OK. | **OK** | — |
| S20 | Dashboard `.mbl` width 110px | 329 / 1519+ | `width:110px;flex-shrink:0` — em 375 sobra ~210px para a barra + label numérico. Funciona. | **OK** | — |
| S21 | Notifs `.nit` | 1793+ | `.nbtn` dentro de `.nif` (flex:1) — quando texto é longo, button aparece embaixo. Ok mas pode ficar visualmente "perdido". | **Baixa** | Backlog. |
| S22 | Badge overlay | 1891+ | `bdov` é `position:fixed;z-index:700` cobrindo tudo. Botão `×` no top-right ok. Foco-trap ausente — Tab vaza para conteúdo abaixo. | **Média** | Mínimo MVP: ao abrir overlay, focar no primeiro botão dentro. Foco-trap completo → backlog. |
| S23 | Edit overlay e modals em geral | 1843+ | `edov` `position:fixed;z-index:600` — sem `role="dialog"`, sem `aria-modal`, sem `aria-labelledby` | **Alta** | Adicionar `role="dialog" aria-modal="true" aria-labelledby="<id-do-titulo>"` em todos os overlays (`#ctmo`, `#edov`, `#bdov`, `#cadvaga-ov`, `#cadprojeto-ov`, `#editsec-ov`, `#bso`). |
| S24 | Modal close × buttons | múltiplas | Botão `×` é `<button>` mas sem `aria-label="Fechar"` | **Alta** | Adicionar `aria-label="Fechar"` em todos os botões `×` (contact, edit, badge, cadvaga, cadprojeto, editsec, bottom-sheet). |
| S25 | Tela #vagas tem 2 botões `setVagaTipo` que mudam classe via inline JS | 2173–2185 | OK funcional. `aria-pressed` ausente. | **Baixa** | Backlog. |

---

## 7. Backlog visível — ondas sugeridas

### Onda 2 (próxima iteração, ~2–3h)
- Médios não cobertos: `.tic`/`.tav` alvo de toque (C1, C2), bnav consistência (C4), bnav SVGs aria-hidden (C5), foco-trap nos overlays (S22 parte), opacidades de texto sobre header escuro (S11, S18), botão Convidar wrap (S17), agent-selector-grid responsivo (S4), bug duplicado embaixador (S5).
- Acrescentar `<h1>/<h2>` semântico nas telas-chave (S10).

### Onda 3 (média)
- Converter `<div onclick>` restantes (`stag`, `bdgi`, `sri`, `bso2`, `cst`) em `<button>` ou role+keyboard handlers (G8 parte resto).
- Substituir handlers `onclick=` inline por `addEventListener` (refator para DX, não pega bug).
- `<a href="#">` esqueci senha (S2).
- Indicador de scroll horizontal em rows que rolam (S8).
- Foco-trap completo nos modais.

### Onda 4 (baixa, polimento)
- Typo "doo seu tempo" (S15).
- Padronizar borda dos chips do banner (S7).
- Ellipsis nos cards de stats de desafios se truncarem (S16).
- Splash SVG `aria-hidden` (S1).
- `<svg>` decorativos restantes com `aria-hidden`.

### Onda 5 (escopo maior, pode virar projeto separado)
- Responsividade tablet/desktop (`@media (min-width:768px)`)
- Separação de CSS e JS em arquivos com bundler
- Refatorar IDs minificados para algo legível
- WCAG AA completa + teste com NVDA/VoiceOver
- Otimização de carregamento (Google Fonts preload, defer scripts)
- Componentização da bnav

---

## 8. Próximos passos

1. **Usuário revisa esta spec** e aprova ou pede ajustes.
2. Após aprovação, invocar `writing-plans` para produzir o plano de implementação enxuto.
3. O plano agrupará os Altos da seção 6 em ~5–7 tasks por afinidade técnica (ex.: "task: viewport+zoom+input font-size", "task: aria-labels em botões-ícone", "task: dialog semantics nos overlays", etc.).
4. Execução, então `requesting-code-review` antes do fechamento.
