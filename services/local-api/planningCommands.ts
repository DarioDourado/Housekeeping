import { ALL_ROOMS, BLOCK } from '@/config/constants';
import { operationalDate } from '@/lib/operationalDate';
import {
  InspectionStatus,
  Movement,
  PlanKind,
  PlanStatus,
  SheetRole,
  TaskKind,
  TaskStatus,
  type ServiceTask,
  type SheetAssignment,
  type TaskSheet
} from '@/types/housekeeping.types';
import type { Command, HousekeepingState } from './types';
import { findRoom, findSheet, findTask, reindexSheet, tasksOfSheet, withEvent } from './helpers';

// - Mover uma tarefa só muda a sua task sheet: nunca a apaga nem a conclui, e fica em qualquer estado (§6.4/§6.5).
//   Não se mistura trabalho entre o plano diurno e o noturno: são distribuições independentes (§10.4).
export const moveTask: Command<{ taskId: string; targetSheetId: string; targetIndex?: number | undefined }> = (
  state,
  { taskId, targetSheetId, targetIndex },
  ctx
) => {
  const task = findTask(state, taskId);
  const target = findSheet(state, targetSheetId);
  const room = task && findRoom(state, task.roomId);
  if (!task || !target || !room || target.planId !== task.planId) return { state };

  const ordered = tasksOfSheet(state, targetSheetId).filter(t => t.id !== taskId);
  const insertAt = targetIndex !== undefined && targetIndex >= 0 && targetIndex <= ordered.length ? targetIndex : ordered.length;
  ordered.splice(insertAt, 0, task);
  const position = new Map(ordered.map((t, index) => [t.id, index]));

  let next: HousekeepingState = {
    ...state,
    tasks: state.tasks.map(t =>
      t.id === taskId
        ? { ...t, sheetId: targetSheetId, orderIndex: position.get(t.id) ?? t.orderIndex }
        : position.has(t.id) ? { ...t, orderIndex: position.get(t.id) ?? t.orderIndex } : t
    )
  };
  next = reindexSheet(next, task.sheetId);
  next = withEvent(next, ctx, {
    type: 'MOVED_TASK_SHEET',
    roomId: room.id,
    roomNumber: room.number,
    taskId,
    metadata: { fromSheetId: task.sheetId, toSheetId: targetSheetId },
    detail: { key: 'events.roomMoved', params: { number: room.number, title: target.title } }
  });

  return { state: next, toast: { key: 'toasts.roomMoved', params: { number: room.number, title: target.title } } };
};

// - ex.: juntar duas vilas numa só task sheet; a de origem fica vazia mas visível (§6.4)
export const mergeSheets: Command<{ sourceSheetId: string; targetSheetId: string }> = (state, { sourceSheetId, targetSheetId }, ctx) => {
  const source = findSheet(state, sourceSheetId);
  const target = findSheet(state, targetSheetId);
  if (!source || !target || source.id === target.id || source.planId !== target.planId) return { state };

  const moved = tasksOfSheet(state, sourceSheetId);
  const offset = tasksOfSheet(state, targetSheetId).length;
  const assignments = [...target.assignments];
  source.assignments.forEach(assignment => {
    if (!assignments.some(existing => existing.staffId === assignment.staffId)) assignments.push(assignment);
  });

  let next: HousekeepingState = {
    ...state,
    sheets: state.sheets.map(sheet => (sheet.id === targetSheetId ? { ...sheet, assignments } : sheet)),
    tasks: state.tasks.map(t => {
      const index = moved.findIndex(m => m.id === t.id);
      return index >= 0 ? { ...t, sheetId: targetSheetId, orderIndex: offset + index } : t;
    })
  };
  next = reindexSheet(next, targetSheetId);
  next = withEvent(next, ctx, {
    type: 'MOVED_TASK_SHEET',
    roomId: 'batch',
    roomNumber: ALL_ROOMS,
    detail: { key: 'events.sheetsMerged', params: { source: source.title, target: target.title } }
  });

  return { state: next };
};

export const assignStaffToSheet: Command<{ sheetId: string; assignments: SheetAssignment[] }> = (state, { sheetId, assignments }) => ({
  state: { ...state, sheets: state.sheets.map(sheet => (sheet.id === sheetId ? { ...sheet, assignments } : sheet)) }
});

