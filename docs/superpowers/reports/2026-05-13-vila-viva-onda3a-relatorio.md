# Vila Viva - Relatorio de fechamento Onda 3a

**Data:** 2026-05-13
**Spec:** `docs/superpowers/specs/2026-05-13-vila-viva-onda3-design.md`
**Plano:** `docs/superpowers/plans/2026-05-13-vila-viva-onda3a-plano.md`
**Branch:** `master`
**Status:** Codigo entregue - validacao visual manual pendente - aguarda code-review externo

## Resumo

Onda 3a aplicada em 3 commits de implementacao + 1 de review fix: T1 G8 conversoes (fe9cdb6), T2 S2+S8 (2e212b2), T2 review fixes (c450e30). 73 conversoes `<div>/<span>` em `<button>` (G8 resto - `.stag` x 60, `.bdgi` x 4, `.bso2` x 8, `.cst` x 1), 1 link "Esqueci senha" virou button (S2), e 5 dos 7 rows scroll-x ganharam `mask-image` gradient (S8 parcial - 2 foram revertidos no review fix por clipar tooltips dos filhos). Sem mudanca estrutural: continua single-file, sem dependencias.

## Nota sobre contagens vs plano

O plano da Onda 3a previa **40** conversoes G8 (27 stag + 4 bdgi + 8 bso2 + 1 cst). A contagem real foi **73** (60 stag + 4 + 8 + 1) porque o plano subestimou `.stag` - `grep -c` conta linhas com match, mas linhas como 580 e 589 tem multiplos `.stag` numa unica linha, e ha 3 formularios adicionais (cadvaga, cadprojeto, editsec - linhas 1890, 1946-1956, 2001-2008) que tambem usam `toggleSkill`. O implementer corretamente identificou e converteu todos os 60 `.stag` com onclick.

Da mesma forma, S8 esperava 7 rows com mask-image; apos code review, ficaram **5** (removidos `.strsc` e `.ffs` por causar clipping visual de tooltips dos filhos). Trade-off aceito: stories e filtros do feed perdem o indicador visual de scroll, mas mantem tooltips funcionais.

Observacao adicional sobre verificacao de contagens: o regex `<button type="button" class="stag"` (com aspa de fechamento literal) retorna 47 matches; ao incluir `.stag` com classes adicionais (ex.: `.stag.act` em "Minhas habilidades"), o total chega a 60. A contagem oficial usa o regex amplo `<button type="button" class="stag` (60 matches), que reflete todas as conversoes feitas em fe9cdb6.

A regex de `mask-image:linear-gradient(to right,#000 85%` retorna 10 matches porque cada um dos 5 containers tem tanto `mask-image:` quanto `-webkit-mask-image:` na mesma linha. O numero real de **containers** com gradient e 5 (linhas 295, 646, 1221, 1242, 1598).

## Itens entregues

| Codigo | Item | Status | Commit |
|---|---|---|---|
| G8 resto | `.stag` x 60 -> `<button>` | OK | fe9cdb6 |
| G8 resto | `.bdgi` x 4 (com onclick) -> `<button>` | OK | fe9cdb6 |
| G8 resto | `.bso2` x 8 -> `<button>` | OK | fe9cdb6 |
| G8 resto | `.cst` x 1 -> `<button>` | OK | fe9cdb6 |
| S2 | "Esqueci senha" `<a>` -> `<button>` | OK | 2e212b2 + c450e30 (fix font-family:inherit) |
| S8 | `mask-image` gradient em 5 rows scroll-x (de 7 originais) | OK parcial | 2e212b2 + c450e30 (removido de .strsc/.ffs) |

**73 conversoes G8 + 1 S2 + 5 S8 = 79 alteracoes entregues** (vs 48 estimadas no plano).

## Metricas (HEAD `onda2-fechada` -> HEAD Onda 3a)

