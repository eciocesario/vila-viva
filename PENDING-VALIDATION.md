# Pendências de validação — Vila Viva Onda 1

Última rodada de revisão entregou todos os 16 itens de severidade Alta da auditoria. **Validação manual ficou pendente — testar quando der tempo.**

Marcar cada item conforme for testando. Se algum falhar, abrir Onda 2 com os achados somados ao backlog já registrado no relatório.

## Checklist

### 1. Visual em 3 viewports
Abrir `index.html` no Chrome/Edge. DevTools → Toggle device toolbar. Testar nos 3 tamanhos:

- [ ] **iPhone SE — 375×667**
- [ ] **iPhone 13/14 — 390×844**
- [ ] **iPhone 15 Pro Max — 430×932**

Em cada viewport, percorrer cada tela e marcar:

- [ ] **Splash** — carrega, dots animam, sem overflow
- [ ] **Login** — inputs respondem, tabs Entrar/Criar perfil funcionam, sem zoom indesejado ao focar input (G3)
- [ ] **Onboarding (4 passos)** — agent grid sem corte; navegação Continuar→ funciona
- [ ] **Feed** — cards renderizam, topbar não quebra ("18 online" + sino + avatar caem na mesma linha), share strip quebra OK em 2 linhas se preciso
- [ ] **Vagas** — sub-tabs Voluntariado/Remunerado funcionam, cards inteiros
- [ ] **Perfil** — hero, agent card, badges grid 4×2, lista de projetos
- [ ] **Match (Jardim de Conexões)** — tabs Pessoas/Orgs/Projetos, search funciona, filtros arquétipo
- [ ] **Desafios** — 5 desafios renderizam, progress bars OK
- [ ] **Dashboard** — charts/bars não quebram
- [ ] **Notifs** — itens lidos, botões clicáveis
- [ ] **Modais** — FAB → bottom-sheet abre/fecha; × no canto foca corretamente

### 2. Lighthouse Acessibilidade (alvo: ≥ 90)

Em Chrome:
1. Abrir `file:///C:/Users/Samsung/projetos/vila-viva/index.html`
2. Pular splash → ir pro login
3. DevTools → Lighthouse → categoria **Accessibility** → modo Mobile → Generate
4. Anotar score:

- [ ] **Login** — Score: ___
- [ ] **Feed** (entrar primeiro) — Score: ___

Se < 90, abrir os "issues" no Lighthouse — se forem coisas já no backlog (Onda 2), OK; senão registrar como achado pós-validação.

### 3. Acessibilidade teclado

- [ ] **Tab** percorre login → consegue chegar nos botões (Entrar, Esqueci senha, WhatsApp) com foco verde visível
- [ ] **Tab** no feed percorre topbar → bottom nav; **Enter** ativa navegação
- [ ] **× nos modais** recebe foco e é anunciável (testar com leitor de tela se possível)

### 4. Touch tooltips

- [ ] Em modo mobile DevTools, **tap** num chip do banner do feed (ex.: "✦ 5 desafios ativos") → tooltip aparece por ~3s e some
- [ ] Tap fora fecha tooltip aberto

### 5. Bugs específicos para conferir

- [ ] **`.tic` sino** tem o círculo cor-areia atrás (foi regressão pega no review, deve estar restaurado no commit `2ea4fd1`)
- [ ] **Botões `.lbtn` (Entrar na Vila)** continuam pill-shape mesmo com foco visível (não viram retângulo)
- [ ] **Inputs no iOS Safari simulado** não disparam auto-zoom (font-size 16px)

---

## Próximo passo após validação

Se tudo OK → Onda 1 fechada formalmente.

Se algum item falhar:
1. Registrar no relatório `docs/superpowers/reports/2026-05-12-vila-viva-revisao-relatorio.md` na seção "Achados pós-validação"
2. Decidir: fix-now (se trivial) ou adicionar à Onda 2 do backlog (seção 7 da spec)

Itens já priorizados pra Onda 2 (independente da validação):
- Contraste de `--ci` sobre `--ar2` (atualmente 4.42:1, alvo ≥4.5)
- `.tic`/`.tav` alvo de toque 44×44 (C1/C2)
- Bnav padronização do 4º item (C4)
- Foco-trap nos modais (S22)
- Bug duplicado embaixador (S5)