// - Abrir o serviço de um dia: copia as secções (configuração base) para task sheets e cria as tarefas a partir das
//   estadias, SEM alterar a configuração base (CT-01). Se esse dia já está aberto, não faz nada.
export const openPlan: Command<{ kind: PlanKind; date?: string | undefined }> = (state, { kind, date }, ctx) => {
  const day = date ?? operationalDate(ctx.now);
  if (state.plans.some(plan => plan.operationalDate === day && plan.kind === kind)) return { state };

  // - ponytail: sem feed real do Opera, um dia novo herda as estadias do dia anterior (a API devolve as do dia)
  let stays = state.stays.filter(stay => stay.date === day);
  if (stays.length === 0) {
    const latest = state.stays.map(stay => stay.date).sort().at(-1);
    stays = state.stays.filter(stay => stay.date === latest).map(stay => ({ ...stay, date: day }));
  }

  const planId = ctx.newId('plan');
  const sheets: TaskSheet[] = [];
  const tasks: ServiceTask[] = [];
  const addTask = (sheetId: string, roomId: string, taskKind: TaskKind, movement: Movement) =>
    tasks.push({
      id: ctx.newId('task'), planId, sheetId, roomId, kind: taskKind, movement, status: TaskStatus.PENDING, isPriority: false,
      orderIndex: tasks.filter(t => t.sheetId === sheetId).length,
      inspectionStatus: taskKind === TaskKind.CLEANING ? InspectionStatus.PENDING : InspectionStatus.NOT_REQUIRED,
      executorIds: [], onBehalfOfTeam: false
    });

  if (kind === PlanKind.DAY) {
    const onDuty = new Set(state.staff.filter(user => user.isOnDuty !== false).map(user => user.id));
    state.sections.forEach((section, index) => {
      const staffIds = section.defaultStaffIds.filter(id => onDuty.has(id));
      sheets.push({
        id: ctx.newId('sheet'), planId, number: Number(section.name.match(/\d+/)?.[0] ?? index + 1), title: section.name,
        block: section.block, sectionId: section.id, isReserve: false,
        assignments: staffIds.map((staffId, position) => ({ staffId, role: position === 0 ? SheetRole.LEAD : SheetRole.MEMBER }))
      });
    });
    const lastNumber = Math.max(0, ...sheets.map(sheet => sheet.number));
    const reserve = [1, 2].map(offset => ({
      id: ctx.newId('sheet'), planId, number: lastNumber + offset, title: BLOCK.PARKING, block: BLOCK.PARKING, isReserve: true, assignments: []
    }));
    sheets.push(...reserve);

    stays.filter(stay => stay.movement !== Movement.VACANT).forEach(stay => {
      const section = state.sections.find(s => s.defaultRoomIds.includes(stay.roomId));
      const sheet = sheets.find(s => s.sectionId === section?.id) ?? reserve[0];
      if (sheet) addTask(sheet.id, stay.roomId, TaskKind.CLEANING, stay.movement);
    });
  } else {
    const occupiedTonight = stays.filter(stay => stay.movement === Movement.STAYOVER || stay.movement === Movement.DEPARTURE_ARRIVAL);
    const blocks = Array.from(new Set(occupiedTonight.map(stay => findRoom(state, stay.roomId)?.block).filter((b): b is string => !!b)));
    blocks.forEach((block, index) =>
      sheets.push({ id: ctx.newId('sheet'), planId, number: 101 + index, title: `Turndown · ${block}`, block, isReserve: false, assignments: [] })
    );
    occupiedTonight.forEach(stay => {
      const sheet = sheets.find(s => s.block === findRoom(state, stay.roomId)?.block);
      if (sheet) addTask(sheet.id, stay.roomId, TaskKind.TURNDOWN, stay.movement);
    });
  }

  const opened = withEvent(
    {
      ...state,
      stays: [...state.stays.filter(stay => stay.date !== day), ...stays],
      plans: [...state.plans, { id: planId, operationalDate: day, kind, status: PlanStatus.ACTIVE }],
      sheets: [...state.sheets, ...sheets],
      tasks: [...state.tasks, ...tasks]
    },
    ctx,
    { type: 'PLAN_OPENED', roomId: 'plan', roomNumber: ALL_ROOMS, detail: { key: 'events.planOpened', params: { kind, date: day } } }
  );

  return { state: opened, toast: { key: 'toasts.planOpened', params: { kind, date: day } } };
};
