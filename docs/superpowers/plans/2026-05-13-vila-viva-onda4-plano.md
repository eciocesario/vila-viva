# Vila Viva — Onda 4 (Polimento) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar 8 edits de polimento em `index.html` cobrindo backlog de Onda 1/2/3a (typo, vagas double-title, chip border, ellipsis defensivo nas stats de desafios, e 4 cleanups defensivos/redundâncias).

**Architecture:** Single-file `index.html` editado in-place. Sem build, sem testes. Validação visual + Grep + code-review externo. 8 edits independentes; agrupados em **1 commit único** porque volume é baixo e fragmentar cria churn.

**Tech Stack:** HTML5, CSS3. Dev tools: Chrome/Edge DevTools (responsive mode, Accessibility tree).

**Spec de referência:** `docs/superpowers/specs/2026-05-13-vila-viva-onda4-design.md`

**Convenção:** repo git no master. Commit final com `git -C "C:/Users/Samsung/projetos/vila-viva"`.

---

## File Structure

**Modificar:**
- `C:\Users\Samsung\projetos\vila-viva\index.html` — única fonte editada.

**Criar (ao final):**
- `C:\Users\Samsung\projetos\vila-viva\docs\superpowers\reports\2026-05-13-vila-viva-onda4-relatorio.md`

---

## Estado atual (HEAD `6abddbd`)

- Última tag: `onda3a-fechada` (commit `6df8444`)
- Após onda3a: linha 1928 ainda tem `doo seu tempo` typo; linha 797 ainda tem `<div class="tlog">Vagas</div>`; linha 624 ainda tem border/color/font-size inline redundantes no chip; linhas 1584/1588/1592 sem ellipsis; `.tav::before` sem pointer-events; `.stag` sem text-align; `.bdgic` ainda tem cursor:pointer.
- Linha 409: splash SVG já tem `aria-hidden="true"` desde Onda 2 C5 — item 9 da spec é skip.

---

## Ordem das tasks

**Task 1** — Aplicar os 8 edits + commit único.
**Task 2** — Validação Grep + relatório + commit.

Sem afinidade técnica/temática suficiente para fragmentar a Task 1: todos os edits são pequenos e independentes. Granularidade 1 commit = 1 onda de polimento.

---

### Task 1: Polimento (8 edits + commit)

**Files:**
- Modify: `C:\Users\Samsung\projetos\vila-viva\index.html`

**Cobre:** Itens 1-8 da spec.

#### Step 1: Typo S15 (linha 1928)

- [ ] Edit:

  Buscar:
  ```html
  <span style="font-size:11px;opacity:.75;font-weight:400">doo seu tempo</span>
  ```

  Substituir:
  ```html
  <span style="font-size:11px;opacity:.75;font-weight:400">doe seu tempo</span>
  ```

#### Step 2: Vagas double-title (linha 797)

- [ ] Edit removendo a linha inteira.

  Buscar (a linha exata, com indentação de 4 espaços):
  ```html
      <div class="tlog">Vagas</div>
  ```

  Substituir por: (string vazia) — remove a linha. Use Edit com `old_string` igual ao trecho acima incluindo o `\n` no final, e `new_string` vazio. Como o Edit tool não permite `new_string` ser idêntico a `old_string`, a forma correta é:

  - `old_string`: linha 797 + linha 798 juntas, ex.:
    ```
        <div class="tlog">Vagas</div>
        <div style="display:flex;align-items:center;gap:8px">
    ```
  - `new_string`: apenas a linha 798:
    ```
        <div style="display:flex;align-items:center;gap:8px">
    ```

  Isso elimina a linha 797 sem afetar o resto. Verifique se o resultado preserva o `<div class="topbar">` aberto + Sementes à direita.

  ⚠️ **Atenção:** o `<div class="topbar">` agora terá apenas 1 filho à direita (Sementes). Verificar se o flex layout da `.topbar` segue funcionando (não força nenhum align/justify que dependa de 2 filhos).

#### Step 3: Remover border + redundância color/font-size do chip "5 desafios" (linha 624) — itens 3 e 7 combinados

