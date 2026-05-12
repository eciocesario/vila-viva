# Vila Viva — Revisão (Onda 1: itens de severidade Alta)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar todos os achados de severidade Alta da auditoria (`docs/superpowers/specs/2026-05-12-vila-viva-revisao-design.md`) em `index.html`, preservando single-file, sem refator de UX.

**Architecture:** Single-file HTML/CSS/JS inline. Todas as edições são feitas in-place no `index.html`. Sem TDD automatizado — verificação visual em DevTools (3 viewports) + Lighthouse Acessibilidade ao fim. Sem novos arquivos exceto o relatório de fechamento.

**Tech Stack:** HTML5, CSS3 (custom properties, flex/grid), JavaScript vanilla. Dev tools: Chrome/Edge DevTools (responsive mode), Lighthouse.

**Spec de referência:** `docs/superpowers/specs/2026-05-12-vila-viva-revisao-design.md`

**Convenção de "save points":** o working dir não é repo git. Task 1 oferece `git init`. Se declinado, cada task termina com cópia `index.html` → `index.backup.html` (sobrescrevendo a anterior) como fallback.

---

## File Structure

**Modificar:**
- `C:\Users\Samsung\projetos\vila-viva\index.html` — única fonte editada. Mudanças localizadas por linha conforme tabela da spec.

**Criar (ao final):**
- `C:\Users\Samsung\projetos\vila-viva\docs\superpowers\reports\2026-05-12-vila-viva-revisao-relatorio.md` — relatório de fechamento

---

## Ordem das tasks (decisão de design)

CSS-only primeiro (baixo risco, sem mexer em markup), depois mudanças de markup com semântica acessível, depois bugs visuais específicos, validação ao final. Isso permite que um eventual rollback parcial seja seguro (CSS isolado nas linhas 9–389; markup nas linhas 391–2017).

---

### Task 1: Setup — versionamento + baseline

**Files:**
- Modify: `C:\Users\Samsung\projetos\vila-viva\index.html` (none — apenas leitura/baseline)

- [ ] **Step 1: Perguntar ao usuário se quer git init**

Mostre ao usuário:
> "Vou iniciar um repositório git em `C:\Users\Samsung\projetos\vila-viva` para que os commits desta revisão fiquem visíveis no histórico (útil para stakeholders verem a evolução). Tudo bem? Se preferir não usar git, faço backup em `index.backup.html` e sigo."

Aguardar resposta. **Se sim → Step 2a. Se não → Step 2b.**

- [ ] **Step 2a (se git): Inicializar repo e fazer baseline commit**

```powershell
git init
git add index.html docs/
git commit -m "chore: baseline antes da revisao Onda 1"
```

Expected: commit criado, working tree clean.

- [ ] **Step 2b (se sem git): Backup do arquivo**

```powershell
Copy-Item index.html index.backup.html -Force
```

Expected: `index.backup.html` criado com mesmo conteúdo de `index.html`.

- [ ] **Step 3: Baseline Lighthouse (opcional, mas recomendado)**

Em Chrome/Edge:
1. Abrir `file:///C:/Users/Samsung/projetos/vila-viva/index.html`
2. DevTools → Lighthouse → Categoria "Accessibility" → Modo "Navigation" → Device "Mobile" → Generate
3. Anotar o score para login (após `setTimeout` redirecionar) e para feed (após clicar "Entrar na Vila").

Expected: score baseline registrado (provavelmente 50–70). Será usado para comparação no Task 9.

Se Lighthouse não estiver disponível, pular este step — não bloqueia.

- [ ] **Step 4: Save point**

Se git: nada a fazer (commit já feito).
Se sem git: nada a fazer (backup já feito).

---

### Task 2: Foundation CSS — viewport, contraste, foco, motion, font-size

**Files:**
- Modify: `C:\Users\Samsung\projetos\vila-viva\index.html` (linhas 5, 9–22, 72, 92, 207, 283, 1208)

**Cobre:** G1, G2, G3, G4, G6, G9 da spec.

- [ ] **Step 1: Liberar zoom do usuário (G1)**

Localize a linha 5:

```html
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
```

Substitua por:

```html
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
```

(Removido `maximum-scale=1`. Adicionado `viewport-fit=cover` por boa prática iOS notch.)

- [ ] **Step 2: Trocar height:100% por 100dvh (G2)**

Localize a linha 19:

```css
html,body{height:100%;overflow:hidden;font-family:var(--fb);background:var(--ar);color:var(--ca);-webkit-font-smoothing:antialiased}
```

Substitua por:

```css
html,body{height:100dvh;overflow:hidden;font-family:var(--fb);background:var(--ar);color:var(--ca);-webkit-font-smoothing:antialiased}
```

(`100dvh` = dynamic viewport height, encolhe corretamente quando teclado virtual abre.)

- [ ] **Step 3: Escurecer token --ci para contraste WCAG AA (G4)**

Localize a linha 12:

```css
--ca:#1E2B20;--ca2:#3A4D3C;--ci:#7A8C7C;--ci2:#A8B8A9;
```

Substitua por:

```css
--ca:#1E2B20;--ca2:#3A4D3C;--ci:#5A6E5C;--ci2:#A8B8A9;
```

