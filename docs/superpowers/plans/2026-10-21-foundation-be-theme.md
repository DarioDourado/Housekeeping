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

### Task 4: Stack do FE conforme `.agents` — PENDENTE (requer revisão do contrato da Task 3)

- [ ] Instalar TanStack Query, React Router, axios, i18next, Vitest, Testing Library.
- [ ] Migrar imports `../../` para `@/`.
- [ ] Partir `HousekeepingContext` (988 linhas) em hooks por domínio + transporters HTTP com `schema.parse`.
- [ ] i18n real (remover ~195 textos hardcoded), ErrorBoundary, ConfirmDialog, 4 estados de UI.
- [ ] Permissões por perfil (matriz §11) em vez de roles hardcoded.
- [ ] Páginas em `pages/`, rotas lazy, login split-screen (Theme.txt).
- [ ] Componentes > 200 linhas divididos; `ConfigurationPage` ligada ou removida.

### Task 5: BE MVP FastAPI — PENDENTE

- [ ] Projeto `backend/` conforme skill 34; modelos e migrações do contrato.
- [ ] Endpoints de planeamento, execução, inspeção e eventos; Opera atrás de interface simulada.
- [ ] Testes pytest dos cenários CT-01 a CT-20 aplicáveis.
