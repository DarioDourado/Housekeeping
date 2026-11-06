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

**Transporte** (do plano de backend, aqui só para referência): base `/api/v1`; JSON `camelCase`; ids **UUID v7** em string (36 caracteres, ordenáveis no tempo; decidido 2026-11-06); datas ISO-8601 UTC; erros `application/problem+json` com `code`; `version` + `If-Match` nas entidades mutáveis; `clientEventId` nas escritas de execução. As rotas abaixo omitem o prefixo `/api/v1`.

## 2. Autenticação e ator

- Hoje: sessão = `userId` em `localStorage`; qualquer password serve; o **cliente envia o `Actor`** (`id`, `name`, `role`, `deviceId?`).
- **Implementado em `housekeeping-api`** (2026-11-06): `POST /auth/login` (access JWT de 15 min no corpo + refresh em cookie httpOnly `path=/api/v1/auth`, ou no corpo com `X-Refresh-Transport: body`), `POST /auth/refresh` (rotação; reutilizar o refresh antigo fora de 20 s revoga a sessão), `POST /auth/logout` (204; o access deixa de valer já), `GET /auth/me`. Sessões no SQL Server com teto de 30 dias; 5 falhas por (conta, IP) → `429 LOGIN_LOCKED` 15 min. Códigos: `INVALID_CREDENTIALS`, `REFRESH_TOKEN_INVALID`, `REFRESH_TOKEN_MISSING`, `SESSION_INVALID`, `NOT_AUTHENTICATED`, `PERMISSION_DENIED`, `ORIGIN_NOT_ALLOWED`, `LOGIN_LOCKED`, `RATE_LIMITED`. O ator é sempre o do token; o corpo nunca o leva. `deviceId` vem do cabeçalho `X-Device-Id`.
- Perfis (`UserRole`): `superadmin` (programador), `admin` (governanta geral), `sub_admin` (chefe de andares), `user` (colaboradora), `reception`. Substituem o `JobTitle` do FE; detalhe na secção 8.

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

Listas sem paginação (o hotel tem ~74 quartos e ~60 pessoas), exceto eventos, paginados por cursor (`limit` máx. 200, `nextCursor`). Todas as leituras respeitam o escopo da empregada (secção 8). `GET /staff?includeInactive=` (por omissão só ativos).

### 3.0 Quadro (decisão 7.2)

`GET /boards/{kind}` é a leitura principal do Planning, do Turndown e do telemóvel, e a que o polling repete. Substitui `useBoard` (7 consultas + junção em `lib/taskViews.ts`).

```jsonc
{
  "plan": ServicePlan | null,          // plano ACTIVE mais recente do kind; null = dia por abrir
  "columns": [{
    "sheet": TaskSheet,
    "assignees": [{ "user": UserSummary, "role": "LEAD" | "MEMBER" }],
    "cards": [{                         // ordem: prioritárias primeiro, depois orderIndex
      "task": ServiceTask,
      "room": Room,
      "stay": RoomStay | null,          // estadia da data do plano
      "executors": UserSummary[],
      "startedBy": UserSummary | null,
      "refreshCount": number            // REFRESH_RECORDED do quarto, calculado no servidor
    }],
    "counters": TaskSheetCounters       // sem estimatedCredits (créditos em standby)
  }],
  "serverTime": string,                 // ISO; o cliente usa-o para durações e "há x min"
  "pollIntervalSeconds": number         // POLL_INTERVAL_SECONDS da API: o cliente pede o quadro outra vez ao fim deste tempo
}
```

`UserSummary = { id, name, role, jobTitles? }`. Para a empregada, `columns` só traz as suas sheets.

### 3.1 Resposta dos comandos (decisão 7.3)

Todos os comandos devolvem `200` com:

