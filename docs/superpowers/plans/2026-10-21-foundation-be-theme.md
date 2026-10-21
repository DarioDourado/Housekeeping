# Foundation, Theme & Backend Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Alinhar o FE React ao `.agents`, aplicar o tema do Theme.txt e preparar o contrato FE↔BE (FastAPI) antes de qualquer código de backend.

**Architecture:** FE = Vite SPA React (layout na raiz: `hooks/`, `services/transporters/`, `types/`, `UI/`). BE = FastAPI + Pydantic v2, contrato único descrito na skill `.agents/34-backend-fastapi`, espelhado em Zod no FE. Tema por tokens em `@theme` (Tailwind v4).

**Tech Stack:** React 19, TypeScript strict, Tailwind v4, Zod, TanStack Query, React Router; FastAPI, Pydantic v2, SQLAlchemy 2, Alembic.

**Spec:** `housekeeping-app.txt` (requisitos da reunião), `Theme.txt` (design system), análise de conformidade de 2026-10-21.

## Global Constraints

- FE React; BE Python com FastAPI (decisão do utilizador).
- `.copilot-instructions` deixa de ser usado: ignorar.
- Qualquer alteração a tipos/transporters/contrato FE tem de atualizar a skill `34-backend-fastapi` no mesmo trabalho.
- Cores só via tokens do Theme.txt; cantos 12/16/24px; sem `shadow-lg/xl` nativos nem sombras em dark; foco = auréola `#00A9C5` a 20%.
- Estados do Opera (Dirty/Clean/Inspected) nunca representam estados internos de tarefa/turndown.

## Review Focus

- Tema em dark mode: sem sombras, rings de foco continuam visíveis.
- Tokens `bg-primary` e escala `blue-*` resolvem para a mesma cor.
- Contrato: quarto com tarefa diurna + refresh + turndown em simultâneo sem colisões.
- Contrato: evento com executor ≠ registador (telemóvel partilhado).
- Contrato: alteração de estado no Opera mais recente nunca é sobrescrita por escrita antiga da app.

---

### Task 1: Higiene do repositório — CONCLUÍDA

**Files:** `.gitignore`, `package.json`, `package-lock.json`, `vite.config.ts`, `.env.example`

- [x] `.agents` deixa de estar no `.gitignore` (verificado com `git check-ignore`: não ignorado).
- [x] Removidas `@google/genai` e `firebase-tools` (resíduos AI Studio).
- [x] Alias `@/` no `vite.config.ts` (o `tsconfig` já o tinha).
- [x] `.env.example` com `VITE_API_URL`.
- [ ] Commit (aguarda pedido do utilizador).

### Task 2: Tema Vila Vita × Apple HIG

**Files:** Modify `app/globals.css`

**Interfaces:** Produz tokens `bg-primary|primary-hover|canvas|surface|content|muted|line|success|danger|warning`, `animate-slide-up`; remapeia escalas `blue-*`, `slate-*`, radius e sombras.

- [x] Tokens, remap de escalas, radius, sombras, foco, checkbox squircle, tactile feedback e keyframes escritos em `globals.css`.
- [x] `npm run build` passa; CSS gerado contém `--color-primary:#00a9c5`, `--radius-xl:16px` e a regra `.dark *{--tw-shadow:0 0 #0000!important}`.
- [x] Verificação visual em light e dark (playwright-cli, 1600x900): marca turquesa, cinzas Apple, squircles, dark sem sombras.
- [ ] Migrar usos residuais de `shadow-*` e cores fora do sistema nos componentes (Task 5).

### Task 2b: Constantes globais (`config/`)

**Files:** Create `config/constants.ts`; Modify `config/hotelData.ts`, `services/transporters/housekeeping/housekeepingTransporter.ts`

**Interfaces:** Produz `BLOCKS`, `SHIFTS`, `TURNDOWN_SCHEDULE`, `CREDIT_TABLE`, `ROLE_PERMISSIONS` (matriz §11) e `OPERA_DAY_CLOSE_HOUR`; `hotelData.ts` passa a ser só dados de demonstração (seed), a sair quando o BE existir.

- [x] Extrair constantes reais de `hotelData.ts` para `config/constants.ts` (blocos, turnos, horários do turndown §10.2, tabela de créditos §15, fecho do dia ~02h §8.4).
- [x] `calculateRoomCredits` passa a ler `CREDIT_TABLE` (fim da duplicação); créditos da Villa marcados `PENDENTE`, pois não constam da reunião.
- [x] Matriz de permissões §11 como constante tipada em vez de `UserRole.X` espalhado (consumida na Task 4).
- [x] `npx tsc --noEmit` passa.

