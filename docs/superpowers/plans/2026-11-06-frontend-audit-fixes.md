# Frontend Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Estado: EXECUTADO na branch `fix/frontend-audit` (2026-11-06), com os desvios abaixo.**

Desvios decididos na execução:
- **Correção posterior: `Theme.txt` prevalece.** Os valores das Tarefas 1 e 2 (cor de ação `#007A8F`, escalas escurecidas, outline sólido de foco) violavam o contrato do cliente ("não inventes hexadecimais novos", botão primário e auréola de foco definidos) e foram revertidos. Hoje `src/index.css` tem os mesmos hexadecimais que `main`, travados por testes de fidelidade em `config/theme.test.ts`. Ficam sem correção, por decisão do cliente: contraste do branco sobre `#00A9C5`, do texto secundário `#86868B` e da auréola de foco (ver `PRODUCT.md`, Accessibility).
- T1 e T2: sem efeito (revertidas).
- T7: o passo "rótulos `text-slate-400` → `text-muted`" ficou resolvido pelo contraste da T1.
- T8: versão enxuta: removidos os aliases de cor (rose, sky, cyan, green, orange, stone) e convertidos os 3 pares mais comuns para `bg-surface`/`text-content`/`border-line`. Não foram criados `info`/`surface-muted` (sem consumidores). O resto das ~1500 classes cruas continua por migrar.
- T10: mantido o hero escuro do Turndown (separação visual dos ciclos, princípio 2 do PRODUCT.md); só removido o gradiente. Alinhamento com o `SummaryStrip` não feito.
- T11: sem axe/Playwright e sem verificação visual no browser (não há Playwright instalado).

**Goal:** Corrigir os problemas da auditoria de 2026-11-06 (12/20) para a versão real: contraste, foco, movimento, navegação responsiva, modais unificados e tokens semânticos. Alvo: ≥18/20 e WCAG 2.2 AA.

**Architecture:** Mudanças de tokens em `src/index.css` (um sítio), seguidas de correções de componentes partilhados (`Modal`, `Navbar`) e migração gradual das classes cruas para tokens semânticos, protegida por testes em `config/theme.test.ts`.

**Tech Stack:** React 19, Tailwind 4 (`@theme`), Vitest + Testing Library, ESLint. Sem dependências novas.

**Spec:** `PRODUCT.md`, `Theme.txt`, auditoria de 2026-11-06 (nesta conversa).

## Global Constraints

- Manter `#00A9C5` como cor de marca (superfícies, ícones, logótipo). Texto e botões usam tokens mais escuros.
- Nenhuma cor nova fora do `Theme.txt`; só derivar tons escuros da mesma família.
- Cada tarefa passa `npm run lint`, `npm run test:run` e `npx tsc -b` antes de fechar.
- Sem mudanças de comportamento de negócio nem de rotas.
- Commits pequenos, um por tarefa.

## Regras do projeto que este plano cumpre (`.agents`)

Lidas depois da primeira versão do plano; os pontos abaixo já estão refletidos nas tarefas.

- **`23-accessibility` (WCAG 2.2 AA por omissão):** o requisito de acessibilidade já está decidido. Pede contraste verificado (4.5:1 texto, 3:1 UI), `focus-visible:ring-2` no mínimo, modais com focus trap + Esc + foco devolvido e `aria-labelledby`, skip link para `#main-content`, hierarquia de headings com `h1` por página e teste só com teclado.
- **`20-rules`:** i18n em todos os textos (`lang/pt.json` e `en.json`), componentes ≤ 200 linhas, named exports, `index.ts` por pasta de componente, `ConfirmDialog` em ações destrutivas, confirmar os 4 estados.
- **`16-tests`:** testes junto ao ficheiro (`X.test.tsx`), `describe('{Nome}')`, `it('should …')` em inglês.
- **`30-simplify`:** reutilizar o que existe (`Modal`, `useFocusTrap`, `ConfirmDialog` são o modelo); sem dependências novas.
- **`25-e2e`:** axe como gate automático nas páginas principais (Tarefa 11).
- **Já conforme, sem trabalho:** rotas com `lazy`, `ErrorBoundary`, `ConfirmDialog` com `aria-labelledby`, i18n PT/EN com fallback `pt`.

## Decisões a confirmar (não bloqueiam as Tarefas 1–4)

1. **Dispositivos** da governanta (desktop, tablet, ambos)? Define a prioridade da Tarefa 4 e se os alvos de toque (Tarefa 9) sobem para 44px.
2. ~~Requisito de acessibilidade~~ **Resolvida:** WCAG 2.2 AA, por `.agents/23-accessibility`. O `PRODUCT.md` deixa de ter este ponto como "a confirmar".
3. **Atribuir pessoas a sheets sem arrastar** (HTML5 drag não funciona com toque): existe alternativa em `AddMemberModal`? Ver Tarefa 10.

---

### Task 1: Tokens de contraste (P1 + P2)

**Files:** Modify `src/index.css`; Test `config/theme.test.ts`