```jsonc
{
  "changed": {                          // só as chaves com alterações
    "tasks"?: ServiceTask[], "sheets"?: TaskSheet[], "rooms"?: Room[], "stays"?: RoomStay[],
    "plans"?: ServicePlan[], "staff"?: User[], "sections"?: Section[], "blockTeams"?: BlockTeam[],
    "alerts"?: RoomAlert[], "syncJobs"?: OperaSyncJob[]
  },
  "removed"?: { "<coleção>": string[] }, // ids apagados (deleteSection, deleteBlockTeam, deleteStaff)
  "events": TaskEvent[],                // eventos escritos por este comando ([] se nenhum)
  "toast"?: LocalizedText               // confirmação para a UI (o que hoje localServer.execute devolve)
}
```

Um comando idempotente repetido (secção 5) devolve `changed: {}` e `events: []`. Os jobs do Opera vêm em `changed.syncJobs` com `state: PENDING` (secção 6.2). Na Fase 1 o cliente pode simplesmente invalidar o quadro ao receber a resposta; `changed` permite depois atualizar a cache sem refetch.

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

**Pré-definição (default) — nunca se começa do zero** (decidido 2026-11-06). A configuração base de cada serviço (`DAY`/`NIGHT`) é o conjunto de secções (quartos por defeito), o bloco por defeito de cada pessoa (`defaultBlock`/`nightDefaultBlock`) e as equipas de bloco. Regras:

0. **As pessoas vêm do perfil de cada colaborador** (decidido 2026-11-06). Quem tem `defaultBlock` = X (manhã) ou `nightDefaultBlock` = X (turndown) aparece no bloco X. A única diferença de dia para dia é `isOnDuty`: quem está de serviço aparece no seu bloco por defeito; quem não está não aparece. **Fase 1:** `isOnDuty` é manual e fica `true` por omissão. **Depois:** sincroniza com o **GesExtra** (picagem de ponto): picar a entrada põe `isOnDuty = true` (ver secção 9). As secções dão os **quartos** de cada sheet; o perfil dá o **bloco** de cada pessoa. Mexer no dia (`moveStaffToBlock`) muda só `assignedArea`/`nightArea`, nunca o bloco por defeito; `restoreDailyToDefaultBaseline` volta a pôr cada pessoa no bloco do perfil. **Quem fica em cada sheet** de um bloco fica para a definição do bloco (por definir); até lá as pessoas de serviço do bloco são as candidatas e a governanta distribui. Até essa definição, ao abrir o dia (`openPlan`) cada sheet recebe as pessoas por defeito da sua secção que estejam de serviço (`section_staff`, como o FE faz hoje), para nunca começar vazia; a primeira que pode liderar (`admin`/`sub_admin`) fica LEAD.
1. **Existe sempre.** A instalação arranca com uma lista pré-feita (seed: quartos, secções e perfis com bloco por defeito); a API recusa apagar a última secção de um serviço (`422`, `code: DEFAULT_REQUIRED`) **[proposta]**.
2. **Cada dia parte dela.** `openPlan` copia-a para as sheets do dia (CT-01) e nunca abre um plano vazio. Se o serviço não tiver secções, `openPlan` devolve `422 DEFAULT_REQUIRED` em vez de criar um dia sem sheets **[proposta]**.
3. **Mudar a pré-definição não mexe no dia aberto**; mexer no dia não muda a pré-definição (§6.1).
4. **Recarregar a pré-definição** (botão "Recarregar pré-definição" do FE): hoje o FE chama `housekeepingTransporter.reset()`, que **recarrega os dados de demonstração inteiros**. Não é um comando de domínio e não pode ir para produção. Passa a ser `resetPlanToDefault` (abaixo).