### Task 3: Skill de backend `34-backend-fastapi` + contrato de domínio

**Files:** Create `.agents/34-backend-fastapi/SKILL.md`, `.agents/34-backend-fastapi/references/domain-contract.md`; regenerar `MODULES.md`, `react-core.md`, `react-master.md`; Modify `.agents/20-rules/SKILL.md` (regra de sincronização).

**Interfaces:** Produz o contrato canónico: entidades `Room`, `ServicePlan`, `TaskSheet`, `ServiceTask`, `TaskEvent`, `OperaSyncJob`; enums; máquinas de estado; permissões; endpoints; decisões em aberto (§19 do requisito).

- [x] SKILL.md com estrutura de pastas FastAPI, Pydantic v2, auth, erros, migrações, testes, mapeamento Pydantic↔Zod e regra de manutenção.
- [x] `domain-contract.md` com modelos, estados e eventos; decisões em aberto marcadas `PENDENTE`.
- [x] `npm run generate` e `npm run check` em `.agents` passam (36 módulos); testes 25/25 com jsdom.
- [x] Regra 17 em `20-rules` e linha em `instructions/core.md`: alterar types/transporters/constants ⇒ atualizar skill 34.
- [x] Corrigido: `.agents` normalizado para LF + `.gitattributes` (o `core.autocrlf` do Windows partia o gerador); `npm test` passa a usar `--environment jsdom`; `corpus.test.ts` 35→36 módulos.

### Task 4: Stack do FE conforme `.agents` (aprovada em 2026-10-21)

Regra de execução: cada sub-tarefa termina verde (`npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build`) antes de começar a seguinte. Dados continuam num adaptador local (localStorage) **atrás do transporter**; o BE troca só o transporter.

