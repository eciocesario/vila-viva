# Vila Viva — Relatório de fechamento Onda 4

**Data:** 2026-05-13
**Spec:** `docs/superpowers/specs/2026-05-13-vila-viva-onda4-design.md`
**Plano:** `docs/superpowers/plans/2026-05-13-vila-viva-onda4-plano.md`
**Branch:** `master`
**Status:** Código entregue · validação manual pendente · aguarda code-review externo

## Resumo

Onda 4 aplicada em 2 commits de implementação: T1 polimento inicial (7715c92) e T1 review fix (5daa094). 7 dos 8 edits planejados aplicados; 1 edit revertido após code-review interno por causar regressão. Sem mudança estrutural. Item 9 da spec (splash logo aria-hidden) já estava aplicado desde Onda 2 C5 — skip confirmado.

## Itens entregues

| # | Item | Tipo | Status | Commit |
|---|---|---|---|---|
| 1 | Typo `doo` → `doe seu tempo` | Texto visível | ✓ | 7715c92 |
| 2 | Remover `<div class="tlog">Vagas</div>` da topbar | UX visível | ✓ | 7715c92 |
| 2b | (review-fix) `margin-left:auto` no wrapper Sementes da topbar `#vagas` | UX correção | ✓ | 5daa094 |
| 3 | Remover border do chip "5 desafios ativos" | UX visível | ✓ | 7715c92 |
| 4 | Ellipsis defensivo nas 3 stats de desafios | Defensivo | ✓ | 7715c92 |
| 5 | ~~`.tav::before` ganha `pointer-events:none`~~ | Cleanup | ✗ revertido | 7715c92 → 5daa094 |
| 6 | `.stag` ganha `text-align:start` defensivo | Cleanup | ✓ | 7715c92 |
| 7 | Remover redundância color/font-size do style inline do chip 624 | Cleanup | ✓ | 7715c92 |
| 8 | Remover `cursor:pointer` redundante de `.bdgic` | Cleanup | ✓ | 7715c92 |
| 9 | ~~Splash logo aria-hidden~~ | — | skip (já feito Onda 2 C5) | — |

**7 edits aplicados + 1 revertido + 1 review-fix correlato.**

## Achados durante execução

1. **Item 5 revertido** — code-review interno (subagent) identificou que `pointer-events:none` em `.tav::before` desfazia a expansão de área de toque 44×44 introduzida na Onda 2 commit `b7bcccc` (item C2, WCAG 2.5.5). O `.tav::before` com `inset:-6px` é o que estende a área clicável do avatar de 32×32 para 44×44; bloquear pointer-events faz o pseudo virar decorativo e a área clicável volta para 32×32. O "defensivo" original era contra interações conflitantes hipotéticas, mas o catch-22 é que esses cliques REAIS são o uso pretendido. Revertido em `5daa094`.

2. **Item 2 corolário (5daa094)** — após remover `<div class="tlog">Vagas</div>` da topbar (item 2), a topbar ficou com apenas 1 filho. Como `.topbar` usa `display:flex; justify-content:space-between`, o Sementes wrapper migrou para flex-start (esquerda) ao invés de ficar à direita como nas outras telas. Fix: adicionar `margin-left:auto` no wrapper para empurrar Sementes de volta para a direita.

## Métricas (HEAD `onda3a-fechada` → HEAD Onda 4)

| Métrica | Onda 3a | Onda 4 |
|---|---|---|
| `doo seu tempo` (typo) | 1 | 0 |
| `doe seu tempo` | 0 | 1 |
| `<div class="tlog">Vagas</div>` | 1 | 0 |
| `border:1px solid rgba(255,255,255,.3)` no chip "5 desafios" | 1 | 0 |
| `text-overflow:ellipsis;white-space:nowrap` no contexto stats desafios | 0 | 3 |
| Style inline do button `.cst ht` linha 624 (caracteres aprox.) | ~155 | ~78 |
| Regra `.bdgic` (caracteres) | ~205 | ~191 |
| `.stag` regra com `text-align:start` | 0 | 1 |
| `pointer-events:none` em `.tav::before` | 0 | 0 (revertido) |
| `margin-left:auto` na topbar `#vagas` | 0 | 1 |

## Validações executadas

- [x] Grep checks pós-edits e pós-review-fix
- [x] Spec compliance review interno (T1 spec-compliant)
- [x] Code quality review interno (encontrou Critical .tav::before + Important Sementes left-align; ambos corrigidos em 5daa094)
- [ ] **Pendente — usuário:** validação visual em 3 viewports
- [ ] **Pendente:** code-review externo via `superpowers:requesting-code-review`

## Backlog pós-Onda 4

### Onda 3b — DX refactor (~3-4h, projeto separado)
- 217 `onclick=` inline → `addEventListener` com event delegation
- Permite tratamento a11y automático em elementos injetados dinamicamente

### Onda 5 — Escopo maior
- Responsivo tablet/desktop, separação CSS/JS, IDs legíveis, WCAG AA completa, performance, componentização

### Onda 6+ — Features novas
- Próximas rodadas viram evolução de produto, não mais polimento técnico

## Próximo passo

Após validação manual do usuário e code-review externo, tag `onda4-fechada` no commit final.
