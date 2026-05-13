# Vila Viva — Onda 4: polimento

**Data:** 2026-05-13
**Autor:** Eciocesar Cesário (eciocesario@gmail.com), com Claude (Opus 4.7)
**Arquivo-alvo:** `index.html` (single-file HTML/CSS/JS inline)
**Specs anteriores:** Ondas 1 (`docs/superpowers/specs/2026-05-12-vila-viva-revisao-design.md`), 2 (`docs/superpowers/specs/2026-05-13-vila-viva-onda2-design.md`), 3a (`docs/superpowers/specs/2026-05-13-vila-viva-onda3-design.md`)
**Status:** Spec validada com o usuário em 2026-05-13 (3 decisões respondidas)

---

## 1. Objetivo & escopo

Polimento final do prototype: itens cosméticos, typo, redundâncias e defensivos remanescentes dos backlogs das Ondas 1-3a. Nenhum afeta funcionalidade; corrige imperfeições visíveis ao olhar atento + limpa código.

### Dentro do escopo (8 itens efetivos + 1 já feito)

| # | Item | Tipo | Linha | Origem |
|---|---|---|---|---|
| 1 | Typo S15: `doo` → `doe` em "doe seu tempo" | Texto visível | 1928 | spec Onda 1 |
| 2 | Vagas double-title: remover `<div class="tlog">Vagas</div>` da topbar | UX visível | 797 | code-review Onda 2 |
| 3 | Border S7: remover `border:1px solid rgba(255,255,255,.3)` inline do chip "5 desafios ativos" | UX visível | 624 | spec Onda 1 |
| 4 | Ellipsis defensivo S16: `overflow:hidden;text-overflow:ellipsis;white-space:nowrap` nos 3 labels das stats de desafios | Defensivo | 1584/1588/1592 | spec Onda 1 |
| 5 | `.tav::before` ganha `pointer-events:none` defensivo | Cleanup interno | 121 | code-review Onda 2 |
| 6 | `.stag` ganha `text-align:start` defensivo | Cleanup interno | 99 | code-review Onda 3a |
| 7 | Remover `color:rgba(255,255,255,.85);font-size:12px` redundantes do style inline do chip "5 desafios" | Cleanup interno | 624 | code-review Onda 3a |
| 8 | Remover `cursor:pointer` redundante de `.bdgic` (herdado de `.bdgi` que virou button) | Cleanup interno | 267 | code-review Onda 3a |
| 9 | ~~Splash logo `aria-hidden`~~ | — | 409 | **já aplicado** na Onda 2 C5 (markup + JS one-liner linha 2054) — skip |

**Total real de alterações:** 8 itens (1 typo + 3 UX visíveis + 4 cleanups internos).

### Fora do escopo (continua no backlog)

- **Onda 3b**: refator dos 217 `onclick=` inline para `addEventListener` (DX/manutenibilidade)
- **Onda 5**: responsivo tablet/desktop, separação CSS/JS, IDs legíveis, WCAG AA completa com NVDA/VoiceOver, performance, componentização

---

## 2. Decisões de design (validadas)

| # | Decisão | Como aplicar |
|---|---|---|
| 1 | Polimento completo: todos os 8 itens efetivos numa única rodada | Edição direta em 8 sites do `index.html` |
| 2 | Vagas: remover apenas a topbar `<div class="tlog">Vagas</div>`; manter `<h1>Vagas na Vila</h1>` no body | Topbar fica só com contador de Sementes à direita; visualmente equivalente ao padrão da `#match` |
| 3 | Chip "5 desafios": remover apenas a border; sem adicionar nos outros 4 | Destaque do CTA mantido pelo `background:rgba(255,255,255,.18)` (mais opaco que `.12` dos outros chips) |
| 4 | Cleanups defensivos (itens 5, 6) aplicados nas regras CSS, não em cada uso inline | Edita `.tav::before` linha 121 e `.stag` linha 99 |

---

## 3. Critério de severidade

Todos os 8 itens são **severidade Baixa** por definição (são polimento). Nenhum bloqueia uso real. Onda 4 existe porque o user disse explicitamente "vamos a onda 4 primeiro" — não há urgência.

---

## 4. Metodologia

1. **8 edits** em `index.html`, organizados em **1 commit único** (`fix(polish): typo, vagas double-title, chip border, ellipsis stats, defensivos`). Volume baixo dispensa fragmentação por tema.
2. **Validação Grep** após edits (ver Seção 6).
3. **Validação visual** pelo usuário no browser nos 3 viewports.
4. **Code-review externo** via `superpowers:requesting-code-review`.
5. **Tag** `onda4-fechada` no commit final do relatório.

Sem TDD automatizado.

---

## 5. Plano de tasks (referência para writing-plans)

### Task 1 — Polimento (`fix(polish):`)

**Files:** Modify `C:\Users\Samsung\projetos\vila-viva\index.html`.

**Sub-passos** (8 edits triviais):

1. **Typo (linha 1928):** trocar `<span style="...">doo seu tempo</span>` por `<span style="...">doe seu tempo</span>`.

2. **Vagas topbar (linha 797):** remover a linha inteira `    <div class="tlog">Vagas</div>` (incluindo indentação).

