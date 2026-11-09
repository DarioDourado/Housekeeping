# API: comandos de execução — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `housekeeping-api` passa a executar os 6 comandos de execução do contrato §4.1 (`startTask`, `finishTask`, `recordNotPerformed`, `reopenTask`, `reopenRoom`, `setRoomStatus`), com eventos, escrita no Opera, permissões, escopo, erros e idempotência.

**Architecture:** Um `ExecutionService` (regras, uma transação por comando) + um `opera_service.write_opera_status` reutilizável (inspeção e Opera vão precisar dele) + um router fino que traduz o resultado para `CommandResult`. Segue o padrão de `PlanningService` / `routers/planning.py`. O FE **não** muda neste plano: continua na `local-api` até todos os grupos existirem (projeto 3).

**Tech Stack:** FastAPI, SQLAlchemy 2 (sync, pyodbc), SQL Server real nos testes (`housekeeping_cloud_test`), pytest.

**Spec:** `docs/api/domain-contract.md` (FE) §4.1, §5, §6.1–6.3, §8; comportamento de referência em `services/local-api/executionCommands.ts` e `helpers.ts` (FE). Código em `../housekeeping-api`.

## Decisões deste plano (minhas, a rever)

1. **Opera sem worker.** O contrato §6.2 manda criar o job `PENDING` (outbox). Não há integração Opera nem worker, e o quarto nunca mudaria de estado. Por isso o job nasce `CONFIRMED` e o quarto muda na mesma transação, como o FE faz hoje. Marcado com `ponytail:` no código; a outbox entra quando houver Opera.
2. **Sem `If-Match`/412 aqui.** O contrato §6.3 pede-o para todas as entidades mutáveis; fica para um passo transversal depois dos grupos de comandos. Idempotência por `clientEventId` entra já.
3. **Sem toast.** Estes comandos não devolvem toast no FE (`toast` fica `None`).
4. **`occurredAt` aceite e ignorado** (contrato §6.2, Fase 1): o relógio é o do servidor.
5. **Erros** (contrato §5): recurso inexistente → 404 `TASK_NOT_FOUND`/`ROOM_NOT_FOUND`; transição inválida → 409 `TASK_INVALID_TRANSITION`; `reopenTask` numa `CLEANING` → 422 `TASK_KIND_NOT_ALLOWED`; mesmo resultado repetido → 200 sem evento; fora do escopo → 403 `SCOPE_FORBIDDEN`.

## Global Constraints

- Rotas sob `/api/v1`, JSON camelCase, inputs `StrictInputSchema` (campo desconhecido → 422).
- Ator sempre o do token (nunca no corpo); `deviceId` vem do cabeçalho `X-Device-Id`.
- Eventos append-only, `occurred_at` = relógio do servidor (`Now`), snapshot de nome e role do ator.
- Permissões (`app/core/permissions.py`): `startTask`/`finishTask`/`recordNotPerformed` → `TASK_START_FINISH`; `reopenTask`/`reopenRoom`/`setRoomStatus` → `ROOM_MARK_DIRTY`.
- Escopo (`in_scope`): só a `user` está limitada às sheets onde está atribuída.
- Testes só contra `housekeeping_cloud_test`; nunca a BD `housekeeping`. Comandos a correr a partir de `housekeeping-api/` com `.venv/Scripts/python.exe -m pytest`.
- Commits no repo `housekeeping-api`, mensagens `feat(execution): …`.

## Review Focus

Cada linha tem o teste no passo indicado.

1. Toque duplo em "concluir": segundo `finishTask` → 409 `TASK_INVALID_TRANSITION`, sem 2.º evento nem 2.º job (Task 2).
2. Reenvio com o mesmo `clientEventId` (telemóvel com rede fraca) → 200 com `changed` e `events` vazios, nenhum evento duplicado (Task 2).
3. Colaboradora (`user`) a agir numa tarefa de uma sheet onde não está → 403 `SCOPE_FORBIDDEN`, nada escrito (Task 2).
4. Id inexistente → 404 (não 500); `reopenRoom` num quarto sem plano DAY ativo ou sem tarefa de limpeza → escreve DIRTY e o evento, sem falhar (Tasks 2 e 3).
5. `executorIds` com mais de 20 ids ou ids com mais de 36 caracteres → 422 (Task 2).

---

### Task 1: Eventos, escrita no Opera e respostas

**Files:**
- Create: `app/services/events.py`, `app/services/opera_service.py`
- Modify: `app/schemas/domain.py` (`Changed` + `SyncJobOut`)
- Test: `tests/integration/test_opera_service.py`

