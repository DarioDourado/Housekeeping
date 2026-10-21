# Contrato de domínio FE ↔ BE (Housekeeping VILA VITA Parc)

Versão do contrato: **0.3 (rascunho)** · Origem: `housekeeping-app.txt` (reunião) · Estado: **a validar com a equipa**.
`PENDENTE` = decisão em aberto (§19 do requisito), com o **default provisório** a usar até decisão.
Qualquer alteração a `types/`, `services/transporters/` ou `config/constants.ts` atualiza este ficheiro.

## 1. Princípios de modelação (§22 do requisito)

1. **Room** é a unidade física; **ServiceTask** é uma intervenção; **ServicePlan** é a distribuição de um dia e serviço.
2. Estado Opera (`operaStatus`) ≠ estado da tarefa (`status`) ≠ inspeção (`inspectionStatus`) ≠ bloqueio comercial (`commercialBlock`).
3. Guardar **eventos**, não só estado atual.
4. Distinguir **executor físico**, **registador** e **supervisor**.
5. Opera é a fonte de reservas, ocupação, inventário, estado Dirty/Clean/Inspected e OOS/OOO.

## 2. Enums

| Enum | Valores | Notas |
|---|---|---|
| `RoomStatus` (Opera) | `DIRTY` `CLEAN` `INSPECTED` | Igual ao FE |
| `Movement` | `DEPARTURE_ARRIVAL` `STAYOVER` `DEPARTURE_ONLY` `VACANT` | Substitui a parte "movimento" do `ServiceType` do FE |
| `TaskKind` | `CLEANING` `REFRESH` `TURNDOWN` | `ServiceType.REFRESH` do FE passa para aqui |
| `PlanKind` | `DAY` `NIGHT` | `ServiceShift.MORNING`/`TURNDOWN` do FE |
| `TaskStatus` | `PENDING` `IN_PROGRESS` `COMPLETED` `NOT_PERFORMED` | Execução; sem estados do Opera |
| `NotPerformedReason` | `DND` `REFUSE_SERVICE` | Nunca contam como limpo |
| `InspectionStatus` | `NOT_REQUIRED` `PENDING` `APPROVED` `CORRECTION_REQUESTED` | Dimensão própria |
| `CommercialBlock` | `NONE` `OOS` `OOO` | Só leitura (Opera) |
| `UserRole` | `admin` `supervisor` `housekeeper` `reception` | Valores iguais ao FE |
| `PriorityOrigin` | `RECEPTION` `HOUSEKEEPING` | |
| `SyncState` | `PENDING` `CONFIRMED` `FAILED` `CONFLICT` | |
| `EventType` | ver §4 | Superconjunto do `RoomEventType` do FE |

## 3. Entidades

Campos `camelCase` no fio, `snake_case` na base de dados. `*` = obrigatório. `version` em todas as mutáveis (**BE**: o FE em memória ainda não o usa; o BE acrescenta-o para concorrência otimista).

**Room** (leitura do Opera): `id*` `number*` `block*` `floor*` `typology*` (`STANDARD|JUNIOR_SUITE|SUITE|VILLA`) `operaStatus*` `operaStatusUpdatedAt*` `commercialBlock*` `occupied*`.

**RoomStay** (snapshot do Opera por dia): `roomId*` `date*` `movement*` `guestName` `vipType` `adults` `children` `childAges: (int|null)[]` `arrivalEta` `departureEta` `isLinenChangeDue` `instructions` `traces[]` `notes` `specials[]` `preferences`. Dados pessoais: minimizar, só campos necessários por perfil.
> FE hoje guarda `childAges` como texto livre; passa a lista de idades (a API não inventa o que não foi introduzido).

**Section** (configuração base, permanente): `id*` `name*` `block*` `defaultRoomIds[]` (ordenada) `defaultStaffIds[]`. Alterar aqui é estrutural; não afeta planos já abertos.

**Staff** (utilizador): `id*` `name*` `role*` `email*` `defaultSectionId` `isExtra` `isActive` `shift`. **Device**: `id*` `label*` (ex. `TEL-AREA-06`) `assignedStaffId`.

**ServicePlan**: `id*` `operationalDate*` `kind*` `status*` (`DRAFT|ACTIVE|CLOSED`) `createdById*`. Único por (`operationalDate`, `kind`). Abrir um plano **copia** os defaults das secções sem os alterar.

