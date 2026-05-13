# Vila Viva — Onda 3a (G8 resto, S2, S8) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Concluir o backlog a11y/UX da Onda 2 sem entrar no refator DX de `addEventListener`: converter 40 elementos `<div onclick>`/`<span onclick>` em `<button type="button">` (G8 resto), 1 `<a href="#">` em button (S2), e adicionar gradient fade nos 7 rows com scroll horizontal (S8).

**Architecture:** Single-file `index.html` editado in-place. Sem build, sem testes — validação visual + tour keyboard + Lighthouse. Estratégia para G8: reset CSS por classe + conversão de markup um tipo por vez. Estratégia para S8: `mask-image:linear-gradient(...)` aplicado às 3 regras CSS de classe e às 4 ocorrências de style inline.

**Tech Stack:** HTML5, CSS3 (custom props, `mask-image`), JavaScript vanilla. Dev tools: Chrome/Edge DevTools (responsive mode, Accessibility tree, Lighthouse).

**Spec de referência:** `docs/superpowers/specs/2026-05-13-vila-viva-onda3-design.md`

**Convenção de "save points":** repo `vila-viva` é git. Cada task termina com commit no padrão `fix(a11y):` / `fix(ui):` / `docs:` da Onda 2.

---

## File Structure

**Modificar:**
- `C:\Users\Samsung\projetos\vila-viva\index.html` — única fonte editada.

**Criar (ao final):**
- `C:\Users\Samsung\projetos\vila-viva\docs\superpowers\reports\2026-05-13-vila-viva-onda3a-relatorio.md`

---

## Nota sobre contagens vs spec

A spec da Onda 3a estimou ~64 alterações totais (55 G8 + 2 S2 + 7 S8). Após inspeção real do markup atual, as contagens corretas são:

| Item da spec | Contagem real | Observação |
|---|---|---|
| `.stag` + onclick | 27 | confirmado |
| `.bdgi` + onclick | **4** (não 8) | 4 cards locked (`🔒`) **não têm onclick** — são placeholders visuais, não interativos. Permanecem `<div>`. |
| `.sri` + onclick | **0** (não ~10) | Os 6 `.sri` no feed são listagem visual sem onclick. Não convertem em button. Saem do escopo G8. |
| `.bso2` + onclick | 8 | confirmado |
| `.cst` + onclick | **1** (não ~5) | Apenas o chip "5 desafios ativos" (linha 624) tem onclick. Os outros 4 chips (`.cst` linhas 620-623) são decorativos. |
| `<a href="#">` (S2) | 2 totais; **1 conversível** | Linha 429 "Esqueci minha senha" vira button. Linha 1847 (`ct-link` WhatsApp) é link real com `target="_blank"` populado via JS — **não converter**. |
| Rows scroll-x (S8) | 7 | confirmado |

**Total real de alterações:** 27 + 4 + 8 + 1 + 1 + 7 = **48 alterações** (40 G8 + 1 S2 + 7 S8).

Não cabe ajustar a spec retroativamente — o número 64 era estimativa. O plano abaixo segue a realidade do markup.

---

## Ordem das tasks

Afinidade temática, 3 tasks. Cada task começa por CSS (reset de regras) quando aplicável, depois markup, depois Grep de verificação, depois commit.

---

### Task 1: A11y G8 conversões (`fix(a11y):`)

**Files:**
- Modify: `C:\Users\Samsung\projetos\vila-viva\index.html`

**Cobre:** G8 resto (Onda 1 backlog) — 4 dos 5 tipos previstos (`.sri` saiu do escopo por não ter onclick no markup atual).

#### Step 1: Reset CSS em `.stag` (linha 99)

- [ ] Localizar a regra `.stag` (linha 99):

```css
.stag{padding:8px 14px;border-radius:var(--r3);font-size:13px;border:1.5px solid var(--bo);background:var(--ar);color:var(--ca2);cursor:pointer;transition:all .15s;user-select:none}
```

Substituir por (adiciona `font:inherit` e `display:inline-flex` para preservar layout inline + alinhamento de emoji+texto):

