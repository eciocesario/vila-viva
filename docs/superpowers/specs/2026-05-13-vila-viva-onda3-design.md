# Vila Viva — Onda 3a: G8 resto, S2 links, S8 scroll indicator

**Data:** 2026-05-13
**Autor:** Eciocesar Cesário (eciocesario@gmail.com), com Claude (Opus 4.7)
**Arquivo-alvo:** `index.html` (single-file HTML/CSS/JS inline)
**Spec da Onda 1:** `docs/superpowers/specs/2026-05-12-vila-viva-revisao-design.md`
**Spec da Onda 2:** `docs/superpowers/specs/2026-05-13-vila-viva-onda2-design.md`
**Relatório da Onda 2:** `docs/superpowers/reports/2026-05-13-vila-viva-onda2-relatorio.md`
**Status:** Spec validada com o usuário (4 decisões confirmadas) · aguardando plano de implementação

---

## 1. Objetivo & escopo

Completar o backlog de a11y e UX deixado pela Onda 2 sem entrar no refator amplo de `onclick=` para `addEventListener` (que vira Onda 3b separada por volume e risco). Mantém o single-file `index.html`, sem refator estrutural.

### Dentro do escopo (3 itens, ~64 alterações de elementos)

- **G8 (resto):** converter os 55 elementos `<div onclick>`/`<span onclick>` das 5 classes (`.stag`, `.bdgi`, `.sri`, `.bso2`, `.cst`) em `<button type="button">` com reset CSS apropriado por classe. Resultado: foco/Enter/Space/role nativos, sem necessidade de keyboard handlers manuais.
- **S2:** 2 ocorrências de `<a href="#">` (Esqueci senha + Criar conta no `#login`) convertidas em `<button type="button">` com style inline preservando aparência de link (`background:none;border:none;color:var(--v);text-decoration:underline;cursor:pointer;font:inherit;padding:0`).
- **S8:** indicador visual de scroll horizontal nos 7 rows que rolam (`.strsc`, `.ffs`, `.mapf`, `#agent-filter-row`, tab row do match, filter row do match, row de filtros de desafios). Implementação: `mask-image:linear-gradient(to right, black 85%, transparent 100%)` + `-webkit-mask-image` análogo. Sem JS, sem listener de scroll.

### Fora do escopo (continua no backlog)

- **Onda 3b:** refator dos 217 `onclick=` inline para `addEventListener` (DX/manutenção, não é correção de bug)
- **Onda 4:** typo "doo seu tempo", borda de chips, ellipsis em stats, `pointer-events:none` em `.tav::before`, double-title em vagas, revisão de hierarquia visual de `--ci:#566A58`
- **Onda 5:** responsivo tablet/desktop, separação CSS/JS, IDs legíveis, WCAG AA completa, performance, componentização da bnav

---

## 2. Decisões de design (validadas com o usuário em 2026-05-13)

| # | Decisão | Como aplicar |
|---|---|---|
| 1 | Escopo Onda 3 dividido em 3a (esta) e 3b (DX refactor futuro) | Apenas G8 + S2 + S8 nesta rodada |
| 2 | **G8:** converter todos os 5 tipos em `<button type="button">` (não `role="button"`) | Reset CSS na regra de classe; `Enter`/`Space`/foco nativos eliminam necessidade de keyboard handlers manuais. Mesma estratégia da Onda 1 com `.bni` |
| 3 | **S8:** `mask-image` com linear-gradient | Sem JS, sem listener; gradient fica visível mesmo no fim do scroll (trade-off aceitável para protótipo) |
| 4 | **S2:** ambos `<a href="#">` viram `<button type="button">` | Style inline preserva visual de link sublinhado verde |

---

## 3. Contexto técnico (contagens reais no `index.html` atual, HEAD `445c5ed`)

| Item | Ocorrências | Risco | Estratégia |
|---|---|---|---|
| `.stag` (skill tags inline) | ~25 (perfil + edit overlay) | médio | converter span→button, manter `display:inline-flex` |
| `.bdgi` (badge cards) | 8 (grid 4×2) | baixo | div→button + reset CSS |
| `.sri` (search result items) | ~10 (match) | baixo | div→button, manter `width:100%` |
| `.bso2` (bottom-sheet options) | 6 (FAB sheet) | baixo | div→button + manter tooltip `.tb` |
| `.cst` (banner chip) | 1 (feed) | trivial | div→button + manter tooltip |
| `<a href="#">` (S2) | 2 (login) | trivial | trocar tag |
| Rows `overflow-x:auto` (S8) | 7 | trivial | adicionar `mask-image` |

**Total esperado:** ~57 conversões de markup + 7 atualizações de regra/style com `mask-image` + 5 resets de CSS por classe G8 + 2 buttons-as-link.

