# Contrato de domínio FE ↔ API

> Estado: **rascunho v0.4**, extraído do código em 2026-11-06 (`services/local-api/*`, `types/*`, `config/constants.ts`). O que vem do código está descrito como é; tudo o que é decisão nova está marcado **[proposta]** e precisa de validação antes de ser implementado.
>
> **Continua o contrato v0.3.1** (`.agents/34-backend-fastapi/references/domain-contract.md`, 2026-10-21), que foi apagado do repositório no commit `a7752c1` (2026-10-29, "fix") e se recupera com `git show 8007b3c:.agents/34-backend-fastapi/references/domain-contract.md`. Os nomes de rotas seguem o v0.3.1 onde ele já definia uma. Decisões de arquitetura e tarefas estão em `docs/superpowers/plans/2026-10-21-backend-fastapi.md` (rascunho, não aprovado); este documento não as repete. As diferenças face ao v0.3.1 estão na secção 10.
>
> Fonte dos tipos: `types/housekeeping.schemas.ts` (zod) e `types/housekeeping.enums.ts`. Este documento não os repete: define **o que a API expõe e as regras que cumpre**. A API deve validar com os mesmos campos.

## 1. Princípios

1. **Comandos, não CRUD.** A UI chama 39 comandos nomeados; cada um é uma transação que altera estado, escreve eventos e, quando aplicável, o Opera. A API expõe-os como `POST` a recursos (secção 4).
2. **O servidor é dono das regras.** Hoje vivem em `services/local-api`; a API implementa as mesmas. As permissões no cliente (`lib/permissions.ts`) são só UX (`só UX` no código).
3. **Eventos append-only.** Cada alteração relevante escreve um `TaskEvent` com quem registou, quando, em que dispositivo e quem executou (ver 6.1).
4. **Dois ciclos independentes.** Plano `DAY` e plano `NIGHT` nunca se misturam: mover tarefas ou pessoas entre planos é inválido (`target.planId !== task.planId`).
5. **Estado Opera ≠ estado da tarefa.** DND, recusa (NQ), já arrumado (AC), refresh e turndown nunca contam como limpeza concluída nem escrevem no Opera.
6. **Dia operacional** fecha às 02h, nunca à meia-noite (`lib/operationalDate.ts`). O servidor calcula a data; o cliente não a envia, exceto em `openPlan`.

**Transporte** (do plano de backend, aqui só para referência): base `/api/v1`; JSON `camelCase`; ids UUID em string; datas ISO-8601 UTC; erros `application/problem+json` com `code`; `version` + `If-Match` nas entidades mutáveis; `clientEventId` nas escritas de execução. As rotas abaixo omitem o prefixo `/api/v1`.

## 2. Autenticação e ator

- Hoje: sessão = `userId` em `localStorage`; qualquer password serve; o **cliente envia o `Actor`** (`id`, `name`, `role`, `deviceId?`).
- **[proposta]** A API autentica por token (access em memória + refresh em cookie `httpOnly`, `.agents/08-auth`). O ator é sempre o do token; o corpo do pedido nunca o leva. `deviceId` vem de um cabeçalho (`X-Device-Id`), alinhado com `User.phoneDeviceId`. Hoje o cliente nunca preenche `deviceId`, por isso o requisito "quem, quando e em que dispositivo" ainda não está cumprido.
- Perfis (`UserRole`): `admin`, `housekeeper`, `reception`. Funções (`JobTitle`): `GOVERNANTA`, `RESPONSAVEL_ANDARES`. As permissões vêm do perfil, não da função; **só a função decide quem pode ser responsável (LEAD) de uma sheet** (regra `isGovernanta`).

## 3. Leituras

Hoje o cliente lê 10 coleções inteiras (`housekeepingTransporter.get*`) e junta-as no browser (`lib/taskViews.ts`).

