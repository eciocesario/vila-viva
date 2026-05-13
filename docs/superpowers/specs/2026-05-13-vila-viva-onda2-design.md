# Vila Viva — Onda 2: itens de severidade Média + achado de contraste

**Data:** 2026-05-13
**Autor:** Eciocesar Cesário (eciocesario@gmail.com), com Claude (Opus 4.7)
**Arquivo-alvo:** `index.html` (single-file HTML/CSS/JS inline; ~2356 linhas após Onda 1)
**Spec da Onda 1:** `docs/superpowers/specs/2026-05-12-vila-viva-revisao-design.md`
**Relatório da Onda 1:** `docs/superpowers/reports/2026-05-12-vila-viva-revisao-relatorio.md`
**Status:** Spec validada com o usuário (5 decisões respondidas) · aguardando plano de implementação

---

## 1. Objetivo & escopo

Aplicar o backlog da Onda 2 herdado da spec da Onda 1 (seção 7) + um achado novo de contraste descoberto no code-review da Onda 1. Mantém o single-file `index.html`, sem refator estrutural, sem mudanças de UX além das explicitamente previstas (bnav, opacidades de botões, padding de alvos de toque).

### Dentro do escopo (10 itens)

- **A11y core:**
  - **S22** — Foco-trap completo nos 7 overlays (Tab cíclico, ESC fecha, foco devolvido ao opener)
  - **S10** — Headings semânticos (`<h1>` raiz + `<h2>` em seções) em todas as 9 telas
  - **C5** — `aria-hidden` no markup para SVGs decorativos críticos (complementa o JS one-liner da Onda 1)
- **Responsividade/UX:**
  - **C1 / C2** — Alvos de toque de `.tic` e `.tav` para ≥ 44×44 via `min-width`/`min-height`, sem alterar tamanho visual
  - **S4** — `.agent-selector-grid` responsivo em <375px com `auto-fit minmax(140px, 1fr)`
  - **S17** — Botão "Convidar" do hero de Desafios não corta em 375 (font-size menor + `min-width:0`)
  - **S11** — Opacidade dos botões "← Vila" / "✏️ Editar" sobre `.phero` (perfil)
  - **S18** — Cor do "voltar" no `.dhdr` (dashboard)
- **Padronização e bugs:**
  - **C4** — Bnav idêntica em todas as 7 ocorrências (Vila / Vagas / + / Conexões / Eu — remove Desafios da nav, mantém acesso via card do feed)
  - **S5** — Bug `data-agent="embaixador"` duplicado na onboarding (linha ~531)
  - **Achado pós-Onda 1** — `--ci:#5A6E5C` dá só 4.42:1 sobre `--ar2` (textos em share strip, banner do feed). Escurecer para `~#566A58` para passar AA em ambos os fundos.

### Fora do escopo (continua no backlog)

Onda 3, 4, 5 conforme seção 6 desta spec. Itens não cobertos por escolha consciente: `.stag`/`.bdgi`/`.sri` como `<div onclick>` (G8 resto); refator de `onclick=` inline para `addEventListener`; `<a href="#">` esqueci senha (S2); indicador de scroll horizontal (S8); typo "doo seu tempo" (S15); tablet/desktop responsivo; separação CSS/JS em arquivos.

---

## 2. Decisões de design (validadas com o usuário em 2026-05-13)

| # | Decisão | Como aplicar |
|---|---|---|
| 1 | Escopo da Onda 2 = backlog completo da spec + achado de contraste | 10 itens nominais cobertos |
| 2 | **C4 bnav:** padronizar para Vila / Vagas / + / Conexões / Eu | Remover "Desafios" das 3 bnav que o usam (vagas, dashboard, desafios). Card de Desafios no feed continua sendo o ponto de entrada |
| 3 | **Contraste:** escurecer `--ci` para `~#566A58` (sem criar token novo) | Substituir o valor do token. Validar contraste ≥ 4.5:1 sobre `--ar:#F7F2EA` e sobre `--ar2` antes do commit. Se não atingir, ajustar mais escuro |
| 4 | **S22 foco-trap:** trap completo | Função genérica JS (`openDialog(id, openerEl)` / `closeDialog(id)`) reaproveitável pelos 7 overlays: foca primeiro focal interno, ciclo Tab/Shift+Tab, ESC fecha, devolve foco ao opener ao fechar |
| 5 | **S10 headings:** todas as 9 telas | `<h1>` raiz por tela + `<h2>` em seções internas (badges, projetos, jornada, conquistas coletivas). Visual preservado via `style="margin:0;font-family:var(--fd);..."` |

---

## 3. Critério de severidade

Mesma régua da Onda 1, adaptada:

