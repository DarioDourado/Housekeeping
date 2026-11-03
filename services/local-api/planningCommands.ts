import { isOnDuty } from '@/lib/staffDuty';
import { ALL_ROOMS, BLOCK, DEFAULT_PARKING_SHEET_COUNT } from '@/config/constants';
import { operationalDate } from '@/lib/operationalDate';
import { getStaffBlock } from '@/lib/staffBlock';
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
import type { Command, CommandContext, HousekeepingState } from './types';
import { findRoom, findSheet, findTask, reindexSheet, tasksOfSheet, withEvent, withLead } from './helpers';

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

// - Mudanças na equipa de uma sheet ficam na auditoria: metadata = { staffId, action, fromSheetId?, toSheetId? }
const logStaffSheet = (
  state: HousekeepingState,
  ctx: CommandContext,
  { staffId, action, sheet, from }: { staffId: string; action: 'added' | 'removed' | 'moved'; sheet: TaskSheet; from?: TaskSheet | undefined }
): HousekeepingState => {
  const name = state.staff.find(user => user.id === staffId)?.name ?? staffId;
  const key = { added: 'events.staffSheetAdded', removed: 'events.staffSheetRemoved', moved: 'events.staffSheetMoved' }[action];
  return withEvent(state, ctx, {
    type: 'STAFF_SHEET_CHANGED',
    roomId: sheet.id,
    roomNumber: sheet.title,
    detail: { key, params: { name, sheet: sheet.title, from: from?.title ?? '' } },
    metadata: { staffId, action, ...(from && { fromSheetId: from.id }), ...(action !== 'removed' && { toSheetId: sheet.id }) }
  });
};

// - Editar a task sheet do dia (nome e bloco). Não toca na secção base nem em planos já abertos (§6.1).
export const updateSheet: Command<{ sheetId: string; title: string; block: string }> = (state, { sheetId, title, block }, ctx) => {
  const sheet = findSheet(state, sheetId);
  const next = { title: title.trim() || sheet?.title, block: block.trim() || sheet?.block };
  if (!sheet || (next.title === sheet.title && next.block === sheet.block)) return { state };
  const updated = { ...state, sheets: state.sheets.map(current => (current.id === sheetId ? { ...current, ...next } as TaskSheet : current)) };
  return {
    state: withEvent(updated, ctx, {
      type: 'SHEET_UPDATED',
      roomId: sheet.id,
      roomNumber: next.title ?? sheet.title,
      detail: { key: 'events.sheetUpdated', params: { before: sheet.title, after: next.title ?? sheet.title, block: next.block ?? sheet.block } },
      metadata: { sheetId, before: { title: sheet.title, block: sheet.block }, after: next }
    })
  };
};

// - Arrastar uma pessoa para uma sheet: sai da sheet de origem (se vier de uma) e entra na de destino. Só dentro do mesmo plano
//   (manhã e noite são distribuições independentes). Se a responsável sai, a primeira que fica passa a responsável.
export const moveStaffToSheet: Command<{ staffId: string; toSheetId: string; fromSheetId?: string | undefined }> = (state, { staffId, toSheetId, fromSheetId }, ctx) => {
  const to = findSheet(state, toSheetId);
  const from = fromSheetId ? findSheet(state, fromSheetId) : undefined;
  if (!to || to.id === fromSheetId || (from && from.planId !== to.planId)) return { state };
  if (to.assignments.some(a => a.staffId === staffId) && !from) return { state };

  const sheets = state.sheets.map(sheet => {
    if (sheet.id === to.id) {
      if (sheet.assignments.some(a => a.staffId === staffId)) return sheet;
      return { ...sheet, assignments: [...sheet.assignments, { staffId, role: sheet.assignments.length === 0 ? SheetRole.LEAD : SheetRole.MEMBER }] };
    }
    if (sheet.id !== from?.id) return sheet;
    return { ...sheet, assignments: withLead(sheet.assignments.filter(a => a.staffId !== staffId)) };
  });
  return { state: logStaffSheet({ ...state, sheets }, ctx, { staffId, action: from ? 'moved' : 'added', sheet: to, from }) };
};