| Comando (novo) | Rota **[proposta]** | Corpo | Efeito **[proposta, a confirmar]** | Eventos |
|---|---|---|---|---|
| `resetPlanToDefault` | `POST /plans/{id}/reset-to-default` | — | volta a aplicar as secções ao plano do dia: sheets, equipas e a sheet de cada tarefa **ainda `PENDING`**. Tarefas iniciadas, concluídas ou com impedimento ficam onde estão; nenhum estado nem evento é apagado. Sheets criadas à mão nesse dia ficam (vazias) | `PLAN_OPENED` com `metadata.action = "reset"` |

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
| `deactivateStaff` (novo) | `POST /staff/{id}/deactivate` | — | `isActive=false`; sai das sheets do plano ativo e das secções; continua no histórico e nas leituras com `includeInactive`. `POST /staff/{id}/activate` reverte | `STAFF_DUTY_CHANGED` **[proposta: `STAFF_DEACTIVATED`]** |
| `deleteStaff` | `DELETE /staff/{id}` (**só `superadmin`**) | — | apaga a conta e tira-a de sheets e secções; **eventos intactos** (secção 8) | — |
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
| Transição de estado inválida (ex.: `finishTask` numa tarefa `COMPLETED`) | no-op | `409` com `code` (`TASK_INVALID_TRANSITION`) |
| Repetir o mesmo resultado (`recordNotPerformed` com o mesmo motivo, `openPlan` num dia aberto, mover para a mesma sheet) | no-op | `200` idempotente, sem novo evento |
| Regra de domínio violada (mover entre planos, LEAD que não é governanta) | no-op | `422` |
| Sem permissão | (só esconde botões) | `403` |
| Escrita no Opera mais antiga que o estado atual | job `CONFLICT`, comando **tem sucesso** | `200`; o conflito vem no corpo e no evento `OPERA_CONFLICT_DETECTED`. **Não é um erro HTTP** |

Formato (já implementado em `housekeeping-api`): `application/problem+json` (RFC 9457) com `code` estável em `MAIUSCULAS_COM_UNDERSCORE` (`VALIDATION_ERROR`, `HTTP_404`, `TASK_INVALID_TRANSITION`, `SCOPE_FORBIDDEN`, `STALE_RESOURCE`) e `errors[]` por campo nos 422; o cliente traduz `errors.<CODE>` e nunca mostra texto do servidor. As mensagens geradas pelo sistema continuam a ser `LocalizedText` (`{key, params}`).

## 6. Regras transversais

### 6.1 Eventos (`withEvent`)
Campos escritos por comando: `id`, `occurredAt` (relógio do **servidor**), `registeredById/Name/Role` (do ator), `deviceId`, `executorIds`, `onBehalfOfTeam`, `supervisorId?`, `durationSeconds?`, `detail` (`LocalizedText`), `metadata?`. Nunca se alteram nem apagam.

Atenção: eventos que **não são sobre um quarto** reutilizam `roomId`/`roomNumber` como atalho (`'staff'`, `'plan'`, `'team'`, `'night-audit'`, ou o id/título de uma sheet). A API usa `subjectType` + `subjectId` e deixa `roomId` opcional (secção 7).

### 6.2 Escritas no Opera (`writeOperaStatus`)
- `idempotencyKey = roomId:alvo:occurredAt`. A mesma chave repetida **não duplica nada**.
- Se `room.operaStatusUpdatedAt > occurredAt`: job `CONFLICT`, **não altera o quarto**, regista `OPERA_CONFLICT_DETECTED`. Só `retryOperaJob` (decisão humana) o resolve.
- **Diferença FE → API.** No FE a escrita é imediata (job nasce `CONFIRMED`). Na API (plano T7) é uma *outbox*: o job é criado `PENDING` na mesma transação do evento, um worker escreve no Opera depois, e o pedido HTTP nunca espera pelo Opera. Consequências: (1) a resposta do comando devolve o job `PENDING` e a UI tem de mostrar "a sincronizar" em vez de assumir o novo estado; (2) a verificação de conflito acontece no worker, por isso faz sentido mesmo com `occurredAt` do servidor (o Opera pode mudar entre o evento e a escrita).
- **`occurredAt`.** Hoje 5 comandos aceitam-no do cliente (`finishTask`, `reopenRoom`, `setRoomStatus`, `inspectTask`; `receiveOperaStatus` com `observedAt`). O plano usa sempre o relógio do servidor (Review Focus 2) e o v0.3.1 põe o offline fora da Fase 1. Na Fase 1 o parâmetro é ignorado; volta, validado (não no futuro, desvio limitado), quando houver fila offline. `observedAt` do Opera é diferente: vem do sistema de origem e mantém-se.

