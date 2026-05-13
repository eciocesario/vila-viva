# Vila Viva — Relatório de fechamento Onda 2

**Data:** 2026-05-13
**Spec:** `docs/superpowers/specs/2026-05-13-vila-viva-onda2-design.md`
**Plano:** `docs/superpowers/plans/2026-05-13-vila-viva-onda2-plano.md`
**Branch:** `master`
**Status:** Código entregue, code-review final aplicado · validação visual manual pendente

## Resumo

Onda 2 de `index.html` aplicada em 6 commits granulares + 2 commits de relatório:
- 49a00e5 — T1 a11y core (foco-trap + headings)
- 479f185 — T1 review-fix interno
- b7bcccc — T2 responsividade/UX
- 7bd7406 — T3 padronização/bugs
- 140bcc7 — relatório inicial
- aa6e9c2 — final-review interno (parcialmente revertido depois)
- 3822e7a — relatório atualizado
- d454c5e — **code-review externo (requesting-code-review)**: ESC fecha visualmente + reverter `bni a` enganoso

10 itens previstos no plano entregues + 1 achado de contraste do plano da Onda 1 resolvido. Cada task passou por dois subagents de revisão (spec compliance + code quality); um final review interno e um code-review externo (`superpowers:requesting-code-review`) encontraram bugs reais que foram corrigidos. Sem mudança estrutural: continua single-file, sem dependências externas, sem alteração de UX visível ao usuário leigo. Métricas chave: 9 `<h1>` (era 0), 23 `<h2>` no markup (era 7), 49 `aria-hidden="true"` no markup (era ~21, automação JS continua cobrindo o resto), 28 buttons `.bni` distribuídos em 7 bnav estruturalmente uniformes com indicador "tab ativa" em 4 telas próprias (feed/vagas/perfil/match) e nenhuma falsa indicação nas demais (dashboard/desafios/notifs), contraste `--ci` agora passa AA sobre `--ar` (5.38:1) e sobre `--ar2` (4.82:1).

## Itens entregues

| Código | Item | Status | Commit |
|---|---|---|---|
| S22 | Foco-trap completo nos 7 overlays (Tab/Shift+Tab/ESC + restore foco + fechamento visual) | ✓ | 49a00e5+479f185+d454c5e |
| S10 | `<h1>` em 9 telas + `<h2>` em 16 subseções | ✓ | 49a00e5 |
| C1 | `.tic` alvo de toque 44×44 (visual mantém ícone 20×20) | ✓ | b7bcccc |
| C2 | `.tav` área clicável 44×44 via `::before inset:-6px` | ✓ | b7bcccc |
| S4 | `.agent-selector-grid` responsivo (`auto-fit minmax(140px,1fr)`) | ✓ | b7bcccc |
| S17 | Botão "Convidar" wrap + `min-width:0` + `font-size 12px` | ✓ | b7bcccc |
| S11 | Opacidade botões `.phero` `.15`→`.25` | ✓ | b7bcccc |
| S18 | Cor "voltar" `.dhdr` `.55`→`.85` | ✓ | b7bcccc |
| C4 | Bnav padronizada (5 alterações iniciais + 1 ajuste de consistência de tooltip) | ✓ | 7bd7406 + aa6e9c2 (parcial) + d454c5e |
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
| Bnav com indicador "tab ativa" (`bni a`) honesto | 4/7 (feed com `ht` inconsistente) | 4/7 (feed/vagas/perfil/match — telas que têm slot próprio na bnav; consistente sem `ht` no item ativo) |
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
- [x] Final code review interno (subagent) de toda a Onda 2 com 2 fixes aplicados em aa6e9c2
- [x] Code review externo via `superpowers:requesting-code-review` (Senior Code Reviewer) que detectou 1 bug Critical real (ESC liberava o trap mas não fechava o modal visualmente) e 1 Important (`bni a` em Vila enganoso em dashboard/desafios/notifs); ambos corrigidos em d454c5e (mapa `_dialogVisualClose` por id no `closeDialog` + reverter os 3 `bni a` enganosos)
- [ ] **Pendente — usuário:** validação visual em 3 viewports (375/390/430) percorrendo as 9 telas
- [ ] **Pendente — usuário:** tour manual dos 7 modais (Tab cíclico, Shift+Tab, ESC, restore foco) em browser real
- [ ] **Pendente — usuário:** Lighthouse Acessibilidade ≥ 90 em login e feed (mobile)
- [ ] **Pendente — usuário:** verificar nos DevTools que `:focus-visible` continua aparecendo após mudança de `--ci`

## Achados durante execução

Nenhum bloqueante. 3 ajustes/adaptações aplicados:

1. **T1 review-fix (commit 479f185):** `nextOb` no welcome flow restaurava foco em elemento off-screen após `goTo('feed')`. Refatorado para desmontar trap sem refocusar opener escondido. Bonus fix incluso: `closeBadgeOverlay` tinha guard `e&&` defensiva morta — limpeza enquanto o arquivo estava aberto.

2. **T2 adaptação:** botão da tela `#desafios` que a spec descreveu como "Compartilhar desafio" é na verdade "Participar do desafio →". O fix (flex-wrap + min-width:0 + font-size menor no "Convidar") foi aplicado ao único row que casa estruturalmente no markup atual. Sem prejuízo ao escopo do item S17.

3. **T3 schema:** entrada `org_parceira` no objeto JS `agents` segue o schema real do arquivo (`icon`/`name`/`tipo`/`cls`/`arq`/`acesso`), não o sugerido na spec (`nome`/`emoji`/`desc`/`cor`). Reusa `cls:'ag-embaixador'` para badge visual consistente; `acesso:'Parcial'` coerente com o nível do Embaixador. Decisão registrada para evitar reescrita de CSS de badges.

4. **Final review-fix interno (commit aa6e9c2):** o final reviewer interno identificou duas inconsistências de UX:
   - A padronização C4 (commit 7bd7406) removeu o autorreferente "Desafios a"/"Avisos a" das bnav de dashboard/desafios/notifs, deixando essas 3 telas sem indicador visual de "tab ativa". Solução tentada: marcar o botão "Vila" como `bni a` nessas 3 bnav.
   - O item Vila ativo do feed retinha `ht`+tooltip enquanto os outros itens `bni a` haviam perdido. Solução: remover `ht` e `<div class="tb">` do Vila ativo do feed.

5. **Code review externo (commit d454c5e):** `superpowers:requesting-code-review` despachou um Senior Code Reviewer que encontrou 2 problemas reais que escaparam dos reviews internos:
   - **Critical:** ESC libertava o foco-trap (`closeDialog` removia listener + devolvia foco) mas NÃO removia a classe que mantinha o modal visível. Resultado: depois de ESC, o modal continuava na tela com o trap solto. Fix: introduzir o mapa `_dialogVisualClose` por id dentro do `closeDialog`, que invoca o closer visual apropriado (`.classList.remove('op')` / `.classList.remove('sh')` / `style.display='none'` conforme cada overlay) antes de devolver o foco. Agora ESC, × buttons e Cancelar/Salvar todos passam pelo mesmo caminho de fechamento — o `classList.remove` redundante nos callers do markup foi mantido como defesa.
   - **Important:** Os 3 `bni a` em "Vila" nas bnav de dashboard/desafios/notifs (de aa6e9c2) são semanticamente enganosos — dizem "você está em Vila" enquanto o usuário está em outra tela. Spec original aceitava sem highlight ("a tela `desafios` não terá item ativo na bnav, igual ao notifs anteriormente"). Decisão: reverter os 3 `bni a` adicionados, mantendo a outra metade do aa6e9c2 (remoção do `ht`/tooltip do Vila ativo do feed). Agora 4 telas (feed/vagas/perfil/match) têm indicador honesto e as 3 outras (dashboard/desafios/notifs) não têm item próprio na bnav e portanto não têm highlight.

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

Code-review externo já invocado e fixes aplicados (commit d454c5e). Resta apenas a **validação manual no browser** pelo usuário:
- 3 viewports (375/390/430) percorrendo as 9 telas
- Tour dos 7 modais: abrir → foco no 1º focal → Tab/Shift+Tab cíclico → ESC fecha **visualmente** + restore foco → testar também botão × e Cancelar
- Lighthouse Acessibilidade ≥ 90 em login e feed (mobile)

Após validação manual, a Onda 2 pode ser declarada **fechada**.

## Itens Minor do code-review externo deferidos

O Senior Reviewer listou 6 Minor + 4 Recomendações que não bloqueiam o fechamento e foram absorvidos pelos backlogs:

- `pointer-events:none` defensivo em `.tav::before` → Onda 4 polimento
- Restaurar guard `e&&` em `closeBadgeOverlay` ou aceitar conscientemente → não-bloqueante; deixar como está (call site único e seguro)
- Vagas tem `tlog`+`<h1>` simultaneamente ("Vagas" + "Vagas na Vila") → Onda 3 (decidir entre remover topbar div ou diferenciar)
- `--ci` mais escuro pode alterar hierarquia visual de small-text → validar visualmente; ajustar se necessário em Onda 3
- Splash não tem `<h1>` (tela transitória; spec dizia "9 telas") → trivial
- Codificar contrato "close = visually hide + release trap" via `_dialogCloser` (já feito parcialmente em d454c5e via `_dialogVisualClose`) → Onda 3 pode refinar com `addEventListener` no DX