**TaskSheet** (instância): `id*` `planId*` `number*` `title*` `sectionId` `isReserve*` (estacionamento/sem colaboradora) `assignments[]` = `{ staffId, role: LEAD|MEMBER }`. Contadores são **derivados**, nunca guardados. Sheets vazias nunca são apagadas.

**ServiceTask** (já assim no FE, 0.3): `id*` `planId*` `sheetId*` `roomId*` `kind*` `movement*` `status*` `notPerformedReason` `isPriority*` `priorityOrigin` `priorityReason` `orderIndex*` `inspectionStatus*` `inspectionNote` `startedAt` `finishedAt` `durationSeconds` `startedById` (quem registou o início) `executorIds[]` (quem executou; vazio = desconhecido) `onBehalfOfTeam*`. Único por (`planId`, `roomId`, `kind`). A duração é **real**: nunca se ajusta nem corta, para as anomalias ficarem visíveis na auditoria.

**TaskEvent** (append-only; FE 0.3): `id*` `occurredAt*` (UTC, servidor) `type*` `roomId*` `roomNumber*` (snapshot; `ALL` = vários) `taskId` `registeredById*` `registeredByName*` `registeredByRole*` `executorIds[]` `deviceId` `onBehalfOfTeam*` `supervisorId` `detail: LocalizedText` `durationSeconds` `metadata` (JSON tipado por `type`). **BE**: acrescenta `clientEventId*` (idempotência).
> Executor ≠ registador: num telemóvel partilhado a responsável regista (`registeredById`) e escolhe quem executou (`executorIds`); sem escolha, `onBehalfOfTeam = true` e a estatística é da equipa.

**OperaSyncJob** (FE 0.3): `id*` `roomId` (`null` = todos) `direction*` (`APP_TO_OPERA|OPERA_TO_APP`) `previousStatus` `targetStatus*` `state*` `attempts*` `idempotencyKey*` (mesma chave = mesma escrita) `lastError: LocalizedText` `operaObservedAt` `createdAt*` `source: LocalizedText`. `CONFLICT` e `FAILED` só avançam por **retry humano** (`retryOperaJob`).

**Fase 2 (esboço)**: `Alert`, `Occurrence` (`roomId`, `category`, `description`, `attachmentIds[]`), `Message` (`scope: INDIVIDUAL|GROUP`), `Attachment`. **Fase 3**: `CreditRule` (tipologia × serviço).

## 4. Eventos

Mantidos do FE: `ROOM_STARTED` `ROOM_FINISHED` `INSPECTION_APPROVED` `INSPECTION_REPROVED` `REFRESH_RECORDED` `DND_RECORDED` `SERVICE_REFUSED` `PRIORITY_TOGGLED` `MOVED_TASK_SHEET` `OPERA_SYNC_PUSH` `OPERA_SYNC_PULL` `NIGHT_AUDIT_TRIGGERED`.
Novos: `TASK_NOT_PERFORMED` `CORRECTION_REQUESTED` `CORRECTION_DONE` `STAFF_ASSIGNED` `STAFF_UNASSIGNED` `OPERA_SYNC_FAILED` `OPERA_CONFLICT_DETECTED`.
**Já no FE (0.3):** `CORRECTION_DONE` `PLAN_OPENED` `OPERA_CONFLICT_DETECTED` (os três juntam-se aos de 0.2) e `reopenTask` (reabre uma tarefa não limpa, sem escrever no Opera).
**Já no FE (0.2):** `ROOM_REOPENED` (governanta devolve o quarto a Dirty; antes era registado como `PRIORITY_TOGGLED`), `TURNDOWN_UPDATED` (antes `ROOM_FINISHED`, o que misturava turndown com o serviço diurno) e `STAFF_MOVED`.

**Formato de eventos, alertas e logs Opera (0.2):** `timestamp` em ISO-8601 UTC; o texto gerado pelo sistema não é uma frase mas `detail: { key, params }` (`LocalizedText`), que a UI traduz (`events.*`, `alerts.*`, `opera.source.*`). O BE guarda e devolve `key` + `params`; nunca texto traduzido. Eventos que abrangem todos os quartos usam `roomNumber = "ALL"`. Chaves de sistema novas em 0.3: `events.{turndownDone,roomFinishedNoTime,correctionDone,taskReopened,operaConflict,operaPulled,operaRetried,planOpened}`, `opera.source.{pushedByOpera,nightAuditNoShow}`, `opera.errors.newerStatus`, `toasts.planOpened` (um teste do FE garante que todas existem em `pt.json` e `en.json`).

