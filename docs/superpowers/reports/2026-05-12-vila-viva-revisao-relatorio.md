# Vila Viva — Relatório de fechamento Onda 1

**Data:** 2026-05-12
**Spec:** `docs/superpowers/specs/2026-05-12-vila-viva-revisao-design.md`
**Plano:** `docs/superpowers/plans/2026-05-12-vila-viva-revisao-plano.md`
**Branch:** `master` (repo `vila-viva` — inicializado nesta rodada)

**Status:** Código entregue + revisado. **Validação manual pendente** (ver seção [Validações pendentes](#validações-pendentes-a-executar-manualmente) abaixo). A rodada só é considerada totalmente fechada quando o usuário executar essas validações; se alguma falhar, abrir Onda 2 imediatamente com os achados.

## Resumo

Aplicada a Onda 1 da revisão de `index.html`: todos os achados de severidade Alta da auditoria foram corrigidos in-place, mantendo o single-file. 8 commits granulares (baseline + 7 fixes temáticos), 134 inserções e 104 deleções em `index.html`. Sem mudanças de UX, sem reescrita estrutural — apenas correções de viewport, contraste, semântica acessível, foco visível, dialog semantics nos overlays, labels associados, navegação por teclado na bottom nav, tooltips com fallback touch e clamp de overflow, e dois bugs visuais específicos de responsividade.

## Itens entregues (severidade Alta)

| Código | Item | Status | Commit |
|---|---|---|---|
| G1 | viewport zoom liberado (`maximum-scale=1` removido) | ✓ | 59d3c79 |
| G2 | `100dvh` em `html`/`body` | ✓ | 59d3c79 |
| G3 | input font-size 16px (5 classes/locais) | ✓ | 59d3c79 |
| G4 | `--ci` escurecido para `#5A6E5C` (~4.7:1) | ✓ | 59d3c79 |
| G5 | `aria-label` em botões-ícone + `aria-hidden` global via JS | ✓ | 44e5ef1 |
| G6 | `:focus-visible` global (com variante branca em headers) | ✓ | 59d3c79 |
| G7 | `<label for>` em login (5 inputs), onboarding (4 campos), edit profile (9 campos) | ✓ | 75cc7bc |
| G8 (MVP) | `.bni` div → `<button type="button">` em todas as 7 bnav (28 itens) | ✓ | 936bb19 |
| G9 | `@media (prefers-reduced-motion:reduce)` | ✓ | 59d3c79 |
| G10 | `title=` fallback espelhando `.tb` + touch support via JS | ✓ | 31a6b14 |
| G11 | `.tb` com `max-width:min(210px,calc(100vw - 32px))` | ✓ | 31a6b14 |
| C3 | `.shst` com `flex-wrap:wrap` + `.shst-txt` com `min-width:140px` | ✓ | 49903be |
| C6 | `.ht` focável via `:focus-within` (cobre containers); touch via JS | ✓ | 31a6b14 |
| S6 | `.trig` com `flex-shrink:0` + "18 online" com `white-space:nowrap` | ✓ | 49903be |
| S23 | `role="dialog" aria-modal="true" aria-labelledby` nos 7 overlays + `<h2>` nos títulos | ✓ | 1205c12 |
| S24 | `aria-label="Fechar"` em todos os botões × dos modais (3 explícitos) | ✓ | 44e5ef1 |

**Todos os 16 itens Alta entregues. Nenhum adiado.**

## Métricas (baseline e00d2a3 → HEAD 49903be)

| Métrica | Antes | Depois |
|---|---|---|
| `aria-label` no markup | 0 | 21 |
| `aria-hidden` no markup | 0 | 21 (+ via JS runtime em ~30 SVGs) |
| `role="dialog"` | 0 | 7 |
| `@media` queries | 0 | 1 (reduced-motion) |
| `<label class=...>` associados | 0 | 17 |
| `<button class="bni">` (era `<div>`) | 0 | 28 |
| Linhas `index.html` | 2344 | 2356 |

## Validações pendentes (a executar manualmente)

Não consegui executar essas verificações daqui — peço que você rode:

- [ ] **Visual em 3 viewports** (375×667 SE, 390×844 iPhone 13/14, 430×932 15 Pro Max). Percorrer cada tela: splash, login, onboarding (4 passos), feed, vagas, perfil, match, desafios, dashboard, notifs, modais. Conferir sem overflow horizontal, sem sobreposição, sem texto cortado.
- [ ] **Lighthouse Acessibilidade** em login + feed (modo Mobile). Alvo da spec: ≥ 90.
- [ ] **Teclado**: Tab pelo feed, ver foco visível em todos os controles da bnav; Enter ativa navegação.
- [ ] **Touch**: tocar em chip com tooltip (ex.: `pretag "✦ Conquista coletiva"`) — tooltip deve aparecer por 3s.
- [ ] **Modal**: abrir FAB → bottom-sheet → tabular até × → `aria-label="Fechar"` anunciado.

Se algum achado novo aparecer nessa validação, registrar como adendo abaixo.

## Achados durante execução (não previstos)

Plano executado conforme spec. Um ponto operacional + dois achados do code review aplicados em-cima desta rodada:

**Operacional:** o JS one-liner que aplica `aria-hidden` em SVGs decorativos roda no carregamento inicial. Cobre os elementos presentes na carga. Elementos injetados dinamicamente (ex.: cards de projeto via `submitCadProjeto`) ficam sem o atributo — não-bloqueante porque esses são casos de demo. Anotado para Onda 3 (refactor de event handlers).

**Code review (commit pós-revisão):** o revisor encontrou duas regressões sutis introduzidas pelos próprios fixes, corrigidas in-line:
- `.tic` (sino de notificações no topbar) perdeu o background tan/cream porque o `style="...background:none..."` inline do botão sobrescreveu a regra de classe. Inline tem maior especificidade que selector. Fix: remover `background:none` do inline; CSS de `.tic` volta a aplicar.
- `:focus-visible{...border-radius:inherit}` global era ruído com efeito colateral: o `outline` não respeita `border-radius` nativamente (só Firefox parcialmente), e o `inherit` no elemento focado herdava `0` do pai, ameaçando arredondamento de botões pill (`.lbtn`, `.obtn`, etc.). Fix: remover `border-radius:inherit` da regra.

**Achado de contraste pós-review (vai para Onda 2):** o novo `--ci:#5A6E5C` dá 4.93:1 sobre `--ar` (passa AA), mas só 4.42:1 sobre `--ar2`. O token é usado em texto de `.shst-txt` (share strip), banner do feed e similares onde o fundo é `--ar2`. Marginal (4.42 vs 4.5 mínimo AA texto normal). Decisão: escurecer mais para `~#566A58` na Onda 2, ou criar token específico `--ci-on-ar2`. Lighthouse pode flagrar.

## Backlog — Ondas 2/3/4 (inalterado vs spec seção 7)

Reproduzido aqui por conveniência:

### Onda 2 (~2–3h)
- C1/C2: `.tic`/`.tav` aumentar alvo de toque para 44×44 via padding
- C4: bnav padronização (4º item inconsistente entre telas — Conexões vs Desafios)
- C5: `aria-hidden` em SVGs já está coberto pelo one-liner — pode ser feito no markup como melhoria
- S4: `agent-selector-grid` responsivo em <375px
- S5: bug embaixador duplicado (`data-agent="embaixador"` em duas posições)
- S11/S18: opacidades de texto em headers escuros
- S17: botão Convidar wrap em desafios
- S22: foco-trap nos modais
- Heading semântico `<h1>`/`<h2>` em telas-chave (S10)

### Onda 3 (média)
- Converter `<span class="stag">`, `<div class="bdgi/sri/bso2/cst">` em `<button>` + keyboard
- Substituir `onclick=` inline por `addEventListener`
- `<a href="#">` Esqueci senha (S2) → `<button>`
- Indicador visual em rows com scroll horizontal
- Foco-trap completo nos modais

### Onda 4 (polimento)
- Typo "doo seu tempo" → "doe seu tempo" (linha 1919)
- Padronização de borda nos chips do banner (S7)
- Ellipsis em stats de desafios
- `aria-hidden` em SVGs decorativos restantes (ex.: splash logo `.slf` — já coberto pelo one-liner mas pode ir no markup)

### Onda 5 (escopo maior)
- Tablet/desktop responsivo (`@media (min-width:768px)`)
- Separação CSS/JS em arquivos com bundler
- WCAG AA completa + teste com NVDA/VoiceOver
- Componentização da bnav
- Performance (Google Fonts preload, defer scripts)

## Próximo passo

Conforme combinado na spec, próximo é `superpowers:requesting-code-review` para revisão final antes de encerrar a Onda 1. Aguardando confirmação do usuário para invocar.