3. **Border do chip "5 desafios" (linha 624):** no `style` inline do `<button class="cst ht">`, remover `border:1px solid rgba(255,255,255,.3);`. Style final esperado: `cursor:pointer;background:rgba(255,255,255,.18);color:rgba(255,255,255,.85);font-size:12px` — mas ver item 7 que removerá o `color`/`font-size`.

4. **Ellipsis stats (linhas 1584, 1588, 1592):** em cada um dos 3 divs de label (`<div style="font-size:10px;color:rgba(255,255,255,.6);margin-top:2px">desafios ativos|participantes|Lua Cheia</div>`), adicionar `;overflow:hidden;text-overflow:ellipsis;white-space:nowrap` ao style.

5. **`.tav::before` pointer-events (linha 121):** trocar `.tav::before{content:'';position:absolute;inset:-6px;border-radius:50%}` por `.tav::before{content:'';position:absolute;inset:-6px;border-radius:50%;pointer-events:none}`.

   ⚠️ Nota: `.tav::before` foi adicionado na Onda 2 C2 para expandir área clicável de 32×32 para 44×44. `pointer-events:none` é defensivo — atualmente o `::before` sem background não captura cliques visíveis, mas pode interferir com tooltips ou outros elementos com z-index. Adicionar previne edge cases futuros.

6. **`.stag` text-align (linha 99):** adicionar `;text-align:start` ao final da regra `.stag`. Necessário porque `<button>` UA default é `text-align:center` — se um `.stag` ganhar `width` fixo no futuro, o texto centraliza. `text-align:start` é defensivo.

7. **Redundância no chip "5 desafios" style inline (linha 624):** após item 3, remover também `color:rgba(255,255,255,.85)` e `font-size:12px` do style inline. Esses valores já vêm da regra `.cst` (linha 143). Style final: `cursor:pointer;background:rgba(255,255,255,.18)`.

8. **`.bdgic` cursor (linha 267):** remover `cursor:pointer` da regra `.bdgic`. O `.bdgi` (parent, agora `<button>` desde Onda 3a) já tem `cursor:pointer` no reset CSS, e `cursor` herda para filhos.

### Task 2 — Validação + relatório

**Files:** Create `docs/superpowers/reports/2026-05-13-vila-viva-onda4-relatorio.md`.

1. **Grep checks:**
   - `doo seu tempo` → 0
   - `doe seu tempo` → 1
   - `<div class="tlog">Vagas</div>` → 0
   - `border:1px solid rgba(255,255,255,.3)` no contexto do `.cst` → 0
   - `text-overflow:ellipsis` no contexto dos stats desafios → 3 novos matches
   - `.tav::before` regra com `pointer-events:none`
   - `.stag` regra com `text-align:start`
   - Style inline do `.cst` button (linha 624) reduzido (`cursor:pointer;background:rgba(255,255,255,.18)` apenas)
   - `.bdgic` regra sem `cursor:pointer`

2. **Tour visual** (pelo usuário):
   - Cadastrar vaga modal: texto "doe seu tempo" (não "doo").
   - Tela `#vagas`: topbar não tem mais "Vagas" duplicado.
   - Feed banner: chip "5 desafios ativos" sem borda (mas com background destacado).
   - Tela `#desafios`: stats com ellipsis se truncar (provavelmente não trunca em 375 — defensivo).
   - Sem regressão visual em `.tav`, `.stag`, `.bdgic`.

3. **Escrever relatório** com tabela de itens entregues + métricas before/after.

4. **Commit:** `docs: relatorio de fechamento Onda 4`.

5. **Code review externo** via `superpowers:requesting-code-review`.

6. **Tag** `onda4-fechada` após aprovação.

---

## 6. Critério de "pronto"

1. 8 edits aplicados no `index.html`.
2. Visual preservado nos 3 viewports (375/390/430).
3. Grep checks da Task 2 passam.
4. Diff revisado: sem refator oportunista além do escopo.
5. 1 commit de polimento + 1 commit de relatório.
6. Validação manual pelo usuário no browser.
7. Code-review externo aprovado.
8. Tag `onda4-fechada` no commit final.

Sem TDD automatizado.

---

## 7. Backlog após Onda 4

### Onda 3b — DX refactor (~3-4h, projeto separado)
- 217 `onclick=` inline → `addEventListener` central com event delegation
- Permite tratamento a11y automático em elementos injetados dinamicamente
- Não é correção de bug; é dívida técnica/manutenibilidade

### Onda 5 — Escopo maior (pode virar projeto separado)
- Responsivo tablet/desktop (`@media (min-width:768px)`)
- Separação CSS/JS em arquivos com bundler (Vite/esbuild)
- IDs minificados (`.tic`, `.bni`, `.fab`, `.bsh`, etc.) → nomes legíveis
- WCAG AA completa + teste com NVDA/VoiceOver
- Performance: Google Fonts `preconnect`/`preload`, `defer` em scripts
- Componentização da bnav (Web Components ou template engine)

### Onda 6+ — Features novas
- Quando surgir feature de produto (chat, calendário, etc.), nova rodada de brainstorming. Ondas 1-4 fecham o ciclo de "polimento técnico" do prototype.

---

## 8. Próximos passos

1. **Usuário revisa esta spec** e aprova ou pede ajustes.
2. Após aprovação, invocar `superpowers:writing-plans` para o plano detalhado.
3. Execução em modo subagent-driven.
4. Code-review externo, validação manual, tag.
