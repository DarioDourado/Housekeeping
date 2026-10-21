import { ALL_ROOMS } from '@/config/constants';
import {
  InspectionStatus,
  Movement,
  PlanKind,
  RoomStatus,
  SyncState,
  TaskKind,
  TaskStatus,
  type LocalizedText,
  type OperaSyncJob
} from '@/types/housekeeping.types';
import type { Command, CommandContext, HousekeepingState } from './types';
import { activePlan, findRoom, resetTask, tasksOfSheet, updateRoomIn, updateTaskIn, withEvent } from './helpers';

// - Alteração feita do lado do Opera (receção, fecho do dia…): a app lê-a e NUNCA repõe o estado que tinha guardado (§8.4).
//   Uma notificação mais antiga do que o estado que já temos é ignorada (chegou fora de ordem).
const pullStatus = (
  state: HousekeepingState,
  ctx: CommandContext,
  roomId: string,
  status: RoomStatus,
  source: LocalizedText,
  observedAt: string = ctx.now.toISOString()
): HousekeepingState => {
  const room = findRoom(state, roomId);
  if (!room || observedAt < room.operaStatusUpdatedAt) return state;

  const job: OperaSyncJob = {
    id: ctx.newId('job'),
    roomId,
    direction: 'OPERA_TO_APP',
    previousStatus: room.operaStatus,
    targetStatus: status,
    state: SyncState.CONFIRMED,
    attempts: 1,
    idempotencyKey: `${roomId}:pull:${status}:${observedAt}`,
    createdAt: ctx.now.toISOString(),
    operaObservedAt: observedAt,
    source
  };
  return updateRoomIn({ ...state, syncJobs: [job, ...state.syncJobs] }, roomId, r => ({
    ...r,
    operaStatus: status,
    operaStatusUpdatedAt: observedAt
  }));
};

export const receiveOperaStatus: Command<{ roomId: string; status: RoomStatus; observedAt?: string }> = (
  state,
  { roomId, status, observedAt },
  ctx
) => {
  const room = findRoom(state, roomId);
  if (!room) return { state };

  const pulled = pullStatus(state, ctx, roomId, status, { key: 'opera.source.pushedByOpera' }, observedAt);
  if (pulled === state) return { state };

  return {
    state: withEvent(pulled, ctx, {
      type: 'OPERA_SYNC_PULL',
      roomId,
      roomNumber: room.number,
      detail: { key: 'events.operaPulled', params: { number: room.number, status } }
    })
  };
};

// - Simula o fecho do dia do Opera (~02h, nunca à meia-noite; §8.4): Inspected volta a Clean (passa a precisar de refresh)
//   e o no-show passa a Dirty (a limpeza volta ao início).
export const triggerNightAudit: Command = (state, _args, ctx) => {
  const plan = activePlan(state, PlanKind.DAY);
  let next = state;
  let backToClean = 0;
  let backToDirty = 0;

  for (const room of state.rooms) {
    const dayTasks = state.tasks.filter(t => t.planId === plan?.id && t.roomId === room.id);
    const cleaning = dayTasks.find(t => t.kind === TaskKind.CLEANING);

    if (room.operaStatus === RoomStatus.INSPECTED) {
      backToClean++;
      next = pullStatus(next, ctx, room.id, RoomStatus.CLEAN, { key: 'opera.source.nightAudit' });
      if (plan && !dayTasks.some(t => t.kind === TaskKind.REFRESH)) {
        const sheetId = cleaning?.sheetId ?? state.sheets.find(s => s.planId === plan.id && s.isReserve)?.id;
        if (sheetId) {
          next = {
            ...next,
            tasks: [
              ...next.tasks,
              {
                id: ctx.newId('task'), planId: plan.id, sheetId, roomId: room.id, kind: TaskKind.REFRESH,
                movement: Movement.VACANT, status: TaskStatus.PENDING, isPriority: false,
                orderIndex: tasksOfSheet(next, sheetId).length, inspectionStatus: InspectionStatus.NOT_REQUIRED,
                executorIds: [], onBehalfOfTeam: false
              }
            ]
          };
        }
      }
    } else if (cleaning?.movement === Movement.DEPARTURE_ARRIVAL && room.operaStatus === RoomStatus.CLEAN && cleaning.status === TaskStatus.COMPLETED) {
      backToDirty++;
      next = pullStatus(next, ctx, room.id, RoomStatus.DIRTY, { key: 'opera.source.nightAuditNoShow' });
      next = updateTaskIn(next, cleaning.id, resetTask);
    }
  }

  return {
    state: withEvent(next, ctx, {
      type: 'NIGHT_AUDIT_TRIGGERED',
      roomId: 'night-audit',
      roomNumber: ALL_ROOMS,
      detail: { key: 'events.nightAudit', params: { clean: backToClean, dirty: backToDirty } }
    })
  };
};

export const syncWithOpera: Command<{ roomId?: string } | undefined> = (state, args, ctx) => {
  const room = args?.roomId ? findRoom(state, args.roomId) : undefined;
  const status = room?.operaStatus ?? RoomStatus.CLEAN;
  const job: OperaSyncJob = {
    id: ctx.newId('job'),
    roomId: room?.id ?? null,
    direction: 'APP_TO_OPERA',
    previousStatus: status,
    targetStatus: status,
    state: SyncState.CONFIRMED,
    attempts: 1,
    idempotencyKey: `${room?.id ?? ALL_ROOMS}:manual:${ctx.now.toISOString()}`,
    createdAt: ctx.now.toISOString(),
    operaObservedAt: ctx.now.toISOString(),
    source: { key: 'opera.source.manualSync' }
  };
  return { state: { ...state, syncJobs: [job, ...state.syncJobs] } };
};

// - Reenvio decidido por uma pessoa: um job em conflito ou falhado só se aplica se alguém o mandar (nunca automaticamente)
export const retryOperaJob: Command<{ jobId: string }> = (state, { jobId }, ctx) => {
  const job = state.syncJobs.find(candidate => candidate.id === jobId);
  const room = job?.roomId ? findRoom(state, job.roomId) : undefined;
  if (!job || !room || (job.state !== SyncState.FAILED && job.state !== SyncState.CONFLICT)) return { state };

  const applied = updateRoomIn(state, room.id, r => ({ ...r, operaStatus: job.targetStatus, operaStatusUpdatedAt: ctx.now.toISOString() }));
  const retried = {
    ...applied,
    syncJobs: applied.syncJobs.map(candidate =>
      candidate.id === jobId
        ? {
            ...candidate,
            state: SyncState.CONFIRMED,
            attempts: candidate.attempts + 1,
            previousStatus: room.operaStatus,
            lastError: undefined,
            operaObservedAt: ctx.now.toISOString()
          }
        : candidate
    )
  };

  return {
    state: withEvent(retried, ctx, {
      type: 'OPERA_SYNC_PUSH',
      roomId: room.id,
      roomNumber: room.number,
      detail: { key: 'events.operaRetried', params: { number: room.number, status: job.targetStatus } }
    })
  };
};
