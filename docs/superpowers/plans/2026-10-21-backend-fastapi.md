# Backend FastAPI (MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Estado: RASCUNHO PARA ANÁLISE.** Nada deste plano foi implementado nem aprovado. Primeiro passo, depois de aprovado: reconciliar `last-verified` da skill 34 com o git (regra de manutenção) e resolver a secção *Decisões a tomar*.

**Goal:** Substituir o `services/local-api` do FE por uma API FastAPI real que cumpre o mesmo contrato, sem alterar páginas, hooks nem tipos do FE (só os transporters).

**Architecture:** Router → Service → Repository (+ `integrations/opera`). As regras de negócio que hoje são funções puras em `services/local-api/*Commands.ts` passam a ser serviços Python com os **mesmos cenários de teste**. O estado Opera é escrito por uma outbox (`OperaSyncJob`) processada à parte, nunca dentro do pedido HTTP. O FE continua a ser a especificação executável até o BE passar os mesmos testes.

**Tech Stack:** Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2 (async) + Alembic, PostgreSQL, PyJWT + argon2, pytest + httpx, ruff + mypy strict (skill `34-backend-fastapi`; versões fixadas ao instalar).

**Spec:** `.agents/34-backend-fastapi/SKILL.md`, `.agents/34-backend-fastapi/references/domain-contract.md` (v0.3.1), `housekeeping-app.txt` (CT-01…CT-20), `services/local-api/` (comportamento de referência), `types/housekeeping.schemas.ts` (Zod = forma no fio).

## Global Constraints

- Base `/api/v1`; JSON `camelCase`; IDs UUID em string; datas ISO-8601 UTC com fuso.
- Enums com exatamente os valores dos enums de `types/housekeeping.enums.ts` e `UserRole` (`admin|supervisor|housekeeper|reception`).
- Erros `application/problem+json` com `code` estável (o FE traduz `errors.<code>`; nunca texto do servidor no ecrã).
- Concorrência otimista (`version` + `If-Match`, conflito = 409) e idempotência (`clientEventId`) em todas as escritas de execução.
- Eventos append-only; nenhuma estatística é guardada, reconstrói-se dos eventos.
- Texto gerado pelo sistema = `{ key, params }` (`LocalizedText`), nunca frase traduzida.
- Matriz de permissões = espelho de `ROLE_PERMISSIONS` (`config/constants.ts`); escopo: governanta = a sua área, empregada = tarefas atribuídas. O FE esconde, o BE decide.
- Estado Opera ≠ estado da tarefa; turndown e refresh nunca escrevem no Opera; DND/recusa nunca contam como limpo; escrita antiga nunca sobrepõe estado Opera mais recente (`CONFLICT`, retry humano).
- Dia operacional fecha às `OPERA_DAY_CLOSE_HOUR` (02h), configurável.
- Logs sem PII; dados de hóspedes só nos campos necessários por perfil.
- Alterar contrato ⇒ atualizar `domain-contract.md` e o seu changelog no mesmo trabalho.

## Decisões a tomar (bloqueiam as tarefas indicadas)

| # | Decisão | Default proposto | Bloqueia |
|---|---|---|---|
| D1 | Base de dados em dev/produção | PostgreSQL em ambos (Docker Compose em dev); SQLite só para testes unitários rápidos **não** (diverge em constraints e timestamps) | T1, T3 |
| D2 | Acesso real ao Opera (OHIP): credenciais, ambiente de testes, limites de taxa | Começar só com `FakeOperaClient`; `OhipClient` fica atrás do `Protocol` e só entra quando houver sandbox | T7, T12 |
| D3 | Identidade: contas locais (argon2) ou SSO do hotel | Contas locais no MVP; `AuthProvider` isolado para trocar por SSO | T6 |
| D4 | Onde corre (hosting, domínio, TLS, backups) | Fora do plano; só ficam `Dockerfile` e variáveis de ambiente documentadas | T11 |
| D5 | Tempo real: polling, SSE ou WebSocket | Polling por `staleTime` (já é o comportamento do FE); SSE numa 2.ª fase se a latência incomodar | T10 |
| D6 | Retenção de histórico e de dados de hóspedes (§19 do requisito) | Sem apagar na Fase 1; job de anonimização por configuração, desligado | T9 |
| D7 | Quem é a fonte das task sheets: criadas na app ou vindas do Opera | Criadas na app (default do contrato §9) | T4 |
| D8 | Alertas (`RoomAlert`) e chat estão na Fase 1? | Alertas **sim** (CT-08 precisa deles); chat/anexos/ocorrências (CT-16) Fase 2 | T5, T13 |

