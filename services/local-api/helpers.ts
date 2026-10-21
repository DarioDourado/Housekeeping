import { selectActivePlan } from '@/lib/taskViews';
import {
  InspectionStatus,
  SyncState,
  TaskStatus,
  type LocalizedText,
  type OperaSyncJob,
  type PlanKind,
  type Room,
  type RoomStatus,
  type ServicePlan,
  type ServiceTask,
  type TaskEvent,
  type TaskSheet
} from '@/types/housekeeping.types';
import type { Actor, CommandContext, HousekeepingState } from './types';

export { ALL_ROOMS } from '@/config/constants';

export const SYSTEM_ACTOR: Actor = { id: 'sys', name: 'Sistema', role: 'operator' };

export const defaultNewId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

// ---------- pesquisa ----------

export const findRoom = (state: HousekeepingState, roomId: string): Room | undefined =>
  state.rooms.find(room => room.id === roomId);

export const findTask = (state: HousekeepingState, taskId: string): ServiceTask | undefined =>
  state.tasks.find(task => task.id === taskId);

export const findSheet = (state: HousekeepingState, sheetId: string): TaskSheet | undefined =>
  state.sheets.find(sheet => sheet.id === sheetId);

export const activePlan = (state: HousekeepingState, kind: PlanKind): ServicePlan | undefined =>
  selectActivePlan(state.plans, kind);

// ---------- atualização imutável ----------

export const updateTaskIn = (
  state: HousekeepingState,
  taskId: string,
  change: (task: ServiceTask) => ServiceTask
): HousekeepingState => ({ ...state, tasks: state.tasks.map(task => (task.id === taskId ? change(task) : task)) });

export const updateRoomIn = (state: HousekeepingState, roomId: string, change: (room: Room) => Room): HousekeepingState => ({
  ...state,
  rooms: state.rooms.map(room => (room.id === roomId ? change(room) : room))
});

// - a ordem visível de uma sheet é o orderIndex das suas tarefas; mantém-se contínuo (0..n-1)
export const tasksOfSheet = (state: HousekeepingState, sheetId: string): ServiceTask[] =>
  state.tasks.filter(task => task.sheetId === sheetId).sort((a, b) => a.orderIndex - b.orderIndex);

export const reindexSheet = (state: HousekeepingState, sheetId: string): HousekeepingState => {
  const position = new Map(tasksOfSheet(state, sheetId).map((task, index) => [task.id, index]));
  return {
    ...state,
    tasks: state.tasks.map(task => (position.has(task.id) ? { ...task, orderIndex: position.get(task.id) ?? task.orderIndex } : task))
  };
};

// - A limpeza volta ao início (reabertura ou no-show); o que aconteceu fica no histórico de eventos
export const resetTask = (task: ServiceTask): ServiceTask => ({
  ...task,
  status: TaskStatus.PENDING,
  inspectionStatus: InspectionStatus.PENDING,
  inspectionNote: undefined,
  startedAt: undefined,
  finishedAt: undefined,
  durationSeconds: undefined,
  startedById: undefined,
  notPerformedReason: undefined,
  executorIds: [],
  onBehalfOfTeam: false
});

// ---------- eventos (append-only) ----------

interface EventInput {
  type: TaskEvent['type'];
  roomId: string;
  roomNumber: string;
  taskId?: string | undefined;
  detail?: LocalizedText | undefined;
  durationSeconds?: number | undefined;
  executorIds?: string[] | undefined;
  onBehalfOfTeam?: boolean | undefined;
  supervisorId?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export const withEvent = (state: HousekeepingState, ctx: CommandContext, input: EventInput): HousekeepingState => {
  const event: TaskEvent = {
    id: ctx.newId('ev'),
    occurredAt: ctx.now.toISOString(),
    registeredById: ctx.actor.id,
    registeredByName: ctx.actor.name,
    registeredByRole: ctx.actor.role,
    deviceId: ctx.actor.deviceId,
    ...input,
    executorIds: input.executorIds ?? [],
    onBehalfOfTeam: input.onBehalfOfTeam ?? false
  };
  return { ...state, events: [event, ...state.events] };
};

// - Quem executou ≠ quem registou (§14.5). Telemóvel partilhado: se a equipa tem várias pessoas, o registo é "em nome da
//   equipa" e o executor fica por identificar; com uma só pessoa atribuída e a própria a registar, o executor é ela.
export const resolveExecution = (
  state: HousekeepingState,
  task: Pick<ServiceTask, 'sheetId'>,
  actor: Actor,
  explicitExecutorIds?: string[] | undefined
): { executorIds: string[]; onBehalfOfTeam: boolean } => {
  if (explicitExecutorIds && explicitExecutorIds.length > 0) {
    return { executorIds: explicitExecutorIds, onBehalfOfTeam: !explicitExecutorIds.includes(actor.id) };
  }
  const assigned = findSheet(state, task.sheetId)?.assignments.map(assignment => assignment.staffId) ?? [];
  if (assigned.length === 1 && assigned[0] === actor.id) return { executorIds: [actor.id], onBehalfOfTeam: false };
  return { executorIds: [], onBehalfOfTeam: true };
};

// ---------- Opera ----------

interface OperaWrite {
  room: Room;
  target: RoomStatus;
  occurredAt?: string | undefined;
  source: LocalizedText;
}

// - Nunca sobrescrever um estado do Opera mais recente com uma escrita antiga: fica um job CONFLICT e o quarto não muda (§22.6).
//   A mesma escrita (idempotencyKey) repetida, por exemplo ao reenviar uma fila offline, não duplica nada.
export const writeOperaStatus = (state: HousekeepingState, ctx: CommandContext, input: OperaWrite): HousekeepingState => {
  const { room, target, source } = input;
  const occurredAt = input.occurredAt ?? ctx.now.toISOString();
  const idempotencyKey = `${room.id}:${target}:${occurredAt}`;
  if (state.syncJobs.some(job => job.idempotencyKey === idempotencyKey)) return state;

  const base: Omit<OperaSyncJob, 'state'> = {
    id: ctx.newId('job'),
    roomId: room.id,
    direction: 'APP_TO_OPERA',
    previousStatus: room.operaStatus,
    targetStatus: target,
    attempts: 1,
    idempotencyKey,
    createdAt: ctx.now.toISOString(),
    source
  };

  if (room.operaStatusUpdatedAt > occurredAt) {
    const conflict: OperaSyncJob = { ...base, state: SyncState.CONFLICT, lastError: { key: 'opera.errors.newerStatus' } };
    return withEvent({ ...state, syncJobs: [conflict, ...state.syncJobs] }, ctx, {
      type: 'OPERA_CONFLICT_DETECTED',
      roomId: room.id,
      roomNumber: room.number,
      detail: { key: 'events.operaConflict', params: { number: room.number, status: target } }
    });
  }

  const confirmed: OperaSyncJob = { ...base, state: SyncState.CONFIRMED, operaObservedAt: ctx.now.toISOString() };
  return updateRoomIn({ ...state, syncJobs: [confirmed, ...state.syncJobs] }, room.id, r => ({
    ...r,
    operaStatus: target,
    operaStatusUpdatedAt: ctx.now.toISOString()
  }));
};
