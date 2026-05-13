# Vila Viva — Onda 2 (a11y avançado, responsividade, padronização)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar os 10 itens da Onda 2 (foco-trap completo nos 7 overlays, headings semânticos em todas as 9 telas, alvos de toque ≥ 44px, padronização da bnav, bugs de UX e responsividade, contraste `--ci` sobre `--ar2`) em `index.html`, preservando single-file e sem refator de UX além do previsto.

**Architecture:** Single-file HTML/CSS/JS inline. Edições in-place no `index.html`. Sem TDD automatizado — verificação visual em DevTools (3 viewports) + tour manual dos 7 modais + Lighthouse Acessibilidade ao fim. Único arquivo novo: o relatório de fechamento.

**Tech Stack:** HTML5, CSS3 (custom properties, flex/grid), JavaScript vanilla. Dev tools: Chrome/Edge DevTools (responsive mode, Accessibility tree, Lighthouse), calculadora de contraste WCAG (contrast-ratio.com ou DevTools color picker).

**Spec de referência:** `docs/superpowers/specs/2026-05-13-vila-viva-onda2-design.md`

**Convenção de "save points":** o repo `vila-viva` é git. Cada task termina com `git add index.html && git commit` no padrão da Onda 1.

---

## File Structure

**Modificar:**
- `C:\Users\Samsung\projetos\vila-viva\index.html` — única fonte editada.

**Criar (ao final):**
- `C:\Users\Samsung\projetos\vila-viva\docs\superpowers\reports\2026-05-13-vila-viva-onda2-relatorio.md` — relatório de fechamento.

---

## Ordem das tasks

Afinidade temática (Opção B do brainstorming):
- **T1**: A11y core — foco-trap nos overlays + headings semânticos
- **T2**: Responsividade/UX — alvos de toque, agent-grid, botão Convidar, opacidades
- **T3**: Padronização e bugs — bnav, embaixador duplicado, contraste `--ci`, `aria-hidden` no markup
- **T4**: Validação + relatório

Dentro de cada task, agrupamos edits relacionados num único commit. Mensagens no estilo `fix(a11y): ...`, `fix(ui): ...`, `fix(consistency): ...` para coerência com o histórico da Onda 1.

---

### Task 1: A11y core — foco-trap nos overlays + headings semânticos

**Files:**
- Modify: `C:\Users\Samsung\projetos\vila-viva\index.html`

**Cobre:** S22, S10 da spec.

#### Step 1: Adicionar funções `openDialog`/`closeDialog` no `<script>`

- [ ] **Localizar** o final do bloco `<script>` que aplica `aria-hidden` em SVGs (cerca de `document.querySelectorAll('.bni svg, .fab svg, ...').forEach(...)`). Inserir **logo abaixo** o seguinte bloco:

```javascript
// ── Foco-trap genérico para overlays/modais (S22) ──
const _dialogState = new WeakMap();

function _focalsOf(root) {
  return Array.from(root.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )).filter(el => !el.disabled && el.offsetParent !== null);
}

function openDialog(idOrEl, openerEl) {
  const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
  if (!el) return;
  const opener = openerEl || document.activeElement;
  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); closeDialog(el); return; }
    if (e.key !== 'Tab') return;
    const focals = _focalsOf(el);
    if (!focals.length) { e.preventDefault(); return; }
    const first = focals[0], last = focals[focals.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  _dialogState.set(el, { opener, onKey });
  el.addEventListener('keydown', onKey);
  // foca primeiro focal interno após o overlay aparecer
  setTimeout(() => {
    const focals = _focalsOf(el);
    if (focals.length) focals[0].focus();
  }, 50);
}

function closeDialog(idOrEl) {
  const el = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
  if (!el) return;
  const st = _dialogState.get(el);
  if (st) {
    el.removeEventListener('keydown', st.onKey);
    _dialogState.delete(el);
    if (st.opener && typeof st.opener.focus === 'function') st.opener.focus();
  }
}
```

#### Step 2: Refatorar pontos de abertura/fechamento dos 7 overlays para usar `openDialog`/`closeDialog`

Há 7 overlays: `bsh` (bottom-sheet), `ctmo` (contato), `edov` (edit profile), `bdov` (badge), `cadvaga-ov`, `cadprojeto-ov`, `editsec-ov`. Cada um é aberto por uma função e fechado por outra (`closeSh`, `closeShByOverlay`, etc.).

**Estratégia:** envolver os pontos de abertura existentes para chamar `openDialog` **em adição** à lógica que já aplica a classe (`op`, `sh`, etc.). Idem para fechamento.

- [ ] **Localizar** as funções abaixo no `<script>` e modificá-las. Para cada par, mostro o estado original (que você confirma por Grep) e o destino. Use `Grep` para encontrar cada função pelo nome.

##### 2a. `openSh()` / `closeSh()` (bottom-sheet contribuir, id `bsh`)