---

## 4. Metodologia

1. **Reset CSS por classe (T1 prep):** adicionar `background:none;border:none;font:inherit;color:inherit;text-align:inherit;cursor:pointer;` (subset apropriado) em cada uma das 5 regras de classe G8. Sem isso, button trará default UA styling (cinza, border, font system) e quebra o visual.

2. **Conversão de markup (T1):** localizar cada `<div class="X" onclick="...">` ou `<span class="X" onclick="...">` e converter em `<button type="button" class="X" onclick="...">`. Manter o `onclick` inline para esta rodada (refator vira Onda 3b). Fechar `</button>` no lugar de `</div>`/`</span>`.

3. **S2 + S8 (T2):** trocar tags `<a href="#">` por `<button>`; adicionar `mask-image` nas 7 regras/styles de scroll-x.

4. **Validação (T3):**
   - Grep checks (contagens antes/depois)
   - Manual: o usuário valida visual nos 3 viewports + tour keyboard (Tab por cada tela; Enter/Space em cada item convertido dispara `onclick`).
   - Code-review externo via `superpowers:requesting-code-review`.
   - Tag `onda3-fechada` no commit final.

Sem TDD automatizado.

---

## 5. Plano de tasks (referência para writing-plans)

### Task 1 — A11y G8 conversões (`fix(a11y):`)

**Cobre:** G8 resto (Onda 1 backlog).

**Files:** Modify `C:\Users\Samsung\projetos\vila-viva\index.html`.

**Sub-passos:**

1. **Reset CSS por classe.** Para cada classe (`.stag`, `.bdgi`, `.sri`, `.bso2`, `.cst`), adicionar à regra existente:
   ```css
   background:none;border:none;font:inherit;color:inherit;text-align:left;cursor:pointer;
   ```
   (`text-align` pode ser `center` ou `left` dependendo da classe — verificar visual antes de finalizar.)

2. **`.stag` conversões.** Localizar todas as ocorrências de `<span class="stag` (e variantes `stag s` selecionado, `stag` em `#perfil`, em `#edov` overlay). Converter cada para `<button type="button" class="stag` mantendo classe e onclick. Trocar `</span>` → `</button>`. Verificar que `toggleSkill(this)` no `onclick` ainda funciona (passa o próprio elemento).

3. **`.bdgi` conversões.** Localizar `<div class="bdgi"` com onclick. Converter para button. Geralmente o conteúdo é emoji + nome — verificar `text-align:center` na regra `.bdgi`.

4. **`.sri` conversões.** Localizar `<div class="sri"` com onclick. Card de result. Verificar que `width:100%` ou similar continua aplicável em button.

5. **`.bso2` conversões.** Localizar `<div class="bso2"` ou `<div class="bso2 ht"`. Converter. Atenção: alguns têm tooltip `<div class="tb">` interno — preservar.

6. **`.cst` conversão.** Localizar `<div class="cst ht"` (linha ~623, feed banner). Converter para button mantendo tooltip.

7. **Verificação Grep:**
   - `<div class="stag` + onclick → 0
   - `<span class="stag` + onclick → 0
   - `<div class="bdgi"` + onclick → 0
   - `<div class="sri"` + onclick → 0
   - `<div class="bso2` + onclick → 0
   - `<div class="cst` + onclick → 0
   - `<button` + cada uma das 5 classes ≥ contagem original

8. **Commit:** `fix(a11y): converter .stag/.bdgi/.sri/.bso2/.cst em <button> focaveis (G8 resto)`

### Task 2 — UX S2 links + S8 scroll indicator (`fix(ui):`)

**Cobre:** S2, S8.

**Files:** Modify `C:\Users\Samsung\projetos\vila-viva\index.html`.

**Sub-passos:**

1. **S2 — converter `<a href="#">` em `<button type="button">`.** Localizar as 2 ocorrências em `#login` (Esqueci senha + Criar conta). Para cada:
   - Trocar `<a href="#" ...>` por `<button type="button" ...>`.
   - Trocar `</a>` por `</button>`.
   - Adicionar style inline (se ainda não tiver): `background:none;border:none;color:var(--v);text-decoration:underline;cursor:pointer;font:inherit;padding:0`.
   - Se já houver `onclick` no link, manter; se não houver, adicionar handler apropriado (provavelmente `onclick="alert('Em breve')"` ou similar — decidir no momento).