```css
.stag{display:inline-flex;align-items:center;padding:8px 14px;border-radius:var(--r3);font-size:13px;font-family:inherit;border:1.5px solid var(--bo);background:var(--ar);color:var(--ca2);cursor:pointer;transition:all .15s;user-select:none}
```

(O default de `<button>` é `display:inline-block` mas `flex` cuida do alinhamento de "emoji + text". `border:1.5px solid var(--bo)` já existia — preservado.)

#### Step 2: Reset CSS em `.bdgi` (linha 266)

- [ ] Localizar a regra `.bdgi`:

```css
.bdgi{display:flex;flex-direction:column;align-items:center;gap:4px}
```

Substituir por (adiciona resets de button):

```css
.bdgi{display:flex;flex-direction:column;align-items:center;gap:4px;background:none;border:none;padding:0;font:inherit;color:inherit;cursor:pointer}
```

(`cursor:pointer` está em `.bdgic:hover` mas o `<button>` herda automaticamente — explicitar aqui é seguro. `text-align` não precisa explícito pois `flex` alinha tudo.)

#### Step 3: Reset CSS em `.bso2` (linha 367)

- [ ] Localizar a regra `.bso2`:

```css
.bso2{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 10px;background:var(--ar);border-radius:var(--r2);cursor:pointer;transition:all .15s;border:1.5px solid transparent;position:relative}
```

Substituir por (adiciona `font:inherit;color:inherit;text-align:center`):

```css
.bso2{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 10px;background:var(--ar);border-radius:var(--r2);cursor:pointer;transition:all .15s;border:1.5px solid transparent;position:relative;font:inherit;color:inherit;text-align:center}
```

#### Step 4: Reset CSS em `.cst` (linha 143)

- [ ] Localizar a regra `.cst`:

```css
.cst{display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.12);border-radius:var(--r3);padding:5px 10px;font-size:12px;color:rgba(255,255,255,.85);cursor:default}
```

Substituir por (adiciona `font-family:inherit;border:none`; mantém `cursor:default` porque a maioria dos `.cst` é estática — o único com onclick (linha 624) sobrescreve para `cursor:pointer` via style inline):

```css
.cst{display:flex;align-items:center;gap:5px;background:rgba(255,255,255,.12);border-radius:var(--r3);padding:5px 10px;font-size:12px;font-family:inherit;color:rgba(255,255,255,.85);border:none;cursor:default}
```

#### Step 5: Conversões de markup `.stag` (27 elementos)

A estrutura dos 27 elementos é uniforme: `<span class="stag[ s]" onclick="toggleSkill(this)">EMOJI Texto</span>`. Convertê-los em batch via `replace_all`.

- [ ] **5a.** Edit `replace_all`:
  - Buscar: `<span class="stag s" onclick="toggleSkill(this)">`
  - Substituir: `<button type="button" class="stag s" onclick="toggleSkill(this)">`

- [ ] **5b.** Edit `replace_all`:
  - Buscar: `<span class="stag" onclick="toggleSkill(this)">`
  - Substituir: `<button type="button" class="stag" onclick="toggleSkill(this)">`

- [ ] **5c.** Fechar `</span>` → `</button>` nos elementos `.stag` convertidos. Como `</span>` aparece em muitos contextos, não usar `replace_all` cego.

A estrutura nas linhas 557-561 (onboarding step 3) é uma `<span>...</span>` por linha — substituir cada `</span>` por `</button>` nessas 5 linhas:

Linha 557:
```html
<span class="stag s" onclick="toggleSkill(this)">💰 Apoio financeiro a projetos</span>
```
→ ao converter linha 557 com o passo 5a, o span de abertura virou button. Falta trocar `</span>` no fim da mesma linha para `</button>`.

**Estratégia eficiente:** após 5a e 5b, fazer Edit `replace_all` para fechar:

- [ ] **5d.** Edit `replace_all`:
  - Buscar: `Apoio financeiro a projetos</span>`
  - Substituir: `Apoio financeiro a projetos</button>`