## Review Focus

Entradas que o requisito implica mas nenhuma tarefa exercita por si, e que mais facilmente falham em produção. Cada linha tem o seu teste na tarefa dona.

1. **Dois pedidos em simultâneo** sobre a mesma tarefa (duas empregadas no mesmo telemóvel, ou retry do telemóvel): só um `ROOM_STARTED`/`ROOM_FINISHED`; o segundo devolve o mesmo resultado (idempotência) ou 409 (versão). Teste em T4.
2. **Relógio do telemóvel errado**: `occurredAt` vem do servidor; o cliente só envia `clientEventId`. Um `occurredAt` do cliente no futuro é rejeitado ou ignorado, nunca gravado. Teste em T4.
3. **Dia operacional à meia-noite**: um quarto terminado à 01h30 pertence ao dia anterior; às 02h00 já é o dia seguinte; `openPlan` às 01h59 e às 02h01 abre planos diferentes. Teste em T4/T7 (clock injetável).
4. **Opera indisponível ou lento**: o pedido HTTP termina em ≤ 1 s sem esperar pelo Opera; o job fica `PENDING`, depois `FAILED` com tentativas; reiniciar o worker não duplica a escrita (`idempotencyKey`). Teste em T7.
5. **Apagar dados referenciados** (pessoa numa sheet, secção com quartos, quarto com tarefas): nunca deixa ids órfãos nem apaga histórico; o evento antigo mantém `registeredByName` (snapshot). Teste em T3/T5.

---

## Estrutura de ficheiros

```
backend/
├── pyproject.toml            # deps fixadas, ruff, mypy strict, pytest
├── Dockerfile · docker-compose.yml (api + postgres)
├── alembic.ini · migrations/
├── app/
│   ├── main.py · core/{config,security,deps,errors,permissions,clock,ids}.py
│   ├── models/    {staff,rooms,planning,tasks,events,opera,alerts}.py
│   ├── schemas/   (camelCase; 1 ficheiro por domínio, nomes iguais ao FE)
│   ├── repositories/ · services/ · api/v1/routers/
│   └── integrations/opera/{client.py (Protocol), fake.py, ohip.py, worker.py}
├── tests/                    # espelha app/ + tests/acceptance/test_ct_01_20.py + tests/contract/
└── contract/                 # fixtures geradas a partir do FE (ver T2)
```

---

### Task 1: Arranque do projeto e qualidade

**Files:** Create `backend/pyproject.toml`, `Dockerfile`, `docker-compose.yml`, `app/main.py`, `app/core/config.py`, `.github/workflows/backend.yml` (ou equivalente do CI usado), `tests/test_health.py`.

**Interfaces:** Produces `create_app() -> FastAPI`, `Settings` (pydantic-settings: `DATABASE_URL`, `JWT_*`, `CORS_ORIGINS`, `OPERA_DAY_CLOSE_HOUR`, `OPERA_MODE=fake|ohip`).

- [ ] Teste `GET /api/v1/health` → `200 {status:"ok"}`; falha antes de existir app.
- [ ] `create_app()` com CORS por origens explícitas (nunca `*` com credenciais) e handler de erros (T2).
- [ ] `ruff`, `mypy --strict` e `pytest` a correr no CI; segredos só por ambiente, `.env.example` sem valores reais.
- [ ] Verificação: `docker compose up` + `pytest -q` verdes numa máquina limpa.