Localizar `function openSh()`:
```javascript
function openSh(){document.getElementById('bso').classList.add('op');document.getElementById('bsh').classList.add('op')}
```

Substituir por:
```javascript
function openSh(){const opener=document.activeElement;document.getElementById('bso').classList.add('op');document.getElementById('bsh').classList.add('op');openDialog('bsh',opener)}
```

Localizar `function closeSh()`:
```javascript
function closeSh(){document.getElementById('bso').classList.remove('op');document.getElementById('bsh').classList.remove('op')}
```

Substituir por:
```javascript
function closeSh(){closeDialog('bsh');document.getElementById('bso').classList.remove('op');document.getElementById('bsh').classList.remove('op')}
```

Se houver `function closeShByOverlay(e){...}` que envolve `closeSh()`, **não** mexer — ela já chama `closeSh()`.

##### 2b. `openCt()` / fechamento de `#ctmo`

Localizar `function openCt(`:
```javascript
function openCt(nome,wp){document.getElementById('ct-title').textContent='Conectar com '+nome;...document.getElementById('ctmo').classList.add('op')}
```

Adicionar antes do final da função:
```javascript
openDialog('ctmo');
```

Resultado final esperado (mantém todo o conteúdo da função, só acrescenta no fim):
```javascript
function openCt(nome,wp){document.getElementById('ct-title').textContent='Conectar com '+nome;...document.getElementById('ctmo').classList.add('op');openDialog('ctmo')}
```

(`openDialog` salva o opener via `document.activeElement` por padrão — não precisamos passar.)

Localizar o `onclick` que fecha `ctmo` no markup (linha ~1833):
```html
<button onclick="document.getElementById('ctmo').classList.remove('op')" aria-label="Fechar" style="...">×</button>
```

Substituir o `onclick` para:
```html
<button onclick="closeDialog('ctmo');document.getElementById('ctmo').classList.remove('op')" aria-label="Fechar" style="...">×</button>
```

##### 2c. `openEdit()` / `closeEdit()` (edit profile overlay, id `edov`)

Buscar `function openEdit(`. Acrescentar `;openDialog('edov')` no fim da função (antes do último `}`).

Buscar `function closeEdit(` (ou equivalente). Acrescentar `closeDialog('edov');` no início.

Se a função de fechar não existir e o markup fechar via `onclick="document.getElementById('edov').classList.remove('op')"`, edite o `onclick` para anteceder `closeDialog('edov');`.

##### 2d. Badge overlay (`bdov`)

Buscar `function showBadge(`. Localizar o ponto onde aplica `classList.add('sh')` ao `bdov`. Acrescentar `openDialog('bdov')` logo após.

Localizar `function closeBadgeOverlay(e)`:
```javascript
function closeBadgeOverlay(e){if(e&&e.target.id!=='bdov')return;document.getElementById('bdov').classList.remove('sh')}
```

Substituir por:
```javascript
function closeBadgeOverlay(e){if(e&&e.target.id!=='bdov')return;closeDialog('bdov');document.getElementById('bdov').classList.remove('sh')}
```

E no markup, o botão `×` do `bdov` (linha ~1893):
```html
<button onclick="document.getElementById('bdov').classList.remove('sh')" aria-label="Fechar" style="...">×</button>
```
→
```html
<button onclick="closeDialog('bdov');document.getElementById('bdov').classList.remove('sh')" aria-label="Fechar" style="...">×</button>
```

##### 2e. Modais `cadvaga-ov`, `cadprojeto-ov`, `editsec-ov`

Para cada um, localizar a função/onclick que abre (algo como `openCadVaga()`, `openCadProjeto()`, `openEditSec(...)` ou inline `classList.add('op')`) e a função/onclick que fecha (botão "Cancelar" textual ou `classList.remove('op')`).

**Padrão de acréscimo:** após `classList.add('op')`, acrescentar `openDialog('cadvaga-ov')` (ou o id apropriado). Antes de `classList.remove('op')`, acrescentar `closeDialog('cadvaga-ov')`.

Use Grep para localizar cada `cadvaga-ov`, `cadprojeto-ov`, `editsec-ov` no markup e no JS. Aplicar o padrão.

#### Step 3: Verificação manual do foco-trap

- [ ] Abrir `index.html` em Chrome em mobile (375×667).
- [ ] Clicar/Tap em cada um dos 7 elementos que abrem modais:
  - FAB "+" da bnav → bottom-sheet `bsh`
  - "Conectar com Josemar" no feed → `ctmo`
  - "✏️ Editar" no perfil → `edov`
  - Qualquer badge no perfil → `bdov`
  - "Cadastrar vaga" na bottom-sheet → `cadvaga-ov`
  - "+ Cadastrar projeto" no perfil → `cadprojeto-ov`
  - "Editar" em alguma seção do perfil → `editsec-ov`
- [ ] Para **cada** modal aberto:
  - Foco está no primeiro elemento focal interno (não no body).
  - Pressionar Tab repetidamente: foco cicla dentro do modal, não vaza.
  - Shift+Tab: cicla ao contrário.
  - ESC: fecha o modal e devolve foco ao elemento que o abriu.