Repetir 5d para cada texto único que termina em `</span>` em linha `.stag`. Lista completa dos textos (entre `>` e `</span>` original):

Onboarding step 3 (linhas 557-561):
- `💰 Apoio financeiro a projetos`
- `🔗 Conexões externas`
- `🏠 Minha casa para mutirões`
- `📢 Divulgação externa`
- `🎓 Mentoria remota`

Edit overlay (linhas 580 e 589, 1 linha por step que contém vários `.stag` inline) — esses casos têm múltiplos `</span>` na mesma linha. Vou tratar separadamente.

**5e.** Linha 580: tem 20 `.stag` em uma única linha (skills do step 4 onboarding). Todos terminam com `</span>`. Após a substituição dos passos 5a/5b a abertura virou `<button type="button" class="stag" onclick="toggleSkill(this)">EMOJI Texto</span>`. Precisa fechar todos os `</span>` dessa linha em `</button>`.

Como há outros `</span>` em outras partes do arquivo (notas, etc.), não posso fazer `replace_all` global de `</span>`. Em vez disso:

Para linha 580, fazer um Edit substituindo a linha completa. Após o `replace_all` de 5a/5b, a linha está como:
```html
          <button type="button" class="stag s" onclick="toggleSkill(this)">🎨 Artes</span><button type="button" class="stag" onclick="toggleSkill(this)">✂️ Costura</span>...
```

Use Read para obter o estado exato da linha após 5a/5b, depois Edit substituindo todos os `</span>` por `</button>` dentro daquele bloco específico. Aceitável fazer Edit individual para cada `</span>` se necessário, ou usar um Edit grande com a linha inteira.

**5f.** Linha 589 (skills do step 4 onboarding "intenções"): idem, 8 `.stag` numa linha — tratar igual a 5e.

- [ ] **5g.** Verificação:
  - Grep `<span class="stag` → 0 matches
  - Grep `<button type="button" class="stag` → 27 matches

#### Step 6: Conversões de markup `.bdgi` (4 elementos)

Os 4 `.bdgi` com onclick estão nas linhas 1044-1047. Cada linha tem a estrutura:

```html
<div class="bdgi ht" onclick="showBadge('Nome','Descrição','🎨')"><div class="bdgic ea">🌳</div><div class="bdgn">Nome</div><div class="tb">Tooltip</div></div>
```

- [ ] Para cada uma das 4 linhas (1044, 1045, 1046, 1047), fazer Edit individual:

  - Buscar (Linha 1044): `<div class="bdgi ht" onclick="showBadge('Raiz Profunda',`
  - Substituir: `<button type="button" class="bdgi ht" onclick="showBadge('Raiz Profunda',`

  E ajustar o fechamento. Cada linha tem ESTRUTURA `<div ... onclick="..."><div>...</div><div>...</div><div>...</div></div>` — o `</div>` final fecha o `.bdgi`. Os 3 `</div>` internos fecham os filhos (.bdgic, .bdgn, .tb).

  Para cada linha, **Edit completo** substituindo o `<div class="bdgi ht" onclick="..."` no início **e** o `</div>` no fim por `</button>`.

  Exemplo linha 1044:

  Buscar:
  ```html
  <div class="bdgi ht" onclick="showBadge('Raiz Profunda','10+ anos em Piracanga. Você é pilar desta comunidade.','🌳')"><div class="bdgic ea">🌳</div><div class="bdgn">Raiz Profunda</div><div class="tb">10+ anos de Piracanga. Clique para celebrar.</div></div>
  ```

  Substituir:
  ```html
  <button type="button" class="bdgi ht" onclick="showBadge('Raiz Profunda','10+ anos em Piracanga. Você é pilar desta comunidade.','🌳')"><div class="bdgic ea">🌳</div><div class="bdgn">Raiz Profunda</div><div class="tb">10+ anos de Piracanga. Clique para celebrar.</div></button>
  ```

  Repetir para linhas 1045, 1046, 1047 (Tecelã, Guardiã do Fogo, Fonte de Saber).

  Os outros 4 `.bdgi` sem onclick (linhas 1048-1051: Plantadora, Polinizadora, Solstício, Luna Nova) **permanecem `<div>`** — não há ação ao clicar.