- [ ] Adicionar `--color-primary-strong: #007A8F` (≥4.5:1 com branco e sobre `#F5F5F7`) e usá-lo em `--color-primary-hover` (escurecido) e em novo `--color-action`; `primary-foreground` mantém-se branco.
- [ ] No modo claro, escurecer `--color-slate-400` e `--color-slate-500` para tons com ≥4.5:1 sobre `#FFFFFF` e `#F5F5F7` (ex.: ≥ `#6B6B70`). No modo escuro `--muted` já passa (5.22:1).
- [ ] Texto de estado: documentar que `emerald-600`/`amber-500` não servem para texto; tokens `--color-success-text` e `--color-warning-text` (ex.: `emerald-700`, `amber-700`).
- [ ] Teste em `config/theme.test.ts` que lê `src/index.css`, calcula contraste e falha se `action`/`primary-hover` com branco, `slate-500` sobre branco ou `success-text` sobre branco ficarem abaixo de 4.5:1.
- [ ] Trocar `bg-primary`/`bg-blue-600` + texto branco (botões) por `bg-action`; `text-blue-600` (links, tabs ativas, contadores) por `text-action`.
- [ ] Verificar: `npm run test:run`; olhar Login, Navbar (tab ativa), Planning (contadores).

### Task 2: Foco de teclado visível (P1)

**Files:** Modify `src/index.css`, `pages/Login/LoginPage.tsx`, `pages/Login/components/DemoAccounts.tsx`, `pages/Settings/components/PeopleTab.tsx`, `pages/Settings/components/SectionsTab.tsx`

- [ ] `:focus-visible` com `outline: 2px solid var(--color-action)` + `box-shadow` da auréola suave por cima (≥3:1). Equivale ao `focus-visible:ring-2` que `23-accessibility` exige como mínimo.
- [ ] Remover os `focus:outline-none focus:ring-4 focus:ring-primary/20` locais, que repetem o anel fraco; a regra global cobre tudo.
- [ ] Teste: `:focus-visible` existe em `index.css` com outline sólido (asserção de string em `theme.test.ts`). Verificar Tab em Login, Navbar, RoomCard e modais.

### Task 3: `prefers-reduced-motion` (P1)

**Files:** Modify `src/index.css`

- [ ] `@media (prefers-reduced-motion: reduce)`: sem `animate-pulse`, `slideUpFade`, `scale` no `:active` e transições do `body`; manter cor/opacidade nas mudanças de estado.
- [ ] Teste de string em `theme.test.ts`. Verificar emulando a preferência nos DevTools.

### Task 4: Navegação responsiva (P1)

**Files:** Modify `UI/containers/AppLayout/Navbar.tsx`; Test `UI/containers/AppLayout/Navbar.test.tsx` (novo)

- [ ] Abaixo de `lg`, botão de menu (`aria-expanded`, `aria-controls`) que abre uma lista com `LINKS` e as ações hoje escondidas por `hidden sm:flex` (Opera, créditos, equipas, chat, definições, tema).
- [ ] Fechar com Esc e ao navegar; reutilizar `useFocusTrap` se for painel modal.
- [ ] Textos novos (rótulo do botão de menu) em `lang/pt.json` e `lang/en.json`. Se o `Navbar.tsx` passar de 200 linhas, extrair o menu para `UI/containers/AppLayout/NavMenu.tsx` (named export).
- [ ] Teste (`it('should …')`): em viewport estreito, os 4 links existem no menu; Esc fecha.
- [ ] Se a decisão 1 for "só desktop", reduzir a tarefa ao mínimo (menu simples) em vez de a saltar.

### Task 5: Unificar modais (P2)

**Files:** Modify `UI/components/Modal/Modal.tsx`, `UI/components/Correction/CorrectionRequestModal.tsx`, `UI/components/MoveTask/MoveTaskModal.tsx`, `UI/components/RoomDetailModal/RoomDetailModal.tsx`; Test `UI/components/Modal/Modal.test.tsx` (novo)

- [ ] Prop `dismissOnBackdrop` (por omissão `true`); `false` quando há texto por gravar, em Correction.
- [ ] Migrar as três cópias para `<Modal>`; cabeçalho de Correction via `icon`/`headerExtra`.
- [ ] Corrigir o botão de fechar (estado dark/hover) na casca única.
- [ ] No `Modal`, trocar `aria-label` por `aria-labelledby` apontando para o título (`useId`), e o título de `h3` para `h2` (padrão do `ConfirmDialog` e de `23-accessibility`).
- [ ] Testes: Esc fecha; clique no backdrop fecha só com `dismissOnBackdrop`; foco volta ao elemento de origem.

### Task 6: Idioma da página (P3)

**Files:** Modify `lang/i18n.config.ts`; Test `lang/lang.test.ts`

- [ ] `i18n.on('languageChanged', lng => document.documentElement.lang = lng)` e valor inicial; `index.html` passa a `lang="pt"`.
- [ ] Teste: mudar idioma atualiza `document.documentElement.lang`.