**4.1 Ferramentas** — Files: `package.json`, `eslint.config.mjs`, `vitest.config.ts`, `tests/setup.ts`; apagar `.eslintrc.json`
- [x] Instalar `@tanstack/react-query`, `react-router-dom`, `axios`, `i18next`, `react-i18next`; dev: `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `typescript-eslint`.
- [x] ESLint com `typescript-eslint`; regras: `no-explicit-any`, `no-console`, `no-restricted-imports` (`../../*`), sem default export fora de config. `npm run lint` corre sem erros de parsing.
- [x] Vitest (jsdom, alias `@`, setup jest-dom); scripts `test`, `test:run`; um teste de fumo passa.

**4.2 Imports `@/`** — todos os `../../` e `../` entre pastas de topo passam a `@/`.
- [x] Migração mecânica (124 imports em 40 ficheiros); `tsc`, `lint`, `test` e `build` verdes; regra `no-restricted-imports` em `error`.
  - Nota 4.1: `@types/node` subiu para 24 (exigido pelo vitest 5); `no-unused-vars`, `no-explicit-any` e default-export em `warn` até 4.5/4.6/4.8.

**4.3 Fundações de UI e permissões** — Files: `UI/components/feedback/ErrorBoundary`, `UI/components/feedback/ConfirmDialog`, `lib/queryClient.ts`, `hooks/auth/usePermission.ts`
- [x] `ErrorBoundary` no root; `ConfirmDialog` acessível (foco, Esc); `QueryClientProvider` no root.
- [x] `usePermission(permission)` sobre `ROLE_PERMISSIONS`; substituir as 42 comparações com `UserRole.X` na UI. Teste: perfis × permissões confirmadas.
- [x] Ações destrutivas sem confirmação (remover colaborador no StaffManager, recarregar pré-definição) passam por `ConfirmDialog` via `useConfirm`. Verificado no browser (foco em Cancelar, Esc fecha).
  - Nota: das 42 ocorrências de `UserRole.X`, só 4 eram decisões de autorização (RoomCard, RoomDetailModal, MobileView); o resto são opções de `<select>`/rótulos e ficam. Efeito da matriz §11: empregadas deixam de ver o botão de prioridade; escritório deixa de ver "reabrir a Dirty" (§8.3 só confirma governantas) — rever com a equipa.
  - Nota: tsconfig target/lib → ES2022 (`.at()` do useFocusTrap).

**4.4 i18n real** — Files: `lang/i18n.config.ts`, `lang/pt.json`, `lang/en.json`; remover `hooks/i18n` e `lang/i18n.ts` antigos
- [x] `react-i18next` com `LanguageDetector` (09-i18n), `lang/pt.json` + `lang/en.json`, chaves `domínio.grupo.chave`; `lang/i18n.config.ts` carregado em `main.tsx` e nos testes.
- [x] 16 componentes + `app/page.tsx` + `App.tsx` extraídos (Navbar, MoveRoom, Inspection, OperaSync, Audit, Credits, Chat, Turndown, Mobile, RoomCard, RoomDetail, TaskSheetColumn, StaffManager, BlockTeamRosterBar, TeamManagerModal, CollaboratorDirectoryTab); scanner sem textos hardcoded restantes.
- [x] `lang/lang.test.ts`: mesmas chaves pt/en, sem vazios, mesmas variáveis `{{}}`, **todas as chaves `t('…')` usadas no código existem** (red-green verificado), chaves dinâmicas (`roles.*`, `teamColors.*`). Percurso no browser em PT e EN sem chaves a vazar.
- [ ] Pendente (fora da 4.4): `ConfigurationPage` (traduz-se ao dividi-lo na 4.6); textos gerados em contexto/transporters (eventos `Início de serviço às…`, canais de chat, seed) passam a estruturados na 4.5.
  - Notas: DRY `lib/credits.ts` (créditos) e `lib/staffBlock.ts` (bloco do utilizador); turndown deixou de mostrar "(Clean)/(Dirty)" (§10.6); matriz de créditos lê `CREDIT_TABLE` (refresh da Villa passa a 0,5 como no cálculo); favicon da marca.

**4.5 Dados: API local + transporters + React Query** — remove `context/HousekeepingContext.tsx` (988 linhas: regras + persistência + UI misturadas)

Fase A (mesmo modelo de domínio; troca de arquitetura):
- [x] **A1 Tipos:** timestamps passam a ISO-8601 (contrato §2); textos gerados deixam de ser frases PT guardadas e passam a `LocalizedText {key, params}` (eventos, alertas, logs Opera, toasts); novos tipos de evento `ROOM_REOPENED`, `TURNDOWN_UPDATED`, `STAFF_MOVED` (hoje reabrir/turndown/mover pessoa são registados com tipos errados). `lib/datetime.ts` formata com `Intl`.
- [x] **A2 Schemas Zod** (`types/housekeeping.schemas.ts`, `auth`) alinhados com os tipos; usados no transporter (`schema.parse`, 20-rules #7). Seed passa a ISO e sai do transporter para `config/hotelData.ts`.
- [x] **A3 API local** (`services/local-api/`): regras como funções puras `(estado, args, {actor, now}) → estado`, uma por comando, com testes (CLEAN ao terminar; DND/recusa ≠ limpo; turndown não toca no Opera; reprovar mantém CLEAN + alerta; inspeção → INSPECTED; mover/fundir sheets; night audit; prioridade; mover pessoa). É o que o BE FastAPI vai implementar.
- [x] **A4 Transporters** API-shaped (`housekeeping`, `staff`, `auth`, `chat`) sobre o store local (localStorage) com `schema.parse`; `_queryKeys.ts`; `calculateCounters`/`calculateRoomCredits` em `lib/`.
- [x] **A5 Hooks** (1 por ficheiro, <100 linhas): queries (`useRooms`, `useTaskSheets`, `useEvents`…) e mutações (`useStartRoom`, `useFinishRoom`, …) com invalidação; estado de UI cliente (arrastar, toast) em Zustand (`store/uiStore.ts`).
- [x] **A6 Migração dos componentes** (14 ficheiros) para os hooks; `HousekeepingContext` e `useHousekeeping` apagados; `AuthContext` só com sessão; `ChatDrawer` deixa de chamar o transporter diretamente.
- [x] **A7 Verificação:** `tsc` 0 erros; `lint` 0 erros (82 avisos de `no-unused-vars`/`any` a limpar na 4.8); 53 testes; `build` ok; percurso real no browser com 16 asserções (iniciar→terminar→Opera, mover quarto com toast e coluna, turndown independente, auditoria traduzida, persistência com validação Zod, night audit, reset com confirmação, 0 erros de consola).
  - Resultado: `HousekeepingContext` (988 linhas) apagado; regras em `services/local-api` (19 comandos puros, 27 testes), 36 hooks de 1 ficheiro, `store/uiStore` (Zustand) para arrastar/toast, `AuthContext` só com sessão.
  - Bugs encontrados e corrigidos ao extrair as regras (ver contrato 0.2): reabrir a Dirty era registado como prioridade e não escrevia no Opera; turndown era registado como `ROOM_FINISHED`; recomeçar uma limpeza herdava o fim anterior (não dava para terminar); largar um quarto numa posição não reordenava; mover quarto de bloco deixava `assignedSheetId` inconsistente; eliminar pessoa deixava ids pendurados nas sheets; seeds com horas `HH:mm` em campos ISO (`Invalid Date`).
  - Fora desta fase: `chatTransporter` (Fase 2 do requisito) mantém-se tal como estava, agora atrás de hooks; `ConfigurationPage` só trocou os hooks (traduz-se/divide-se na 4.6).

Fase B (contrato) — decisões: `hotelData.ts` continua a ser o mock/seed, agora em forma de contrato; a UI deixa de ler "quartos com estado" e passa a ler **tarefas** (`TaskView` = tarefa + quarto + estadia + sheet + executores), que é o que um cartão realmente representa.
- [x] **B1 Tipos e schemas do contrato** (`types/housekeeping.types.ts` reescrito): `Room` (físico, Opera), `RoomStay`, `Section`, `ServicePlan`, `TaskSheet` (+ atribuições), `ServiceTask`, `TaskEvent` (registador/executor/supervisor), `OperaSyncJob`; enums `Movement`, `TaskKind`, `PlanKind`, `TaskStatus`, `NotPerformedReason`, `InspectionStatus`, `CommercialBlock`, `PriorityOrigin`, `SyncState`. `operationalDate()` com o fecho às 02h.
- [x] **B2 Seed** em `config/hotelData.ts` na forma do contrato (13 quartos → quartos + estadias + secções + plano diurno e noturno + tarefas + eventos + jobs).
- [x] **B3 Comandos** (testes primeiro): `startTask`, `finishTask`, `inspectTask`, `requestCorrection`, `completeCorrection`, `reopenRoom`, `recordRefresh`, `recordNotPerformed` (DND/recusa), `togglePriority`, `moveTask`, `mergeSheets`, `assignStaffToSheet`, `openPlan`, `receiveOperaStatus`, `retryOperaJob`, `triggerNightAudit`, … Regras novas: tarefas independentes por tipo (CT-13/14), DND ≠ concluído (CT-10/11), executor ≠ registador, Opera: estado mais recente nunca é sobrescrito → job `CONFLICT` (CT-20), abrir dia a partir das secções sem as alterar (CT-01).
- [x] **B4 Camada de dados**: store/server/transporters/query keys/hooks; `lib/taskViews.ts` (junta tarefa+quarto+estadia+sheet+executores) e `useTaskViews(kind)`; créditos e contadores sobre tarefas.
- [x] **B5 Componentes** migrados para `TaskView` (cartão, detalhe, coluna, turndown, mobile, auditoria, Opera por jobs).
- [x] **B6 Verificação**: `tsc`, `lint`, testes, build e percurso no browser; contrato 0.3. Resultado: 103 testes (49 comandos, 8 de rotas/páginas com red-green por mutação), `tsc`/`lint` sem erros nem avisos, build ok; browser: login/validação/credenciais inválidas, 6 rotas, logout, permissões (empregada sem Configuração), empregada inicia→termina 102 → governanta aprova (Inspecionado), painéis Opera/Créditos/Equipas/Chat abrem e fecham com Esc, 0 erros de consola.

**4.6 Páginas, rotas e componentes** — Files: `pages/`, `routes/`, `UI/containers/`
- [x] `app/page.tsx` → `pages/Planning`, `pages/Turndown`, `pages/Live`, `pages/Audit`, `pages/Settings`, `pages/Login` (split-screen Theme.txt), rotas lazy + `ProtectedRoute`.
- [x] 4 estados de UI (loading/error/empty/success) em cada página (`PageStates`; Settings delega nas abas).
- [x] Componentes > 200 linhas divididos (nenhum componente passa de 200; `services/local-api/executionCommands.ts` tem 343 e divide-se na 4.8). `ConfigurationPage` (1537 linhas) substituída por `pages/Settings`: secções (CRUD, base permanente), quartos só de leitura (Opera) e atalhos para equipas/pessoal; permissão `config.zones`.
- [x] Sem `export default` na app; `'use client'` removido. Rotas em `routes/` (`ROUTES` em `config/constants.ts`), `UI/containers/{AppLayout,Overlays,ToastHost}`; login sem sessão implícita; `app/` e `types/components|pages` apagados.

**4.7 Tema residual** — [ ] `shadow-*`, cores cruas e `type=checkbox` revistos nos componentes; sem classes fora do sistema.

**4.8 Fecho** — [ ] contrato (`domain-contract.md`) reconciliado com o FE; changelog atualizado; verificação completa.

### Task 5: BE MVP FastAPI — PENDENTE

- [ ] Projeto `backend/` conforme skill 34; modelos e migrações do contrato.
- [ ] Endpoints de planeamento, execução, inspeção e eventos; Opera atrás de interface simulada.
- [ ] Testes pytest dos cenários CT-01 a CT-20 aplicáveis.