### Task 2: Núcleo partilhado e contrato executável

**Files:** `app/core/{errors,permissions,clock,ids}.py`, `app/schemas/base.py`, `tests/contract/test_permissions.py`, `tests/contract/test_enums.py`, FE: `scripts/export-contract.ts` (gera `backend/contract/*.json`).

**Interfaces:**
- Produces `CamelModel`, `ProblemDetail(type,title,status,detail,code)`, `Clock` (injetável: `now() -> datetime`, `operational_date(dt) -> date` com o fecho às 02h), `require(permission) -> Depends`.
- Consumes do FE (exportado em JSON): `ROLE_PERMISSIONS`, todos os enums, `OPERA_DAY_CLOSE_HOUR`, seed de `config/hotelData.ts`.

- [ ] Script no FE exporta `ROLE_PERMISSIONS`, enums, constantes e seed para `backend/contract/` (regenerado por um comando; CI do FE falha se o ficheiro commitado divergir).
- [ ] Testes: a matriz Python é **igual** ao JSON exportado, célula a célula (admin sem `task.startFinish`/`room.markDirty`, etc.); cada enum Python tem os mesmos valores.
- [ ] Teste de `Clock.operational_date`: 01h59 → dia anterior, 02h00 → dia corrente; viragem de ano.
- [ ] Erros: qualquer exceção de domínio vira problem+json com `code`; nunca stack trace nem texto de SQL.

### Task 3: Modelo de dados e migrações

**Files:** `app/models/*.py`, `migrations/versions/0001_initial.py`, `tests/models/test_constraints.py`.

**Interfaces:** Produces tabelas `staff, devices, rooms, room_stays, sections, section_rooms, section_staff, service_plans, task_sheets, sheet_assignments, service_tasks, task_events, opera_sync_jobs, room_alerts, block_teams, refresh_tokens`. Todas as mutáveis com `version`.

- [ ] Constraints testadas (cada uma com um insert que tem de falhar): único `(operational_date, kind)` em planos; único `(plan_id, room_id, kind)` em tarefas; único `idempotency_key` em jobs; único `client_event_id` por `(registered_by, client_event_id)`.
- [ ] `task_events` append-only: o papel da aplicação não tem `UPDATE/DELETE` (ou trigger que recusa); teste que tenta alterar e falha. Eventos guardam `registered_by_name/role` e `room_number` como snapshot.
- [ ] Apagar pessoa/secção: política explícita (sheet_assignments em cascata, histórico intacto); teste do Review Focus 5.
- [ ] Alembic `upgrade head` + `downgrade base` num Postgres limpo; migração aplicada nunca é editada.
- [ ] Seed de desenvolvimento = o mesmo de `config/hotelData.ts` (via `contract/seed.json`).

### Task 4: Execução e inspeção (CT-06…CT-12, CT-19)

**Files:** `app/services/{execution,inspection,intervention}_service.py`, `app/repositories/{task,event}_repository.py`, `app/schemas/tasks.py`, `tests/services/test_execution.py`, `tests/services/test_inspection.py`.

**Interfaces:** Cada função recebe `(session, actor, args, clock)` e devolve a tarefa + eventos criados. Nomes iguais aos comandos do FE: `start_task, finish_task, record_not_performed, reopen_task, reopen_room, inspect_task, request_correction, complete_correction, record_refresh, toggle_priority`.

- [ ] **Port dos testes**: cada caso de `services/local-api/localApi.test.ts` sobre estes comandos vira um teste pytest com o **mesmo nome** (ex.: terminar limpeza → job Opera `CLEAN`; DND ≠ limpo; turndown nunca cria job; reprovar mantém `CLEAN` + alerta; recomeçar limpa o fim anterior; duração real sem *clamp*; executor ≠ registador; refresh sem tarefa prevista cria intervenção).
- [ ] Idempotência: repetir `start_task` com o mesmo `clientEventId` devolve o resultado anterior sem novo evento (Review Focus 1); `If-Match` com versão velha → 409 `code=version_conflict`.
- [ ] `occurredAt` sempre do servidor (Review Focus 2).
- [ ] Permissões e escopo por serviço (empregada só nas suas tarefas; governanta só na sua área), com teste negativo por cada.
- [ ] Mutação: remover a verificação de estado ou de permissão tem de fazer falhar pelo menos um teste (red-green registado no plano).