### Task 6b: Skip link e hierarquia de headings (nova, vinda de `.agents`)

**Files:** Modify `UI/containers/AppLayout/AppLayout.tsx`, `pages/Turndown/TurndownPage.tsx`, `pages/Live/LivePage.tsx`, `pages/Audit/AuditPage.tsx`, `pages/Mobile/MobilePage.tsx`, `lang/pt.json`, `lang/en.json`; Test `UI/containers/AppLayout/AppLayout.test.tsx` (novo)

- [ ] Skip link como primeiro elemento focável (`sr-only focus:not-sr-only`), que salta para `<main id="main-content" tabIndex={-1}>`; texto `common.skipToContent` em PT/EN.
- [ ] Turndown, Live, Audit e Mobile abrem com `h2` sem `h1`: passar o título principal de cada página a `h1` (mantendo o estilo) e deixar os restantes como `h2`. Confirmar Planning, que não apareceu na pesquisa por headings.
- [ ] Teste: o skip link é o primeiro elemento focável e o `main` tem o `id`.

### Task 7: Legibilidade do texto (P2)

**Files:** Modify componentes com `text-[8px]`/`text-[9px]` e rótulos `text-slate-400` (ex.: `SummaryStrip.tsx`, `CreditsStatsModal.tsx`)

- [ ] Eliminar `text-[8px]`/`text-[9px]` (4 ocorrências); piso de `text-[11px]` para texto informativo, `text-xs` onde couber.
- [ ] Rótulos que usam `text-slate-400` sobre fundo claro passam a `text-muted` (token da Tarefa 1).
- [ ] Teste em `theme.test.ts` que falha com `text-\[(8|9)px\]`.

### Task 8: Migração para tokens semânticos (P2)

**Files:** Modify `src/index.css`, `config/theme.test.ts`, componentes por camadas

- [ ] Definir tokens em falta: `info`, `info-text`, `surface-muted`, `border`, e os de estado da Tarefa 1.
- [ ] Migrar por camadas, um commit cada: `Modal`/`ConfirmDialog`/`Navbar` → `RoomCard` e chips → páginas Planning/Turndown/Audit/Settings → restantes.
- [ ] Em cada camada migrada, o teste passa a proibir `bg-slate-*`, `text-slate-*`, `border-slate-*`, `bg-white` nessa pasta (lista de pastas "já migradas" em `theme.test.ts`).
- [ ] No fim, remover os aliases de `index.css` (`sky`, `cyan`, `green`, `rose`, `orange`, `stone`) e o teste das famílias com `ALLOWED`.
- [ ] Verificar no browser light e dark: diferenças visuais nas telas principais.

### Task 9: Alvos de toque e ruído de leitor de ecrã (P3)

**Files:** Modify `UI/containers/AppLayout/Navbar.tsx`, `UI/components/Correction/CorrectionRequestModal.tsx`, `UI/components/RoomCard/RoomCard.tsx`

- [ ] Botões de ícone com `min-h-9 min-w-9` (ou 44px se a decisão 1 incluir tablet); chips de preset com `py-1.5`.
- [ ] Remover o `title` do `div` do cartão (o botão do número já o tem).

### Task 10: Hero do Turndown e cor da equipa (P2)

**Files:** Modify `pages/Turndown/TurndownPage.tsx`, `UI/components/TeamManager/TeamMemberCard.tsx`, `UI/components/TeamManager/TeamColumn.tsx`

- [ ] Hero do Turndown com tokens do tema e sem gradiente; manter o ar noturno (superfície escura, ícone da lua) e alinhar o bloco de métricas ao `SummaryStrip`.
- [ ] Garantir que o nome do bloco/equipa aparece sempre junto dos riscos laterais/de topo.
- [ ] Confirmar a decisão 3: se não houver alternativa a arrastar para atribuir pessoas, abrir uma tarefa de seguimento.

### Task 11: Verificação final

- [ ] `npm run lint`, `npm run test:run`, `npx tsc -b`, `npm run build`.
- [ ] `impeccable detect --json UI pages src` sem avisos novos.
- [ ] Gate de acessibilidade automático conforme `.agents/25-e2e` (`@axe-core/playwright`, WCAG 2.2 AA) nas páginas principais. É a única dependência de desenvolvimento nova do plano; só entra se o projeto adotar Playwright, caso contrário fica registada como pendente.
- [ ] Checklist de `20-rules` (novo componente / nova página) e de `23-accessibility` para os componentes tocados; navegar cada página só com teclado.
- [ ] Revisão manual de teclado (Tab em todas as páginas) e do modo escuro.
- [ ] Voltar a correr `/impeccable audit` e comparar com 12/20.

## Ordem e esforço

Tarefas 1–4 (P1) primeiro, por esta ordem; a 1 desbloqueia a 2 e a 7. Depois 5 e 6 (independentes), 7, 8 (a maior, por camadas) e por fim 9–11.
