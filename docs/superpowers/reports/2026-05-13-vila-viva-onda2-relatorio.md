# Vila Viva — Relatório de fechamento Onda 2

**Data:** 2026-05-13
**Spec:** `docs/superpowers/specs/2026-05-13-vila-viva-onda2-design.md`
**Plano:** `docs/superpowers/plans/2026-05-13-vila-viva-onda2-plano.md`
**Branch:** `master`
**Status:** Código entregue, final review aplicado · validação visual manual pendente

## Resumo

Onda 2 de `index.html` aplicada em 5 commits granulares: T1 a11y core (49a00e5), T1 review-fix (479f185), T2 responsividade/UX (b7bcccc), T3 padronização/bugs (7bd7406), e final-review fix (aa6e9c2). 10 itens previstos no plano entregues + 1 achado de contraste do plano da Onda 1 resolvido. Cada task passou por dois subagents de revisão (spec compliance + code quality); um final review encontrou 2 regressões pequenas de UX corrigidas em commit dedicado. Sem mudança estrutural: continua single-file, sem dependências externas, sem alteração de UX visível ao usuário leigo. Métricas chave: 9 `<h1>` (era 0), 23 `<h2>` no markup (era 7), 49 `aria-hidden="true"` no markup (era ~21, automação JS continua cobrindo o resto), 28 buttons `.bni` distribuídos em 7 bnav agora estruturalmente uniformes com indicador "tab ativa" em todas as 7 telas, contraste `--ci` agora passa AA sobre `--ar` (5.38:1) e sobre `--ar2` (4.82:1).

## Itens entregues

| Código | Item | Status | Commit |
|---|---|---|---|
| S22 | Foco-trap completo nos 7 overlays (Tab/Shift+Tab/ESC + restore foco) | ✓ | 49a00e5+479f185 |
| S10 | `<h1>` em 9 telas + `<h2>` em 16 subseções | ✓ | 49a00e5 |
| C1 | `.tic` alvo de toque 44×44 (visual mantém ícone 20×20) | ✓ | b7bcccc |
| C2 | `.tav` área clicável 44×44 via `::before inset:-6px` | ✓ | b7bcccc |
| S4 | `.agent-selector-grid` responsivo (`auto-fit minmax(140px,1fr)`) | ✓ | b7bcccc |
| S17 | Botão "Convidar" wrap + `min-width:0` + `font-size 12px` | ✓ | b7bcccc |
| S11 | Opacidade botões `.phero` `.15`→`.25` | ✓ | b7bcccc |
| S18 | Cor "voltar" `.dhdr` `.55`→`.85` | ✓ | b7bcccc |
| C4 | Bnav padronizada (5 alterações iniciais + 4 ajustes pós-review para uniformidade total) | ✓ | 7bd7406 + aa6e9c2 |
| S5 | `data-agent="org_parceira"` novo, sem duplicação com embaixador | ✓ | 7bd7406 |
| Contraste --ar2 | `--ci` atualizado para `#566A58` (5.38 sobre `--ar`, 4.82 sobre `--ar2`) | ✓ | 7bd7406 |
| C5 | `aria-hidden` no markup em SVGs decorativos (`.bni` × 28 + `.slf`) | ✓ | 7bd7406 |

**Todos os 10 itens previstos + achado de contraste entregues.**

## Métricas (HEAD Onda 1 → HEAD Onda 2)

| Métrica | Onda 1 | Onda 2 |
|---|---|---|
| Commits | 12 | +5 (+ 1 docs) |
| `<h1>` no arquivo | 0 | 9 |
| `<h2>` no arquivo | 7 (modais) | 23 (7 modais + 16 subseções) |
| `aria-label=` no markup | ~13 (referência indireta) | 13 |
| `aria-hidden="true"` no markup | ~21 | 49 |
| `role="dialog"` | 7 | 7 |
| `<label class=` associados | 17 | 17 |
| `class="bni"` (bnav buttons) | 28 | 28 |
| Bnav com sequência Vila/Vagas/+/Conexões/Eu | 2/7 | 7/7 |
| Bnav com indicador "tab ativa" (`bni a`) | 4/7 (feed com `ht` inconsistente) | 7/7 (consistente, sem `ht` no item ativo) |
| `<span>Eu</span>` (bnav uniformidade) | <7 | 7 |
| `<span>Desafios</span>` em bnav (anomalia) | >0 | 0 |
| `<span>Avisos</span>` em bnav (anomalia) | >0 | 0 |
| `data-agent` únicos no onboarding | duplicado (embaixador 2×) | único (embaixador 1×, org_parceira 1×) |
| Contraste `--ci` sobre `--ar` | 4.93:1 | 5.38:1 |
| Contraste `--ci` sobre `--ar2` | 4.42:1 (< AA) | 4.82:1 (passa AA) |

Nota sobre `aria-label`: a contagem 13 no markup reflete os labels explícitos remanescentes; outros botões-ícone recebem `aria-label` programaticamente via o bloco JS introduzido em Onda 1 (G5), que mapeia tooltips `.tb` para `aria-label` no runtime — esse mecanismo segue ativo e cobre os botões não cobertos no markup direto.