**Interfaces:**
- Produces:
  - `make_event(actor: Staff, now: datetime, type: EventType, *, subject_type: SubjectType, subject_id: str, room: Room | None = None, task: ServiceTask | None = None, detail: dict | None = None, executor_ids: Sequence[str] = (), on_behalf_of_team: bool = False, supervisor_id: str | None = None, duration_seconds: int | None = None, device_id: str | None = None, client_event_id: str | None = None) -> TaskEvent` (não faz `add`; preenche `room_id`/`room_number`/`task_id` a partir de `room`/`task`).
  - `@dataclass OperaWrite: job: OperaSyncJob | None; events: list[TaskEvent]` e `write_opera_status(db: Session, now: datetime, actor: Staff, room: Room, target: RoomStatus, source: dict, *, device_id: str | None = None, occurred_at: datetime | None = None) -> OperaWrite`.
  - `SyncJobOut(CamelModel)` com os campos de `OperaSyncJob` em camelCase; `Changed` ganha `rooms: list[RoomOut] | None` e `sync_jobs: list[SyncJobOut] | None`.

- [ ] **Step 1: Write the failing tests** em `tests/integration/test_opera_service.py` (usar a fixture `db`; criar um `Room` DIRTY e um `Staff` com helpers locais):
  - `test_write_confirms_job_and_updates_room`: `write_opera_status(..., target=CLEAN, source={"key": "opera.source.cleanFinished"})` → `job.state == CONFIRMED`, `job.previous_status == DIRTY`, `room.opera_status == CLEAN`, `room.opera_status_updated_at == now`, `events == []`.
  - `test_same_idempotency_key_creates_no_second_job`: duas chamadas com o mesmo `occurred_at` explícito → a 2.ª devolve `job is None` e há 1 só linha em `opera_sync_jobs`.
  - `test_older_write_is_a_conflict_and_leaves_room_untouched`: quarto com `opera_status_updated_at = now`, chamada com `occurred_at = now - 1 min` → `job.state == CONFLICT`, `job.last_error == {"key": "opera.errors.newerStatus"}`, estado do quarto inalterado, `events[0].type == OPERA_CONFLICT_DETECTED`.
- [ ] **Step 2: Run** `.venv/Scripts/python.exe -m pytest tests/integration/test_opera_service.py -q` → FAIL (módulos inexistentes).
- [ ] **Step 3: Implement** `make_event`, `write_opera_status` e os schemas. `idempotency_key = f"{room.id}:{target.value}:{occurred_at.isoformat()}"`; `occurred_at` por omissão = `now`; conflito se `room.opera_status_updated_at > occurred_at`. Detalhe do evento de conflito: `{"key": "events.operaConflict", "params": {"number": room.number, "status": target.value}}`. Marcar com `# ponytail: sem worker Opera, o job nasce CONFIRMED (contrato §6.2 manda PENDING); outbox quando houver integração`.
- [ ] **Step 4: Run** o mesmo comando → PASS.
- [ ] **Step 5: Commit** `feat(execution): event factory and Opera write with idempotency and conflict`.

### Task 2: startTask, finishTask, recordNotPerformed

**Files:**
- Create: `app/services/execution_service.py`, `app/routers/execution.py`
- Modify: `app/main.py` (incluir o router sob `API_V1`), `app/core/cors.py` (adicionar `X-Device-Id` a `allow_headers`)
- Test: `tests/integration/test_execution.py`

**Interfaces:**
- Consumes: `make_event`, `write_opera_status` (Task 1); `in_scope` (`app/core/permissions.py`); `DomainError`; `Now`, `DbSession`, `require` (`app/dependencies`).
- Produces:
  - `@dataclass ExecutionResult: tasks: list[ServiceTask]; rooms: list[Room]; sync_jobs: list[OperaSyncJob]; events: list[TaskEvent]` (vazio = no-op idempotente).
  - `ExecutionService(db: Session, now: datetime, actor: Staff, device_id: str | None = None)` com `start_task(task_id: str, executor_ids: list[str] | None, client_event_id: str | None) -> ExecutionResult`, `finish_task(task_id, executor_ids, client_event_id) -> ExecutionResult`, `record_not_performed(task_id: str, reason: NotPerformedReason, client_event_id: str | None) -> ExecutionResult`.
  - Rotas: `POST /tasks/{task_id}/start` e `/finish` (corpo `{executorIds?, clientEventId?, occurredAt?}`), `POST /tasks/{task_id}/not-performed` (corpo `{reason, clientEventId?}`); todas devolvem `CommandResult`. `command_result(result: ExecutionResult) -> CommandResult` no router (reutilizado na Task 3); chama `background.add_task(notify_changed, ["tasks", "rooms", "syncJobs"], <task ou room id>)` quando há alterações.