- [ ] Verificação:
  - Grep `<div class="bdgi ht" onclick` → 0 matches
  - Grep `<button type="button" class="bdgi ht" onclick` → 4 matches

#### Step 7: Conversões de markup `.bso2` (8 elementos)

Os 8 `.bso2` com onclick estão nas linhas 1828-1835. Cada linha tem estrutura similar a `.bdgi` (vários `<div>` filhos).

- [ ] Para cada uma das 8 linhas, fazer Edit individual no `<div class="bso2 ht" onclick="...">` e no `</div>` final.

  Pode-se usar `replace_all` em duas partes:

  **7a.** Edit `replace_all`:
  - Buscar: `<div class="bso2 ht" onclick=`
  - Substituir: `<button type="button" class="bso2 ht" onclick=`

  **7b.** Para fechamento, precisa-se identificar o `</div>` final de cada bso2. Como o último filho de cada bso2 é `<div class="tb">...</div>` e logo após vem `</div>` (fechamento do .bso2), o padrão único é `</div></div>` no fim de cada linha. Mas isso pode aparecer em outros contextos.

  **Estratégia mais segura:** Edit individual usando como anchor o texto único de cada bso2 (o `.bsol` "Nova história", "Pedido de ajuda", etc.):

  Linha 1828:
  - Buscar fim da linha: `+2 Sementes 🌱</div></div>`
  - Substituir: `+2 Sementes 🌱</div></button>`

  Linha 1829:
  - Buscar: `+3 Sementes 🌱</div></div>`
  - Substituir: `+3 Sementes 🌱</div></button>`

  Linha 1830:
  - Buscar: `+8 Sementes 🌱</div></div>`
  - Substituir: `+8 Sementes 🌱</div></button>`

  Linha 1831:
  - Buscar: `+5 Sementes 🌱</div></div>`
  - Esse padrão aparece em linha 1831 (Convocar) e 1833 (Criar evento) e 1834 (Cadastrar vaga). Para evitar colisão, usar ancora mais específica:
  - Linha 1831 buscar: `moradores com interesse serão notificados. +5 Sementes 🌱</div></div>`
  - Linha 1833 buscar: `Moradores interessados recebem notificação. +5 Sementes 🌱</div></div>`
  - Linha 1834 buscar: `voluntariado ou trabalho remunerado. +5 Sementes 🌱</div></div>`

  Linha 1832:
  - Buscar: `+10 Sementes 🌱</div></div>`
  - Substituir: `+10 Sementes 🌱</div></button>`

  Linha 1835:
  - Buscar: `Complete e ganhe Sementes.</div></div>`
  - Substituir: `Complete e ganhe Sementes.</div></button>`

  Após cada Edit, o `</div></div>` vira `</div></button>` — fecha o `.tb` interno como `</div>` e fecha o `.bso2` como `</button>`.

- [ ] Verificação:
  - Grep `<div class="bso2 ht" onclick` → 0 matches
  - Grep `<button type="button" class="bso2 ht" onclick` → 8 matches

#### Step 8: Conversão de markup `.cst` (1 elemento)

- [ ] Edit individual da linha 624. Buscar:

```html
<div class="cst ht" onclick="goTo('desafios')" style="cursor:pointer;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3)">⭐ 5 desafios ativos<div class="tb">Desafios do território baseados no Censo 2025 e no Bioma</div></div>
```

Substituir:

```html
<button type="button" class="cst ht" onclick="goTo('desafios')" style="cursor:pointer;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.3);color:rgba(255,255,255,.85);font-size:12px">⭐ 5 desafios ativos<div class="tb">Desafios do território baseados no Censo 2025 e no Bioma</div></button>
```

