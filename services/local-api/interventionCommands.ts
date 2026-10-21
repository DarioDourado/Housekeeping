import {
  InspectionStatus,
  Movement,
  PlanKind,
  PriorityOrigin,
  TaskKind,
  TaskStatus,
  type LocalizedText
} from '@/types/housekeeping.types';
import type { Command, TaskArgs } from './types';
import {
  activePlan,
  findRoom,
  findTask,
  resolveExecution,
  tasksOfSheet,
  updateTaskIn,
  withEvent
} from './helpers';

// - Refresh não é uma limpeza: tem a sua própria tarefa e o seu histórico, e não altera o estado do quarto (§9.4).
//   Sem tarefa de refresh no plano, regista-se uma intervenção não prevista (§6.5).
export const recordRefresh: Command<{ roomId: string; executorIds?: string[] | undefined }> = (state, { roomId, executorIds }, ctx) => {
  const room = findRoom(state, roomId);
  const plan = activePlan(state, PlanKind.DAY);
  if (!room || !plan) return { state };

  const existing = state.tasks.find(t => t.planId === plan.id && t.roomId === roomId && t.kind === TaskKind.REFRESH);
  const cleaning = state.tasks.find(t => t.planId === plan.id && t.roomId === roomId && t.kind === TaskKind.CLEANING);
  const sheetId = (existing ?? cleaning)?.sheetId
    ?? state.sheets.find(sheet => sheet.planId === plan.id && sheet.isReserve)?.id
    ?? state.sheets.find(sheet => sheet.planId === plan.id)?.id;
  if (!sheetId) return { state };

  const execution = resolveExecution(state, { sheetId }, ctx.actor, executorIds);
  const movement = state.stays.find(stay => stay.roomId === roomId && stay.date === plan.operationalDate)?.movement ?? Movement.VACANT;
  const done = {
    status: TaskStatus.COMPLETED,
    finishedAt: ctx.now.toISOString(),
    startedById: ctx.actor.id,
    ...execution
  };

  let next = existing
    ? updateTaskIn(state, existing.id, t => ({ ...t, ...done }))
    : {
        ...state,
        tasks: [
          ...state.tasks,
          {
            id: ctx.newId('task'),
            planId: plan.id,
            sheetId,
            roomId,
            kind: TaskKind.REFRESH,
            movement,
            isPriority: false,
            orderIndex: tasksOfSheet(state, sheetId).length,
            inspectionStatus: InspectionStatus.NOT_REQUIRED,
            ...done
          }
        ]
      };

  next = withEvent(next, ctx, {
    type: 'REFRESH_RECORDED',
    roomId,
    roomNumber: room.number,
    taskId: existing?.id,
    ...execution,
    detail: { key: 'events.refreshRecorded', params: { name: ctx.actor.name } }
  });
  return { state: next };
};

export const togglePriority: Command<TaskArgs & { reason?: string | undefined }> = (state, { taskId, reason }, ctx) => {
  const task = findTask(state, taskId);
  const room = task && findRoom(state, task.roomId);
  if (!task || !room) return { state };

  const enabled = !task.isPriority;
  const toggled = updateTaskIn(state, taskId, t => ({
    ...t,
    isPriority: enabled,
    priorityOrigin: enabled ? (ctx.actor.role === 'reception' ? PriorityOrigin.RECEPTION : PriorityOrigin.HOUSEKEEPING) : undefined,
    priorityReason: enabled ? reason : undefined
  }));

  const detail: LocalizedText = !enabled
    ? { key: 'events.priorityOff' }
    : reason
      ? { key: 'events.priorityOn', params: { name: ctx.actor.name, reason } }
      : { key: 'events.priorityOnNoNote', params: { name: ctx.actor.name } };

  return { state: withEvent(toggled, ctx, { type: 'PRIORITY_TOGGLED', roomId: room.id, roomNumber: room.number, taskId, detail }) };
};