2. **S8 — mask-image nos 7 rows.**

   Regras CSS de classe (3 sites):
   - `.strsc` (linha 148): adicionar `mask-image:linear-gradient(to right, black 85%, transparent 100%);-webkit-mask-image:linear-gradient(to right, black 85%, transparent 100%)`.
   - `.ffs` (linha 158): idem.
   - `.mapf` (linha 295): idem.

   Style inline (4 sites):
   - `#agent-filter-row` (linha ~646): adicionar `mask-image:...` ao `style=""`.
   - Tab row do match (linha ~1221): idem.
   - Filter row do match (linha ~1242): idem.
   - Row filtros desafios (linha ~1598): idem.

3. **Verificação Grep:**
   - `<a href="#"` → 0
   - `mask-image:linear-gradient(to right, black 85%` → 7 ocorrências (3 em CSS + 4 em style inline)

4. **Commit:** `fix(ui): S2 links viram buttons; S8 mask-image gradient em 7 rows scroll-x`

### Task 3 — Validação + relatório

**Files:** Create `C:\Users\Samsung\projetos\vila-viva\docs\superpowers\reports\2026-05-13-vila-viva-onda3-relatorio.md`.

**Sub-passos:**

1. **Tour visual 3 viewports (375/390/430):**
   - Perfil: badges + skill tags clicáveis, visual idêntico
   - Match: search results, tabs com fade no scroll
   - Feed: stories com fade, chip "5 desafios ativos" clicável
   - Onboarding/edit overlay: skill tags continuam toggle
   - Login: "Esqueci senha" + "Criar conta" visualmente idênticos

2. **Tour keyboard:**
   - Tab pelas telas; cada elemento G8 recebe foco visível verde
   - Enter/Space em cada elemento G8 dispara `onclick` original
   - `.stag.s` toggle continua alternando ao Enter
   - `.bdgi` abre badge overlay ao Enter

3. **Lighthouse a11y** em login e feed (alvo: igual ou melhor que Onda 2)

4. **Métricas para o relatório:**
   - Buttons G8 totais: count
   - `<a href="#"`: 0
   - `mask-image`: 7

5. **Achados durante execução:** registrar quaisquer adaptações.

6. **Backlog Onda 3b/4/5:** reproduzir inalterado.

7. **Commit:** `docs: relatorio de fechamento Onda 3a`

8. **Code review externo** via `superpowers:requesting-code-review` antes da tag.

9. **Tag** `onda3a-fechada` após aprovação.

---

## 6. Backlog após Onda 3a

### Onda 3b — DX refactor (~3-4h, projeto separado)
- 217 `onclick=` inline → `addEventListener` central com event delegation
- Permite que elementos injetados dinamicamente (cards de projeto) recebam tratamento a11y automático
- Não é correção de bug; é dívida técnica/DX

### Onda 4 (polimento, ~1h)
- S15: typo "doo seu tempo" → "doe seu tempo" (linha ~1919)
- S7: padronizar borda dos chips do banner do feed
- S16: ellipsis em stats de desafios se truncarem em 375
- Itens Minor do code-review da Onda 2 deferidos: `pointer-events:none` em `.tav::before`, double-title em vagas, revisão de hierarquia visual do `--ci:#566A58`

### Onda 5 (escopo maior — pode virar projeto separado)
- Responsivo tablet/desktop (`@media (min-width:768px)`)
- Separação CSS/JS em arquivos com bundler
- IDs minificados → nomes legíveis
- WCAG AA completa + NVDA/VoiceOver
- Performance: Google Fonts preconnect/preload, defer scripts
- Componentização da bnav

---

## 7. Critério de "pronto"

1. 55 elementos G8 + 2 S2 + 7 S8 = 64 alterações entregues no `index.html`.
2. Visual preservado em 3 viewports (375/390/430).
3. Tour keyboard OK: Tab passa por todos os elementos convertidos com foco visível, Enter/Space dispara o `onclick`, toggle de `.stag.s` funciona via teclado.
4. Tooltips `.bso2.ht` e `.cst.ht` preservados (hover/focus-within/touch).
5. S8: 7 rows mostram fade gradient à direita.
6. Grep checks da seção 5 passam.
7. Lighthouse Acessibilidade em login e feed mantém ≥ 90 (alvo: igual ou melhor que Onda 2).
8. Diff revisado sem refator oportunista; sem comentário-ruído.
9. 3 commits granulares + relatório + tag `onda3a-fechada`.
10. Code-review externo via `superpowers:requesting-code-review` aplicado antes da tag.

Sem TDD automatizado.

---

## 8. Próximos passos

1. **Usuário revisa esta spec** e aprova ou pede ajustes.
2. Após aprovação, invocar `superpowers:writing-plans` para o plano detalhado com steps/Grep verificações e exemplos antes/depois.
3. Execução em modo subagent-driven (mesma estratégia bem-sucedida da Onda 2).
4. Code review externo, validação manual, tag.