### 6.3 Concorrência e idempotência
Hoje o estado é substituído por inteiro e as operações são síncronas, por isso não há conflitos possíveis. Do plano de backend (rascunho): `version` nas entidades mutáveis; versão velha com `If-Match` → `412 STALE_RESOURCE`, sem `If-Match` → `409 CONFLICT` (regra `DB-LOCK` da API, implementada com `version_id_col`); e `clientEventId` em todas as escritas de execução (repetir o mesmo não duplica o evento).

### 6.4 Identificadores
Hoje o cliente gera ids (`prefix-Date.now()-random`). O servidor gera **UUID v7** (RFC 9562), guardado como texto de 36 caracteres: o `UNIQUEIDENTIFIER` do SQL Server ordena pelos últimos bytes e perderia a ordem temporal. Os campos `id` saem de `addStaff`, `addSection`, `addBlockTeam` e `addSheet`.

## 7. Decisões

Do plano `2026-10-21-backend-fastapi.md` (aceites): **SQL Server** via ODBC (D1, alterado em 2026-11-06: é o que `housekeeping-api` já usa), Opera atrás de um `Protocol` com `FakeOperaClient` até haver sandbox (D2), contas locais com argon2 (D3), sem apagar histórico na Fase 1 (D6), sheets criadas na app (D7), alertas na Fase 1 e chat na Fase 2 (D8).

Fechadas com o utilizador em 2026-11-06:

| # | Decisão |
|---|---|
| 1 | **Tempo real por WebSocket** (decidido 2026-11-06, substitui o polling do D5). Ao gravar uma alteração, a API avisa todos os dispositivos ligados em `GET /api/v1/ws` (WebSocket) com `{ "type": "changed", "collections": ["tasks", ...], "planId"? }`; o cliente volta a pedir só o que mudou. Autenticação no WebSocket com o access token (primeira mensagem, nunca na URL) e verificação da sessão como no HTTP. **Implementado** em `/api/v1/ws`: o cliente manda `{"type":"auth","token"}` e `{"type":"ping"}`; o servidor manda `ready`, `pong` e `changed`. Fecho `4001` = renovar o token e voltar a ligar; `4003` = origem recusada; `1013` = demasiadas ligações. A sessão é revista a cada mensagem e a cada 30 s. **Rede de segurança:** o polling continua, com `POLL_INTERVAL_SECONDS`/`VITE_POLL_INTERVAL_SECONDS` (30 s, ajustável), para o caso de a ligação cair; aceita-se até 30 s de atraso nesse caso. shortcut: 1 processo, ligações em memória; com vários workers o aviso passa por Redis pub/sub (15-websockets). |
| 2 | **Leitura agregada:** `GET /boards/{kind}` (secção 3). Com polling, 1 pedido por ciclo em vez de 7. |
| 3 | **Resposta dos comandos:** `CommandResult` (secção 3.1). |
| 4 | **Créditos em standby.** A API não calcula nem guarda créditos na Fase 1; o FE mantém a tabela ilustrativa só para visualização. Sem `estimatedCredits` no contrato. |
| 5 | **Pessoal:** o `admin` (governanta geral) **desativa** (`deactivateStaff`, a pessoa sai das sheets e secções mas fica no histórico); só o **`superadmin`** **apaga**. Novo perfil, secção 8. |
| 6 | **Hóspedes:** a app é só interna de housekeeping. Todos os perfis veem os dados de hóspede que a estadia traz; não há minimização por perfil (`guest.view` sai). A minimização mantém-se nos logs (plano T9). |
| 7 | **DND / NQ / AC:** `admin` e empregada. |
| 8 | **Receção acompanha** (e alertas): vê o estado na app ou diretamente no Opera Cloud, porque a app escreve no Opera via OHIP (`CLEAN`/`INSPECTED`/`DIRTY`, secção 6.2). Perde `task.startFinish` e `priority.reorder` (ver nota 2 da secção 8). Consequência: para a receção, "quarto pronto" só existe no Opera depois de o job confirmar, por isso a sincronização OHIP (em aberto, ponto 2 abaixo) é do caminho crítico da receção, não um extra. |
| 9 | **Escopo:** governanta e responsável de andares veem e agem sobre **tudo**; só a empregada tem escopo (as suas tarefas). |
| 10 | **Sem fusão de sheets;** uma sheet tem vários blocos (`blocks[]`). |
| 11 | **5 perfis:** `superadmin` (programador), `admin` (governanta geral), `sub_admin` (chefe de andares), `user` (colaboradora), `reception`. Não há `supervisor`; o `JobTitle` deixa de ser preciso. |
| 13 | **Pré-definição sempre presente:** nunca se começa do zero; `openPlan` parte dela e o "Recarregar" passa a ser `resetPlanToDefault` (secção 4.4). |
| 12 | **Prioridades: cria a governanta geral**; hierarquia governanta geral → responsável de andar → colaboradoras. A receção pede por alerta (secção 8, nota 2). |