### Task 5: Planeamento, equipas e secções (CT-01…CT-05, CT-13…CT-15, CT-18)

**Files:** `app/services/{planning,team,section}_service.py`, `app/services/alert_service.py`, routers e schemas correspondentes, `tests/services/test_planning.py`, `tests/services/test_team.py`.

**Interfaces:** `open_plan(kind, date?)`, `move_task`, `merge_sheets`, `assign_staff_to_sheet`, `move_staff_to_block`, CRUD de `staff`, `block_teams`, `sections`, `move_room_to_section`, `restore_daily_to_default_baseline`, `acknowledge_alert`, `send_trace_alert`.

- [ ] Port dos testes do FE para estes comandos: abrir o dia copia as secções **sem as alterar** (CT-01); mover quarto não perde a tarefa nem muda `status` (CT-02); fundir vilas numa atribuição (CT-03); várias pessoas por sheet com `LEAD|MEMBER` (CT-04); extra criada e atribuível (CT-05); turndown independente do dia e duas atribuições por pessoa (CT-13/14); sheet vazia mantém-se (CT-15); quarto `OOS/OOO` nunca perde o bloqueio (CT-18).
- [ ] Largar um quarto numa posição reordena a sheet; apagar pessoa retira-a das sheets; mover quarto de bloco atualiza a sheet.
- [ ] `open_plan` é idempotente por `(date, kind)` e respeita o dia operacional (Review Focus 3).

### Task 6: Autenticação e dispositivos

**Files:** `app/core/security.py`, `app/services/auth_service.py`, `app/api/v1/routers/auth.py`, `tests/services/test_auth.py`, `tests/api/test_auth.py`.

**Interfaces:** `POST /auth/login|refresh|logout`, `GET /auth/me` (401 sem sessão, como o FE já faz). Access token curto no corpo; refresh em cookie `httpOnly; Secure; SameSite=Strict`, com rotação e deteção de reutilização (reutilizar um refresh antigo revoga a família).

- [ ] Testes: password errada e utilizador inexistente dão a **mesma** resposta e tempo comparável; limite de tentativas; reutilização de refresh revoga tudo; logout invalida; cookie com as flags certas.
- [ ] Telemóvel partilhado: troca de utilizador no dispositivo é um novo login; cada evento guarda `registeredById`, `deviceId` e `executorIds` opcional.
- [ ] Passwords com argon2; nunca em logs.

### Task 7: Opera atrás de uma interface (CT-06, CT-07, CT-20)

**Files:** `app/integrations/opera/{client,fake,ohip,worker}.py`, `app/services/opera_service.py`, `tests/integrations/test_fake_opera.py`, `tests/services/test_opera.py`.

**Interfaces:** `OperaClient` (Protocol): `get_room_status(room_id) -> (RoomStatus, observed_at)`, `set_room_status(room_id, status, idempotency_key)`, `list_rooms()`. `process_pending_jobs(session, client, clock)` (idempotente, com retry e *backoff*).

- [ ] Escritas só via `OperaSyncJob` (outbox) criada na mesma transação do evento; o pedido HTTP nunca chama o Opera (Review Focus 4).
- [ ] Conflito: se `room.opera_status_updated_at` > `occurredAt` do evento, o job fica `CONFLICT`, grava `OPERA_CONFLICT_DETECTED` e **não escreve**; só `retry_opera_job` (humano) relê o estado e decide.
- [ ] `receive_opera_status` (push/pull) atualiza o quarto sem tocar em tarefas (CT-20); `trigger_night_audit` faz Inspected→Clean e no-show→Dirty, com os eventos certos.
- [ ] `FakeOperaClient` configurável por teste (falha, lentidão, estado mais recente); `OhipClient` só com esqueleto e testes marcados `skip` até D2.
- [ ] Reiniciar o worker a meio não duplica escritas (mesma `idempotencyKey`).