## Validações executadas

- [x] Spec compliance review de cada uma das 3 tasks de implementação (T1/T2/T3 — todas aprovadas via subagents)
- [x] Code quality review de cada uma das 3 tasks (T1 com 2 fixes aplicados → 479f185; T2 e T3 aprovadas sem alterações)
- [x] Heading outline: Grep confirma 9 `<h1>` (1 por tela), 23 `<h2>` (7 modais pré-existentes + 16 subseções novas)
- [x] Uniformidade da bnav: 28 buttons `class="bni"`, zero `<span>Desafios</span>` ou `<span>Avisos</span>` em bnav, 7 `<span>Eu</span>` (1 por tela com bnav)
- [x] Singularidade de agente: `data-agent="embaixador"` = 1, `data-agent="org_parceira"` = 1 (sem duplicação)
- [x] Contraste WCAG calculado pelo spec-reviewer: `--ci` `#566A58` dá 5.38:1 sobre `--ar` `#F7F2EA` e 4.82:1 sobre `--ar2` `#EDE6D6` (ambos ≥ 4.5, AA aprovado)
- [x] Inventário de `aria-hidden="true"` no markup subiu de ~21 para 49 (cobertura ampliada nas bnav e splash)
- [x] Final code review de toda a Onda 2 (cross-task coherence, regressões, consistência) com 2 fixes aplicados em aa6e9c2
- [ ] **Pendente — usuário:** validação visual em 3 viewports (375/390/430) percorrendo as 9 telas
- [ ] **Pendente — usuário:** tour manual dos 7 modais (Tab cíclico, Shift+Tab, ESC, restore foco) em browser real
- [ ] **Pendente — usuário:** Lighthouse Acessibilidade ≥ 90 em login e feed (mobile)
- [ ] **Pendente — usuário:** verificar nos DevTools que `:focus-visible` continua aparecendo após mudança de `--ci`

## Achados durante execução

Nenhum bloqueante. 3 ajustes/adaptações aplicados:

1. **T1 review-fix (commit 479f185):** `nextOb` no welcome flow restaurava foco em elemento off-screen após `goTo('feed')`. Refatorado para desmontar trap sem refocusar opener escondido. Bonus fix incluso: `closeBadgeOverlay` tinha guard `e&&` defensiva morta — limpeza enquanto o arquivo estava aberto.

2. **T2 adaptação:** botão da tela `#desafios` que a spec descreveu como "Compartilhar desafio" é na verdade "Participar do desafio →". O fix (flex-wrap + min-width:0 + font-size menor no "Convidar") foi aplicado ao único row que casa estruturalmente no markup atual. Sem prejuízo ao escopo do item S17.

3. **T3 schema:** entrada `org_parceira` no objeto JS `agents` segue o schema real do arquivo (`icon`/`name`/`tipo`/`cls`/`arq`/`acesso`), não o sugerido na spec (`nome`/`emoji`/`desc`/`cor`). Reusa `cls:'ag-embaixador'` para badge visual consistente; `acesso:'Parcial'` coerente com o nível do Embaixador. Decisão registrada para evitar reescrita de CSS de badges.

4. **Final review-fix (commit aa6e9c2):** o final reviewer identificou duas inconsistências de UX:
   - A padronização C4 (commit 7bd7406) removeu o autorreferente "Desafios a"/"Avisos a" das bnav de dashboard/desafios/notifs, deixando essas 3 telas sem indicador visual de "tab ativa". Solução: marcar o botão "Vila" como `bni a` nessas 3 bnav (sinaliza "← voltar leva ao feed").
   - O item Vila ativo do feed retinha `ht`+tooltip enquanto os outros itens `bni a` haviam perdido. Solução: remover `ht` e `<div class="tb">` do Vila ativo do feed.

## Backlog (inalterado vs spec seção 6)

### Onda 3 (~2-3h, refator a11y + DX)
- G8 resto: `.stag`, `.bdgi`, `.sri`, `.bso2`, `.cst` em `<button>` ou role+keyboard
- DX: `onclick=` inline → `addEventListener` (permite que SVGs injetados dinamicamente recebam aria-hidden)
- S2: `<a href="#">` Esqueci senha → `<button>`
- S8: indicador visual de scroll horizontal em rows

### Onda 4 (polimento)
- S15: typo "doo seu tempo" → "doe seu tempo"
- S7: padronizar borda dos chips do banner
- S16: ellipsis em stats de desafios se truncarem
- S1: `aria-hidden` no SVG da splash (markup) — já entregue em T3 via C5
- `aria-hidden` em SVGs decorativos restantes que não entraram em C5 (cobertura JS continua, mas markup direto é mais robusto)

### Onda 5 (escopo maior — pode virar projeto separado)
- Tablet/desktop responsivo
- Separação CSS/JS em arquivos com bundler
- IDs minificados → legíveis
- WCAG AA completa + NVDA/VoiceOver
- Performance (Fonts preload, defer scripts)
- Componentização da bnav

## Próximo passo

Após validação manual do usuário (3 viewports + tour modal + Lighthouse), invocar `superpowers:requesting-code-review` para revisão final antes de encerrar oficialmente a Onda 2.