- [ ] **Step 1: Write the failing tests** em `tests/integration/test_execution.py`. Fixtures: `demo` e `auth` como em `test_planning.py`; fixture `day(client, demo)` abre o plano DAY como governanta (Filipa Mendes) e devolve `(headers, tasks)` do `changed`; helper `member_of(task)` devolve o `Staff` `user` atribuído (role `MEMBER`) à sheet da tarefa. Testes:
  - `test_start_sets_in_progress_and_writes_event`: `POST /tasks/{id}/start` como a colaboradora da sheet → `tasks[0].status == "IN_PROGRESS"`, `startedById` = ela, `executorIds == [ela]` (sheet com 1 só pessoa não-LEAD), `events[0].type == "ROOM_STARTED"`, `events[0].deviceId == "TAB-1"` quando enviado `X-Device-Id: TAB-1`.
  - `test_finish_cleaning_completes_and_marks_room_clean`: start + finish → `status == "COMPLETED"`, `durationSeconds >= 0`, `inspectionStatus == "PENDING"`, `changed.rooms[0].operaStatus == "CLEAN"`, `changed.syncJobs[0].state == "CONFIRMED"`, evento `ROOM_FINISHED` com `durationSeconds`.
  - `test_finish_is_not_repeatable` (Review Focus 1): 2.º finish → 409, `code == "TASK_INVALID_TRANSITION"`, e `count(task_events)` e `count(opera_sync_jobs)` iguais aos do fim do 1.º.
  - `test_client_event_id_makes_start_idempotent` (Review Focus 2): dois `start` com o mesmo `clientEventId` → 2.º devolve 200 com `events == []` e `changed.tasks` vazio/ausente; 1 só evento `ROOM_STARTED`.
  - `test_collaborator_outside_sheet_is_forbidden` (Review Focus 3): `user` de OUTRA sheet → 403 `SCOPE_FORBIDDEN`; tarefa continua `PENDING`.
  - `test_reception_cannot_start`: role `reception` → 403 `PERMISSION_DENIED`.
  - `test_unknown_task_is_404` (Review Focus 4): id inexistente → 404 `TASK_NOT_FOUND`.
  - `test_executor_ids_are_bounded` (Review Focus 5): 21 ids, ou um id de 37 caracteres → 422.
  - `test_not_performed_dnd_then_same_reason_is_noop`: `reason=DND` → `NOT_PERFORMED`, `inspectionStatus == "NOT_REQUIRED"`, evento `DND_RECORDED`, sem job nem alteração do quarto; repetir o mesmo motivo → 200, `events == []`; numa tarefa `COMPLETED` → 409.
- [ ] **Step 2: Run** `.venv/Scripts/python.exe -m pytest tests/integration/test_execution.py -q` → FAIL (404 nas rotas).
- [ ] **Step 3: Implement** o service seguindo `services/local-api/executionCommands.ts` (FE) ponto a ponto:
  - guardas: `start` só de `PENDING`/`NOT_PERFORMED`; `finish` só de `PENDING`/`IN_PROGRESS`; `not_performed` recusa `COMPLETED` (409) e é no-op se já `NOT_PERFORMED` com o mesmo motivo; outras → 409 `TASK_INVALID_TRANSITION`;
  - `resolve_execution(task, executor_ids)`: com ids explícitos `on_behalf_of_team = actor.id not in ids`; sem ids, se a sheet (sem LEAD) tem exatamente 1 pessoa e é o ator → `[actor.id]`, senão `[]` e `on_behalf_of_team=True`; `finish` mantém os executores do início se `task.started_by_id` e sem ids explícitos;
  - `start` limpa `finished_at`, `duration_seconds`, `not_performed_reason`; `finish` calcula a duração real sem mínimo; só `CLEANING` passa a `inspection_status=PENDING` e chama `write_opera_status(..., CLEAN, {"key": "opera.source.cleanFinished"})`;
  - tipos de evento e chaves de `detail` iguais às do FE (`ROOM_STARTED`/`events.roomStarted`, `ROOM_FINISHED`/`TURNDOWN_UPDATED`, `DND_RECORDED`/`SERVICE_REFUSED`/`TURNDOWN_UPDATED`);
  - escopo: antes de qualquer escrita, se `not in_scope(actor.role, actor.id, ids dos SheetAssignment da sheet da tarefa)` → `DomainError("SCOPE_FORBIDDEN", status_code=403)`;
  - idempotência: se `client_event_id` já existe para `(actor.id, client_event_id)` → `ExecutionResult` vazio;
  - schemas de corpo com `StrictInputSchema`, `executor_ids: list[Annotated[str, Field(max_length=36)]] | None = Field(default=None, max_length=20)`, `client_event_id: str | None = Field(default=None, max_length=36)`.
- [ ] **Step 4: Run** o mesmo comando → PASS; correr também `pytest tests/integration/test_planning.py -q` (sem regressões).
- [ ] **Step 5: Commit** `feat(execution): startTask, finishTask and recordNotPerformed`.

### Task 3: reopenTask, reopenRoom, setRoomStatus