Detalhes técnicos fechados aqui (**[proposta]**, mudam sem impacto no domínio):

- `version` em todas as entidades mutáveis (`Room`, `RoomStay`, `Section`, `ServicePlan`, `TaskSheet`, `ServiceTask`, `BlockTeam`, `User`, `RoomAlert`). `TaskEvent` e `OperaSyncJob` não (append-only / só o worker os muda).
- `clientEventId` (UUID v4 ou v7 gerado no cliente) no **corpo** dos comandos de execução e inspeção; opcional na Fase 1, obrigatório quando houver fila offline.
- Eventos com `subjectType` (`ROOM` `SHEET` `STAFF` `PLAN` `TEAM` `SYSTEM`) + `subjectId`; `roomId`/`roomNumber` só quando o evento é de um quarto.
- `openPlan` cria cada sheet com `blocks: [section.block]`; as secções continuam com um bloco. Juntar blocos numa sheet faz-se com `updateSheet`.

Ainda em aberto (não bloqueiam T1–T5):

1. **Tecnologia do cliente móvel** (nativa, web ou PWA): afeta fila offline e `deviceId`.
2. **Sincronização com o Opera (OHIP):** direção, frequência e escritas em falha. `syncWithOpera` é hoje um simulador. **Prioritário:** é por aqui que a receção vê os quartos prontos (decisão 8). Precisa de credenciais e sandbox OHIP (plano D2) e de saber em quanto tempo uma escrita tem de aparecer no Opera.
3. **`sub_admin` e LEAD** (secção 8, nota 3 e regra do LEAD).

## 8. Permissões e escopo

A API aplica estas regras; o FE só esconde botões.

**Perfis (decidido 2026-11-06):**

| Perfil (`UserRole`) | Quem | Papel |
|---|---|---|
| `superadmin` | programador | tudo, incluindo apagar pessoal; suporte técnico |
| `admin` | governanta geral | topo da operação: cria prioridades, aprova, distribui, configura |
| `sub_admin` | chefe de andares | supervisiona os andares abaixo da governanta geral |
| `user` | colaboradora (empregada de andares) | inicia, conclui e regista impedimentos nas suas tarefas |
| `reception` | receção | acompanha (na app ou no Opera) e envia/reconhece alertas |

Hierarquia: `admin` → `sub_admin` → `user`. Os perfis substituem o `JobTitle` (`GOVERNANTA` = `admin`, `RESPONSAVEL_ANDARES` = `sub_admin`).