(Acrescenta `color:rgba(255,255,255,.85);font-size:12px` ao style inline porque `.cst` regra geral aplica esses valores, mas como agora é `<button>` com reset `font:inherit;color:inherit`, preciso explicitar para a único `.cst` interativo manter cor branca. Os outros 4 `.cst` sem onclick continuam `<div>` e usam a regra geral inalterada.)

- [ ] Verificação:
  - Grep `<div class="cst ht" onclick` → 0 matches
  - Grep `<button type="button" class="cst ht" onclick` → 1 match

#### Step 9: Verificação geral

- [ ] Rodar checks finais via Grep:
  - `<div class="stag` + onclick → 0
  - `<span class="stag` + onclick → 0
  - `<div class="bdgi.*onclick` → 0
  - `<div class="bso2.*onclick` → 0
  - `<div class="cst.*onclick` → 0
  - `<button type="button" class="stag` → 27
  - `<button type="button" class="bdgi` → 4
  - `<button type="button" class="bso2` → 8
  - `<button type="button" class="cst` → 1

  Total novos buttons G8: **40**.

- [ ] Spot-check visual rápido (se possível abrir o file): nada deve mudar visualmente. Botões devem aparecer pixel-idênticos aos `<div>` originais.

#### Step 10: Commit Task 1

```powershell
git -C "C:/Users/Samsung/projetos/vila-viva" add index.html
git -C "C:/Users/Samsung/projetos/vila-viva" commit -m "fix(a11y): converter .stag/.bdgi/.bso2/.cst em <button> focaveis (G8 resto)"
```

---

### Task 2: UX S2 link → button + S8 mask-image scroll indicator (`fix(ui):`)

**Files:**
- Modify: `C:\Users\Samsung\projetos\vila-viva\index.html`

**Cobre:** S2 (1 conversão) + S8 (7 rows).

#### Step 1: S2 — converter `<a href="#">` "Esqueci minha senha" em `<button>`

Linha 429:

- [ ] Buscar:
  ```html
  <div style="text-align:center;margin-top:10px"><a href="#" style="font-size:13px;color:var(--ci)">Esqueci minha senha</a></div>
  ```

  Substituir:
  ```html
  <div style="text-align:center;margin-top:10px"><button type="button" onclick="alert('Recuperação de senha em breve — use suas credenciais atuais.')" style="font-size:13px;color:var(--ci);background:none;border:none;text-decoration:underline;cursor:pointer;font:inherit;padding:0">Esqueci minha senha</button></div>
  ```

  (Adiciona `onclick` com `alert()` — stub razoável para um protótipo de demonstração, onde "Esqueci senha" não é um fluxo implementado. Mantém visual com `text-decoration:underline` + cor `var(--ci)`.)

- [ ] Linha 1847 — **não converter**. O `<a id="ct-link" href="#" class="wabtn" target="_blank">` é populado dinamicamente via JS (`openCt(...)` provavelmente atualiza `href` para o link `wa.me/...`). Deixar como `<a>` por ser link de fato (abre WhatsApp externo).

- [ ] Verificação:
  - Grep `<a href="#"` → 1 match (apenas linha 1847)
  - Grep `Esqueci minha senha` em contexto de `<button>` → 1 match

#### Step 2: S8 — mask-image em regras CSS de classe (3 sites)

**2a. `.strsc` (linha 148):**

- [ ] Buscar:
  ```css
  .strsc{display:flex;gap:12px;padding:0 16px;overflow-x:auto;scrollbar-width:none}
  ```

  Substituir:
  ```css
  .strsc{display:flex;gap:12px;padding:0 16px;overflow-x:auto;scrollbar-width:none;mask-image:linear-gradient(to right,#000 85%,transparent 100%);-webkit-mask-image:linear-gradient(to right,#000 85%,transparent 100%)}
  ```

**2b. `.ffs` (linha 158):**

- [ ] Buscar:
  ```css
  .ffs{display:flex;gap:8px;padding:8px 16px;overflow-x:auto;scrollbar-width:none}
  ```

  Substituir:
  ```css
  .ffs{display:flex;gap:8px;padding:8px 16px;overflow-x:auto;scrollbar-width:none;mask-image:linear-gradient(to right,#000 85%,transparent 100%);-webkit-mask-image:linear-gradient(to right,#000 85%,transparent 100%)}
  ```