**Files:**
- Modify: `app/services/execution_service.py`, `app/routers/execution.py`
- Test: `tests/integration/test_execution.py`

**Interfaces:**
- Consumes: `ExecutionService`, `ExecutionResult`, `command_result` (Task 2); `write_opera_status`.
- Produces: `ExecutionService.reopen_task(task_id: str) -> ExecutionResult`, `reopen_room(room_id: str, reason: str | None) -> ExecutionResult`, `set_room_status(room_id: str, status: RoomStatus) -> ExecutionResult`; rotas `POST /tasks/{task_id}/reopen`, `POST /rooms/{room_id}/reopen` (corpo `{reason?, occurredAt?}`), `PUT /rooms/{room_id}/status` (corpo `{status, occurredAt?}`), todas com `Permission.ROOM_MARK_DIRTY`.

- [ ] **Step 1: Write the failing tests** (mesmo ficheiro; abrir também o plano NIGHT para ter um turndown):
  - `test_reopen_cleaning_task_is_not_allowed`: `reopen` numa `CLEANING` → 422 `TASK_KIND_NOT_ALLOWED`.
  - `test_reopen_turndown_resets_it`: turndown concluído → `reopen` → `PENDING`, executores vazios, evento `TURNDOWN_UPDATED`, sem job; num já `PENDING` → 200 sem eventos.
  - `test_reopen_room_resets_day_cleaning_and_writes_dirty`: limpeza concluída e quarto `CLEAN` → `POST /rooms/{id}/reopen` → tarefa `PENDING`, `inspectionStatus == "PENDING"`, quarto `DIRTY`, evento `ROOM_REOPENED` com `supervisorId` = ator, job `CONFIRMED` com `targetStatus == "DIRTY"`.
  - `test_reopen_room_without_day_plan_still_writes_dirty` (Review Focus 4): sem plano aberto → 200, quarto `DIRTY`, evento `ROOM_REOPENED` com `taskId == None`; id de quarto inexistente → 404 `ROOM_NOT_FOUND`.
  - `test_set_status_inspected_approves_the_cleaning`: `PUT /rooms/{id}/status {"status": "INSPECTED"}` → limpeza `COMPLETED` + `APPROVED`, quarto `INSPECTED`, evento `ROOM_STATUS_CHANGED`; `CLEAN` → `inspectionStatus == "PENDING"`; `DIRTY` delega em `reopen_room` (mesmo evento `ROOM_REOPENED`); estado igual ao atual → 200 sem eventos nem job.
  - `test_collaborator_cannot_reopen_or_set_status`: `user` → 403 `PERMISSION_DENIED` nas 3 rotas.
- [ ] **Step 2: Run** `.venv/Scripts/python.exe -m pytest tests/integration/test_execution.py -q` → FAIL nos novos.
- [ ] **Step 3: Implement** seguindo `reopenTask`, `reopenRoom` e `setRoomStatus` do FE: `reset_task` repõe `status=PENDING`, `inspection_status=PENDING`, `inspection_note`, `started_at`, `finished_at`, `duration_seconds`, `started_by_id`, `not_performed_reason` a nulo, `executor_ids=[]`, `on_behalf_of_team=False`; a limpeza do dia é a tarefa `CLEANING` do quarto no plano DAY `ACTIVE` mais recente; `reopen_room` escreve `DIRTY` (`source={"key": "opera.source.reopened"}`) e `set_room_status` usa `{"key": "opera.source.statusEdited"}`; chaves de `detail`: `events.taskReopened`, `events.roomReopened`/`events.roomReopenedDefault`, `events.roomStatusChanged` (params `name`, `from`, `to`).
- [ ] **Step 4: Run** o ficheiro inteiro → PASS.
- [ ] **Step 5: Commit** `feat(execution): reopenTask, reopenRoom and setRoomStatus`.

### Task 4: Contrato, regressão e fecho

**Files:**
- Modify (repo FE): `docs/api/domain-contract.md` (§4.1, §6.2, §2)
- Modify (repo API): `README.md` não é necessário

- [ ] **Step 1:** No contrato, marcar as 6 rotas de §4.1 como **implementadas** (sem `[proposta]`), documentar `X-Device-Id`, `clientEventId`, os códigos novos (`TASK_NOT_FOUND`, `ROOM_NOT_FOUND`, `TASK_INVALID_TRANSITION`, `TASK_KIND_NOT_ALLOWED`, `SCOPE_FORBIDDEN`) e, em §6.2, a decisão 1 (job `CONFIRMED` sem worker até haver Opera).
- [ ] **Step 2:** No repo API correr a suite completa: `.venv/Scripts/python.exe -m pytest -q` → todos passam, incluindo `test_migrations_match_models` (não há migration nova: o grupo não altera o schema).
- [ ] **Step 3: Commit** no repo FE `docs(api): execution commands as implemented`.