| Permissão | Comandos | `superadmin` | `admin` | `sub_admin` | `user` | `reception` |
|---|---|:-:|:-:|:-:|:-:|:-:|
| `task.startFinish` | `startTask`, `finishTask`, `recordNotPerformed` | ✔ | ✔ ¹ | ✔ ¹ | ✔ | — |
| `room.markClean` | `recordRefresh`, `completeCorrection` | ✔ | ✔ | ✔ | — | — |
| `room.markDirty` | `reopenRoom`, `setRoomStatus`, `reopenTask` | ✔ | ✔ | ✔ | — | — |
| `room.markInspected` | `inspectTask` | ✔ | ✔ | ✔ | — | — |
| `correction.request` | `requestCorrection` | ✔ | ✔ | ✔ | — | — |
| `room.editDetails` | `updateRoomInstructions` | ✔ | ✔ | ✔ | — | — |
| `priority.reorder` | `togglePriority` | ✔ | ✔ | — ² | — | — |
| `sheets.distribute` | `openPlan`, `resetPlanToDefault`, `moveTask`, `addSheet`, `updateSheet` | ✔ | ✔ | ✔ ³ | — | — |
| `staff.assign` | `moveStaffToSheet`, `setSheetLead`, `removeStaffFromSheet`, `assignStaffToSheet`, `moveStaffToBlock`, `removeStaffFromBlock`, `restoreDailyToDefaultBaseline` | ✔ | ✔ | ✔ ³ | — | — |
| `staff.manage` (nova) | `addStaff`, `updateStaff`, `deactivateStaff` | ✔ | ✔ | — ³ | — | — |
| `staff.delete` (nova) | `deleteStaff` | ✔ | — | — | — | — |
| `config.zones` | `addSection`, `updateSection`, `deleteSection`, `moveRoomToSection`, `addBlockTeam`, `updateBlockTeam`, `deleteBlockTeam`, `syncWithOpera`, `retryOperaJob`, `triggerNightAudit`, `receiveOperaStatus` | ✔ | ✔ | — ³ | — | — |
| (autenticado) | `sendTraceAlert`, `acknowledgeAlert`, todas as leituras | ✔ | ✔ | ✔ | ✔ | ✔ |

1. `admin` e `sub_admin` não precisam de iniciar/concluir; mantêm a permissão até se rever a regra de negócio.
2. **Prioridades:** cria a governanta geral (`admin`). A receção pede por alerta (`sendTraceAlert`) e a governanta decide. `priorityOrigin` passa a ser sempre `HOUSEKEEPING`; `PriorityOrigin.RECEPTION` fica só para ler histórico antigo.
3. **[proposta, a confirmar]** O chefe de andares supervisiona e redistribui no dia (inspeção, correções, mover tarefas e pessoas), mas não gere fichas de pessoal nem a configuração base, que ficam com a governanta geral.

**Responsável (LEAD) de uma sheet:** hoje é sempre uma pessoa com `JobTitle` `GOVERNANTA` (regra `withLead`). Com os perfis novos passa a ser **`admin` ou `sub_admin`** **[proposta, a confirmar]**: nos dados de demonstração as sheets têm várias governantas como LEAD, e "governanta geral" é uma pessoa só.

**Escopo:** só a colaboradora (`user`) o tem. Vê e age apenas sobre as tarefas das sheets onde está atribuída no plano ativo (e os quartos dessas tarefas); fora disso, `403` com `code: SCOPE_FORBIDDEN`. `superadmin`, `admin`, `sub_admin` e a receção (leitura) veem tudo.

**`deleteStaff` (`superadmin`):** apaga a conta, mas o histórico fica intacto: os eventos guardam `registeredByName`/`registeredByRole` como snapshot e os `executorIds` órfãos passam a mostrar "pessoa removida". Nunca apaga eventos.

Permissões que saem: `rooms.viewAll`/`viewArea`/`viewAssigned` (substituídas pelo escopo), `guest.view` (decisão 6). Ficam sem uso na Fase 1: `stats.teamTimes`, `stats.supervisors` (estatísticas por definir), `messages.send` (chat, Fase 2).

## 9. Fora deste contrato (ainda por levantar)