### Task 8: API HTTP completa

**Files:** `app/api/v1/routers/{auth,staff,rooms,sections,plans,tasks,events,opera,alerts}.py`, `tests/api/test_*.py`.

Mapa comando FE → endpoint (um endpoint por comando; nomes do FE):

| Comando FE | Endpoint | Permissão |
|---|---|---|
| `startTask` / `finishTask` | `POST /tasks/{id}/start` · `/finish` | `task.startFinish` |
| `recordNotPerformed` | `POST /tasks/{id}/not-performed` | `task.startFinish` |
| `inspectTask` / `requestCorrection` / `completeCorrection` | `POST /tasks/{id}/inspect` · `/request-correction` · `/complete-correction` | `room.markInspected` · `correction.request` · `room.markClean` |
| `reopenRoom` / `reopenTask` | `POST /rooms/{id}/reopen` · `POST /tasks/{id}/reopen` | `room.markDirty` |
| `recordRefresh` | `POST /rooms/{id}/refresh` | `room.markClean` |
| `togglePriority` | `PATCH /tasks/{id}/priority` | `priority.reorder` |
| `openPlan` | `POST /plans` | `sheets.distribute` |
| `moveTask` / `mergeSheets` | `PATCH /tasks/{id}/move` · `POST /sheets/{id}/merge` | `sheets.distribute` |
| `assignStaffToSheet` | `PUT /sheets/{id}/assignments` | `staff.assign` |
| `receiveOperaStatus` / `syncWithOpera` / `retryOperaJob` / `triggerNightAudit` | `POST /opera/pull` · `/opera/sync` · `/opera/sync-jobs/{id}/retry` · `/opera/night-audit` | `config.zones` |
| staff · block-teams · sections | CRUD `/staff`, `/block-teams`, `/sections` (+ `PATCH /rooms/{id}/section`) | `staff.assign` / `config.zones` |
| `acknowledgeAlert` / `sendTraceAlert` | `POST /alerts/{id}/acknowledge` · `POST /alerts` | `messages.send` |
| leitura | `GET /rooms /stays /plans /sheets /tasks /events /opera/sync-jobs /alerts` | por escopo |

- [ ] Cada endpoint: teste feliz + 401 + 403 (perfil errado) + 403 (fora do escopo) + 422 (corpo inválido) + 409 (versão).
- [ ] Teste de contrato: `openapi.json` gerado = snapshot versionado; alterá-lo exige atualizar o snapshot e o contrato.
- [ ] Respostas de leitura filtradas por perfil: `guest.view` controla os campos de hóspede (minimização).

### Task 9: Privacidade, segurança e observabilidade

**Files:** `app/core/logging.py`, `app/core/security_headers.py`, `tests/security/`, `docs/` (nota de retenção).

- [ ] Logs estruturados com `requestId`; teste que falha se um email/nome de hóspede aparecer num log de pedido.
- [ ] Cabeçalhos de segurança, limites de tamanho de corpo, rate limit em login; checklist de `17-security` e `28-security-verification` executada e registada.
- [ ] Retenção/anonimização conforme D6 (desligada por defeito, com teste do mecanismo).
- [ ] Auditoria: quem leu dados de um hóspede (apenas contador/evento, sem conteúdo) — decidir com D6.

### Task 10: Tempo real (só se D5 o exigir)

- [ ] Default: nenhum trabalho; o FE já invalida por `staleTime`. Se SSE: `GET /events/stream` com autenticação por token de curta duração, reconexão e *heartbeat*; o FE só chama `queryClient.invalidateQueries` (nenhuma regra no cliente).

### Task 11: Entrega

**Files:** `Dockerfile` multi-stage, `docker-compose.yml`, `.github/workflows/backend.yml`, `README` do backend.