(`--ci` foi de #7A8C7C → #5A6E5C. Eleva contraste sobre `--ar:#F7F2EA` de ~3.3:1 para ~4.7:1. `--ci2` permanece — só é usado em borders.)

- [ ] **Step 4: Adicionar foco visível global (G6)**

Localize o seletor universal na linha 18:

```css
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
```

**Logo após** essa linha (antes da linha 19), insira novo bloco:

```css
:focus-visible{outline:2px solid var(--v);outline-offset:2px;border-radius:inherit}
button:focus-visible,a:focus-visible{outline:2px solid var(--v);outline-offset:2px}
.lhd :focus-visible,.ohd :focus-visible,.phero :focus-visible,.dhdr :focus-visible,.qhdr :focus-visible{outline-color:#fff}
```

(Última linha: foco branco sobre headers verde escuro.)

- [ ] **Step 5: Adicionar @media prefers-reduced-motion (G9)**

No final do bloco `<style>` (imediatamente antes da linha 389 `</style>`), insira:

```css
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important;scroll-behavior:auto!important}
}
```

- [ ] **Step 6: Subir font-size de inputs para evitar auto-zoom iOS (G3)**

Existem 5 classes de input/textarea com font-size abaixo de 16px. Edite cada uma:

**6a.** Linha 72 — `.li` (login input):

```css
.li{width:100%;padding:13px 14px;background:var(--ar);border:1.5px solid var(--bo);border-radius:var(--r);font-family:var(--fb);font-size:14px;color:var(--ca);outline:none}
```

→ troque `font-size:14px` por `font-size:16px`.

**6b.** Linha 92 — `.oin` (onboarding input):

```css
.oin{width:100%;padding:13px 16px;background:var(--ar);border:1.5px solid var(--bo);border-radius:var(--r);font-family:var(--fb);font-size:15px;color:var(--ca);outline:none;transition:border-color .2s}
```

→ troque `font-size:15px` por `font-size:16px`.

**6c.** Linha 207 — `.cminp` (comment input):

```css
.cminp{flex:1;padding:8px 12px;background:var(--ar);border:1.5px solid var(--bo);border-radius:var(--r3);font-family:var(--fb);font-size:13px;color:var(--ca);outline:none}
```

→ troque `font-size:13px` por `font-size:16px`.

**6d.** Linha 283 — `.edi` (edit profile input):

```css
.edi{width:100%;padding:12px 14px;background:var(--ar);border:1.5px solid var(--bo);border-radius:var(--r);font-family:var(--fb);font-size:14px;color:var(--ca);outline:none}
```

→ troque `font-size:14px` por `font-size:16px`.

**6e.** Linha 1208 — input search inline no match screen:

```html
<input id="match-search" type="text" placeholder="Buscar por nome, habilidade ou casa..." oninput="filterMatch(this.value)"
  style="width:100%;padding:10px 12px 10px 36px;background:var(--ar);border:1.5px solid var(--bo);border-radius:var(--r3);font-family:var(--fb);font-size:14px;color:var(--ca);outline:none">
```

→ troque o `font-size:14px` inline por `font-size:16px`.

- [ ] **Step 7: Verificação visual rápida**

Abrir `index.html` em Chrome. DevTools → Toggle device (375×667).

Verificar:
- [ ] Pode dar pinch-zoom em qualquer tela (G1 ✓)
- [ ] Texto secundário (em `.csb`, `.olab`) está mais escuro/legível (G4 ✓)
- [ ] Ao dar Tab nos campos de login, aparece outline verde de 2px (G6 ✓)
- [ ] Inputs não disparam zoom automático em iOS simulado (responsive mode com iPhone) (G3 ✓)

Se algo falhou, reverter aquela mudança específica e investigar antes de seguir.

- [ ] **Step 8: Save point**

Se git:
```powershell
git add index.html
git commit -m "fix(a11y): liberar zoom, contraste --ci, foco visivel, reduced-motion, input font-size"
```

Se sem git:
```powershell
Copy-Item index.html index.backup.html -Force
```

---

### Task 3: ARIA labels em botões-ícone e SVGs decorativos

**Files:**
- Modify: `C:\Users\Samsung\projetos\vila-viva\index.html` (múltiplas linhas — todos os botões-ícone sem texto)

**Cobre:** G5, S24, C5 da spec.

**Estratégia:** percorrer markup procurando `<button>` ou `<div onclick>` que contenha **apenas** SVG ou caractere "×", sem texto visível adjacente. Adicionar `aria-label` no botão e `aria-hidden="true"` nos SVGs decorativos dentro de qualquer container com texto adjacente.

- [ ] **Step 1: Topbar — sino de notificações (linha 598)**

Antes:
```html
<div class="tic ht" onclick="goTo('notifs')" style="cursor:pointer;position:relative">
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="var(--ca2)" fill="none" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  <div class="notif-dot"></div>
  <div class="tb tr">Notificações — conexões, badges e novidades da vila</div>
</div>
```

Depois:
```html
<button type="button" class="tic ht" onclick="goTo('notifs')" aria-label="Notificações" style="cursor:pointer;position:relative;background:none;border:none;padding:0">
  <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" stroke="var(--ca2)" fill="none" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  <div class="notif-dot" aria-hidden="true"></div>
  <div class="tb tr" aria-hidden="true">Notificações — conexões, badges e novidades da vila</div>
</button>
```

(`<div>` virou `<button>` para foco/Enter/Space nativo. `style` adiciona reset de fundo/borda. Tooltip recebe `aria-hidden` porque agora a info está no `aria-label`.)

- [ ] **Step 2: Topbar — avatar do perfil (linha 603)**

Antes:
```html
<div class="tav ht" onclick="goTo('perfil')" tabindex="0">MR<div class="tb tr">Seu perfil — badges, sementes e sua jornada</div></div>
```

Depois:
```html
<button type="button" class="tav ht" onclick="goTo('perfil')" aria-label="Meu perfil" style="font-family:inherit">MR<div class="tb tr" aria-hidden="true">Seu perfil — badges, sementes e sua jornada</div></button>
```

(`tabindex="0"` removido — `<button>` é focável nativamente. Avatar text "MR" permanece como conteúdo visual.)

- [ ] **Step 3: FAB "+" em todas as bnav (7 ocorrências)**

Em cada `.bnav`, o `<button class="fab">` tem apenas SVG. Padronizar:

Buscar por:
```html
<button class="fab" onclick="openSh()"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
```

Substituir todas as ocorrências por:
```html
<button class="fab" onclick="openSh()" aria-label="Contribuir — abrir menu de ações"><svg aria-hidden="true" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>
```

Há uma variação com tooltip na primeira ocorrência da bnav do feed (linha 779) que tem `<div class="tb">`:
```html
<div class="bnc"><button class="fab ht" onclick="openSh()"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><div class="tb" style="bottom:calc(100% + 16px)">Contribuir — histórias, pedidos, projetos, eventos ou conquistas</div></button></div>
```

Para essa, manter o tooltip mas adicionar aria-label e aria-hidden no svg/tb:
```html
<div class="bnc"><button class="fab ht" onclick="openSh()" aria-label="Contribuir — abrir menu de ações"><svg aria-hidden="true" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><div class="tb" aria-hidden="true" style="bottom:calc(100% + 16px)">Contribuir — histórias, pedidos, projetos, eventos ou conquistas</div></button></div>
```

Use `replace_all` no Edit para as 6 ocorrências padrão (sem `.ht`/tooltip), depois trate manualmente a 1 com tooltip.

- [ ] **Step 4: Botões × (fechar) em modais (4 ocorrências)**

Localize cada `×` close button e adicione `aria-label="Fechar"`:

**4a.** Bottom sheet contribuir (linha 1816):
```html
<button onclick="closeSh()" style="...">×</button>
```
→ adicione `aria-label="Fechar"`:
```html
<button onclick="closeSh()" aria-label="Fechar" style="...">×</button>
```

**4b.** Contact modal (linha 1833):
```html
<button onclick="document.getElementById('ctmo').classList.remove('op')" style="...">×</button>
```
→ adicione `aria-label="Fechar"`.

**4c.** Badge overlay (linha 1893):
```html
<button onclick="document.getElementById('bdov').classList.remove('sh')" style="...">×</button>
```
→ adicione `aria-label="Fechar"`.

**4d.** Quaisquer outros `×` em modais (`#cadvaga-ov`, `#cadprojeto-ov`, `#editsec-ov` — verificar se têm; pode não ter). Os modais `#edov`, `#cadvaga-ov`, `#cadprojeto-ov`, `#editsec-ov` usam botão "Cancelar" textual em vez de `×`, então OK.

- [ ] **Step 5: Match — botão "voltar" (linha 1201)**

Antes:
```html
<button class="bkbtn" onclick="goTo('feed')" style="...">← voltar</button>
```

Texto "← voltar" já é acessível, não precisa aria-label. **Skip.**

Mesma análise para dashboard (1465), desafios (1561), notifs (1791): texto presente. Skip.

- [ ] **Step 6: Match search — ícone decorativo (linha 1206)**

Antes:
```html
<svg style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;stroke:var(--ci);fill:none;stroke-width:1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
<input id="match-search" type="text" placeholder="Buscar por nome, habilidade ou casa..." ...>
```

Adicione `aria-hidden="true"` no SVG e `aria-label="Buscar pessoas, organizações ou projetos"` no input:

```html
<svg aria-hidden="true" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;stroke:var(--ci);fill:none;stroke-width:1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
<input id="match-search" type="text" placeholder="Buscar por nome, habilidade ou casa..." aria-label="Buscar pessoas, organizações ou projetos" oninput="filterMatch(this.value)" ...>
```

(Mantém o resto dos atributos inalterados.)

- [ ] **Step 7: SVGs em .bni (bottom nav items) — aria-hidden**

Cada `.bni` tem texto label visível em `<span>`. O SVG é decorativo. Em cada um dos 7 `.bnav` blocks, adicionar `aria-hidden="true"` aos SVGs internos de `.bni`.

Para minimizar trabalho repetitivo, fazer um find-replace por padrão:

Buscar: `<div class="bni" onclick="goTo('feed')"><svg viewBox="0 0 24 24">`
Substituir por: `<div class="bni" onclick="goTo('feed')"><svg aria-hidden="true" viewBox="0 0 24 24">`

Repetir para cada combinação `class="bni..." onclick="goTo('...')"` + SVG. Há essencialmente 4 destinos: feed, vagas, match, perfil, notifs, desafios. Use `replace_all` no Edit com cuidado para não pegar SVGs de outros contextos.

Atalho mais eficiente: substituir o padrão geral em todas as ocorrências de `.bni`:

Buscar: `class="bni`
(Não, isso é genérico demais.)

**Melhor estratégia:** usar Grep para encontrar todas as linhas com `class="bni"` ou `class="bni ` ou `class="bni ht"`, depois editar cada linha. Aceitar que é um pouco repetitivo. ~25 edits.

Para reduzir, **alternativa:** adicionar no CSS uma regra global aria-hidden via `[aria-hidden]` é impossível (aria não é CSS). Mas pode-se considerar adicionar role/aria-hidden via JS na inicialização:

Em `<script>` (linha 2019+), depois das declarações iniciais, adicionar:

```javascript
// A11y: marcar SVGs decorativos
document.querySelectorAll('.bni svg, .fab svg, .tic svg, .tav svg, .nic svg, .cav svg, .waico, .slf').forEach(el=>el.setAttribute('aria-hidden','true'));
```

Esse one-liner cobre todos os SVGs decorativos sem precisar editar 25 linhas. **Adote essa abordagem para os SVGs.** Deixe Step 3, 4, 6 (aria-label nos botões pais) feitos manualmente porque são únicos.

Localização: insira a linha após `setTimeout(()=>goTo('login'),2600);` (linha 2041):

```javascript
setTimeout(()=>goTo('login'),2600);

// A11y: marcar SVGs decorativos para leitores de tela
document.querySelectorAll('.bni svg, .fab svg, .tic svg, .tav svg, .nic svg, .cav svg, .waico, .slf, .msvg').forEach(el=>el.setAttribute('aria-hidden','true'));
```

- [ ] **Step 8: Verificação visual + leitor de tela básico**

1. Abrir DevTools → Accessibility tree. Tab pelo header do feed. Verificar:
   - [ ] Botão "Notificações" anunciado com label
   - [ ] Botão "Meu perfil" anunciado
   - [ ] FAB "Contribuir" anunciado
   - [ ] SVGs aparecem como "ignored" no a11y tree

2. Em telas com modais: abrir um modal (ex.: clicar FAB → ver bottom-sheet → tabular ao × → ver "Fechar" anunciado).

- [ ] **Step 9: Save point**

Se git:
```powershell
git add index.html
git commit -m "fix(a11y): aria-label em botoes-icone, aria-hidden em svgs decorativos"
```

Se sem git: `Copy-Item index.html index.backup.html -Force`

---

### Task 4: Dialog semantics nos overlays

**Files:**
- Modify: `C:\Users\Samsung\projetos\vila-viva\index.html` (linhas dos overlays: ~1811, 1815, 1831, 1835, 1844, 1847, 1891, 1896, 1907, 1911, 1958, 1962, 2007, 2011)

**Cobre:** S23 da spec.

- [ ] **Step 1: Bottom sheet contribuir (linha 1812)**

Antes:
```html
<div class="bsh" id="bsh">
  <div class="bshd"></div>
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
    <div style="font-family:var(--fd);font-size:20px;font-weight:300;color:var(--ca)">O que você quer plantar hoje?</div>
```

Depois:
```html
<div class="bsh" id="bsh" role="dialog" aria-modal="true" aria-labelledby="bsh-title">
  <div class="bshd" aria-hidden="true"></div>
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
    <h2 id="bsh-title" style="font-family:var(--fd);font-size:20px;font-weight:300;color:var(--ca);margin:0">O que você quer plantar hoje?</h2>
```

(`<div>` do título virou `<h2>` com `id`. `margin:0` preserva visual.)

- [ ] **Step 2: Contact modal (linha 1831)**

Antes:
```html
<div class="ctmo" id="ctmo">
  <div class="ctin" style="position:relative">
    <button onclick="..." style="...">×</button>
    <div class="cthd"></div>
    <div style="font-family:var(--fd);font-size:20px;font-weight:300;color:var(--ca);margin-bottom:6px" id="ct-title">Conectar com</div>
```

Depois:
```html
<div class="ctmo" id="ctmo" role="dialog" aria-modal="true" aria-labelledby="ct-title">
  <div class="ctin" style="position:relative">
    <button onclick="document.getElementById('ctmo').classList.remove('op')" aria-label="Fechar" style="...">×</button>
    <div class="cthd" aria-hidden="true"></div>
    <h2 style="font-family:var(--fd);font-size:20px;font-weight:300;color:var(--ca);margin:0 0 6px 0" id="ct-title">Conectar com</h2>
```

(O `id="ct-title"` já existia — basta adicionar `aria-labelledby` no container. Convertido para `<h2>`.)

- [ ] **Step 3: Edit profile overlay (linha 1844)**

Antes:
```html
<div class="edov" id="edov">
  <div class="edsh">
    <div class="edshh"></div>
    <div style="font-family:var(--fd);font-size:22px;font-weight:300;color:var(--ca);margin-bottom:20px">Editar meu perfil</div>
```

Depois:
```html
<div class="edov" id="edov" role="dialog" aria-modal="true" aria-labelledby="edov-title">
  <div class="edsh">
    <div class="edshh" aria-hidden="true"></div>
    <h2 id="edov-title" style="font-family:var(--fd);font-size:22px;font-weight:300;color:var(--ca);margin:0 0 20px 0">Editar meu perfil</h2>
```

- [ ] **Step 4: Badge overlay (linha 1891)**

Antes:
```html
<div class="bdov" id="bdov" onclick="closeBadgeOverlay(event)">
  <div class="bdmo" style="position:relative">
    <button onclick="..." style="...">×</button>
    <span class="bdic" id="bdic">🌳</span>
    <div class="bdse">🌱 +15 sementes conquistadas!</div>
    <div class="bdmt" id="bdmt">Badge conquistado!</div>
```

Depois:
```html
<div class="bdov" id="bdov" role="dialog" aria-modal="true" aria-labelledby="bdmt" onclick="closeBadgeOverlay(event)">
  <div class="bdmo" style="position:relative">
    <button onclick="document.getElementById('bdov').classList.remove('sh')" aria-label="Fechar" style="...">×</button>
    <span class="bdic" id="bdic" aria-hidden="true">🌳</span>
    <div class="bdse">🌱 +15 sementes conquistadas!</div>
    <h2 class="bdmt" id="bdmt" style="margin:0">Badge conquistado!</h2>
```

(`bdmt` vira `<h2>` mantendo `id` para `aria-labelledby`. `bdic` recebe aria-hidden — emoji decorativo.)

⚠️ **Cuidado:** o CSS de `.bdmt` (linha 375) é `font-family:var(--fd);font-size:22px;...`. Verifique se ainda aplica em `<h2>`. Se o browser dev tools mostrar font default, adicione style inline `font-family:var(--fd)` na tag.

- [ ] **Step 5: Cadastrar vaga modal (linha 1908)**

Antes:
```html
<div class="edov" id="cadvaga-ov">
  <div class="edsh" style="max-height:92vh;overflow-y:auto">
    <div class="edshh"></div>
    <div style="font-family:var(--fd);font-size:22px;font-weight:300;color:var(--ca);margin-bottom:4px">Cadastrar vaga</div>
```

Depois:
```html
<div class="edov" id="cadvaga-ov" role="dialog" aria-modal="true" aria-labelledby="cadvaga-title">
  <div class="edsh" style="max-height:92vh;overflow-y:auto">
    <div class="edshh" aria-hidden="true"></div>
    <h2 id="cadvaga-title" style="font-family:var(--fd);font-size:22px;font-weight:300;color:var(--ca);margin:0 0 4px 0">Cadastrar vaga</h2>
```

- [ ] **Step 6: Cadastrar projeto modal (linha 1959)**

Antes:
```html
<div class="edov" id="cadprojeto-ov">
  <div class="edsh" style="max-height:92vh;overflow-y:auto">
    <div class="edshh"></div>
    <div style="font-family:var(--fd);font-size:22px;font-weight:300;color:var(--ca);margin-bottom:4px">Projeto ou iniciativa</div>
```

Depois:
```html
<div class="edov" id="cadprojeto-ov" role="dialog" aria-modal="true" aria-labelledby="cadproj-title">
  <div class="edsh" style="max-height:92vh;overflow-y:auto">
    <div class="edshh" aria-hidden="true"></div>
    <h2 id="cadproj-title" style="font-family:var(--fd);font-size:22px;font-weight:300;color:var(--ca);margin:0 0 4px 0">Projeto ou iniciativa</h2>
```

- [ ] **Step 7: Edit section modal (linha 2008)**

Antes:
```html
<div class="edov" id="editsec-ov">
  <div class="edsh" style="max-height:88vh;overflow-y:auto">
    <div class="edshh"></div>
    <div style="font-family:var(--fd);font-size:20px;font-weight:300;color:var(--ca);margin-bottom:16px" id="editsec-title">Editar</div>
```

Depois:
```html
<div class="edov" id="editsec-ov" role="dialog" aria-modal="true" aria-labelledby="editsec-title">
  <div class="edsh" style="max-height:88vh;overflow-y:auto">
    <div class="edshh" aria-hidden="true"></div>
    <h2 id="editsec-title" style="font-family:var(--fd);font-size:20px;font-weight:300;color:var(--ca);margin:0 0 16px 0">Editar</h2>
```

(O `id="editsec-title"` já existia. Basta adicionar aria-labelledby no container e converter para h2.)

- [ ] **Step 8: Verificação**

Abrir cada modal manualmente:
- [ ] FAB → bottom-sheet abre com title visível em h2
- [ ] Clicar em "Conectar com Josemar" (feed) → contact modal abre com h2
- [ ] Perfil → ✏️ Editar → edit overlay
- [ ] Clicar em qualquer badge no perfil → badge overlay
- [ ] FAB → "Cadastrar vaga" → modal
- [ ] Perfil → "+ Cadastrar" projeto → modal

Verificar no DevTools Accessibility tree que cada um tem `role: dialog` e título anunciado.

- [ ] **Step 9: Save point**

Se git:
```powershell
git add index.html
git commit -m "fix(a11y): dialog semantics e h2 em titulos de modais"
```

Se sem git: `Copy-Item index.html index.backup.html -Force`

---

### Task 5: Labels associados a inputs (login + onboarding + edit profile)

**Files:**
- Modify: `C:\Users\Samsung\projetos\vila-viva\index.html`

**Cobre:** G7 da spec.

**Escopo MVP:** apenas inputs em login, onboarding step 1, e edit profile overlay. Outros formulários (cadvaga, cadprojeto, editsec) ficam para a Onda 2 (backlog).

**Padrão de mudança:** `<div class="X">Texto</div>` (label visual) + `<input class="Y" placeholder="...">` (input sem id) → `<label class="X" for="campo-X">Texto</label>` + `<input id="campo-X" class="Y" placeholder="...">`.

- [ ] **Step 1: Login — formulário "Entrar" (linhas 417–418)**

Antes:
```html
<div class="lf"><div class="ll">Nome ou e-mail</div><input class="li" placeholder="monica@piracanga.org" type="text"></div>
<div class="lf"><div class="ll">Senha</div><input class="li" placeholder="••••••••" type="password"></div>
```

Depois:
```html
<div class="lf"><label class="ll" for="login-email">Nome ou e-mail</label><input id="login-email" class="li" placeholder="monica@piracanga.org" type="text" autocomplete="username"></div>
<div class="lf"><label class="ll" for="login-pwd">Senha</label><input id="login-pwd" class="li" placeholder="••••••••" type="password" autocomplete="current-password"></div>
```

(Bonus: `autocomplete` ajuda gerenciadores de senha.)

- [ ] **Step 2: Login — formulário "Criar perfil" (linhas 423–425)**

Antes:
```html
<div class="lf"><div class="ll">Nome completo</div><input class="li" placeholder="Seu nome na vila"></div>
<div class="lf"><div class="ll">E-mail</div><input class="li" placeholder="seu@email.com" type="email"></div>
<div class="lf"><div class="ll">Criar senha</div><input class="li" placeholder="Mínimo 8 caracteres" type="password"></div>
```

Depois:
```html
<div class="lf"><label class="ll" for="reg-nome">Nome completo</label><input id="reg-nome" class="li" placeholder="Seu nome na vila" autocomplete="name"></div>
<div class="lf"><label class="ll" for="reg-email">E-mail</label><input id="reg-email" class="li" placeholder="seu@email.com" type="email" autocomplete="email"></div>
<div class="lf"><label class="ll" for="reg-pwd">Criar senha</label><input id="reg-pwd" class="li" placeholder="Mínimo 8 caracteres" type="password" autocomplete="new-password"></div>
```

- [ ] **Step 3: Onboarding step 1 — identidade (linhas 444–450)**

Antes:
```html
<div class="ose"><div class="pretag">✦ Dados pré-preenchidos do Censo 2025</div>
  <div class="olab">Seu nome</div><input class="oin" type="text" value="Mónica Reis">
</div>
<div class="ose"><div class="olab">Casa em Piracanga</div>
  <select class="oin osel"><option>Terra Maré</option>...</select>
</div>
<div class="ose"><div class="olab">Tempo em Piracanga</div><input class="oin" type="text" value="14 anos"></div>
```

Depois:
```html
<div class="ose"><div class="pretag">✦ Dados pré-preenchidos do Censo 2025</div>
  <label class="olab" for="ob-nome">Seu nome</label><input id="ob-nome" class="oin" type="text" value="Mónica Reis">
</div>
<div class="ose"><label class="olab" for="ob-casa">Casa em Piracanga</label>
  <select id="ob-casa" class="oin osel"><option>Terra Maré</option>...</select>
</div>
<div class="ose"><label class="olab" for="ob-tempo">Tempo em Piracanga</label><input id="ob-tempo" class="oin" type="text" value="14 anos"></div>
```

(Mantenha o `<option>` interno inalterado — só mostro a primeira opção como referência.)

- [ ] **Step 4: Onboarding step 4 — intenção (linha 585)**

Antes:
```html
<div class="ose">
  <div class="olab">Minha intenção para esta estação</div>
  <textarea class="oin" rows="3">Quero fortalecer o senso de comunidade...</textarea>
</div>
```

Depois:
```html
<div class="ose">
  <label class="olab" for="ob-intencao">Minha intenção para esta estação</label>
  <textarea id="ob-intencao" class="oin" rows="3">Quero fortalecer o senso de comunidade e conectar pessoas com talentos complementares.</textarea>
</div>
```

- [ ] **Step 5: Edit profile overlay (linhas 1848–1884)**

Há ~7 campos. Convertê-los todos. Padrão:

Antes:
```html
<div class="edf"><div class="edl">Nome</div><input class="edi" value="Mónica Reis"></div>
```

Depois:
```html
<div class="edf"><label class="edl" for="ed-nome">Nome</label><input id="ed-nome" class="edi" value="Mónica Reis" autocomplete="name"></div>
```

Repetir para cada `<div class="edf">`:

| Linha aprox. | id sugerido | Tipo de campo |
|---|---|---|
| 1848 | `ed-nome` | input text |
| 1849 | `ed-casa` | input text |
| 1850 | `ed-tagline` | input text |
| 1851 | `ed-tempo` | input text |
| 1852–1875 | `ed-agente` | select (com optgroup) |
| 1877 | `ed-intencao` | textarea |
| 1878 | `ed-whatsapp` | input tel |
| 1879 | `ed-skills` | container (não input direto — labela o grupo) |
| 1884 | `ed-pwd` | input password |

Para o item "Habilidades" (linha 1879), como é um container com várias span clicáveis, em vez de `<label for=>` usar `role="group" aria-labelledby`:

Antes:
```html
<div class="edf"><div class="edl">Habilidades (clique para editar)</div>
  <div class="sgr" style="margin-top:6px">
    <span class="stag s" onclick="toggleSkill(this)">🎨 Artes</span>...
  </div>
</div>
```

Depois:
```html
<div class="edf">
  <div class="edl" id="ed-skills-lbl">Habilidades (clique para editar)</div>
  <div class="sgr" role="group" aria-labelledby="ed-skills-lbl" style="margin-top:6px">
    <span class="stag s" onclick="toggleSkill(this)">🎨 Artes</span>...
  </div>
</div>
```

- [ ] **Step 6: Verificação**

DevTools → Accessibility tree. Em cada input do login/onboarding/edit-profile:
- [ ] Anunciado com nome do label (não "input sem nome")
- [ ] Clicar no texto do label foca o input

Testar manualmente: clicar em "Senha" no login → input de senha foca.

- [ ] **Step 7: Save point**

Se git:
```powershell
git add index.html
git commit -m "fix(a11y): label[for] associado em login, onboarding e edit profile"
```

Se sem git: `Copy-Item index.html index.backup.html -Force`

---

### Task 6: Bottom nav navegável por teclado

**Files:**
- Modify: `C:\Users\Samsung\projetos\vila-viva\index.html` (cada `.bnav` block — 7 ocorrências)

**Cobre:** G8 (MVP — só nav). Resto vai para Onda 3.

**Estratégia:** todos os `<div class="bni" onclick="...">` viram `<button class="bni" onclick="...">` para foco/Enter/Space nativos. CSS de `.bni` já está compatível (display flex, ok em button).

- [ ] **Step 1: Adicionar reset CSS para `button.bni`**

Encontrar a regra `.bni` no CSS (linha 122):

```css
.bni{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;padding:8px 4px;color:var(--ci);transition:color .15s;position:relative}
```

Substituir por:

```css
.bni{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;padding:8px 4px;color:var(--ci);transition:color .15s;position:relative;background:none;border:none;font-family:var(--fb)}
```

(Reset de background/border para `<button>`; herdar font-family.)

- [ ] **Step 2: Converter todos os `<div class="bni...">` em `<button class="bni..." type="button">`**

Há ocorrências em cada `.bnav` (telas: feed, vagas, perfil, match, dashboard, desafios, notifs). Padrão de conversão:

Buscar:
```
<div class="bni
```

Substituir por:
```
<button type="button" class="bni
```

E correspondentemente buscar/fechar:
```
</div></div>
    <div class="bnc">
```

→ não, isso quebra. Cada `.bni` fecha com `</div>` simples. Vamos com find-replace localizado.

**Abordagem mais segura:** ler cada bnav (~7 blocos) e fazer Edit explícito em cada um, ou usar `Edit` com `replace_all` mas com strings únicas o suficiente.

**Estratégia recomendada:** usar `Edit` com `replace_all` no padrão exato de abertura e separadamente o fechamento de cada `.bni`. Mas como cada `.bni` termina com `</div>` que é genérico demais, faça assim:

Para cada item de bnav, o padrão é:
```html
<div class="bni..." onclick="goTo('XXX')"><svg ...>...</svg><span>YYY</span><div class="tb">ZZZ</div></div>
```
ou sem tooltip:
```html
<div class="bni..." onclick="goTo('XXX')"><svg ...>...</svg><span>YYY</span></div>
```

Faça 2 replace_all:

**2a.** Buscar:
```
<div class="bni
```
Substituir por:
```
<button type="button" class="bni
```
Marca `replace_all`.

(Isso converte todas as 28+ aberturas.)

**2b.** Agora o problema é que cada `<button>` precisa fechar com `</button>` e não `</div>`. Como temos um único `</div>` no fim de cada `.bni`, e há outras `</div>` no doc, **não** podemos fazer um replace_all genérico.

**Solução:** depois do replace de abertura, ler o arquivo, encontrar cada linha que começa com `<button type="button" class="bni"`, achar o `</div>` correspondente nessa linha (são todas em linha única) e trocar por `</button>`.

Como cada item de bnav é uma linha única que termina em `</div>` antes de uma quebra de linha, podemos fazer um regex via `Edit`:

Para cada uma das ~28 linhas, fazer um Edit individual ou usar o seguinte padrão suficientemente único:

```
<span>Vila</span></div>
```
→
```
<span>Vila</span></button>
```

E equivalente para `Vagas`, `Conexões`, `Eu`, `Desafios`, `Avisos`:

| Buscar | Substituir |
|---|---|
| `<span>Vila</span></div>` | `<span>Vila</span></button>` |
| `<span>Vagas</span></div>` | `<span>Vagas</span></button>` |
| `<span>Conexões</span></div>` | `<span>Conexões</span></button>` |
| `<span>Eu</span></div>` | `<span>Eu</span></button>` |
| `<span>Desafios</span></div>` | `<span>Desafios</span></button>` |
| `<span>Avisos</span></div>` | `<span>Avisos</span></button>` |

E para casos com tooltip dentro do bni (formato: `<span>X</span><div class="tb">...</div></div>`):

| Buscar | Substituir |
|---|---|
| `Vagas — voluntariado e emprego remunerado na vila</div></div>` | `Vagas — voluntariado e emprego remunerado na vila</div></button>` |
| `Jardim de Conexões — matching por afinidade e tipo de agente</div></div>` | `Jardim de Conexões — matching por afinidade e tipo de agente</div></button>` |
| `Seu perfil — agente, badges, sementes e sua jornada</div></div>` | `Seu perfil — agente, badges, sementes e sua jornada</div></button>` |
| `Desafios baseados no Censo 2025 e no Bioma</div></div>` | `Desafios baseados no Censo 2025 e no Bioma</div></button>` |
| `Feed principal da comunidade</div></div>` | `Feed principal da comunidade</div></button>` |

Aplicar todos como `Edit` com `replace_all`. Após todos os replaces, fazer um Grep final em `<div class="bni` no arquivo — não deve retornar nada.

- [ ] **Step 3: Verificação de integridade**

```powershell
# (Use o Grep tool, não o PowerShell direto)
```

Rodar Grep:
- Pattern: `<div class="bni`
- Path: `C:\Users\Samsung\projetos\vila-viva\index.html`
- Expected: 0 matches

Se aparecer match, há conversão pendente — investigar e corrigir.

Também:
- Pattern: `<button type="button" class="bni`
- Expected: ~28 matches (5 navs × ~5 items, com algumas variações).

- [ ] **Step 4: Verificação visual + teclado**

Abrir feed em browser. Pressionar Tab repetidamente:
- [ ] Foco visível percorre a topbar e desce para a bnav
- [ ] Em cada item da bnav, vê outline verde
- [ ] Enter no item ativa a navegação (goTo)
- [ ] Layout da bnav inalterado (sem deslocamento)

- [ ] **Step 5: Save point**

Se git:
```powershell
git add index.html
git commit -m "fix(a11y): bottom nav items convertidos em <button> focaveis"
```

Se sem git: `Copy-Item index.html index.backup.html -Force`

---

### Task 7: Tooltips — title fallback + clamp de overflow

**Files:**
- Modify: `C:\Users\Samsung\projetos\vila-viva\index.html` (linha 40 — CSS de `.tb`; markup das `.ht` críticas)

**Cobre:** G10, G11, C6 da spec.

**Estratégia:** o conteúdo dos tooltips `.tb` é informativo. Para garantir acesso por touch e por leitor de tela quando o `.ht` é decorativo, adicionar `title=""` espelhando o texto **nos elementos `.ht` que tenham filho com texto longo informativo** (badges, filtros, chips do banner, etc.). Para tooltips em elementos já focáveis (button/a) o `:focus .tb` já funciona — mas adicionar `title` reforça.

**Decisão de escopo:** vou cobrir apenas os tooltips mais informativos onde a tooltip é a única forma de obter a info. Os triviais ("Em comum", "Aprendi algo") podem ficar.

- [ ] **Step 1: Adicionar clamp ao `.tb` no CSS (G11)**

Encontrar a regra `.tb` (linha 40):

```css
.tb{display:none;position:absolute;bottom:calc(100% + 10px);left:50%;transform:translateX(-50%);background:var(--ca);color:#fff;font-size:12px;line-height:1.5;padding:9px 12px;border-radius:10px;width:210px;z-index:9999;pointer-events:none;box-shadow:0 4px 20px rgba(0,0,0,.25);font-family:var(--fb)}
```

Substituir `width:210px` por `width:max-content;max-width:min(210px,calc(100vw - 32px))`:

```css
.tb{display:none;position:absolute;bottom:calc(100% + 10px);left:50%;transform:translateX(-50%);background:var(--ca);color:#fff;font-size:12px;line-height:1.5;padding:9px 12px;border-radius:10px;width:max-content;max-width:min(210px,calc(100vw - 32px));z-index:9999;pointer-events:none;box-shadow:0 4px 20px rgba(0,0,0,.25);font-family:var(--fb)}
```

(Tooltip cresce conforme conteúdo até o limite menor entre 210px e (largura da viewport - 32px de margem segura).)

- [ ] **Step 2: Adicionar suporte a touch e teclado nos tooltips via JS**

Touch devices não disparam `:hover`. Adicionar listener que mostra tooltip ao tocar e esconde depois de 3s ou ao tocar fora.

No `<script>` (depois do bloco a11y adicionado no Task 3 Step 7), adicionar:

```javascript
// Tooltips: suporte a touch e teclado (focus já coberto pelo CSS via .ht:focus .tb)
document.addEventListener('click',function(e){
  // Esconder qualquer tooltip aberto manualmente
  document.querySelectorAll('.tb.touch-open').forEach(tb=>tb.classList.remove('touch-open'));
  // Se clicou em um .ht que não é botão/link, abrir tooltip dele
  const ht=e.target.closest('.ht');
  if(ht && !ht.matches('button,a,input,select,textarea,[role="button"]')){
    const tb=ht.querySelector(':scope > .tb');
    if(tb){tb.classList.add('touch-open');setTimeout(()=>tb.classList.remove('touch-open'),3000);}
  }
});
```

E adicionar a regra CSS na linha **antes** da linha 44 (`.ht:hover .tb,.ht:focus .tb{display:block}`):

```css
.ht:hover .tb,.ht:focus-within .tb,.tb.touch-open{display:block}
```

(Substituir a linha 44 atual:
```css
.ht:hover .tb,.ht:focus .tb{display:block}
```
)

(`:focus-within` cobre quando o `.ht` é um container e o foco está em um filho. `.touch-open` é a classe disparada via JS.)

- [ ] **Step 3: Migrar tooltips críticos para `title=` (fallback nativo)**

Atalho via JS: ao carregar a página, espelhar o texto de cada `.tb` para o `title=` do pai `.ht`. Isso garante SR/touch suporte sem editar markup.

Adicionar no `<script>` (logo após o trecho do Step 2):

```javascript
// Tooltips: espelhar texto para title= como fallback nativo
document.querySelectorAll('.ht').forEach(el=>{
  const tb=el.querySelector(':scope > .tb');
  if(tb && !el.hasAttribute('title')){
    const txt=tb.textContent.trim();
    if(txt) el.setAttribute('title',txt);
  }
});
```

(Não sobrescreve `title=` existentes — alguns botões já têm.)

- [ ] **Step 4: Verificação visual + touch**

1. Em DevTools, ativar device mobile (Toggle device toolbar).
2. Touch (clique) em uma badge com tooltip (ex.: pretag "✦ Conquista coletiva" no feed) → tooltip aparece por ~3s.
3. Hover de um botão na bnav (em modo desktop) → ainda mostra tooltip.
4. Tab por botões com tooltip → tooltip aparece com foco visível.

5. Forçar viewport 375px. Hover (ou inspecionar) em tooltip próximo à borda direita (ex.: `.tb.tr` na bnav perfil) → não estoura o viewport.

- [ ] **Step 5: Save point**

Se git:
```powershell
git add index.html
git commit -m "fix(a11y/ux): tooltips com title fallback, touch support, clamp de overflow"
```

Se sem git: `Copy-Item index.html index.backup.html -Force`

---

### Task 8: Bugs visuais responsividade — share strip + topbar feed

**Files:**
- Modify: `C:\Users\Samsung\projetos\vila-viva\index.html` (linha 194 — `.shst`; linha 596 — topbar do feed)

**Cobre:** C3, S6 da spec.

- [ ] **Step 1: Adicionar flex-wrap ao .shst (C3)**

Encontrar (linha 194):

```css
.shst{background:var(--ar2);border-top:1px solid var(--bo);padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:8px}
```

Substituir por:

```css
.shst{background:var(--ar2);border-top:1px solid var(--bo);padding:10px 14px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}
.shst-txt{min-width:0}
```

(`flex-wrap` permite quebrar em 2 linhas em 375. `min-width:0` no texto evita que ele empurre os botões para fora.)

⚠️ Importante: já existe a regra `.shst-txt{font-size:12px;color:var(--ci);flex:1;line-height:1.4}` na linha 195. Localize-a e troque por:

```css
.shst-txt{font-size:12px;color:var(--ci);flex:1;line-height:1.4;min-width:140px}
```

(`min-width:140px` garante que o texto não fica espremido em 1 palavra por linha — quando o conteúdo passa do limite, wraps inteiro.)

- [ ] **Step 2: Topbar do feed — flex-shrink e nowrap (S6)**

Encontrar (linha 597 dentro de `#feed`):

```html
<div style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--ci)"><div class="pud"></div>18 online</div>
```

Substituir por:

```html
<div style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--ci);white-space:nowrap;flex-shrink:0"><div class="pud" aria-hidden="true"></div>18 online</div>
```

Também adicionar `flex-shrink:0` no container `.trig` (linha 596):

Antes:
```html
<div class="trig">
```

Depois:
```html
<div class="trig" style="flex-shrink:0">
```

(A regra `.trig` na linha 112 já tem `display:flex;align-items:center;gap:10px` mas não previne shrink.)

Alternativamente, e melhor: editar diretamente a regra CSS `.trig`. Encontre linha 112:

```css
.trig{display:flex;align-items:center;gap:10px}
```

Troque por:

```css
.trig{display:flex;align-items:center;gap:10px;flex-shrink:0}
```

E **remova** o `style="flex-shrink:0"` inline que sugeri acima — fica no CSS. Mantenha só a edição inline do `<div>` interno com `white-space:nowrap;flex-shrink:0`.

Resumo final desse step:
1. CSS linha 112: adicionar `;flex-shrink:0` na regra `.trig`.
2. HTML linha 597: adicionar `white-space:nowrap;flex-shrink:0` no style inline do "18 online", e `aria-hidden="true"` no `<div class="pud">`.

- [ ] **Step 3: Verificação visual em 375px**

Abrir feed em 375×667:
- [ ] Topbar não quebra em 2 linhas
- [ ] Avatar "MR" e sino visíveis e clicáveis na direita
- [ ] Em uma card com `.shst` (compartilhar), texto + botões cabem; se não cabem, quebram em linhas próprias sem cortar botão "Copiar"

- [ ] **Step 4: Save point**

Se git:
```powershell
git add index.html
git commit -m "fix(ui): flex-wrap em share strip; nowrap em topbar feed"
```

Se sem git: `Copy-Item index.html index.backup.html -Force`

---

### Task 9: Validação final + relatório de fechamento

**Files:**
- Create: `C:\Users\Samsung\projetos\vila-viva\docs\superpowers\reports\2026-05-12-vila-viva-revisao-relatorio.md`

- [ ] **Step 1: Validação visual nos 3 viewports**

Abrir `index.html` no browser. DevTools → Toggle device toolbar.

Para cada viewport (375×667, 390×844, 430×932), percorrer cada tela:

| Tela | Verificação |
|---|---|
| Splash | Carrega, sem overflow |
| Login | Inputs respondem, tabs funcionam, sem zoom indesejado ao focar input |
| Onboarding | 4 passos navegam, agent grid em 2 colunas sem corte |
| Feed | Cards renderizam, topbar sem quebra, share strip quebra OK |
| Vagas | Tabs vol/rem funcionam, cards inteiros |
| Perfil | Hero, agent card, badges grid 4x2, projetos |
| Match | Tabs pessoas/orgs/projetos, search funciona, filtros arq |
| Desafios | 5 desafios renderizam, progress bars OK |
| Dashboard | Charts/bars sem quebra |
| Notifs | Itens lidos, botões clicáveis |
| Modals | FAB → bottom-sheet abre e fecha; ⚊ × foca corretamente |

Anotar problemas observados em uma lista — vão para o relatório.

- [ ] **Step 2: Lighthouse Acessibilidade — login e feed**

Em Chrome:

1. Abrir `file:///C:/Users/Samsung/projetos/vila-viva/index.html` em modo mobile (375x667).
2. Após a splash ir para login. DevTools → Lighthouse → Categoria "Accessibility" → Device "Mobile" → Generate report.
3. Anotar score (alvo: ≥ 90).
4. Clicar "Entrar na Vila" → ir para feed. Rodar Lighthouse de novo.
5. Anotar score do feed (alvo: ≥ 90).

Se score < 90, abrir cada "issue" no Lighthouse e ver se é coberto por algum item de severidade alta da spec. Se sim, voltar à task correspondente e arrumar. Se não, registrar no relatório como "achado novo — Onda 2".

- [ ] **Step 3: Diff final + verificação de não-mexer-em-coisa-não-pedida**

Se git:
```powershell
git diff HEAD~7 -- index.html | Out-Host
```

(ou contar commits desde o baseline e ajustar `HEAD~N`)

Revisar:
- [ ] Apenas as áreas previstas pela spec foram tocadas
- [ ] Nenhum console.log, debug, ou comentário-ruído adicionado
- [ ] Nenhuma feature/UX nova (só fixes)
- [ ] Indentação e estilo do código consistentes com o restante do arquivo

- [ ] **Step 4: Escrever relatório de fechamento**

Criar `C:\Users\Samsung\projetos\vila-viva\docs\superpowers\reports\2026-05-12-vila-viva-revisao-relatorio.md` com:

```markdown
# Vila Viva — Relatório de fechamento Onda 1

**Data:** 2026-05-12
**Spec:** `docs/superpowers/specs/2026-05-12-vila-viva-revisao-design.md`
**Plano:** `docs/superpowers/plans/2026-05-12-vila-viva-revisao-plano.md`

## Resumo
[1 parágrafo: o que mudou no index.html e por quê]

## Itens entregues (Altos)
[Lista por código G/C/S referenciando linhas finais. Marcar ✓ resolvido / ⏸️ adiado com justificativa]

- ✓ G1: viewport zoom liberado
- ✓ G2: 100dvh em html/body
- ✓ G3: input font-size 16px (5 classes)
- ✓ G4: --ci escurecido para #5A6E5C
- ✓ G5: aria-label em botões-ícone + aria-hidden via JS one-liner
- ✓ G6: :focus-visible global
- ✓ G7: label[for] em login/onboarding/edit profile
- ✓ G8 (MVP): .bni convertidos em <button>
- ✓ G9: @media prefers-reduced-motion
- ✓ G10: title fallback + touch support em tooltips
- ✓ G11: max-width clamp em .tb
- ✓ C3: flex-wrap em .shst
- ✓ S6: white-space e flex-shrink em topbar feed
- ✓ S23: role=dialog em todos os 7 overlays
- ✓ S24: aria-label="Fechar" em todos os × buttons
- ⏸️ S5 (duplicação embaixador): adiado para Onda 2 — requer decisão de UX

## Métricas

| | Antes | Depois |
|---|---|---|
| Lighthouse Acessibilidade (login) | [baseline] | [final] |
| Lighthouse Acessibilidade (feed) | [baseline] | [final] |
| @media queries no arquivo | 0 | 1 (prefers-reduced-motion) |
| Botões com aria-label | 0 | [count] |
| Inputs com label[for] | 0 | [count em login+onboarding+edit] |

## Achados durante execução (não previstos)
[Se algum: descrever. Se nenhum: "Nenhum."]

## Backlog Onda 2 (próximas iterações)
Inalterado conforme spec seção 7. Itens prioritários:
- C1/C2: alvos de toque .tic/.tav
- C4: bnav padronização
- S22: foco-trap em modais
- G8 resto: .stag, .bdgi, .sri, .bso2 em buttons

## Validação manual
- [x] 3 viewports OK (375 / 390 / 430)
- [x] Lighthouse Acessibilidade ≥ 90 em login e feed
- [x] Diff revisado sem refator oportunista
- [x] Tooltips testados em touch + teclado
```

Preencher os colchetes com valores reais.

- [ ] **Step 5: Save point final**

Se git:
```powershell
git add index.html docs/
git commit -m "docs: relatorio de fechamento Onda 1"
```

Se sem git: `Copy-Item index.html index.backup.html -Force`

- [ ] **Step 6: Próximo passo — code review**

Avisar ao usuário:

> "Execução concluída. Relatório em `docs/superpowers/reports/2026-05-12-vila-viva-revisao-relatorio.md`.
>
> Conforme combinado na spec, próximo passo é `superpowers:requesting-code-review` para revisão final antes de fechar a rodada. Quer que eu invoque agora?"

Aguardar resposta antes de invocar.

---

## Coverage matrix (autoauditoria contra spec)

| Spec item | Severidade | Task | Status |
|---|---|---|---|
| G1 viewport zoom | Alta | T2.1 | Coberto |
| G2 100dvh | Média | T2.2 | Coberto (subiu para incluir já que é trivial) |
| G3 input font-size | Alta | T2.6 | Coberto |
| G4 contraste --ci | Alta | T2.3 | Coberto |
| G5 aria-label icon | Alta | T3.1–3.7 | Coberto |
| G6 :focus-visible | Alta | T2.4 | Coberto |
| G7 label[for] | Alta | T5 | Coberto (MVP: login+onb+edit) |
| G8 nav button | Alta (nav) | T6 | Coberto (MVP) |
| G9 reduced-motion | Alta | T2.5 | Coberto |
| G10 title fallback | Alta | T7.3 | Coberto |
| G11 tooltip clamp | Alta | T7.1 | Coberto |
| C3 .shst flex-wrap | Alta | T8.1 | Coberto |
| C6 .ht div focus | Alta | T6 + T7.2 | Coberto (nav via button; resto via :focus-within e .touch-open) |
| S6 topbar feed | Alta | T8.2 | Coberto |
| S23 dialog semantics | Alta | T4 | Coberto |
| S24 close × labels | Alta | T3.4 | Coberto |
| Lighthouse ≥ 90 | DoD | T9.2 | Validação |
| Validação 3 viewports | DoD | T9.1 | Validação |
| Relatório | DoD | T9.4 | Coberto |

Todos os Altos têm task. Sem placeholders. Sem `TBD`. Itens médios/baixos explicitamente fora do escopo desta onda.