Se algum modal falhar, voltar ao Step 2 correspondente e revisar.

#### Step 4: Adicionar `<h1>` raiz nas 9 telas

A regra é: cada `<div class="screen" id="...">` deve ter exatamente 1 `<h1>` raiz, normalmente o título mais proeminente da tela. Preservar visual via inline `style="margin:0;..."`.

Locais e edições (mostrar antes/depois para cada):

##### 4a. `#login` — usar título "Vila Viva" ou similar

Buscar no markup do `#login` o div que serve como título principal. Geralmente algo como:
```html
<div style="font-family:var(--fd);font-size:42px;...">Vila Viva</div>
```

Trocar `<div>` por `<h1>` mantendo style inline + `margin:0`. Não inventar texto novo — usar o que está lá.

##### 4b. `#onb` — `<h1>` no step 1, `<h2>` em step 2/3/4

Buscar o título do step 1 (geralmente "Vamos nos conhecer" ou similar). Trocar para `<h1>`. Os títulos dos steps 2/3/4 viram `<h2>`.

##### 4c. `#feed` — `<h1>` no banner principal

Buscar o título mais proeminente do banner do feed (ex.: nome "Vila Viva" no topbar, ou o título do banner `.csts` se houver). Converter para `<h1>` com style inline preservando visual.

Se não houver título visível claro no feed, **adicionar** `<h1 class="visually-hidden" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Feed da Vila</h1>` logo após o `<div class="topbar">` para servir de raiz semântica sem afetar visual.

##### 4d. `#vagas` — converter "Vagas na Vila" (linha 804)

Antes:
```html
<div style="font-family:var(--fd);font-size:22px;font-weight:300;color:#fff">Vagas na Vila</div>
```

Depois:
```html
<h1 style="font-family:var(--fd);font-size:22px;font-weight:300;color:#fff;margin:0">Vagas na Vila</h1>
```

##### 4e. `#perfil` — `<h1>` no nome do usuário no `.phero`

Buscar no `.phero` o nome ("Mónica Reis" ou similar). Trocar o `<div>` desse nome por `<h1>` com style inline. `<h2>` nas seções "Sobre", "Habilidades", "Badges", "Projetos", "Jornada" (procurar cada subtítulo).

##### 4f. `#match` — `<h1>` "Jardim de Conexões"

Buscar o título no header do match. Converter para `<h1>`.

##### 4g. `#desafios` — `<h1>` no título do hero

Buscar o título do hero (provavelmente "Desafios da Vila" ou similar). Converter para `<h1>`.

##### 4h. `#dash` — `<h1>` "Painel da Vila" e `<h2>` em seções

Buscar título do `.dhdr` (linha ~1472). Converter para `<h1>`. Seções "Composição da Vila", "Engajamento", etc. → `<h2>`.

##### 4i. `#notifs` — `<h1>` no título principal (linha ~1799)

Antes:
```html
<div style="font-family:var(--fd);font-size:26px;font-weight:300;color:var(--ca)">Conexões & Avisos</div>
```

Depois:
```html
<h1 style="font-family:var(--fd);font-size:26px;font-weight:300;color:var(--ca);margin:0">Conexões & Avisos</h1>
```

#### Step 5: Verificação do outline de headings

- [ ] Abrir DevTools → Accessibility tree (ou usar uma extensão como "headingsMap").
- [ ] Para cada tela ativa, verificar:
  - Exatamente 1 `<h1>` por tela.
  - `<h2>` apenas em subseções da tela ativa.
  - Sem h3 órfão sem h2 acima.

Também rodar via Grep no arquivo:
- Pattern `<h1` deve ter ~9 ocorrências (1 por tela). Se mais ou menos, investigar.

#### Step 6: Commit Task 1

```powershell
git add index.html
git commit -m "fix(a11y): foco-trap generico em modais e headings semanticos em telas"
```

---

### Task 2: Responsividade/UX — alvos de toque, agent-grid, botão Convidar, opacidades

**Files:**
- Modify: `C:\Users\Samsung\projetos\vila-viva\index.html`

**Cobre:** C1, C2, S4, S17, S11, S18 da spec.

#### Step 1: Alvos de toque `.tic` e `.tav` (C1, C2)

- [ ] **Localizar** a regra `.tic` (linha ~116):

```css
.tic{width:36px;height:36px;display:flex;align-items:center;justify-content:center;background:var(--ar2);border-radius:50%;...}
```

Substituir adicionando `min-width:44px;min-height:44px`:

```css
.tic{width:36px;height:36px;min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;background:var(--ar2);border-radius:50%;...}
```

(Use Read para ver a regra exata; preservar todos os outros valores.)