- Chat (`chatTransporter`, hoje `localStorage`).
- **GesExtra** (picagem de ponto): fonte de `isOnDuty`. Falta saber a interface (API, BD partilhada, ficheiro), o identificador comum da pessoa e o que acontece à saída.
- Estatísticas e relatórios (sem definição do cliente).
- Importação de reservas/hóspedes (OHIP): `RoomStay` vem hoje de `config/hotelData.ts`. `openPlan` herda as estadias do dia anterior quando o dia não tem nenhuma (`ponytail` no código); a API devolve as do dia.

## 10. Diferenças face ao contrato v0.3.1 e ao plano de backend

O FE evoluiu desde 2026-10-21. O plano de backend foi escrito sobre o v0.3.1, por isso **antes de o aprovar** convém corrigi-lo com esta lista.

| Tema | v0.3.1 / plano | FE hoje |
|---|---|---|
| Perfis | `admin` `supervisor` `housekeeper` `reception` (4) | **Decidido:** `superadmin` `admin` `sub_admin` `user` `reception` (secção 8). O `supervisor` do plano corresponde ao `sub_admin`. A governanta e o responsável de andares são `admin` com `JobTitle`; o que o plano chamava `supervisor` é o escopo da secção 8. O plano tem de deixar o perfil |
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
- **Decisões de 2026-11-06:** todas na secção 7 (tabela "Fechadas com o utilizador") e aplicadas nas secções 3, 4.4b e 8.
- **Ordem sugerida para começar:** núcleo (`Clock` com fecho às 02h, problem+json, `require(permission)` + escopo), modelo de dados com `version`, depois execução e inspeção portando os testes de `services/local-api/localApi.test.ts` com o mesmo nome.
- **Cuidado ao portar do `local-api`:** os comandos do FE falham em silêncio (devolvem o estado inalterado); na API cada guarda da secção 4 vira o erro da secção 5. E o FE não tem escopo nem `version`: esses testes escrevem-se de raiz.

### Mudanças que o FE terá de fazer (não feitas)

| Mudança | Onde |
|---|---|
| Esconder refresh, concluir correção e reabrir à empregada (mantém start, finish e DND/NQ/AC) | `RoomCardActions.tsx`, `DetailActions.tsx`, `TurndownCard.tsx`, `ROLE_PERMISSIONS` |
| Receção só visualiza: tirar `task.startFinish` e `priority.reorder` | `config/constants.ts` |
| Perfis `superadmin`/`admin`/`sub_admin`/`user`/`reception` (renomear `housekeeper` → `user`; `JobTitle` sai; LEAD por perfil); `admin` desativa e só `superadmin` apaga; `User.isActive` | `types/auth.types.ts`, `config/constants.ts`, `TeamManager`/`StaffManager`, `local-api/teamCommands.ts` |
| `TaskSheet.block` → `blocks[]` (formulário, filtro por bloco, cabeçalho da sheet) | `types/housekeeping.schemas.ts`, `SheetEditor`, `PlanningPage`/`TurndownPage` (filtro), `openPlan`/`addSheet` no `local-api` |
| Ler o quadro de `GET /boards/{kind}` em vez de juntar 7 coleções | `useBoard`, `lib/taskViews.ts` (passa a só tipar a resposta) |
| Créditos em standby: os cálculos ficam no FE só para visualização | `lib/credits.ts`, `lib/counters.ts` (sem mudança agora) |
| Remover `guest.view` e `rooms.view*` | `config/constants.ts`, `MobilePage.tsx` |
| Alertas visíveis e reconhecíveis por todos os perfis | `TraceForm.tsx`, `MobileAlerts.tsx` |
| Mostrar o job do Opera `PENDING` ("a sincronizar") | cartões e detalhe do quarto |
| "Recarregar pré-definição" chama `resetPlanToDefault`, não `housekeepingTransporter.reset()` (que só serve à demonstração) | `useResetToDailyPreset.ts`, `SummaryStrip` |
| Escopo nas leituras (empregada só vê as suas tarefas) | vem filtrado da API; o FE deixa de assumir a coleção inteira |
