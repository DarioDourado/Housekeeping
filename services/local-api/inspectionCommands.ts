import {
  InspectionStatus,
  RoomStatus,
  TaskKind,
  TaskStatus
} from '@/types/housekeeping.types';
import type { Command, ExecutionArgs, TaskArgs } from './types';
import {
  findRoom,
  findSheet,
  findTask,
  resolveExecution,
  updateTaskIn,
  withEvent,
  writeOperaStatus
} from './helpers';

// - Inspeção da governanta: aprovar, pedir correção e concluir a correção. Ver também o contrato §5 (Inspeção).
export const inspectTask: Command<TaskArgs & { occurredAt?: string | undefined }> = (state, { taskId, occurredAt }, ctx) => {
  const task = findTask(state, taskId);
  const room = task && findRoom(state, task.roomId);
  if (!task || !room || task.kind !== TaskKind.CLEANING || task.status !== TaskStatus.COMPLETED || task.inspectionStatus !== InspectionStatus.PENDING) {
    return { state };
  }

  const approved = updateTaskIn(state, taskId, t => ({ ...t, inspectionStatus: InspectionStatus.APPROVED, inspectionNote: undefined }));
  const logged = withEvent(approved, ctx, {
    type: 'INSPECTION_APPROVED',
    roomId: room.id,
    roomNumber: room.number,
    taskId,
    supervisorId: ctx.actor.id,
    detail: { key: 'events.inspectionApproved', params: { name: ctx.actor.name } }
  });

  return {
    state: writeOperaStatus(logged, ctx, { room, target: RoomStatus.INSPECTED, occurredAt, source: { key: 'opera.source.inspectionApproved' } })
  };
};

// - O pedido de correção NÃO é um estado do Opera: o quarto continua Clean, a tarefa continua concluída e a empregada recebe
//   um alerta com a nota (§8.2). Só deixa de ser Inspected-elegível até a correção estar feita.
export const requestCorrection: Command<TaskArgs & { note: string }> = (state, { taskId, note }, ctx) => {
  const task = findTask(state, taskId);
  const room = task && findRoom(state, task.roomId);
  if (!task || !room || task.status !== TaskStatus.COMPLETED || task.inspectionStatus !== InspectionStatus.PENDING) return { state };

  const flagged = updateTaskIn(state, taskId, t => ({ ...t, inspectionStatus: InspectionStatus.CORRECTION_REQUESTED, inspectionNote: note }));
  const logged = withEvent(flagged, ctx, {
    type: 'INSPECTION_REPROVED',
    roomId: room.id,
    roomNumber: room.number,
    taskId,
    supervisorId: ctx.actor.id,
    detail: { key: 'events.inspectionReproved', params: { name: ctx.actor.name, note } }
  });

  const responsible = (task.executorIds[0] ? state.staff.find(user => user.id === task.executorIds[0]) : undefined)
    ?? state.staff.find(user => user.id === findSheet(state, task.sheetId)?.assignments[0]?.staffId);

  return {
    state: {
      ...logged,
      alerts: [
        {
          id: ctx.newId('alt'),
          timestamp: ctx.now.toISOString(),
          roomId: room.id,
          roomNumber: room.number,
          taskId,
          targetWorkerName: responsible?.name,
          targetArea: room.block,
          type: 'REPROVAL',
          message: { key: 'alerts.reproval', params: { number: room.number, name: ctx.actor.name, note } },
          acknowledged: false
        },
        ...logged.alerts
      ]
    }
  };
};

// - correção feita: volta a ficar à espera de inspeção (§5 do contrato)
export const completeCorrection: Command<ExecutionArgs> = (state, { taskId, executorIds }, ctx) => {
  const task = findTask(state, taskId);
  const room = task && findRoom(state, task.roomId);
  if (!task || !room || task.inspectionStatus !== InspectionStatus.CORRECTION_REQUESTED) return { state };

  const execution = resolveExecution(state, task, ctx.actor, executorIds);
  const fixed = updateTaskIn(state, taskId, t => ({ ...t, inspectionStatus: InspectionStatus.PENDING, inspectionNote: undefined }));

  return {
    state: withEvent(fixed, ctx, {
      type: 'CORRECTION_DONE',
      roomId: room.id,
      roomNumber: room.number,
      taskId,
      ...execution,
      detail: { key: 'events.correctionDone', params: { name: ctx.actor.name } }
    })
  };
};