⚠️ **Cuidado:** se `width:36px` for fixo, `min-width:44px` força o tamanho real para 44 — o que mudaria o visual. Solução: trocar `width:36px;height:36px` por `width:44px;height:44px` mas manter o SVG interno em 20×20 (já está). Resultado: ícone 20px centralizado em área 44px, sem mudar tamanho percebido do ícone.

**Alternativa preferida (sem alterar tamanho percebido):** manter `width:36px;height:36px` e usar um pseudo-elemento que expande área clicável. Mas isso é mais complexo. Vamos com `width:44px;height:44px` por simplicidade — o `.tic` é um background tan circular discreto, ir de 36 para 44 é aceitável.

Edit final:
```css
.tic{width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:var(--ar2);border-radius:50%;...}
```

- [ ] **Localizar** a regra `.tav` (linha ~117):

```css
.tav{width:32px;height:32px;...}
```

Aplicar mesma técnica: trocar para 44×44 OU manter 32 e expandir via padding/pseudo. Decisão: **manter 32 visualmente** porque o avatar com iniciais "MR" fica grande demais em 44. Em vez disso, **expandir área via pseudo-elemento**:

Adicionar após a regra `.tav`:
```css
.tav::before{content:'';position:absolute;inset:-6px;border-radius:50%}
.tav{position:relative}
```

(O `position:relative` permite que o `::before` se posicione; o `inset:-6px` cria uma "borda invisível" de 6px ao redor, total 44×44 de área clicável sobre um avatar visual de 32. O `::before` herda o cursor:pointer do pai.)

Atenção: a regra `.tav` precisa ter `position:relative`. Se já não tem, adicione no edit.

#### Step 2: `.agent-selector-grid` responsivo (S4)

- [ ] **Localizar** a regra `.agent-selector-grid` (linha ~104):

```css
.agent-selector-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
```

Substituir por:

```css
.agent-selector-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}
```

- [ ] **Localizar** a regra `.agent-sel-card` (próxima na sequência ou via Grep). Adicionar `min-width:0` para evitar overflow:

```css
.agent-sel-card{...;min-width:0}
```

- [ ] **Localizar** a regra `.asc-name` (Grep). Adicionar `word-wrap:break-word;overflow-wrap:break-word`:

```css
.asc-name{...;word-wrap:break-word;overflow-wrap:break-word}
```

#### Step 3: Botão Convidar wrap (S17)

- [ ] **Localizar** no markup o row com 2 botões de "Compartilhar" / "Convidar" (WhatsApp) na tela `#desafios`. Pelo grep da Onda 1, está em torno da linha 1639. Usar Grep no padrão `Convidar` ou `flex:2.*flex:1` para encontrar.

Estrutura típica:
```html
<div style="display:flex;gap:8px;margin-top:12px">
  <button style="flex:2;..." onclick="...">📣 Compartilhar desafio</button>
  <button style="flex:1;..." onclick="...">💬 Convidar</button>
</div>
```

Substituir por:
```html
<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
  <button style="flex:2;min-width:0;font-size:13px;..." onclick="...">📣 Compartilhar desafio</button>
  <button style="flex:1;min-width:0;font-size:12px;..." onclick="...">💬 Convidar</button>
</div>
```

(`flex-wrap:wrap` permite quebrar em 2 linhas em 375 se necessário; `min-width:0` permite encolher; font-sizes diferenciados ajudam o botão menor a caber.)

#### Step 4: Opacidades botões `.phero` (S11)

- [ ] **Localizar** no markup os botões "← Vila" e "✏️ Editar" no `.phero` do perfil. Cada um tem `background:rgba(255,255,255,.15)` inline.

Trocar `rgba(255,255,255,.15)` para `rgba(255,255,255,.25)` em ambos os botões.

Padrão de Edit (use `replace_all` se a string for única; senão, Edit individual):

Buscar: `background:rgba(255,255,255,.15)`
Substituir: `background:rgba(255,255,255,.25)`

⚠️ **Verificar antes** se essa string aparece em outros lugares no arquivo (Grep). Se sim, fazer Edit individual nos 2 botões do `.phero` mantendo as outras inalteradas.

#### Step 5: Opacidade "voltar" no `.dhdr` (S18)

- [ ] **Localizar** no markup do `.dhdr` (linha ~1472) o botão "voltar" ou ícone. Geralmente tem `color:rgba(255,255,255,.55)`.

Substituir `rgba(255,255,255,.55)` por `rgba(255,255,255,.85)`.

Se houver outras ocorrências dessa string em outros headers escuros (qhdr, ohd), aplicar também onde texto esteja sobre fundo verde escuro. Verificar Grep antes:

```
Pattern: rgba\(255,255,255,\.55\)
```

Cada match: avaliar se é texto sobre fundo verde — se sim, escurecer para .85. Documentar no relatório.

#### Step 6: Verificação visual