- [ ] Imagem sem root, `HEALTHCHECK`, migrações como passo separado do arranque; variáveis documentadas.
- [ ] CI: ruff, mypy, pytest com Postgres de serviço, snapshot OpenAPI, `pip-audit`.

### Task 12: Ligar o FE ao BE (único ponto que mexe no FE)

**Files (FE):** `services/transporters/{housekeeping,staff,auth}/*.ts`, `lib/apiClient.ts` (axios), `.env.example` (`VITE_API_URL`), `types/**` só se o contrato mudar.

**Interfaces:** Consumes todos os endpoints de T8. Produces o mesmo contrato dos transporters atuais (as assinaturas que os hooks usam não mudam).

- [ ] `apiClient`: `baseURL=VITE_API_URL`, access token em memória, refresh automático uma vez em 401, `withCredentials` para o cookie; erros problem+json → `ApiError{code}` → `errors.<code>`.
- [ ] Transporters: trocar `localServer.query/execute` por chamadas HTTP, mantendo `schema.parse` (Zod) e as `_queryKeys`; `VITE_API_URL` vazio mantém o `local-api` (modo demonstração/testes do FE).
- [ ] Enviar `clientEventId` e `If-Match`; tratar 409 com refetch + aviso (`toasts.versionConflict`, chave nova nas duas línguas).
- [ ] Teste de integração FE↔BE: subir o BE com seed, correr o fluxo do `routes.test`/browser (login → empregada termina 102 → governanta aprova → Opera Inspected) contra a API real.
- [ ] `domain-contract.md` → 1.0 (sai de rascunho) e `last-verified` atualizado.

### Task 13: Fase 2 (fora do MVP, só para não bloquear o desenho)

- Ocorrências com foto (CT-16): `Occurrence` + `Attachment` com upload validado (tipo/tamanho, antivírus, URL assinada); chat (`messages`); idades das crianças já vêm em `RoomStay.childAges` (CT-17).
- Regras de créditos configuráveis (`CreditRule`), hoje constante no FE (`CREDIT_TABLE`).

---

## Mapa CT-01…CT-20 → teste de aceitação

`tests/acceptance/test_ct_01_20.py` tem **um teste por CT**, a correr sobre a API HTTP com o seed do contrato (não sobre os serviços), para provar o fluxo ponta a ponta.

| CT | Tarefa dona | CT | Tarefa dona |
|---|---|---|---|
| 01 abrir o dia | T5 | 11 Refuse Service | T4 |
| 02 mover quarto | T5 | 12 Refresh independente | T4 |
| 03 juntar vilas | T5 | 13 turndown vs dia | T5 |
| 04 várias pessoas/sheet | T5 | 14 dois serviços por pessoa | T5 |
| 05 colaboradora extra | T5 | 15 sheet vazia | T5 |
| 06 limpeza → Clean | T4 + T7 | 16 foto de avaria | T13 (Fase 2) |
| 07 aprovar → Inspected | T4 + T7 | 17 idades de crianças | T8 (leitura) |
| 08 reprovar | T4 | 18 OOO/OOS | T5 |
| 09 prioridade | T4 | 19 histórico da tarefa | T4 + T8 |
| 10 DND | T4 | 20 mudança no Opera | T7 |

## Auto-revisão

- **Cobertura:** CT-01…CT-20 mapeados (CT-16 declarado Fase 2). Comandos do FE (`services/local-api/index.ts`) todos têm endpoint em T8. Entidades do contrato todas têm tabela em T3; `BlockTeam` e `RoomAlert` (não estavam no rascunho 0.2) entram em T3/T5 por D8.
- **Risco principal:** divergência silenciosa FE↔BE. Mitigações: fixtures geradas do FE (T2), snapshot OpenAPI (T8), testes portados com os mesmos nomes (T4/T5) e o teste de integração de T12.
- **Fora de âmbito deliberado:** Opera real (D2), SSO (D3), hosting (D4), tempo real (D5).
- **Ordem sugerida:** T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T11 → T12; T10 e T13 por decisão.