- [ ] Edit:

  Buscar:
  ```html
  <button type="button" class="cst ht" onclick="goTo('desafios')" style="cursor:pointer;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);color:rgba(255,255,255,.85);font-size:12px">⭐ 5 desafios ativos<div class="tb">Desafios do território baseados no Censo 2025 e no Bioma</div></button>
  ```

  Substituir:
  ```html
  <button type="button" class="cst ht" onclick="goTo('desafios')" style="cursor:pointer;background:rgba(255,255,255,.18)">⭐ 5 desafios ativos<div class="tb">Desafios do território baseados no Censo 2025 e no Bioma</div></button>
  ```

  Style final: `cursor:pointer;background:rgba(255,255,255,.18)`. Cor branca e font-size:12px vêm da regra `.cst` (linha 143).

#### Step 4: Ellipsis defensivo nas 3 stats de desafios (linhas 1584, 1588, 1592)

- [ ] Edit individual no label de cada um dos 3 stats. Os 3 stats estão dentro do hero da tela `#desafios` (linhas 1582-1593).

  **4a. Stat "desafios ativos" (linha 1584):**

  Buscar:
  ```html
  <div style="font-size:10px;color:rgba(255,255,255,.6);margin-top:2px">desafios ativos</div>
  ```

  Substituir:
  ```html
  <div style="font-size:10px;color:rgba(255,255,255,.6);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">desafios ativos</div>
  ```

  **4b. Stat "participantes" (linha 1588):**

  Buscar:
  ```html
  <div style="font-size:10px;color:rgba(255,255,255,.6);margin-top:2px">participantes</div>
  ```

  Substituir:
  ```html
  <div style="font-size:10px;color:rgba(255,255,255,.6);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">participantes</div>
  ```

  **4c. Stat "Lua Cheia" (linha 1592):**

  Buscar:
  ```html
  <div style="font-size:10px;color:rgba(255,255,255,.6);margin-top:2px">Lua Cheia</div>
  ```

  Substituir:
  ```html
  <div style="font-size:10px;color:rgba(255,255,255,.6);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Lua Cheia</div>
  ```

#### Step 5: `.tav::before` pointer-events:none (linha 121)

- [ ] Edit:

  Buscar:
  ```css
  .tav::before{content:'';position:absolute;inset:-6px;border-radius:50%}
  ```

  Substituir:
  ```css
  .tav::before{content:'';position:absolute;inset:-6px;border-radius:50%;pointer-events:none}
  ```

#### Step 6: `.stag` text-align:start defensivo (linha 99)

- [ ] Edit:

  Buscar:
  ```css
  .stag{display:inline-flex;align-items:center;padding:8px 14px;border-radius:var(--r3);font-size:13px;font-family:inherit;border:1.5px solid var(--bo);background:var(--ar);color:var(--ca2);cursor:pointer;transition:all .15s;user-select:none}
  ```

  Substituir:
  ```css
  .stag{display:inline-flex;align-items:center;padding:8px 14px;border-radius:var(--r3);font-size:13px;font-family:inherit;text-align:start;border:1.5px solid var(--bo);background:var(--ar);color:var(--ca2);cursor:pointer;transition:all .15s;user-select:none}
  ```

#### Step 7: `.bdgic` cursor:pointer redundante (linha 267)

- [ ] Edit:

  Buscar:
  ```css
  .bdgic{width:52px;height:52px;border-radius:50%;background:var(--ar2);display:flex;align-items:center;justify-content:center;font-size:24px;border:2px solid var(--bo);cursor:pointer;transition:transform .15s;position:relative}
  ```

  Substituir:
  ```css
  .bdgic{width:52px;height:52px;border-radius:50%;background:var(--ar2);display:flex;align-items:center;justify-content:center;font-size:24px;border:2px solid var(--bo);transition:transform .15s;position:relative}
  ```

  (Removeu `cursor:pointer;`.)

#### Step 8: Verificação Grep pós-edits