| Hoje | Rota |
|---|---|
| `getRooms` | `GET /rooms` |
| `getStays` | `GET /stays?date=` |
| `getSections` | `GET /sections?kind=` |
| `getPlans` | `GET /plans` |
| `getSheets` | `GET /plans/{id}/sheets` |
| `getTasks` | `GET /plans/{id}/tasks` |
| `getEvents` | `GET /events?roomId=&taskId=&from=&to=&cursor=` **[proposta: paginado; hoje é a coleção inteira]**, e `GET /rooms/{id}/history` |
| `getAlerts` | `GET /alerts` |
| `getSyncJobs` | `GET /opera/sync-jobs` |
| `getBlockTeams` | `GET /block-teams?kind=` |
| (staff) | `GET /staff` |
| auth | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` |

**[proposta, a decidir]** `GET /boards/{kind}` devolve o plano ativo, as sheets, as tarefas e, por tarefa, o quarto, a estadia do dia, os executores e `refreshCount` (hoje calculado a percorrer todos os eventos). Substitui 7 pedidos por 1 e tira a junção do browser. Os totais (`SheetColumn`, contadores, créditos) passam a vir calculados (ver 7, ponto 4).

## 4. Comandos

Colunas: **Guarda** = condição que hoje faz o comando não fazer nada (devolve o estado inalterado). **Eventos** = tipo de `TaskEvent` escrito. **Opera** = escreve no Opera (via `writeOperaStatus`, ver 6.2).

### 4.1 Execução (`executionCommands.ts`)

| Comando | Rota **[proposta]** | Corpo | Guarda (hoje: sem efeito) | Efeito | Eventos | Opera |
|---|---|---|---|---|---|---|
| `startTask` | `POST /tasks/{id}/start` | `executorIds?` | estado ∉ {`PENDING`, `NOT_PERFORMED`} | → `IN_PROGRESS`; guarda `startedAt`, `startedById`, executores; limpa fim e motivo | `ROOM_STARTED` | não |
| `finishTask` | `POST /tasks/{id}/finish` | `executorIds?`, `occurredAt?` | estado ∉ {`PENDING`, `IN_PROGRESS`} | → `COMPLETED`; `durationSeconds` real, sem mínimo (anomalia é para mostrar); limpeza passa a `inspectionStatus=PENDING` | `ROOM_FINISHED` (limpeza/refresh) ou `TURNDOWN_UPDATED` | **só `CLEANING`**: → `CLEAN` |
| `recordNotPerformed` | `POST /tasks/{id}/not-performed` | `reason` (`DND`/`REFUSE_SERVICE`/`ALREADY_DONE`) | tarefa `COMPLETED`; ou já `NOT_PERFORMED` com o mesmo motivo | → `NOT_PERFORMED`, `inspectionStatus=NOT_REQUIRED` | `DND_RECORDED` / `SERVICE_REFUSED` / `TURNDOWN_UPDATED` | não |
| `reopenTask` | `POST /tasks/{id}/reopen` | — | tipo `CLEANING`, ou já `PENDING` | repõe a tarefa a `PENDING` (`resetTask`) | `TURNDOWN_UPDATED` ou `REFRESH_RECORDED` | não |
| `reopenRoom` | `POST /rooms/{id}/reopen` | `reason?`, `occurredAt?` | quarto inexistente | repõe a limpeza **do plano DAY ativo** a `PENDING` | `ROOM_REOPENED` | → `DIRTY` |
| `setRoomStatus` | `PUT /rooms/{id}/status` | `status`, `occurredAt?` | estado igual ao atual | `DIRTY` delega em `reopenRoom`. `CLEAN`/`INSPECTED` alinham a limpeza do dia (`COMPLETED`; `INSPECTED` → `APPROVED`, `CLEAN` → `PENDING`) | `ROOM_STATUS_CHANGED` | → estado pedido |

Execução (`resolveExecution`): quem **executou** ≠ quem **registou** (§14.5). Com `executorIds` explícito, `onBehalfOfTeam = !executorIds.includes(ator)`. Sem eles: se a sheet (sem a responsável) tem exatamente 1 pessoa e é o ator, executor = ator; caso contrário `executorIds = []` e `onBehalfOfTeam = true` (telemóvel partilhado). `finishTask` mantém os executores do início se já existiam.

### 4.2 Inspeção (`inspectionCommands.ts`)

| Comando | Rota **[proposta]** | Corpo | Guarda | Efeito | Eventos | Opera |
|---|---|---|---|---|---|---|
| `inspectTask` | `POST /tasks/{id}/inspect` | `occurredAt?` | tipo ≠ `CLEANING`, ou não `COMPLETED`, ou `inspectionStatus ≠ PENDING` | `APPROVED` | `INSPECTION_APPROVED` | → `INSPECTED` |
| `requestCorrection` | `POST /tasks/{id}/request-correction` | `note` | não `COMPLETED`, ou `inspectionStatus ≠ PENDING` | `CORRECTION_REQUESTED` + nota; **cria `RoomAlert` `REPROVAL`** para o 1.º executor (ou 1.º da sheet). O quarto **continua `CLEAN`** | `INSPECTION_REPROVED` | não |
| `completeCorrection` | `POST /tasks/{id}/complete-correction` (novo face ao v0.3.1) | `executorIds?` | `inspectionStatus ≠ CORRECTION_REQUESTED` | volta a `PENDING` (aguarda nova inspeção) | `CORRECTION_DONE` | não |

### 4.3 Intervenções (`interventionCommands.ts`)

| Comando | Rota **[proposta]** | Corpo | Guarda | Efeito | Eventos |
|---|---|---|---|---|---|
| `recordRefresh` | `POST /rooms/{id}/refresh` | `executorIds?` | sem quarto ou sem plano DAY ativo; sem sheet onde cair | marca a tarefa `REFRESH` do dia como `COMPLETED`; **se não existe, cria-a** (sheet da limpeza → reserva → 1.ª sheet). Não altera o estado do quarto | `REFRESH_RECORDED` |
| `togglePriority` | `PATCH /tasks/{id}/priority` | `isPriority`, `reason?` | tarefa inexistente | prioridade com origem `RECEPTION` (se o ator é `reception`) ou `HOUSEKEEPING` | `PRIORITY_TOGGLED` |
| `updateRoomInstructions` | `PUT /rooms/{id}/instructions` | `instructions` | sem estadia do dia, ou texto igual | atualiza `RoomStay.instructions` do dia | `ROOM_INSTRUCTIONS_UPDATED` |

`togglePriority` hoje **alterna** (não idempotente). **[proposta]** receber o valor desejado.

### 4.4 Planeamento (`planningCommands.ts`)

| Comando | Rota **[proposta]** | Corpo | Guarda | Efeito | Eventos |
|---|---|---|---|---|---|
| `openPlan` | `POST /plans` | `kind`, `date?` | já existe plano desse `kind` e dia | **DAY**: 1 sheet por secção base DAY (só pessoal de serviço) + 2 sheets de reserva; 1 tarefa `CLEANING` por estadia ≠ `VACANT`. **NIGHT**: 1 zona por secção NIGHT (número 100+); tarefa `TURNDOWN` por quarto ocupado nessa noite. Não altera a configuração base (CT-01) | `PLAN_OPENED` |
| `moveTask` | `PATCH /tasks/{id}/move` | `targetSheetId`, `targetIndex?` | sheet de outro plano | muda a sheet, reordena (`orderIndex` contínuo 0..n-1) nas duas. Qualquer estado da tarefa | `MOVED_TASK_SHEET` |
| `addSheet` | `POST /plans/{planId}/sheets` | `title`, `blocks[]`, `leadId?` | sem blocos | número = máx+1 (NIGHT parte de 100); título por omissão `Secção NN` / `Turndown Zona N`; LEAD só se `leadId` for governanta | `SHEET_UPDATED` |
| `updateSheet` | `PATCH /sheets/{id}` | `title`, `blocks[]` | sem mudanças | só `title`/`blocks`; não toca a secção base | `SHEET_UPDATED` |
| `moveStaffToSheet` | `POST /sheets/{toId}/assignments` | `staffId`, `fromSheetId?` | sheets de planos diferentes; já está no destino sem origem | tira da origem, põe no destino (`MEMBER`); recalcula o LEAD (`withLead`) | `STAFF_SHEET_CHANGED` |
| `setSheetLead` | `PUT /sheets/{id}/lead` | `staffId` | não é governanta, não está na sheet, ou já é LEAD | troca o LEAD; o anterior fica `MEMBER` | `STAFF_SHEET_CHANGED` |
| `removeStaffFromSheet` | `DELETE /sheets/{id}/assignments/{staffId}` | — | pessoa não está na sheet | sai da sheet e **passa ao pool Apoio** nesse serviço | `STAFF_SHEET_CHANGED` (+ `STAFF_MOVED` se não estava já em Apoio) |
| `assignStaffToSheet` | `PUT /sheets/{id}/assignments` | `assignments[]` | sheet inexistente | substitui a equipa; regista quem entrou e quem saiu | `STAFF_SHEET_CHANGED` por pessoa |

Regra do LEAD (`withLead`): é sempre uma governanta. Se o atual sai, passa à primeira governanta da sheet; sem nenhuma, a sheet fica sem responsável e todos são `MEMBER`.

### 4.4b Equipas, pessoal e secções (`teamCommands.ts`)

| Comando | Rota **[proposta]** | Corpo | Efeito | Eventos |
|---|---|---|---|---|
| `moveStaffToBlock` | `PUT /staff/{id}/block` | `targetBlock`, `kind?` (DAY) | muda `assignedArea` (DAY) ou `nightArea` (NIGHT) | `STAFF_MOVED` |
| `removeStaffFromBlock` | `DELETE /staff/{id}/block?kind=` | — | → pool Apoio. **Se já está em Apoio: passa a fora de serviço** (`isOnDuty=false`). Nunca mexe nas sheets | `STAFF_MOVED` |
| `restoreDailyToDefaultBaseline` | `POST /staff/restore-baseline` | `kind?` | repõe cada pessoa no bloco por defeito (`defaultBlock`/`nightDefaultBlock`) | — |
| `addBlockTeam` | `POST /block-teams` | `team` sem `id` | cria | — |
| `updateBlockTeam` | `PUT /block-teams/{id}` | `team` | atualiza | `BLOCK_LEAD_CHANGED` se mudou o responsável |
| `deleteBlockTeam` | `DELETE /block-teams/{id}` | — | quem lá estava (nesse serviço) volta ao pool Apoio; o bloco por defeito também | — |
| `addStaff` | `POST /staff` | `user` sem `id` | cria | — |
| `updateStaff` | `PUT /staff/{id}` | `user` | atualiza | `STAFF_DUTY_CHANGED` se mudou `isOnDuty` |
| `deleteStaff` | `DELETE /staff/{id}` | — | **apaga** a pessoa e tira-a de todas as sheets e secções | — |
| `addSection` / `updateSection` / `deleteSection` | `POST/PUT/DELETE /sections[/{id}]` | `section` | configuração base; **não afeta planos já abertos** (§6.1) | — |
| `moveRoomToSection` | `POST /sections/{id}/rooms` | `roomId` | um quarto só está numa secção **por serviço** (`kind`) | — |

### 4.5 Opera (`operaCommands.ts`)

| Comando | Rota **[proposta]** | Natureza |
|---|---|---|
| `receiveOperaStatus` | `POST /opera/pull` (plano T8) | Lê o estado do Opera e atualiza o quarto sem tocar em tarefas (CT-20). Ignora notificações mais antigas que o estado atual (`observedAt < operaStatusUpdatedAt`). **[proposta]** se o OHIP enviar notificações, acrescentar uma entrada de integração autenticada como serviço (`POST /integrations/opera/status`) |
| `triggerNightAudit` | `POST /opera/night-audit` (plano T8) | Hoje é um botão de simulação. **[proposta]** em produção corre como job agendado às 02h e o endpoint fica só para testes/admin. `INSPECTED` → `CLEAN` e cria tarefa `REFRESH`; `DEPARTURE_ARRIVAL` já `CLEAN`/`COMPLETED` → `DIRTY` (no-show) e repõe a limpeza |
| `syncWithOpera` | `POST /opera/sync` (`roomId?`) | Hoje só regista um job `CONFIRMED` sem fazer nada. O mecanismo real de sincronização **não está decidido** (`PRODUCT.md`) |
| `retryOperaJob` | `POST /opera/sync-jobs/{id}/retry` | Só jobs `FAILED` ou `CONFLICT`; reenvio **sempre por decisão de uma pessoa**, nunca automático |

### 4.6 Alertas (`alertCommands.ts`)

| Comando | Rota **[proposta]** | Corpo | Efeito |
|---|---|---|---|
| `acknowledgeAlert` | `POST /alerts/{id}/acknowledge` | — | marca `acknowledged` + `acknowledgedAt` |
| `sendTraceAlert` | `POST /rooms/{id}/alerts` | `message` | cria alerta `RECEPTION_TRACE` para a área do quarto |

## 5. Erros

**Hoje não existe modelo de erros.** Todo o pedido inválido devolve o estado inalterado, e a UI mostra sucesso. Com API isto tem de passar a respostas distintas:

| Situação | Hoje | **[proposta]** |
|---|---|---|
| Recurso inexistente (`task`, `room`, `sheet`…) | no-op | `404` |
| Transição de estado inválida (ex.: `finishTask` numa tarefa `COMPLETED`) | no-op | `409` com `code` (`task.invalidTransition`) |
| Repetir o mesmo resultado (`recordNotPerformed` com o mesmo motivo, `openPlan` num dia aberto, mover para a mesma sheet) | no-op | `200` idempotente, sem novo evento |
| Regra de domínio violada (mover entre planos, LEAD que não é governanta) | no-op | `422` |
| Sem permissão | (só esconde botões) | `403` |
| Escrita no Opera mais antiga que o estado atual | job `CONFLICT`, comando **tem sucesso** | `200`; o conflito vem no corpo e no evento `OPERA_CONFLICT_DETECTED`. **Não é um erro HTTP** |

Formato (do plano de backend): `application/problem+json` com `code` estável; o cliente traduz `errors.<code>` e nunca mostra texto do servidor. As mensagens geradas pelo sistema continuam a ser `LocalizedText` (`{key, params}`).

## 6. Regras transversais

### 6.1 Eventos (`withEvent`)
Campos escritos por comando: `id`, `occurredAt` (relógio do **servidor**), `registeredById/Name/Role` (do ator), `deviceId`, `executorIds`, `onBehalfOfTeam`, `supervisorId?`, `durationSeconds?`, `detail` (`LocalizedText`), `metadata?`. Nunca se alteram nem apagam.

Atenção: eventos que **não são sobre um quarto** reutilizam `roomId`/`roomNumber` como atalho (`'staff'`, `'plan'`, `'team'`, `'night-audit'`, ou o id/título de uma sheet). **[proposta]** a API deve ter `subjectType` + `subjectId` e deixar `roomId` opcional.

### 6.2 Escritas no Opera (`writeOperaStatus`)
- `idempotencyKey = roomId:alvo:occurredAt`. A mesma chave repetida **não duplica nada**.
- Se `room.operaStatusUpdatedAt > occurredAt`: job `CONFLICT`, **não altera o quarto**, regista `OPERA_CONFLICT_DETECTED`. Só `retryOperaJob` (decisão humana) o resolve.
- **Diferença FE → API.** No FE a escrita é imediata (job nasce `CONFIRMED`). Na API (plano T7) é uma *outbox*: o job é criado `PENDING` na mesma transação do evento, um worker escreve no Opera depois, e o pedido HTTP nunca espera pelo Opera. Consequências: (1) a resposta do comando devolve o job `PENDING` e a UI tem de mostrar "a sincronizar" em vez de assumir o novo estado; (2) a verificação de conflito acontece no worker, por isso faz sentido mesmo com `occurredAt` do servidor (o Opera pode mudar entre o evento e a escrita).
- **`occurredAt`.** Hoje 5 comandos aceitam-no do cliente (`finishTask`, `reopenRoom`, `setRoomStatus`, `inspectTask`; `receiveOperaStatus` com `observedAt`). O plano usa sempre o relógio do servidor (Review Focus 2) e o v0.3.1 põe o offline fora da Fase 1. Na Fase 1 o parâmetro é ignorado; volta, validado (não no futuro, desvio limitado), quando houver fila offline. `observedAt` do Opera é diferente: vem do sistema de origem e mantém-se.

### 6.3 Concorrência e idempotência
Hoje o estado é substituído por inteiro e as operações são síncronas, por isso não há conflitos possíveis. Do plano de backend (rascunho): `version` + `If-Match` nas entidades mutáveis (`ServiceTask`, `TaskSheet`) com `409` em conflito, e `clientEventId` em todas as escritas de execução (repetir o mesmo não duplica o evento).

### 6.4 Identificadores
Hoje o cliente gera ids (`prefix-Date.now()-random`). Do plano: o servidor gera UUIDs. Os campos `id` saem de `addStaff`, `addSection`, `addBlockTeam` e `addSheet`.

## 7. Decisões em aberto (bloqueiam a implementação)

Já decididas (por omissão) no plano `2026-10-21-backend-fastapi.md`, só falta aprová-las: PostgreSQL (D1), Opera atrás de um `Protocol` com `FakeOperaClient` até haver sandbox (D2), contas locais com argon2 (D3), polling por `staleTime` e SSE numa 2.ª fase (D5), sem apagar histórico na Fase 1 (D6), sheets criadas na app (D7), alertas na Fase 1 e chat na Fase 2 (D8).

Em aberto, e que a auditoria do frontend encontrou:

1. **Polling chega?** D5 assume o comportamento atual (`staleTime` 30 s). Com a governanta a supervisionar em direto, 30 s pode ser demasiado; validar com ela antes de fechar D5.
2. **Forma da leitura.** `GET /boards/{kind}` agregado, ou as 10 coleções? Eventos paginados e `refreshCount` calculado no servidor (hoje percorre todo o histórico no browser).
3. **Resposta dos comandos.** Hoje cada comando invalida `housekeeping.all` e `staff.all` (~10 pedidos). O plano (T4) já diz que cada serviço devolve "a tarefa + eventos criados". **[proposta]** generalizar a todos os comandos: `{ changed: { tasks?, sheets?, rooms?, staff?, syncJobs?, alerts? }, events: [], toast?: LocalizedText }`, para o cliente atualizar a cache sem refetch geral. O `toast` substitui o que hoje `localServer.execute` devolve.
4. **Dono dos créditos e contadores.** `CREDIT_TABLE`, `REFRESH_CREDITS`, `calculateCounters` e `buildReport` correm no cliente; a tabela é **ilustrativa** (`PENDENTE` no código). A API devolve `estimatedCredits` por tarefa e por sheet. Turndown: 0 créditos, sem regra definida. (O v0.3.1 já previa `CreditRule` na Fase 3.)
5. **Apagar pessoal.** `deleteStaff` apaga, mas os eventos guardam `registeredById/Name` e `executorIds`, e o histórico completo é um princípio do produto. O plano (Review Focus n.º 5) exige que nunca deixe ids órfãos. **[proposta]** desativar (`archivedAt`), nunca apagar.
6. **Tecnologia do cliente móvel** (nativa, web ou PWA): afeta fila offline e `deviceId`.
7. **DND / NQ / AC pela empregada?** e **receção sem start/finish?** (secção 8, notas 2 e 3).
8. **Escopo da governanta e do responsável de andares** (secção 8): validar a leitura de "a sua área".
9. **Sincronização com o Opera (OHIP):** direção, frequência e o que acontece com as escritas em falha. `syncWithOpera` é hoje um simulador.

## 8. Permissões e escopo

Decidido com o utilizador em 2026-11-06. A API aplica estas regras; o FE só esconde botões.

**Regra geral:** o `admin` (escritório, governanta, responsável de andares) pode tudo. A empregada (`housekeeper`) só **inicia e conclui**; aprovar, corrigir e reabrir é sempre do `admin`/governanta. Alertas são para todos.

| Permissão | Comandos | `admin` | `housekeeper` | `reception` |
|---|---|:-:|:-:|:-:|
| `task.startFinish` | `startTask`, `finishTask` | ✔ ¹ | ✔ | — ² |
| `room.markClean` | `recordRefresh`, `completeCorrection` | ✔ | — | — |
| `room.markDirty` | `reopenRoom`, `setRoomStatus`, `reopenTask` | ✔ | — | — |
| `room.markInspected` | `inspectTask` | ✔ | — | — |
| `correction.request` | `requestCorrection` | ✔ | — | — |
| `room.editDetails` | `updateRoomInstructions` | ✔ | — | — |
| `priority.reorder` | `togglePriority` | ✔ | — | ✔ |
| `sheets.distribute` | `openPlan`, `moveTask`, `addSheet`, `updateSheet` | ✔ | — | — |
| `staff.assign` | `moveStaffToSheet`, `setSheetLead`, `removeStaffFromSheet`, `assignStaffToSheet`, `moveStaffToBlock`, `removeStaffFromBlock`, `restoreDailyToDefaultBaseline`, `addStaff`, `updateStaff`, `deleteStaff` | ✔ | — | — |
| `config.zones` | `addSection`, `updateSection`, `deleteSection`, `moveRoomToSection`, `addBlockTeam`, `updateBlockTeam`, `deleteBlockTeam`, `syncWithOpera`, `retryOperaJob`, `triggerNightAudit`, `receiveOperaStatus` | ✔ | — | — |
| (autenticado) | `sendTraceAlert`, `acknowledgeAlert` | ✔ | ✔ | ✔ |
| — | `recordNotPerformed` (DND / NQ / AC) | ✔ | **a confirmar** ³ | — |

1. O `admin` não precisa de iniciar/concluir; fica com a permissão até se rever a regra de negócio.
2. Hoje o FE dá `task.startFinish` à receção (`EXECUTION` a todos os perfis). Pela regra acima deixa de ter; **confirmar**.
3. "Só start e finish" deixa a empregada sem registar DND/recusa/já arrumado, que hoje é ela que marca no turndown. Confirmar se fica no `admin` ou passa a `task.startFinish`.

### Escopo

As permissões dizem *que* ação; o escopo diz *sobre quê*. Uma ação fora do escopo devolve `403` (`code: scope.forbidden`).

| Perfil | Escopo |
|---|---|
| `admin` sem `JobTitle` (escritório) | tudo |
| `admin` com `GOVERNANTA` | sheets onde é `LEAD`, e as tarefas dessas sheets |
| `admin` com `RESPONSAVEL_ANDARES` | blocos de que é responsável (`BlockTeam.supervisorId`), e as sheets e tarefas desses blocos |
| `housekeeper` | tarefas das sheets onde está atribuída (`assignments`) no plano ativo; nas leituras, só vê essas tarefas e os seus quartos |
| `reception` | leitura de todos os quartos; prioridades e alertas em qualquer quarto |

**[proposta]** As linhas da governanta e do responsável de andares são uma leitura de "a sua área" e têm de ser validadas. Uma pessoa com as duas funções soma os dois escopos. O FE hoje **não tem escopo** (qualquer perfil vê e age sobre tudo), por isso estes testes não têm referência no `local-api` e escrevem-se de raiz.

Permissões declaradas que nenhum comando usa: `rooms.viewAll`, `rooms.viewArea`, `rooms.viewAssigned` (passam a ser o escopo acima), `stats.teamTimes`, `stats.supervisors` (estatísticas por definir), `guest.view` (campos de hóspede na leitura; minimização por perfil), `messages.send` (chat, Fase 2).

## 9. Fora deste contrato (ainda por levantar)

- Chat (`chatTransporter`, hoje `localStorage`).
- Estatísticas e relatórios (sem definição do cliente).
- Importação de reservas/hóspedes (OHIP): `RoomStay` vem hoje de `config/hotelData.ts`. `openPlan` herda as estadias do dia anterior quando o dia não tem nenhuma (`ponytail` no código); a API devolve as do dia.

## 10. Diferenças face ao contrato v0.3.1 e ao plano de backend

O FE evoluiu desde 2026-10-21. O plano de backend foi escrito sobre o v0.3.1, por isso **antes de o aprovar** convém corrigi-lo com esta lista.

| Tema | v0.3.1 / plano | FE hoje |
|---|---|---|
| Perfis | `admin` `supervisor` `housekeeper` `reception` (4) | **Decidido: 3 perfis** (`admin` `housekeeper` `reception`). A governanta e o responsável de andares são `admin` com `JobTitle`; o que o plano chamava `supervisor` é o escopo da secção 8. O plano tem de deixar o perfil |
| Motivos de não execução | `DND`, `REFUSE_SERVICE` | + `ALREADY_DONE` (AC do turndown) |
| Eventos | lista da secção 4 do v0.3.1 | + `ROOM_STATUS_CHANGED`, `ROOM_INSTRUCTIONS_UPDATED`, `STAFF_DUTY_CHANGED`, `STAFF_SHEET_CHANGED`, `SHEET_UPDATED`, `BLOCK_LEAD_CHANGED`, `TURNDOWN_UPDATED`, `PLAN_OPENED`. O v0.3.1 propunha `TASK_NOT_PERFORMED`, `CORRECTION_REQUESTED`, `STAFF_ASSIGNED/UNASSIGNED`, `OPERA_SYNC_FAILED`, que o FE **não usa** (usa `DND_RECORDED`/`SERVICE_REFUSED`, `INSPECTION_REPROVED`, `STAFF_SHEET_CHANGED`) |
| CT-03 (fundir vilas numa atribuição) | plano T5 testa-o com `merge_sheets` e `POST /sheets/{id}/merge` | **Decidido: não se fundem sheets.** Uma sheet pode ter **mais de um bloco** (`TaskSheet.blocks: string[]`, mínimo 1). O CT-03 cumpre-se com uma sheet que cobre vários blocos. `merge_sheets` e a rota saem do plano |
| Comandos | inclui `mergeSheets` | `mergeSheets` já não existe; novos: `setRoomStatus`, `setSheetLead`, `moveStaffToSheet`, `removeStaffFromSheet`, `addSheet`, `updateSheet`, `updateRoomInstructions`, `restoreDailyToDefaultBaseline`, CRUD de `BlockTeam` |
| `User` | `Staff`: `defaultSectionId`, `isActive`, `Device` como entidade própria | `User`: `jobTitles`, `assignedArea`, `defaultBlock`, `nightArea`, `nightDefaultBlock`, `isOnDuty`, `isExtra`, `phoneDeviceId`. Não há entidade `Device`; o pessoal tem **bloco por serviço** (manhã e noite separados) |
| `Section`, `BlockTeam` | sem `kind` | `kind` (`DAY`/`NIGHT`): configuração base separada por serviço |
| `TaskSheet` | sem `block` nem `notes` | hoje `block: string`; **passa a `blocks: string[]`** (mínimo 1), `notes?` |
| `RoomStay` | sem horas de check-in/out | + `checkInAt`, `checkOutAt`, `departingGuestName`, `arrivingGuestName` |
| Numeração | — | sheets DAY partem de 1; NIGHT de 101; reservas continuam a numeração |
| Alertas | Fase 2 (esboço) | Já no FE: `RoomAlert` (`REPROVAL`, `RECEPTION_TRACE`, `PRIORITY_NOTICE`, `DND_ALERT`); plano D8 já os põe na Fase 1 |
| Rotas `completeCorrection`, `setRoomStatus`, `reopenRoom`, `reopenTask`, `recordRefresh`, `updateRoomInstructions`, `/block-teams`, `/staff/{id}/block` | não existiam | definidas na secção 4 (**[proposta]**) |

Quando este documento for aprovado, o v0.3.1 deixa de valer e o plano de backend passa a citar `docs/api/domain-contract.md`.

## 11. Notas para a API

- **Onde:** `Housekeeping-APP/housekeeping-api/` (ao lado deste repositório), em FastAPI. Arquitetura, stack e tarefas no plano `docs/superpowers/plans/2026-10-21-backend-fastapi.md`, corrigido pela secção 10 e pelas decisões abaixo.
- **Decisões de 2026-11-06** (utilizador):
  1. `admin` pode tudo; a empregada só inicia e conclui; aprovar, corrigir e reabrir é do `admin`/governanta (secção 8).
  2. Alertas são para todos os perfis.
  3. `admin` mantém `task.startFinish` por agora; regra de negócio a rever.
  4. Não há fusão de sheets; uma sheet pode ter vários blocos (`blocks[]`).
  5. Escopo por perfil faz parte do contrato (secção 8).
- **Ordem sugerida para começar:** núcleo (`Clock` com fecho às 02h, problem+json, `require(permission)` + escopo), modelo de dados com `version`, depois execução e inspeção portando os testes de `services/local-api/localApi.test.ts` com o mesmo nome.
- **Cuidado ao portar do `local-api`:** os comandos do FE falham em silêncio (devolvem o estado inalterado); na API cada guarda da secção 4 vira o erro da secção 5. E o FE não tem escopo nem `version`: esses testes escrevem-se de raiz.

### Mudanças que o FE terá de fazer (não feitas)

| Mudança | Onde |
|---|---|
| Esconder refresh, concluir correção, reabrir turndown e (se confirmado) DND/NQ/AC à empregada | `RoomCardActions.tsx`, `DetailActions.tsx`, `TurndownCard.tsx`, `ROLE_PERMISSIONS` |
| Tirar `task.startFinish` à receção (se confirmado) | `config/constants.ts` (`EXECUTION`) |
| `TaskSheet.block` → `blocks[]` (formulário, filtro por bloco, cabeçalho da sheet) | `types/housekeeping.schemas.ts`, `SheetEditor`, `PlanningPage`/`TurndownPage` (filtro), `openPlan`/`addSheet` no `local-api` |
| Alertas visíveis e reconhecíveis por todos os perfis | `TraceForm.tsx`, `MobileAlerts.tsx` (hoje sem verificação; confirmar ecrãs) |
| Mostrar o job do Opera `PENDING` ("a sincronizar") | cartões e detalhe do quarto |
| Escopo nas leituras (empregada só vê as suas tarefas) | quando a API filtrar, o FE deixa de assumir a coleção inteira |