## 5. Máquinas de estado

**Tarefa:** `PENDING → IN_PROGRESS → COMPLETED`; `PENDING|IN_PROGRESS → NOT_PERFORMED(reason)`; `NOT_PERFORMED → PENDING` (nova tentativa). Mover de sheet não altera `status`.
**Inspeção:** `PENDING → APPROVED | CORRECTION_REQUESTED`; correção feita (`completeCorrection`) → volta a `PENDING`. Pedir correção **mantém** o quarto `CLEAN` no Opera (não reabre a Dirty). `INSPECTED` no Opera só após `APPROVED`.

**Regras de sincronização com o Opera:**

| Acontecimento | Escreve no Opera |
|---|---|
| `CLEANING` concluída | `CLEAN` |
| Inspeção `APPROVED` (limpeza) | `INSPECTED` |
| Inspeção com correção | nada (mantém o estado anterior) |
| Governanta reabre quarto | `DIRTY` (PENDENTE: motivo obrigatório?) |
| `TURNDOWN` em qualquer estado | **nada** |
| DND / Refuse Service | nada (PENDENTE §19: atualizar algum campo?) |
| `REFRESH` concluído | nada por defeito (PENDENTE: reinspeção) |

Conflito: se `Room.operaStatusUpdatedAt` > `occurredAt` do evento, o job fica `CONFLICT`, regista `OPERA_CONFLICT_DETECTED` e **não escreve**; só um retry humano (que relê o estado) o resolve. Escritas idempotentes: repetir a mesma `idempotencyKey` não duplica jobs. Após o fecho do dia (`OPERA_DAY_CLOSE_HOUR`) o estado é relido do Opera, sem repor o guardado.

## 6. Permissões (espelho de `ROLE_PERMISSIONS`)

Permissões: `rooms.viewAll|viewArea|viewAssigned` `sheets.distribute` `staff.assign` `priority.reorder` `task.startFinish` `room.markClean|markInspected|markDirty` `correction.request` `stats.teamTimes` `stats.supervisors` `guest.view` `messages.send` `config.zones`.

| Perfil | Permissões confirmadas (§11) |
|---|---|
| `admin` | viewAll, distribute, assign, reorder, markInspected, correction, teamTimes, supervisors, guest, messages, zones |
| `supervisor` | viewArea, reorder, markClean, markInspected, markDirty, correction, guest, messages |
| `housekeeper` | viewAssigned, startFinish, markClean, guest (só o necessário), messages |
| `reception` | reorder, messages |

As células "A definir" do requisito ficam **fora** até decisão. Escopo: supervisor = a sua área; housekeeper = tarefas atribuídas.

## 7. Endpoints v1 (MVP)

> A especificação executável dos comandos está em `services/local-api/` (FE): 1 função pura por comando
> (0.3: `startTask`, `finishTask`, `recordNotPerformed`, `inspectTask`, `requestCorrection`, `completeCorrection`, `reopenRoom`,
> `reopenTask`, `recordRefresh`, `togglePriority`, `openPlan`, `moveTask`, `mergeSheets`, `assignStaffToSheet`, `receiveOperaStatus`,
> `triggerNightAudit`, `syncWithOpera`, `retryOperaJob`, `moveStaffToBlock`, CRUD de staff/equipas/secções, `moveRoomToSection`,
> `restoreDailyToDefaultBaseline`, `acknowledgeAlert`, `sendTraceAlert`) com testes em `localApi.test.ts`. O BE FastAPI tem de cumprir os mesmos testes.

| Domínio | Endpoints |
|---|---|
| auth | `POST /auth/login` `POST /auth/refresh` `POST /auth/logout` `GET /auth/me` |
| staff / sections | CRUD `/staff`, `/sections`, `/devices` |
| rooms | `GET /rooms` `GET /rooms/{id}/history` |
| plans | `POST /plans` (abrir dia a partir dos defaults) `GET /plans?date&kind` `GET /plans/{id}` |
| sheets | `GET /plans/{id}/sheets` `PUT /sheets/{id}/assignments` |
| tasks | `GET /plans/{id}/tasks` `POST /tasks` (intervenção não prevista) `PATCH /tasks/{id}/move` `PATCH /tasks/{id}/priority` |
| ações | `POST /tasks/{id}/start|finish|not-performed|inspect|request-correction` |
| events | `GET /events?roomId&taskId&from&to` |
| opera | `GET /opera/sync-jobs` `POST /opera/pull` `POST /opera/sync-jobs/{id}/retry` |