- [ ] Rodar:
  - `doo seu tempo` → **0** matches
  - `doe seu tempo` → **1** match (linha 1928)
  - `<div class="tlog">Vagas</div>` → **0** matches
  - `border:1px solid rgba(255,255,255,.3)` no contexto do chip → **0** matches (regex no arquivo todo: deve ser 0)
  - `text-overflow:ellipsis;white-space:nowrap` no contexto dos 3 stats → **3** novos matches
  - `pointer-events:none` na regra `.tav::before` → **1** match
  - `text-align:start` na regra `.stag` → **1** match
  - Estilo inline do button `.cst ht` linha 624: contém apenas `cursor:pointer;background:rgba(255,255,255,.18)` (sem color/font-size)
  - Regra `.bdgic` (linha 267): sem `cursor:pointer`

#### Step 9: Commit Task 1

```powershell
git -C "C:/Users/Samsung/projetos/vila-viva" add index.html
git -C "C:/Users/Samsung/projetos/vila-viva" commit -m "fix(polish): typo doe seu tempo; vagas double-title; chip 5 desafios sem border; ellipsis stats; defensivos .tav::before/.stag/.bdgic"
```

---

### Task 2: Validação + relatório de fechamento

**Files:**
- Create: `C:\Users\Samsung\projetos\vila-viva\docs\superpowers\reports\2026-05-13-vila-viva-onda4-relatorio.md`

#### Step 1: Coletar métricas via Grep

- [ ] Listar commits da Onda 4:
  ```
  git -C "C:/Users/Samsung/projetos/vila-viva" log --oneline onda3a-fechada..HEAD
  ```

  Esperado: 2 commits novos (spec da Onda 4 + polish da Task 1) + 1 commit de relatório que vamos criar.

- [ ] Confirmar os 8 edits via Grep (lista do Step 8 da Task 1).

#### Step 2: Escrever relatório

Criar `C:\Users\Samsung\projetos\vila-viva\docs\superpowers\reports\2026-05-13-vila-viva-onda4-relatorio.md` com conteúdo:

```markdown
# Vila Viva — Relatório de fechamento Onda 4

**Data:** 2026-05-13
**Spec:** `docs/superpowers/specs/2026-05-13-vila-viva-onda4-design.md`
**Plano:** `docs/superpowers/plans/2026-05-13-vila-viva-onda4-plano.md`
**Branch:** `master`
**Status:** Código entregue · validação manual pendente · aguarda code-review externo

## Resumo

Onda 4 aplicada em 1 commit de polimento + 1 commit de relatório. 8 edits triviais cobrindo backlog remanescente de Ondas 1/2/3a: 1 typo visível, 1 double-title removido, 1 borda inconsistente removida, 3 stats ganharam ellipsis defensivo, 3 cleanups internos (pointer-events, text-align, cursor redundante). Sem mudança estrutural. Item 9 da spec (splash logo aria-hidden) já estava aplicado desde Onda 2 C5 — skip confirmado.

## Itens entregues

| # | Item | Tipo | Linha original | Status | Commit |
|---|---|---|---|---|---|
| 1 | Typo `doo` → `doe seu tempo` | Texto visível | 1928 | ✓ | HASH1 |
| 2 | Remover `<div class="tlog">Vagas</div>` da topbar | UX visível | 797 | ✓ | HASH1 |
| 3 | Remover border do chip "5 desafios ativos" | UX visível | 624 | ✓ | HASH1 |
| 4 | Ellipsis defensivo nas 3 stats de desafios | Defensivo | 1584/1588/1592 | ✓ | HASH1 |
| 5 | `.tav::before` ganha `pointer-events:none` | Cleanup | 121 | ✓ | HASH1 |
| 6 | `.stag` ganha `text-align:start` defensivo | Cleanup | 99 | ✓ | HASH1 |
| 7 | Remover redundância color/font-size do style inline do chip 624 | Cleanup | 624 | ✓ | HASH1 |
| 8 | Remover `cursor:pointer` redundante de `.bdgic` | Cleanup | 267 | ✓ | HASH1 |
| 9 | ~~Splash logo aria-hidden~~ | — | 409 | skip (já feito na Onda 2 C5) | — |

**8 edits aplicados.** Item 9 confirmado como já existente (markup + JS one-liner linha 2054).

## Métricas (HEAD `onda3a-fechada` → HEAD Onda 4)

| Métrica | Onda 3a | Onda 4 |
|---|---|---|
| `doo seu tempo` (typo) | 1 | 0 |
| `doe seu tempo` | 0 | 1 |
| `<div class="tlog">Vagas</div>` | 1 | 0 |
| `border:1px solid rgba(255,255,255,.3)` no chip "5 desafios" | 1 | 0 |
| `text-overflow:ellipsis;white-space:nowrap` no contexto stats desafios | 0 | 3 |
| Style inline do button `.cst ht` linha 624 (caracteres) | ~155 | ~78 (redução de ~50%) |
| Regra `.bdgic` (caracteres) | ~205 | ~191 |

## Validações executadas

- [x] Grep checks pós-edits
- [x] Spec/plan/implementação coerentes
- [ ] **Pendente — usuário:** validação visual em 3 viewports
- [ ] **Pendente — usuário:** modal "Cadastrar vaga": texto "doe seu tempo" exibido
- [ ] **Pendente — usuário:** tela `#vagas`: topbar sem "Vagas" duplicado
- [ ] **Pendente — usuário:** feed banner: chip "5 desafios" sem borda
- [ ] **Pendente:** code-review externo via `superpowers:requesting-code-review`