**2c. `.mapf` (linha 295):**

- [ ] Buscar:
  ```css
  .mapf{padding:12px 16px;display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;flex-shrink:0}
  ```

  Substituir:
  ```css
  .mapf{padding:12px 16px;display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;flex-shrink:0;mask-image:linear-gradient(to right,#000 85%,transparent 100%);-webkit-mask-image:linear-gradient(to right,#000 85%,transparent 100%)}
  ```

#### Step 3: S8 — mask-image em style inline (4 sites)

Cada um desses 4 sites usa `overflow-x:auto` inline. Localizar e adicionar `mask-image`:

**3a. `#agent-filter-row` (linha 646):**

- [ ] Buscar:
  ```html
  <div id="agent-filter-row" style="display:none;padding:4px 16px 8px;overflow-x:auto;white-space:nowrap;scrollbar-width:none">
  ```

  Substituir:
  ```html
  <div id="agent-filter-row" style="display:none;padding:4px 16px 8px;overflow-x:auto;white-space:nowrap;scrollbar-width:none;mask-image:linear-gradient(to right,#000 85%,transparent 100%);-webkit-mask-image:linear-gradient(to right,#000 85%,transparent 100%)">
  ```

  ⚠️ Nota: o `display:none` inicial é toggled por JS quando o user clica em filtros. O `mask-image` não afeta visibilidade. Quando o JS mudar para `display:flex` (provavelmente), o `mask-image` aparece também. OK.

**3b. Tab row do match (linha 1221):**

- [ ] Buscar:
  ```html
  <div style="display:flex;gap:0;border-bottom:1px solid var(--bo);background:var(--br);overflow-x:auto;scrollbar-width:none;flex-shrink:0">
  ```

  Substituir:
  ```html
  <div style="display:flex;gap:0;border-bottom:1px solid var(--bo);background:var(--br);overflow-x:auto;scrollbar-width:none;flex-shrink:0;mask-image:linear-gradient(to right,#000 85%,transparent 100%);-webkit-mask-image:linear-gradient(to right,#000 85%,transparent 100%)">
  ```

**3c. Filter row do match (linha 1242):**

- [ ] Buscar:
  ```html
  <div style="padding:10px 16px 6px;overflow-x:auto;white-space:nowrap;scrollbar-width:none">
  ```

  Substituir:
  ```html
  <div style="padding:10px 16px 6px;overflow-x:auto;white-space:nowrap;scrollbar-width:none;mask-image:linear-gradient(to right,#000 85%,transparent 100%);-webkit-mask-image:linear-gradient(to right,#000 85%,transparent 100%)">
  ```

**3d. Row filtros desafios (linha 1598):**

- [ ] Buscar:
  ```html
  <div style="padding:12px 16px 6px;overflow-x:auto;white-space:nowrap;scrollbar-width:none">
  ```

  ⚠️ Cuidado: o padrão de 3c e 3d são quase idênticos (apenas o padding-top muda — 10 vs 12). Use `Read` para confirmar antes de cada Edit e ancore o Edit pela linha exata se necessário (Edit aceita context maior se quiser).

  Substituir:
  ```html
  <div style="padding:12px 16px 6px;overflow-x:auto;white-space:nowrap;scrollbar-width:none;mask-image:linear-gradient(to right,#000 85%,transparent 100%);-webkit-mask-image:linear-gradient(to right,#000 85%,transparent 100%)">
  ```

#### Step 4: Verificação Grep

- [ ] `mask-image:linear-gradient(to right,#000 85%` → **7 matches** (3 em CSS + 4 em style inline).
- [ ] `-webkit-mask-image:linear-gradient(to right,#000 85%` → **7 matches**.
- [ ] `<a href="#"` → 1 match (apenas `ct-link` linha 1847).

#### Step 5: Commit Task 2