| Metrica | Onda 2 | Onda 3a |
|---|---|---|
| `<div onclick>` G8 (`.stag/.bdgi/.bso2/.cst`) | 13 (4+8+1+0) | 0 |
| `<span class="stag" onclick>` | 60 | 0 |
| `<a href="#">` link estatico | 1 | 0 |
| Containers scroll-x com `mask-image` | 0 | 5 |
| Total `<button>` no arquivo | ~167 | **240** (+73) |
| Tags `<button>` balanceadas (abertura/fechamento) | OK | OK (240/240) |

Nota: o plano estimou 239 buttons totais; a contagem real e 240. Diferenca de +1 explicada pelo `<button>` ja existente no S2 (Esqueci senha) que foi convertido, mantendo paridade abertura/fechamento. Tags balanceadas confirmadas via regex (`<button\b` = 240, `</button>` = 240).

## Validacoes executadas

- [x] Grep checks (contagens batem: stag=60, bdgi=4, bso2=8, cst=1, mask=5 containers, href="#"=1 apenas em ct-link)
- [x] Spec compliance review de T1 e T2 via subagents (T1 OK; T2 OK)
- [x] Code quality review de T1 (4 minor nao-bloqueantes) e T2 (1 Critical + 1 Important corrigidos em c450e30)
- [x] Tag balance estrito (240 buttons opening = 240 closing)
- [ ] **Pendente - usuario:** validacao visual em 3 viewports (375/390/430)
- [ ] **Pendente - usuario:** tour keyboard (Tab passa pelos 73 buttons G8 com foco visivel, Enter/Space dispara onclick; toggleSkill em .stag funciona via teclado)
- [ ] **Pendente - usuario:** spot-check S8 (gradient visivel a direita dos 5 rows mantidos)
- [ ] **Pendente - usuario:** Lighthouse Acessibilidade >= 90 em login e feed
- [ ] **Pendente:** code-review externo via `superpowers:requesting-code-review`

## Achados durante execucao

3 ajustes/adaptacoes:

1. **T1 - Plano subestimou `.stag`.** O `grep -c` em linhas conta 27, mas ha 60 `.stag` totais com `onclick="toggleSkill(this)"` no arquivo. O implementer converteu todos os 60 corretamente. Conversoes T1 totais: 73 ao inves de 40.

2. **T2 review-fix (c450e30) - Critical:** botao "Esqueci senha" tinha `font:inherit` que sobrescrevia `font-size:13px` (shorthand resets longhand). Trocado para `font-family:inherit` que e mais especifico e preserva o font-size desejado.

3. **T2 review-fix (c450e30) - Important:** `mask-image` em `.strsc` (stories) e `.ffs` (filtros do feed) clipava visualmente as tooltips dos filhos `.tb`, especialmente as 5 tooltips dos chips de filter. Removidos `mask-image` de ambos. Mantidos nos outros 5 containers que nao tem tooltips em descendentes.

## Backlog pos-Onda 3a (inalterado vs spec secao 6)

### Onda 3b - DX refactor (~3-4h, projeto separado)
- 217 `onclick=` inline -> `addEventListener` central com event delegation
- Permite tratamento a11y automatico em elementos injetados dinamicamente

### Onda 4 (polimento, ~1h)
- S15: typo "doo seu tempo" -> "doe seu tempo" (linha ~1919)
- S7: padronizar borda dos chips do banner do feed
- S16: ellipsis em stats de desafios se truncarem em 375
- Minor do code-review da Onda 2: `pointer-events:none` em `.tav::before`, double-title em vagas
- 4 minor nao-bloqueantes do code-review da Onda 3a T1: `<div>` filhos em `<button>` (HTML5 strict mas funciona); `.stag` defensivo `text-align:start`; redundancia de color/font-size inline no `.cst` linha 624; `.bdgic cursor:pointer` redundante apos `.bdgi` virar button.

### Onda 5 (escopo maior)
- Responsivo tablet/desktop
- Separacao CSS/JS em arquivos com bundler
- IDs minificados -> nomes legiveis
- WCAG AA completa + NVDA/VoiceOver
- Performance: Google Fonts preconnect/preload, defer scripts
- Componentizacao da bnav

## Proximo passo

Apos validacao manual do usuario e code-review externo via `superpowers:requesting-code-review`, tag `onda3a-fechada` no commit final.