## Achados durante execução

[Preencher após execução — provavelmente "Nenhum"]

## Backlog pós-Onda 4

### Onda 3b — DX refactor (~3-4h, projeto separado)
- 217 `onclick=` inline → `addEventListener` com event delegation
- Permite tratamento a11y automático em elementos injetados dinamicamente

### Onda 5 — Escopo maior
- Responsivo tablet/desktop, separação CSS/JS, IDs legíveis, WCAG AA completa, performance, componentização

### Onda 6+ — Features novas
- Próximas rodadas viram evolução de produto, não mais polimento técnico

## Próximo passo

Após validação manual e code-review externo, tag `onda4-fechada` no commit final.
```

Substituir `HASH1` pelo hash real do commit da Task 1.

#### Step 3: Commit relatório

```powershell
git -C "C:/Users/Samsung/projetos/vila-viva" add docs/superpowers/reports/2026-05-13-vila-viva-onda4-relatorio.md
git -C "C:/Users/Samsung/projetos/vila-viva" commit -m "docs: relatorio de fechamento Onda 4"
```

#### Step 4: Próximo passo

Reportar ao controller:

> "Execução da Onda 4 concluída. 2 commits no branch master. Relatório em `docs/superpowers/reports/2026-05-13-vila-viva-onda4-relatorio.md`. Próximo: invocar `superpowers:requesting-code-review` antes da validação manual e da tag `onda4-fechada`."

---

## Coverage matrix (autoauditoria contra spec)

| Spec item | Status |
|---|---|
| 1. Typo S15 | Task 1 Step 1 |
| 2. Vagas double-title | Task 1 Step 2 |
| 3. Border chip "5 desafios" | Task 1 Step 3 (combinado com item 7) |
| 4. Ellipsis stats desafios | Task 1 Step 4 |
| 5. `.tav::before pointer-events` | Task 1 Step 5 |
| 6. `.stag text-align:start` | Task 1 Step 6 |
| 7. Redundância color/font-size chip 624 | Task 1 Step 3 (combinado com item 3) |
| 8. `.bdgic cursor:pointer` redundante | Task 1 Step 7 |
| 9. Splash aria-hidden | **Skip** (já feito Onda 2 C5) |
| Grep validation | Task 1 Step 8 |
| Commit | Task 1 Step 9 |
| Relatório | Task 2 Step 2 |
| Code review externo | pós-Task 2 |
| Tag `onda4-fechada` | pós-validação manual |

Todos os 8 itens efetivos têm step correspondente. Item 9 documentado como skip. Sem placeholders. Sem `TBD`.