- **Inclusos:** todos os itens Média do backlog Onda 2 da spec original + 1 achado novo de contraste (limítrofe Média/Alta — promovido a Alta porque Lighthouse pode flagrar).
- **Adiados:** itens Baixa que ficaram (typo, ellipsis, borda de chips, splash svg aria-hidden) seguem para Onda 4.

---

## 4. Metodologia

Mesma da Onda 1, sem novidade:

1. **Foundation** (CSS-only de baixo risco): contraste `--ci`, `min-width`/`min-height` de `.tic`/`.tav`, opacidades S11/S18, `.agent-selector-grid` responsivo, wrap de S17.
2. **Markup**: bnav C4, headings S10, bug embaixador S5, `aria-hidden` em SVGs (C5).
3. **JS**: foco-trap genérico S22.
4. **Validação**: 3 viewports + Lighthouse + tour manual dos 7 modais (Tab cíclico, ESC, restore de foco).

Ordem de tasks usa **afinidade temática** (Opção B do brainstorming), não ordem técnica — alinhada com o padrão de commits da Onda 1.

---

## 5. Plano de tasks (referência para writing-plans)

### Task 1 — A11y core (`fix(a11y):`)

- **S22 — Foco-trap genérico**
  - Implementar `openDialog(id, openerEl)` que:
    1. Adiciona classe de "aberto" no overlay (preservando comportamento atual: `op`, `sh`, `bsh` aberto).
    2. Salva referência do `openerEl` (último elemento focado antes de abrir).
    3. Define lista de focais internos (`button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])`).
    4. Foca o primeiro focal interno.
    5. Instala listener `keydown` no overlay: se `Tab` e `e.target === último focal && !shift`, foca primeiro; se `Shift+Tab && e.target === primeiro`, foca último; se `ESC`, chama `closeDialog`.
  - Implementar `closeDialog(id)` que: remove classe, devolve foco ao opener salvo, remove o listener.
  - Substituir os pontos atuais que abrem/fecham modais por essas funções, **preservando**:
    - O `onclick="closeBadgeOverlay(event)"` no `bdov` (que tem lógica especial de "clique fora fecha").
    - Os botões `×` continuam chamando o close, mas via `closeDialog`.
  - Verificar que **não quebra** o comportamento atual (overlays seguem abrindo/fechando como antes).

- **S10 — Headings semânticos em todas as 9 telas**
  - Login (`#login`): converter `<div class="lt">Bem-vindo à Vila</div>` em `<h1 class="lt" style="margin:0;font-family:inherit;font-size:inherit;font-weight:inherit">`. Verificar se já existe heading; se sim, manter.
  - Onboarding (`#onb` 4 steps): `<h1>` no step 1 ("Vamos nos conhecer"), `<h2>` em cada `#os2/#os3/#os4`.
  - Feed (`#feed`): `<h1>` semântico oculto visualmente (`.visually-hidden`) ou usar o título do banner ("Vila Viva — sua rede em Piracanga") se já existir como texto.
  - Vagas (`#vagas`): converter o "Vagas" inline (linha ~796) em `<h1>`.
  - Perfil (`#perfil`): `<h1>` no nome do usuário no `.phero`; `<h2>` em seções "Sobre", "Habilidades", "Badges", "Projetos", "Jornada".
  - Match (`#match`): `<h1>` "Jardim de Conexões".
  - Desafios (`#desafios`): `<h1>` "Desafios da Vila"; `<h2>` em "5 desafios ativos" e similares.
  - Dashboard (`#dash`): `<h1>` "Painel da Vila"; `<h2>` em "Composição", "Engajamento", "Atividade".
  - Notifs (`#notifs`): `<h1>` "Notificações".
  - Padrão de preservação visual: `style="margin:0;font-family:var(--fd);font-size:<original>;font-weight:<original>;color:<original>"` se as variáveis CSS daquele div não bastarem.
  - **Verificar outline:** exatamente 1 `<h1>` por tela, `<h2>` apenas após `<h1>` da mesma tela.

### Task 2 — Responsividade/UX (`fix(ui):`)

- **C1 — `.tic` toque 44×44**
  - Regra CSS atual (linha ~116) tem `width:36px;height:36px`.
  - Adicionar `min-width:44px;min-height:44px`. SVG continua 20×20, label visual permanece 36px porque o conteúdo é menor que o container — mas a área clicável vira 44.
  - Verificar que o ícone permanece centralizado (`display:flex;align-items:center;justify-content:center` já cobre).

- **C2 — `.tav` toque 44×44**
  - Mesma técnica. Avatar 32×32 visualmente, área clicável 44 via `min-width:44px;min-height:44px` na regra `.tav`.