- [ ] DevTools → mobile 375×667.
- [ ] **Topbar:** Inspecionar `.tic` e `.tav` — área clicável deve ser ≥ 44×44 (mostrado no Inspector). Visual do ícone do sino e do avatar inalterado para o usuário casual.
- [ ] **Onboarding step 2:** redimensionar para 360px — agent-grid deve manter cards legíveis (sem encavalar texto).
- [ ] **Desafios:** rolar até o hero stats — botões "Compartilhar" e "Convidar" cabem em 375 (em row ou em wrap, sem corte).
- [ ] **Perfil:** botões "← Vila" e "✏️ Editar" sobre o hero verde escuro — texto branco mais legível.
- [ ] **Dashboard:** botão/texto "voltar" no `.dhdr` mais legível.

#### Step 7: Commit Task 2

```powershell
git add index.html
git commit -m "fix(ui): alvos de toque 44px em .tic/.tav, agent-grid responsivo, wrap em convidar, opacidades em headers escuros"
```

---

### Task 3: Padronização e bugs — bnav, embaixador, contraste, aria-hidden no markup

**Files:**
- Modify: `C:\Users\Samsung\projetos\vila-viva\index.html`

**Cobre:** C4, S5, contraste `--ar2`, C5 da spec.

#### Step 1: Padronizar bnav — substituir "Desafios" por "Eu" em 5 bnav (C4)

Das 7 bnav existentes:
- **Feed (linha ~784):** já tem "Eu" como 5º item ✓
- **Perfil (linha ~1197):** já tem "Eu" como 5º item ✓ (mas é `.bni a` — auto-referente)
- **Vagas (linha ~970):** trocar 5º item de "Desafios" → "Eu"
- **Match (linha ~1466):** trocar 5º item de "Desafios" → "Eu"
- **Dashboard (linha ~1562):** trocar 5º item de "Desafios" → "Eu"
- **Desafios (linha ~1793):** trocar 5º item de "Desafios" (active) → "Eu"
- **Notifs (linha ~1814):** trocar 5º item de "Avisos" (active) → "Eu"

Padrão atual do item "Desafios" em bnav (linhas 970, 1466, 1562):
```html
<button type="button" class="bni ht" onclick="goTo('desafios')"><svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><span>Desafios</span><div class="tb">Desafios baseados no Censo 2025 e no Bioma</div></button>
```

Substituir por (item "Eu" do feed, linha 789):
```html
<button type="button" class="bni" onclick="goTo('perfil')"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>Eu</span></button>
```

- [ ] **Edit:** usar `Edit` com `replace_all` no Edit tool. A string completa do `<button>...Desafios...</button>` deve ser idêntica entre as 3 bnav (vagas/match/dashboard) — verifique antes via Grep.

Padrão para `replace_all`:
- Buscar: `<button type="button" class="bni ht" onclick="goTo('desafios')"><svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><span>Desafios</span><div class="tb">Desafios baseados no Censo 2025 e no Bioma</div></button>`
- Substituir: `<button type="button" class="bni" onclick="goTo('perfil')"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>Eu</span></button>`

- [ ] **Bnav desafios (linha 1793)** — variante com classe `a` (active). Substituir Edit individual:

Buscar:
```html
<button type="button" class="bni a" onclick="goTo('desafios')"><svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg><span>Desafios</span></button>
```

Substituir:
```html
<button type="button" class="bni" onclick="goTo('perfil')"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>Eu</span></button>
```

(Remove classe `a` — a tela `desafios` não terá item ativo na bnav, igual ao notifs anteriormente.)

- [ ] **Bnav notifs (linha 1814)** — variante com "Avisos":

Buscar:
```html
<button type="button" class="bni a" onclick="goTo('notifs')"><svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg><span>Avisos</span></button>
```

Substituir:
```html
<button type="button" class="bni" onclick="goTo('perfil')"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span>Eu</span></button>
```

- [ ] **Verificação:** rodar Grep no arquivo após edits:
  - `goTo('desafios')` na bnav: deve aparecer apenas no card `.cst` do feed (linha 623) e no `.bso2` da bottom-sheet (linha 1834), **não** em nenhum `<button class="bni">`.
  - `span>Eu</span>`: deve aparecer 7 vezes (1 por bnav).
  - `span>Desafios</span>` em `<button class="bni"`: **0 ocorrências**.
  - `span>Avisos</span>`: **0 ocorrências**.

#### Step 2: Bug embaixador duplicado (S5)

Pela análise: as linhas 503 e 539 do markup têm `data-agent="embaixador"`. A primeira (503) é o "Embaixador/a" legítimo; a segunda (539) é "Org. Parceira" com mesmo `data-agent`, o que cria conflito de estado.

- [ ] **Localizar** a linha 539 exata:

```html
<div class="agent-sel-card" onclick="selectAgent(this,'embaixador')" data-agent="embaixador" style="flex:1;min-width:140px">
```

Substituir por:
```html
<div class="agent-sel-card" onclick="selectAgent(this,'org_parceira')" data-agent="org_parceira" style="flex:1;min-width:140px">
```

- [ ] **Localizar** o objeto `agents{}` (ou dicionário equivalente) no `<script>`. Usar Grep `embaixador:` para encontrar.