// - Tirar uma pessoa de uma sheet (arrastar para a zona de apagar): sai da sheet e passa ao pool de Apoio (de serviço, sem posição)
export const removeStaffFromSheet: Command<{ staffId: string; sheetId: string }> = (state, { staffId, sheetId }, ctx) => {
  const sheet = findSheet(state, sheetId);
  const person = state.staff.find(user => user.id === staffId);
  if (!sheet || !person || !sheet.assignments.some(a => a.staffId === staffId)) return { state };

  const without: HousekeepingState = {
    ...state,
    sheets: state.sheets.map(current => (current.id === sheetId ? { ...current, assignments: withLead(current.assignments.filter(a => a.staffId !== staffId)) } : current))
  };
  const from = getStaffBlock(person);
  const parked = from === BLOCK.SUPPORT
    ? without
    : withEvent({ ...without, staff: without.staff.map(user => (user.id === staffId ? { ...user, assignedArea: BLOCK.SUPPORT } : user)) }, ctx, {
        type: 'STAFF_MOVED', roomId: 'staff', roomNumber: person.name,
        detail: { key: 'events.staffRemoved', params: { name: person.name, from } },
        metadata: { staffId, from, to: BLOCK.SUPPORT }
      });
  return {
    state: logStaffSheet(parked, ctx, { staffId, action: 'removed', sheet }),
    toast: { key: 'toasts.staffRemovedFromSheet', params: { name: person.name, sheet: sheet.title } }
  };
};

// - Edição da equipa pela lista da sheet: regista quem entrou e quem saiu
export const assignStaffToSheet: Command<{ sheetId: string; assignments: SheetAssignment[] }> = (state, { sheetId, assignments }, ctx) => {
  const sheet = findSheet(state, sheetId);
  if (!sheet) return { state };
  const before = new Set(sheet.assignments.map(a => a.staffId));
  const after = new Set(assignments.map(a => a.staffId));
  let next: HousekeepingState = { ...state, sheets: state.sheets.map(current => (current.id === sheetId ? { ...current, assignments: withLead(assignments) } : current)) };
  after.forEach(staffId => { if (!before.has(staffId)) next = logStaffSheet(next, ctx, { staffId, action: 'added', sheet }); });
  before.forEach(staffId => { if (!after.has(staffId)) next = logStaffSheet(next, ctx, { staffId, action: 'removed', sheet }); });
  return { state: next };
};

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
    const onDuty = new Set(state.staff.filter(isOnDuty).map(user => user.id));
    state.sections.filter(section => section.kind === PlanKind.DAY).forEach((section, index) => {
      const staffIds = section.defaultStaffIds.filter(id => onDuty.has(id));
      sheets.push({
        id: ctx.newId('sheet'), planId, number: Number(section.name.match(/\d+/)?.[0] ?? index + 1), title: section.name,
        block: section.block, sectionId: section.id, isReserve: false,
        assignments: staffIds.map((staffId, position) => ({ staffId, role: position === 0 ? SheetRole.LEAD : SheetRole.MEMBER }))
      });
    });
    const lastNumber = Math.max(0, ...sheets.map(sheet => sheet.number));
    const reserve = Array.from({ length: DEFAULT_PARKING_SHEET_COUNT }, (_, i) => i + 1).map(offset => ({
      id: ctx.newId('sheet'), planId, number: lastNumber + offset, title: BLOCK.PARKING, block: BLOCK.PARKING, isReserve: true, assignments: []
    }));
    sheets.push(...reserve);

    stays.filter(stay => stay.movement !== Movement.VACANT).forEach(stay => {
      const section = state.sections.find(s => s.kind === PlanKind.DAY && s.defaultRoomIds.includes(stay.roomId));
      const sheet = sheets.find(s => s.sectionId === section?.id) ?? reserve[0];
      if (sheet) addTask(sheet.id, stay.roomId, TaskKind.CLEANING, stay.movement);
    });
  } else {
    // - uma zona por secção base do turndown (Definições); só entram quartos ocupados esta noite e quem está de serviço
    const occupiedTonight = new Set(stays.filter(stay => stay.movement === Movement.STAYOVER || stay.movement === Movement.DEPARTURE_ARRIVAL).map(stay => stay.roomId));
    const onDuty = new Set(state.staff.filter(isOnDuty).map(user => user.id));
    state.sections.filter(section => section.kind === PlanKind.NIGHT).forEach((section, index) => {
      const staffIds = section.defaultStaffIds.filter(id => onDuty.has(id));
      const sheet: TaskSheet = {
        id: ctx.newId('sheet'), planId, number: 100 + Number(section.name.match(/\d+/)?.[0] ?? index + 1), title: section.name,
        block: section.block, sectionId: section.id, isReserve: false,
        assignments: staffIds.map((staffId, position) => ({ staffId, role: position === 0 ? SheetRole.LEAD : SheetRole.MEMBER }))
      };
      sheets.push(sheet);
      section.defaultRoomIds.filter(roomId => occupiedTonight.has(roomId)).forEach(roomId => {
        const stay = stays.find(s => s.roomId === roomId);
        if (stay) addTask(sheet.id, roomId, TaskKind.TURNDOWN, stay.movement);
      });
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