- **S4 — `.agent-selector-grid` <375px**
  - Atual: `grid-template-columns:1fr 1fr`. Em 375 com textos longos pode encavalar.
  - Trocar para `grid-template-columns:repeat(auto-fit,minmax(140px,1fr))`.
  - Adicionar `min-width:0` no `.agent-sel-card` e `word-wrap:break-word; overflow-wrap:break-word` no `.asc-name`.

- **S17 — Botão Convidar (WhatsApp) em desafios**
  - Localizar o row com 2 botões `flex:2/flex:1` (~linha 1639).
  - Reduzir font-size do botão menor para 12px.
  - Adicionar `min-width:0` em ambos para permitir que texto encolha.
  - Se ainda cortar em 375, considerar `flex-wrap:wrap` no row (botão WP vai para linha de baixo).

- **S11 — Opacidade botões `.phero` (perfil)**
  - Botões "← Vila" e "✏️ Editar" no topo do hero do perfil têm `background:rgba(255,255,255,.15)` + texto branco. Ratio ~3.5:1 sobre gradient escuro.
  - Trocar para `background:rgba(255,255,255,.25)` ou `background:var(--ca);opacity:.6` (testar visualmente). Texto branco bold já é grande o bastante para AA grande (3:1) mas vamos para 4.5 por margem.

- **S18 — Cor "voltar" no `.dhdr` (dashboard)**
  - Texto/SVG do "voltar" tem `color:rgba(255,255,255,.55)` sobre `--v:#1A5C38`. Ratio ~4.0:1.
  - Trocar para `rgba(255,255,255,.85)` (ratio ~7:1 sobre `--v`). Comparar visualmente — não deve "berrar" no header.

### Task 3 — Padronização e bugs (`fix(consistency):`)

- **C4 — Bnav padronizada**
  - Localizar as 3 bnav que têm "Desafios" como 4º item: `#vagas`, `#dash`, `#desafios`.
  - Trocar o item "Desafios" por "Conexões" → `onclick="goTo('match')"`, label "Conexões", e o SVG do item Conexões (mesmo da bnav feed/perfil).
  - Garantir que o card de Desafios no feed (banner `.csts` ou similar) continua funcionando e leva a `goTo('desafios')`.
  - **Verificação:** após mudança, todas as 7 bnav têm exatamente os mesmos 5 itens (Vila/Vagas/+/Conexões/Eu) com mesmos labels e SVGs.

- **S5 — Bug embaixador duplicado**
  - Linha ~531 do markup tem `<div ... data-agent="embaixador">` com label "Org. Parceira" — colide com o `embaixador` legítimo da linha 495.
  - Renomear o segundo para `data-agent="org_parceira"`.
  - Adicionar entrada `'org_parceira': { ... }` no objeto JS `agents{}` (linha do dicionário) com nome "Organização Parceira", descrição apropriada extraída do contexto, e badge/cor consistentes com os outros agentes externos.
  - Verificar que clicar em "Org. Parceira" no onboarding agora seleciona um agente distinto de "Embaixador/a".

- **Contraste `--ci → #566A58`**
  - Localizar `--ci:#5A6E5C` no `:root` (linha ~12).
  - Substituir por `--ci:#566A58` (ou tom mais escuro se calculadora WCAG mostrar <4.5 em qualquer dos dois fundos).
  - **Antes do commit:** calcular contraste com utilitário (ex.: contrast-ratio.com) em `--ar:#F7F2EA` e `--ar2` (verificar valor real no CSS). Documentar os dois valores no relatório de fechamento.
  - Verificar visualmente que outros usos de `--ci` (borders, ícones) não ficaram excessivamente escuros.

- **C5 — `aria-hidden` no markup para SVGs decorativos críticos**
  - O JS one-liner da Onda 1 cobre os SVGs presentes na carga. Adicionar `aria-hidden="true"` direto no markup nos casos:
    - SVGs dentro de `.bni` (28 ocorrências) — botões da bnav já têm label textual no `<span>`.
    - SVGs dentro de `.fab` (7 ocorrências, 1 por bnav) — botão FAB já tem `aria-label`.
    - SVGs dentro de `.tic` (`#feed` sino) — botão já tem `aria-label`.
    - SVG do logo splash `.slf`.
    - SVGs decorativos em hero/banner que não levam informação.
  - **Estratégia eficiente:** usar `replace_all` com padrões únicos. Ex.: `<svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--ca2)"` → `<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" stroke="var(--ca2)"` quando o padrão for único no contexto.
  - Não duplicar `aria-hidden` em SVGs que já o têm de mudanças anteriores.