Se existir entrada `'embaixador': { ... }` (ou `embaixador: { ... }`), copiar essa entrada e adicionar nova entrada para `org_parceira` com:
- nome: `"Organização Parceira"`
- descrição: extrair do contexto visual da linha 539 (o texto do card visível). Se não houver descrição inline, usar uma frase curta: `"Organizações de fora que apoiam Piracanga com recursos, conhecimento ou parcerias."`
- emoji/badge: o mesmo do `embaixador` (provavelmente 🏢 ou similar) — verificar no JS.
- categoria/cor: similar a outros agentes "externos" — verificar padrão.

Exemplo de inserção no objeto `agents`:
```javascript
'org_parceira': {
  nome: 'Organização Parceira',
  emoji: '🏢',
  desc: 'Organizações de fora que apoiam Piracanga com recursos, conhecimento ou parcerias.',
  cor: 'var(--az)'  // ou a cor que estiver em uso para agentes externos
}
```

(Ajustar conforme estrutura real do objeto. Use `Read` na região do `agents{}` antes de editar.)

- [ ] **Verificação:** abrir onboarding step 2 → clicar em "Embaixador/a" e em "Org. Parceira" separadamente. Verificar que cada um seleciona corretamente (não ambos ao mesmo tempo).

#### Step 3: Contraste `--ci` → mais escuro

- [ ] **Calcular** contraste WCAG de candidatos. Tom-alvo: `~#566A58`. Verificar:
  - `#566A58` vs `--ar:#F7F2EA` — alvo ≥ 4.5
  - `#566A58` vs `--ar2:#EDE6D6` — alvo ≥ 4.5

Use uma calculadora (contrast-ratio.com ou DevTools color picker). Se ambos passam, prosseguir. Se algum falhar, escurecer mais:
- Tentar `#506452` — recalcular
- Tentar `#4C5F4E` — recalcular
- Anotar o valor escolhido + os 2 ratios no relatório.

- [ ] **Editar** linha 12 do `index.html`:

Buscar:
```css
--ca:#1E2B20;--ca2:#3A4D3C;--ci:#5A6E5C;--ci2:#A8B8A9;
```

Substituir (com o valor escolhido — usando `#566A58` como exemplo):
```css
--ca:#1E2B20;--ca2:#3A4D3C;--ci:#566A58;--ci2:#A8B8A9;
```

- [ ] **Verificação visual:** abrir feed e perfil. Texto secundário (em `.shst-txt`, `.csb`, `.ntm`, etc.) deve estar perceptivelmente mais escuro mas ainda em verde-acinzentado. Verificar que ícones em `.tic`/`.tav` (`stroke:var(--ci)` se aplicável) não ficaram excessivamente escuros.

#### Step 4: `aria-hidden` no markup para SVGs decorativos críticos (C5)

Estratégia: complementar o JS one-liner da Onda 1 marcando SVGs no markup. Foco em SVGs já cobertos pelo seletor JS, mas que se beneficiam de markup explícito.

- [ ] **SVGs em `.bni` (28 ocorrências):** o JS one-liner já adiciona `aria-hidden`. Adicionar no markup também via `replace_all`:

Para cada padrão SVG em bnav (Vila, Vagas, Conexões, Eu, Desafios — agora removido), executar `replace_all`.

Exemplos:

Buscar: `<svg viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span>Vila</span>`
Substituir: `<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg><span>Vila</span>`
`replace_all: true`

Repetir o padrão para Vagas, Conexões, Eu (não precisa para Desafios — já foi removido).

- [ ] **SVG do logo splash `.slf`:** localizar no markup `<svg class="slf"` ou `<div class="slf"` e adicionar `aria-hidden="true"` (se for `<svg>` direto) ou em filhos relevantes.

- [ ] **Verificação:** rodar Grep para conferir que SVGs em bnav têm `aria-hidden="true"`:

```
Pattern: <svg viewBox="0 0 24 24"><path d="m3 9 9-7 9 7v11
```

Deve dar 0 matches (todos têm `aria-hidden` agora).

#### Step 5: Commit Task 3

```powershell
git add index.html
git commit -m "fix(consistency): bnav padronizada (Vila/Vagas/+/Conexoes/Eu); bug embaixador duplicado; --ci mais escuro; aria-hidden em SVGs decorativos"
```

---

### Task 4: Validação final + relatório de fechamento

**Files:**
- Create: `C:\Users\Samsung\projetos\vila-viva\docs\superpowers\reports\2026-05-13-vila-viva-onda2-relatorio.md`

#### Step 1: Tour visual 3 viewports

Para cada viewport (375×667, 390×844, 430×932), percorrer cada tela:

| Tela | Verificação |
|---|---|
| Splash | Sem regressão |
| Login | `<h1>` presente, inputs OK |
| Onboarding | 4 steps, agent-grid responsivo no step 2 |
| Feed | Topbar (`.tic` 44 área clicável), bnav padrão Vila/Vagas/+/Conexões/Eu |
| Vagas | `<h1>` "Vagas na Vila", bnav padrão |
| Perfil | `<h1>` no nome, opacidade dos botões hero melhorada, bnav padrão |
| Match | `<h1>` "Jardim de Conexões", bnav padrão |
| Desafios | `<h1>` no hero, botão "Convidar" não corta, bnav padrão (sem Desafios como autoref) |
| Dashboard | `<h1>` no header, "voltar" mais legível, bnav padrão |
| Notifs | `<h1>` "Conexões & Avisos", bnav padrão (sem Avisos como autoref) |

Anotar problemas observados — vão para o relatório.

#### Step 2: Tour modal a11y manual

Para cada um dos 7 overlays:
- [ ] `bsh` (FAB → bottom-sheet)
- [ ] `ctmo` (Conectar com X)
- [ ] `edov` (Editar perfil)
- [ ] `bdov` (Badge)
- [ ] `cadvaga-ov` (Cadastrar vaga)
- [ ] `cadprojeto-ov` (Cadastrar projeto)
- [ ] `editsec-ov` (Editar seção)

Em cada um, verificar:
- [ ] Foco vai para primeiro elemento focal interno ao abrir.
- [ ] Tab cicla dentro do modal (não vaza).
- [ ] Shift+Tab cicla ao contrário.
- [ ] ESC fecha.
- [ ] Após fechar, foco volta ao elemento que abriu.

#### Step 3: Lighthouse Acessibilidade

Em Chrome mobile (375):
1. Abrir login → Lighthouse → Accessibility → Mobile → Generate. Anotar score.
2. Ir para feed → Lighthouse novamente. Anotar score.

Alvo: ≥ 90 (ideal ≥ 95). Comparar com baseline da Onda 1.

Se < 90: abrir cada issue do Lighthouse. Se algum for de um item cobrível nesta onda, voltar à task correspondente. Se for de algo não previsto (ex.: `<a href="#">`), registrar no relatório como "achado novo Onda 3".

#### Step 4: Heading outline

Em DevTools, no Accessibility tab, navegar pelas telas e verificar headings tree. Deve haver:
- 9 telas × 1 `<h1>` cada = 9 `<h1>` totais ativos
- `<h2>` apenas em subseções, sempre após o `<h1>` da mesma tela
- 0 `<h3>` órfãos sem `<h2>` precedente

Rodar Grep:
- Pattern: `<h1` → ~9 matches
- Pattern: `<h2` → ~15-20 matches (depende de quantas subseções)

#### Step 5: Contraste

Documentar no relatório:
- Valor final de `--ci` escolhido
- Ratio sobre `--ar:#F7F2EA`
- Ratio sobre `--ar2:#EDE6D6`
- Lighthouse já não flagra `--ci` em texto

#### Step 6: Diff revisado

```powershell
git diff HEAD~3 -- index.html
```

(Ou o número de commits desta onda — provavelmente 3 antes do relatório.)

Verificar:
- [ ] Apenas as áreas previstas pela spec tocadas.
- [ ] Sem `console.log` ou debug.
- [ ] Sem refator oportunista além do previsto.
- [ ] Indentação e estilo consistentes.

#### Step 7: Escrever relatório

Criar `C:\Users\Samsung\projetos\vila-viva\docs\superpowers\reports\2026-05-13-vila-viva-onda2-relatorio.md`:

```markdown
# Vila Viva — Relatório de fechamento Onda 2

**Data:** 2026-05-13
**Spec:** `docs/superpowers/specs/2026-05-13-vila-viva-onda2-design.md`
**Plano:** `docs/superpowers/plans/2026-05-13-vila-viva-onda2-plano.md`
**Branch:** `master`

## Resumo

Aplicada a Onda 2: 10 itens (foco-trap em modais, headings semânticos, alvos de toque 44px, padronização da bnav, bugs específicos de UX/responsividade, contraste --ci sobre --ar2) corrigidos em `index.html`. [N] commits granulares. Mantém single-file.

## Itens entregues

| Código | Item | Status | Commit |
|---|---|---|---|
| S22 | Foco-trap completo nos 7 overlays (Tab/Shift+Tab/ESC + restore) | ✓ | [hash] |
| S10 | <h1> em 9 telas + <h2> em subseções | ✓ | [hash] |
| C1 | .tic alvo de toque 44×44 | ✓ | [hash] |
| C2 | .tav área clicável 44×44 via ::before | ✓ | [hash] |
| S4 | .agent-selector-grid responsivo (auto-fit minmax(140px,1fr)) | ✓ | [hash] |
| S17 | Botão Convidar com font-size menor + flex-wrap | ✓ | [hash] |
| S11 | Opacidade .25 nos botões .phero | ✓ | [hash] |
| S18 | Cor "voltar" .85 no .dhdr (e outros headers escuros) | ✓ | [hash] |
| C4 | Bnav padronizada (5 alterações: vagas/match/dashboard/desafios/notifs) | ✓ | [hash] |
| S5 | data-agent="org_parceira" novo, sem duplicação com embaixador | ✓ | [hash] |
| Contraste --ar2 | --ci atualizado para [valor] | ✓ | [hash] |
| C5 | aria-hidden no markup em SVGs .bni (28) + .slf + outros | ✓ | [hash] |

**Todos os 10 itens entregues. Nenhum adiado.**

## Métricas

| Métrica | Antes (HEAD Onda 1) | Depois |
|---|---|---|
| Lighthouse Acessibilidade (login) | [baseline] | [final] |
| Lighthouse Acessibilidade (feed) | [baseline] | [final] |
| `<h1>` no arquivo | 0 | 9 |
| `<h2>` no arquivo | 7 (modais) | [N] |
| `aria-hidden` no markup | 21 | [N] |
| Bnav idênticas (Vila/Vagas/+/Conexões/Eu) | 2/7 | 7/7 |
| `data-agent` únicos no onboarding | duplicado | único |
| Contraste --ci sobre --ar | 4.93:1 | [final]:1 |
| Contraste --ci sobre --ar2 | 4.42:1 | [final]:1 |

## Validações executadas

- [ ] Visual em 3 viewports (375/390/430) — 9 telas + 7 modais
- [ ] Tour foco-trap manual em todos os 7 modais (Tab cíclico, Shift+Tab, ESC, restore foco)
- [ ] Lighthouse ≥ 90 em login e feed
- [ ] Heading outline verificado (1 h1/tela, h2 apenas após h1)
- [ ] Calculadora WCAG: --ci ≥ 4.5 sobre --ar e --ar2
- [ ] Diff revisado sem refator oportunista

## Achados durante execução

[Preencher após execução: ou "Nenhum" ou lista]

## Backlog Onda 3+ (inalterado vs spec seção 6)

### Onda 3
- G8 resto: .stag/.bdgi/.sri/.bso2/.cst em <button>
- DX: onclick= inline → addEventListener
- S2: <a href="#"> esqueci senha → button
- S8: indicador de scroll horizontal

### Onda 4 (polimento)
- S15: typo "doo seu tempo"
- S7: borda dos chips do banner
- S16: ellipsis em stats de desafios
- S1: aria-hidden em SVG da splash (markup)

### Onda 5 (escopo maior)
- Tablet/desktop responsivo
- Separação CSS/JS em arquivos com bundler
- IDs minificados → legíveis
- WCAG AA completa + NVDA/VoiceOver
- Performance (Fonts preload, defer scripts)
- Componentização da bnav

## Próximo passo

Invocar `superpowers:requesting-code-review` para revisão final antes de encerrar a Onda 2.
```

Preencher os colchetes com valores reais durante a execução.

#### Step 8: Commit relatório

```powershell
git add docs/
git commit -m "docs: relatorio de fechamento Onda 2"
```

#### Step 9: Próximo passo — code review

Avisar ao usuário:

> "Execução da Onda 2 concluída. Relatório em `docs/superpowers/reports/2026-05-13-vila-viva-onda2-relatorio.md`. Próximo passo: `superpowers:requesting-code-review`. Quer que eu invoque agora?"

Aguardar resposta antes de invocar.

---

## Coverage matrix (autoauditoria contra spec)

| Spec item | Severidade | Task | Status |
|---|---|---|---|
| S22 foco-trap | Média (Onda 2) | T1.1, T1.2, T1.3 | Coberto |
| S10 headings | Média | T1.4, T1.5 | Coberto (9 telas) |
| C1 .tic toque 44 | Média | T2.1 | Coberto |
| C2 .tav toque 44 | Média | T2.1 | Coberto (pseudo) |
| S4 agent-grid <375 | Média | T2.2 | Coberto |
| S17 botão Convidar | Média | T2.3 | Coberto |
| S11 opacidade .phero | Média | T2.4 | Coberto |
| S18 opacidade .dhdr | Média | T2.5 | Coberto |
| C4 bnav padronização | Média | T3.1 | Coberto |
| S5 embaixador duplicado | Média | T3.2 | Coberto |
| Contraste --ci sobre --ar2 | Alta (achado) | T3.3 | Coberto |
| C5 aria-hidden markup | Baixa-Média | T3.4 | Coberto (foco em .bni e .slf) |
| Validação 3 viewports | DoD | T4.1 | Validação |
| Tour modais | DoD | T4.2 | Validação |
| Lighthouse ≥ 90 | DoD | T4.3 | Validação |
| Heading outline | DoD | T4.4 | Validação |
| Contraste verificado | DoD | T4.5 | Validação |
| Diff revisado | DoD | T4.6 | Validação |
| Relatório | DoD | T4.7 | Coberto |

Todos os 10 itens da Onda 2 + DoD têm task correspondente. Sem placeholders. Sem `TBD`. Itens fora do escopo explicitamente no backlog para ondas futuras.