```powershell
git -C "C:/Users/Samsung/projetos/vila-viva" add index.html
git -C "C:/Users/Samsung/projetos/vila-viva" commit -m "fix(ui): Esqueci senha link vira button (S2); mask-image gradient em 7 rows scroll-x (S8)"
```

---

### Task 3: Validação + relatório de fechamento

**Files:**
- Create: `C:\Users\Samsung\projetos\vila-viva\docs\superpowers\reports\2026-05-13-vila-viva-onda3a-relatorio.md`

#### Step 1: Métricas via Grep

- [ ] Contagens para o relatório:
  - `<button type="button" class="stag` → 27
  - `<button type="button" class="bdgi ht"` → 4
  - `<button type="button" class="bso2 ht"` → 8
  - `<button type="button" class="cst ht"` → 1
  - **Total novos buttons G8: 40**
  - `<a href="#"` → 1 (apenas `ct-link`, link real)
  - `mask-image:linear-gradient(to right,#000 85%` → 7

#### Step 2: Listar todos os commits da Onda 3a

```powershell
git -C "C:/Users/Samsung/projetos/vila-viva" log --oneline onda2-fechada..HEAD
```

Esperado: 3 commits (Task 1 + Task 2 + spec do brainstorming/plan já commitada antes) — confirmar quais são os commits desta onda.

#### Step 3: Escrever o relatório

Criar `docs/superpowers/reports/2026-05-13-vila-viva-onda3a-relatorio.md`:

```markdown
# Vila Viva — Relatório de fechamento Onda 3a

**Data:** 2026-05-13
**Spec:** `docs/superpowers/specs/2026-05-13-vila-viva-onda3-design.md`
**Plano:** `docs/superpowers/plans/2026-05-13-vila-viva-onda3a-plano.md`
**Branch:** `master`
**Status:** Código entregue · validação visual manual pendente · aguarda code-review final

## Resumo

Onda 3a aplicada em N commits granulares: T1 G8 a11y core (HASH1), T2 S2+S8 UX (HASH2), T3 relatório (HASH3). 40 conversões `<div>/<span>` em `<button>` (G8 resto), 1 conversão `<a href="#">` em `<button>` (S2 — apenas o "Esqueci senha"; o ct-link WhatsApp permaneceu `<a>` por ser link real com target="_blank" populado via JS), e 7 rows de scroll horizontal ganharam fade gradient via `mask-image` (S8). Sem mudança estrutural: continua single-file, sem dependências, sem alteração de UX visível ao usuário leigo.

## Nota sobre contagens vs spec

A spec estimou ~64 alterações; a real foi **48** (40 + 1 + 7). Diferença:
- `.sri` (~10 estimados): 0 elementos têm `onclick` no markup atual; saiu do escopo.
- `.bdgi` (estimado 8): apenas 4 têm onclick; os outros 4 são "🔒 locked".
- `.cst` (estimado ~5): apenas 1 tem onclick.
- `<a href="#">` (estimado 2): apenas 1 é link estático ("Esqueci senha"); o outro (`ct-link`) é link real para WhatsApp.

## Itens entregues

| Código | Item | Status | Commit |
|---|---|---|---|
| G8 resto | `.stag` × 27 → `<button>` | ✓ | HASH1 |
| G8 resto | `.bdgi` × 4 (com onclick) → `<button>` | ✓ | HASH1 |
| G8 resto | `.bso2` × 8 → `<button>` | ✓ | HASH1 |
| G8 resto | `.cst` × 1 → `<button>` | ✓ | HASH1 |
| S2 | "Esqueci senha" `<a>` → `<button>` | ✓ | HASH2 |
| S8 | `mask-image` gradient em 7 rows scroll-x | ✓ | HASH2 |

**40 conversões G8 + 1 S2 + 7 S8 = 48 alterações entregues.**

## Métricas (HEAD Onda 2 onda2-fechada → HEAD Onda 3a)

| Métrica | Onda 2 | Onda 3a |
|---|---|---|
| `<button>` total no arquivo | ~? | ~? +48 |
| `<div onclick>` G8 (`.stag/.bdgi/.bso2/.cst`) | 40 | 0 |
| `<span onclick>` `.stag` | 27 | 0 |
| `<a href="#">` link estático | 1 | 0 |
| `mask-image` em containers scroll-x | 0 | 7 |

## Validações executadas

- [x] Grep checks (contagens batem)
- [ ] **Pendente — usuário:** validação visual em 3 viewports (375/390/430)
- [ ] **Pendente — usuário:** tour keyboard (Tab passa pelos 48 elementos com foco visível, Enter/Space dispara o `onclick`)
- [ ] **Pendente — usuário:** spot-check S8 (gradient visível à direita dos 7 rows)
- [ ] **Pendente — usuário:** Lighthouse Acessibilidade ≥ 90 em login e feed
- [ ] **Pendente:** code-review externo via `superpowers:requesting-code-review`

## Achados durante execução

[Preencher após execução: ou "Nenhum" ou lista]

## Backlog pós-Onda 3a (inalterado vs spec seção 6)

### Onda 3b — DX refactor (~3-4h, projeto separado)
- 217 `onclick=` inline → `addEventListener` central
- Event delegation; permite tratamento a11y automático em elementos injetados

### Onda 4 (polimento, ~1h)
- S15: typo "doo seu tempo" → "doe seu tempo"
- S7: padronizar borda dos chips do banner
- S16: ellipsis em stats de desafios
- Minor do code-review da Onda 2: `pointer-events:none` em `.tav::before`, double-title em vagas

### Onda 5 (escopo maior)
- Responsivo tablet/desktop, separação CSS/JS, IDs legíveis, WCAG AA completa, performance, componentização

## Próximo passo

Após validação manual e code-review externo OK, tag `onda3a-fechada` no commit final.
```