### Task 4 — Validação + relatório

- **Visual 3 viewports (375 / 390 / 430):** percorrer cada tela; conferir bnav idêntica em todas as 7 ocorrências; conferir alvos de toque em `.tic`/`.tav` (área clicável ≥ 44 via Inspector); conferir que botões em headers escuros têm contraste melhorado; conferir agent-grid em 360px (graceful) e 375px.
- **Tour dos modais (a11y manual):** abrir cada um dos 7 overlays (bottom-sheet contribuir, contact modal, edit profile, badge overlay, cadvaga, cadprojeto, editsec); em cada um:
  - [ ] Ao abrir: foco vai para o primeiro elemento focal interno (não fica no body).
  - [ ] Tab: cicla dentro do modal, não vaza para o fundo.
  - [ ] Shift+Tab: cicla ao contrário, idem.
  - [ ] ESC: fecha o modal.
  - [ ] Após fechar: foco volta ao elemento que abriu o modal.
- **Lighthouse Acessibilidade** em login e feed (mobile, navigation mode). Anotar antes/depois.
- **Heading outline:** abrir DevTools → Accessibility → "Show Headings tree" (ou usar extensão headingsMap). Verificar exatamente 1 `<h1>` por tela e `<h2>` apenas em seções.
- **Contraste:** rodar Lighthouse novamente; se algum item flagrar contraste, abrir o elemento, verificar valor real, ajustar.
- Escrever relatório em `docs/superpowers/reports/2026-05-13-vila-viva-onda2-relatorio.md` com tabela de itens (✓/⏸), métricas (`<h1>` count, `aria-hidden` markup count, Lighthouse antes/depois, contraste antes/depois), achados durante execução, próximos passos.

---

## 6. Backlog após Onda 2

### Onda 3 (~2-3h, refator a11y + DX)
- **G8 resto:** `.stag`, `.bdgi`, `.sri`, `.bso2`, `.cst` em `<button>` ou `role="button"` + keyboard handler
- **DX:** substituir `onclick=` inline por `addEventListener` (também permite reaplicar `aria-hidden` em SVGs injetados dinamicamente, ex.: cards de projeto via `submitCadProjeto`)
- **S2:** `<a href="#">` Esqueci senha → `<button type="button">`
- **S8:** indicador visual de scroll horizontal (sombra/gradient) em rows que rolam (stories)

### Onda 4 (polimento)
- **S15:** typo "doo seu tempo" → "doe seu tempo" (linha 1919)
- **S7:** padronizar borda dos chips do banner do feed
- **S16:** ellipsis em stats de desafios se truncarem
- **S1:** `aria-hidden` no SVG da splash (markup; já coberto via JS)
- `aria-hidden` em SVGs decorativos restantes (markup-level) que não entrarem em C5 desta onda

### Onda 5 (escopo maior — pode virar projeto separado)
- Responsividade tablet/desktop (`@media (min-width:768px)`)
- Separação CSS/JS em arquivos com bundler (Vite, esbuild)
- Refatorar IDs minificados (`.tic`, `.bni`, `.fab`, `.bnav`...) para nomes legíveis
- WCAG AA completa + teste com NVDA/VoiceOver
- Performance: Google Fonts `preconnect`/`preload`, `defer` em scripts
- Componentização da bnav (Web Components ou template engine simples)

---

## 7. Critério de "pronto"

1. Todos os 10 itens da Onda 2 corrigidos no `index.html`.
2. Validação visual nos 3 viewports — sem regressão da Onda 1.
3. Tour manual dos 7 modais com Tab cíclico, Shift+Tab, ESC, restore de foco — 100% OK.
4. Lighthouse Acessibilidade ≥ 90 em login e feed (alvo: melhorar vs Onda 1).
5. Contraste verificado: `--ci:#566A58` ≥ 4.5:1 em `--ar` e `--ar2`.
6. Heading outline coerente: 1 `<h1>` por tela; `<h2>` apenas em subseções.
7. Diff revisado: sem refator oportunista, sem comentário-ruído, sem UX nova além do previsto.
8. ≥ 4 commits granulares (a11y, ui, consistency, docs).
9. Relatório de fechamento escrito.
10. `superpowers:requesting-code-review` invocado antes de declarar a Onda 2 fechada.

Sem TDD automatizado.

---

## 8. Próximos passos

1. **Usuário revisa esta spec** e aprova ou pede ajustes.
2. Após aprovação, invocar `superpowers:writing-plans` para produzir o plano de implementação com checkpoints de step-by-step (mesmo formato da Onda 1).
3. Execução do plano, então `superpowers:requesting-code-review`, então fechar a Onda 2 com relatório.