## 8. Mapa de migração do FE atual

| FE antes de 0.3 | Contrato (já aplicado no FE) |
|---|---|
| `Room.assignedSheetId` | `ServiceTask.sheetId` |
| `Room.morningStatus` | `ServiceTask(CLEANING).status` + `Room.operaStatus` |
| `Room.turndownStatus` / `turndownSheetId` | `ServiceTask(TURNDOWN)` (sem `RoomStatus`) |
| `Room.operational.isDND` / `isRefusedService` | `NOT_PERFORMED` + evento |
| `ServiceType` | `Movement` + `TaskKind` |
| `RoomEvent.userId` | `registeredById` (+ `executorIds`) |
| `TaskSheet.assignedUserNames` | removido (derivado de `assignments`) |
| `BlockTeam` | `Section` + equipa por bloco |
| `GuestOperaInfo.childAges: string` | `RoomStay.childAges: (int|null)[]` |
| Horas como `'08:30'` | ISO-8601 UTC |

## 9. Decisões em aberto (§19) e default provisório

| Tema | Default provisório |
|---|---|
| Origem das task sheets | Criadas na app (centralizar); Opera só fornece quartos/ocupação |
| Executor em telemóvel partilhado | Registar `registeredById` + `executorIds` opcional; estatística por equipa até decisão |
| Governanta redistribui qualquer secção? | Só a sua área |
| Inspeção do turndown | `NOT_REQUIRED` configurável por plano |
| Refresh exige reinspeção? | Não |
| Quem cria/cancela prioridades | admin, supervisor e reception criam; cancela quem criou ou admin |
| Recusas atualizam o Opera? | Não |
| Retenção de histórico | Sem apagar na Fase 1; política a definir |
| Transferir tarefa já iniciada | Permitido; mantém `status` e regista `MOVED_TASK_SHEET` |
| QR Code / offline / dispositivos | Fora da Fase 1; fila offline com `clientEventId` prevista no contrato |

## 10. Changelog do contrato

| Data | Versão | Alteração |
|---|---|---|
| 2026-10-21 | 0.1 | Rascunho inicial a partir do requisito, da análise de conformidade e de `config/constants.ts` |
| 2026-10-21 | 0.2 | FE: timestamps ISO; textos de sistema como `LocalizedText`; eventos `ROOM_REOPENED`/`TURNDOWN_UPDATED`/`STAFF_MOVED`; comandos puros em `services/local-api` como especificação executável. Regras corrigidas: reabrir a Dirty escreve no Opera (com log); recomeçar uma limpeza limpa o fim anterior; largar um quarto numa posição reordena a sheet; apagar uma pessoa retira-a das sheets; mover um quarto de bloco de partida atualiza também a sheet; o night audit já não escreve texto PT em `guest.traces` |
| 2026-10-21 | 0.3 | FE migrado para o modelo do contrato: `ServiceTask`/`ServicePlan`/`TaskEvent`/`OperaSyncJob`; executor ≠ registador (`startedById`, `executorIds`, `onBehalfOfTeam`); conflito Opera → job `CONFLICT` com retry humano; `reopenTask`, `completeCorrection`, `openPlan`; pedir correção mantém `CLEAN`; durações reais; auth sem sessão implícita (`GET /auth/me` devolve 401 sem sessão); rotas e permissões `config.zones` na configuração. Em aberto para o BE: `version` (concorrência otimista) e `clientEventId` |
| 2026-10-21 | 0.3.1 | Sem alteração de contrato. FE: entidades passam a ser **inferidas dos schemas Zod** (`types/housekeeping.schemas.ts`, `auth.types.ts`; enums em `housekeeping.enums.ts`) — o schema é a fonte única que o Pydantic do BE espelha; `tsconfig` com `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` (campo opcional = ausente, ou `undefined` explícito só em argumentos de comandos); comandos de `services/local-api` divididos em `execution`/`inspection`/`intervention`/`opera`/`planning`/`team`/`alert` |
