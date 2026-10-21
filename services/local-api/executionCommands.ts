import {
  InspectionStatus,
  NotPerformedReason,
  PlanKind,
  RoomStatus,
  TaskKind,
  TaskStatus,
  type LocalizedText
} from '@/types/housekeeping.types';
import type { Command, ExecutionArgs, TaskArgs } from './types';
import {
  activePlan,
  findRoom,
  findTask,
  resetTask,
  resolveExecution,
  updateTaskIn,
  withEvent,
  writeOperaStatus
} from './helpers';

// - Cada tarefa tem o seu estado de execução (PENDING→IN_PROGRESS→COMPLETED/NOT_PERFORMED); o estado do quarto no Opera
//   é outra coisa e só muda quando a regra o diz (limpeza concluída, inspeção, reabertura).

export const startTask: Command<ExecutionArgs> = (state, { taskId, executorIds }, ctx) => {
  const task = findTask(state, taskId);
  const room = task && findRoom(state, task.roomId);
  if (!task || !room || (task.status !== TaskStatus.PENDING && task.status !== TaskStatus.NOT_PERFORMED)) return { state };

  const execution = resolveExecution(state, task, ctx.actor, executorIds);
  const started = updateTaskIn(state, taskId, t => ({
    ...t,
    status: TaskStatus.IN_PROGRESS,
    startedAt: ctx.now.toISOString(),
    // - recomeçar depois de reabrir ou de um impedimento não herda o fim anterior
    finishedAt: undefined,
    durationSeconds: undefined,
    notPerformedReason: undefined,
    startedById: ctx.actor.id,
    ...execution
  }));

  return {
    state: withEvent(started, ctx, {
      type: 'ROOM_STARTED',
      roomId: room.id,
      roomNumber: room.number,
      taskId,
      ...execution,
      detail: { key: 'events.roomStarted', params: { name: ctx.actor.name } }
    })
  };
};

// - Concluir uma limpeza: Dirty → Clean no Opera. Refresh e turndown não escrevem no Opera (§9, §10.6).
export const finishTask: Command<ExecutionArgs & { occurredAt?: string | undefined }> = (state, { taskId, executorIds, occurredAt }, ctx) => {
  const task = findTask(state, taskId);
  const room = task && findRoom(state, task.roomId);
  if (!task || !room || (task.status !== TaskStatus.PENDING && task.status !== TaskStatus.IN_PROGRESS)) return { state };

  const execution = executorIds?.length || !task.startedById
    ? resolveExecution(state, task, ctx.actor, executorIds)
    : { executorIds: task.executorIds, onBehalfOfTeam: task.onBehalfOfTeam };

  // - duração real, sem mínimos: uma limpeza "concluída" em 30s é uma anomalia a mostrar à direção, não a esconder (§14.3)
  const duration = task.startedAt
    ? Math.max(0, Math.floor((ctx.now.getTime() - new Date(task.startedAt).getTime()) / 1000))
    : undefined;

  const finished = updateTaskIn(state, taskId, t => ({
    ...t,
    status: TaskStatus.COMPLETED,
    finishedAt: ctx.now.toISOString(),
    durationSeconds: duration,
    ...execution,
    inspectionStatus: t.kind === TaskKind.CLEANING ? InspectionStatus.PENDING : t.inspectionStatus
  }));

  const isTurndown = task.kind === TaskKind.TURNDOWN;
  const detail: LocalizedText = isTurndown
    ? { key: 'events.turndownDone', params: { name: ctx.actor.name } }
    : duration === undefined
      ? { key: 'events.roomFinishedNoTime', params: { name: ctx.actor.name } }
      : { key: 'events.roomFinished', params: { name: ctx.actor.name, minutes: Math.round(duration / 60) } };

  const logged = withEvent(finished, ctx, {
    type: isTurndown ? 'TURNDOWN_UPDATED' : 'ROOM_FINISHED',
    roomId: room.id,
    roomNumber: room.number,
    taskId,
    durationSeconds: duration,
    ...execution,
    detail
  });

  if (task.kind !== TaskKind.CLEANING) return { state: logged };
  return {
    state: writeOperaStatus(logged, ctx, { room, target: RoomStatus.CLEAN, occurredAt, source: { key: 'opera.source.cleanFinished' } })
  };
};

// - DND e recusa são impedimentos registados; nunca contam como limpo nem tocam no Opera (§7.3)
export const recordNotPerformed: Command<TaskArgs & { reason: NotPerformedReason }> = (state, { taskId, reason }, ctx) => {
  const task = findTask(state, taskId);
  const room = task && findRoom(state, task.roomId);
  if (!task || !room || (task.status !== TaskStatus.PENDING && task.status !== TaskStatus.IN_PROGRESS)) return { state };

  const blocked = updateTaskIn(state, taskId, t => ({
    ...t,
    status: TaskStatus.NOT_PERFORMED,
    notPerformedReason: reason,
    inspectionStatus: InspectionStatus.NOT_REQUIRED
  }));

  const isDnd = reason === NotPerformedReason.DND;
  return {
    state: withEvent(blocked, ctx, {
      type: isDnd ? 'DND_RECORDED' : 'SERVICE_REFUSED',
      roomId: room.id,
      roomNumber: room.number,
      taskId,
      detail: { key: isDnd ? 'events.dndRecorded' : 'events.serviceRefused' }
    })
  };
};

// - Reabrir uma tarefa de turndown ou de refresh já concluída (volta a "por iniciar"). Nunca toca no Opera.
//   Reabrir a LIMPEZA do dia é outra coisa: é reopenRoom, que escreve Dirty no Opera.
export const reopenTask: Command<TaskArgs> = (state, { taskId }, ctx) => {
  const task = findTask(state, taskId);
  const room = task && findRoom(state, task.roomId);
  if (!task || !room || task.kind === TaskKind.CLEANING || task.status === TaskStatus.PENDING) return { state };

  return {
    state: withEvent(updateTaskIn(state, taskId, resetTask), ctx, {
      type: task.kind === TaskKind.TURNDOWN ? 'TURNDOWN_UPDATED' : 'REFRESH_RECORDED',
      roomId: room.id,
      roomNumber: room.number,
      taskId,
      detail: { key: 'events.taskReopened', params: { name: ctx.actor.name } }
    })
  };
};

// - A governanta devolve o quarto a Dirty (§8.3): escreve Dirty no Opera e a limpeza do dia volta ao início
export const reopenRoom: Command<{ roomId: string; reason?: string | undefined; occurredAt?: string | undefined }> = (state, { roomId, reason, occurredAt }, ctx) => {
  const room = findRoom(state, roomId);
  if (!room) return { state };

  const plan = activePlan(state, PlanKind.DAY);
  const cleaning = state.tasks.find(t => t.planId === plan?.id && t.roomId === roomId && t.kind === TaskKind.CLEANING);

  const reset = cleaning
    ? updateTaskIn(state, cleaning.id, resetTask)
    : state;

  const logged = withEvent(reset, ctx, {
    type: 'ROOM_REOPENED',
    roomId,
    roomNumber: room.number,
    taskId: cleaning?.id,
    supervisorId: ctx.actor.id,
    detail: reason
      ? { key: 'events.roomReopened', params: { name: ctx.actor.name, reason } }
      : { key: 'events.roomReopenedDefault', params: { name: ctx.actor.name } }
  });

  return { state: writeOperaStatus(logged, ctx, { room, target: RoomStatus.DIRTY, occurredAt, source: { key: 'opera.source.reopened' } }) };
};