Preencher os colchetes com valores reais durante execução.

#### Step 4: Commit do relatório

```powershell
git -C "C:/Users/Samsung/projetos/vila-viva" add docs/
git -C "C:/Users/Samsung/projetos/vila-viva" commit -m "docs: relatorio de fechamento Onda 3a"
```

#### Step 5: Avisar próximo passo

Reportar ao controller:

> "Execução da Onda 3a concluída. 3 commits no branch master. Relatório em `docs/superpowers/reports/2026-05-13-vila-viva-onda3a-relatorio.md`. Próximo: invocar `superpowers:requesting-code-review` antes da validação manual e da tag `onda3a-fechada`."

---

## Coverage matrix (autoauditoria contra spec)

| Spec item | Severidade | Task | Status |
|---|---|---|---|
| G8 `.stag` | Média | T1.1, T1.5 | Coberto (27 conversões) |
| G8 `.bdgi` | Média | T1.2, T1.6 | Coberto (4 conversões; 4 locked sem onclick permanecem div) |
| G8 `.sri` | Média | — | **Fora do escopo** (0 elementos com onclick no markup atual) |
| G8 `.bso2` | Média | T1.3, T1.7 | Coberto (8 conversões) |
| G8 `.cst` | Média | T1.4, T1.8 | Coberto (1 conversão; outros 4 sem onclick permanecem div) |
| S2 link Esqueci senha | Média | T2.1 | Coberto |
| S2 ct-link | Média | — | **Fora do escopo** (link real para WhatsApp) |
| S8 mask-image 7 rows | Média | T2.2, T2.3 | Coberto |
| Validação visual 3 viewports | DoD | T3 (pendente user) | Validação |
| Tour keyboard | DoD | T3 (pendente user) | Validação |
| Lighthouse ≥ 90 | DoD | T3 (pendente user) | Validação |
| Code review externo | DoD | pós-T3 | Pendente |
| Relatório | DoD | T3 | Coberto |
| Tag `onda3a-fechada` | DoD | pós-validação | Pendente |

Os 2 itens "fora do escopo" são justificados acima por inspeção real do markup. Todos os itens efetivamente presentes têm task. Sem placeholders. Sem `TBD`.
