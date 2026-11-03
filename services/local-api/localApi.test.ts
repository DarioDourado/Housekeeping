import { describe, expect, it } from 'vitest';
import { todayAt } from '@/lib/clock';
import {
  CommercialBlock,
  InspectionStatus,
  Movement,
  NotPerformedReason,
  PlanKind,
  PriorityOrigin,
  RoomStatus,
  SheetRole,
  SyncState,
  TaskKind,
  TaskStatus
} from '@/types/housekeeping.types';
import { commands, type Actor, type CommandArgs, type CommandContext, type CommandName, type HousekeepingState } from '@/services/local-api';
import { writeOperaStatus } from '@/services/local-api/helpers';
import { seedState } from '@/services/local-api/store';

const deepFreeze = <T,>(value: T): T => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

const seed = (): HousekeepingState => deepFreeze(seedState());

const SUPERVISOR: Actor = { id: 'user-filipa', name: 'Filipa Mendes', role: 'supervisor' };
const MARIA: Actor = { id: 'user-maria', name: 'Maria João', role: 'housekeeper', deviceId: 'TEL-AREA-01' };
const EXTRA: Actor = { id: 'user-extra-1', name: 'Extra #1', role: 'housekeeper' };
const RECEPTION: Actor = { id: 'user-rececao', name: 'Receção', role: 'reception' };
const T0 = new Date(todayAt('10:00'));
const minutesAfter = (minutes: number) => new Date(T0.getTime() + minutes * 60_000);

const ctx = (actor: Actor = SUPERVISOR, now: Date = T0): CommandContext => {
  let counter = 0;
  return { actor, now, newId: prefix => `${prefix}-test-${++counter}` };
};

// - corre um comando sobre um estado congelado: qualquer mutação direta rebenta o teste
const run = <N extends CommandName>(state: HousekeepingState, name: N, args: CommandArgs<N>, context = ctx()) =>
  (commands[name] as (s: HousekeepingState, a: CommandArgs<N>, c: CommandContext) => { state: HousekeepingState; toast?: { key: string; params?: Record<string, string | number> } })(
    state, args, context
  );

const next = <N extends CommandName>(state: HousekeepingState, name: N, args: CommandArgs<N>, context = ctx()) =>
  deepFreeze(run(state, name, args, context).state);

const task = (state: HousekeepingState, id: string) => {
  const found = state.tasks.find(t => t.id === id);
  if (!found) throw new Error(`task ${id} missing`);
  return found;
};
const room = (state: HousekeepingState, id: string) => {
  const found = state.rooms.find(r => r.id === id);
  if (!found) throw new Error(`room ${id} missing`);
  return found;
};

const CLEAN_101 = 'task-101-cleaning';

describe('pureza dos comandos', () => {
  it('o estado de teste está mesmo congelado (mutar diretamente rebenta)', () => {
    expect(() => { (seed().rooms[0] as { number: string }).number = 'X'; }).toThrow(TypeError);
  });
});

describe('execução diurna', () => {
  it('CT-06: terminar uma limpeza conclui a tarefa, regista a duração real e escreve Clean no Opera', () => {
    const started = next(seed(), 'startTask', { taskId: CLEAN_101 }, ctx(MARIA, T0));
    const finished = run(started, 'finishTask', { taskId: CLEAN_101 }, ctx(MARIA, minutesAfter(40))).state;

    expect(task(finished, CLEAN_101)).toMatchObject({ status: TaskStatus.COMPLETED, durationSeconds: 2400, inspectionStatus: InspectionStatus.PENDING });
    expect(room(finished, 'room-101').operaStatus).toBe(RoomStatus.CLEAN);
    expect(finished.syncJobs[0]).toMatchObject({ roomId: 'room-101', direction: 'APP_TO_OPERA', previousStatus: RoomStatus.DIRTY, targetStatus: RoomStatus.CLEAN, state: SyncState.CONFIRMED });
    expect(finished.events[0]).toMatchObject({ type: 'ROOM_FINISHED', taskId: CLEAN_101, durationSeconds: 2400 });
  });

  it('§14.3: uma limpeza concluída em 30s fica registada com 30s (não se esconde a anomalia)', () => {
    const started = next(seed(), 'startTask', { taskId: CLEAN_101 }, ctx(MARIA, T0));
    const finished = run(started, 'finishTask', { taskId: CLEAN_101 }, ctx(MARIA, new Date(T0.getTime() + 30_000))).state;
    expect(task(finished, CLEAN_101).durationSeconds).toBe(30);
  });

  it('só se inicia o que está pendente e só se conclui o que está pendente ou em curso', () => {
    const started = next(seed(), 'startTask', { taskId: CLEAN_101 });
    expect(run(started, 'startTask', { taskId: CLEAN_101 }).state).toBe(started);
    const done = next(started, 'finishTask', { taskId: CLEAN_101 });
    expect(run(done, 'finishTask', { taskId: CLEAN_101 }).state).toBe(done);
  });

  it('executor ≠ registador: sozinha na sheet e a registar, a pessoa é a executora', () => {
    const state = run(seed(), 'startTask', { taskId: CLEAN_101 }, ctx(MARIA)).state;
    expect(task(state, CLEAN_101)).toMatchObject({ startedById: 'user-maria', executorIds: ['user-maria'], onBehalfOfTeam: false });
    expect(state.events[0]).toMatchObject({ registeredById: 'user-maria', executorIds: ['user-maria'], onBehalfOfTeam: false, deviceId: 'TEL-AREA-01' });
  });

  it('executor ≠ registador: telemóvel partilhado numa sheet com várias pessoas fica "em nome da equipa" e sem executor', () => {
    const state = run(seed(), 'startTask', { taskId: 'task-601-cleaning' }, ctx(EXTRA)).state;
    expect(task(state, 'task-601-cleaning')).toMatchObject({ startedById: 'user-extra-1', executorIds: [], onBehalfOfTeam: true });
    expect(state.events[0]).toMatchObject({ registeredById: 'user-extra-1', executorIds: [], onBehalfOfTeam: true });
  });

  it('o executor pode ser indicado: quem registou continua a ser quem registou', () => {
    const state = run(seed(), 'startTask', { taskId: 'task-601-cleaning', executorIds: ['user-celia'] }, ctx(EXTRA)).state;
    expect(task(state, 'task-601-cleaning')).toMatchObject({ startedById: 'user-extra-1', executorIds: ['user-celia'], onBehalfOfTeam: true });
  });

  it('concluir mantém o executor registado no início; a supervisão a registar nunca é a executora', () => {
    const started = next(seed(), 'startTask', { taskId: CLEAN_101 }, ctx(MARIA, T0));
    const finished = run(started, 'finishTask', { taskId: CLEAN_101 }, ctx(SUPERVISOR, minutesAfter(30))).state;
    expect(task(finished, CLEAN_101).executorIds).toEqual(['user-maria']);
    expect(finished.events[0]).toMatchObject({ registeredById: 'user-filipa', executorIds: ['user-maria'] });
  });

  it('CT-10/11: DND e recusa são impedimentos: a tarefa não conta como feita nem toca no Opera', () => {
    const before = seed();
    const dnd = next(before, 'recordNotPerformed', { taskId: CLEAN_101, reason: NotPerformedReason.DND });
    const refused = next(dnd, 'recordNotPerformed', { taskId: 'task-102-cleaning', reason: NotPerformedReason.REFUSE_SERVICE });

    expect(task(refused, CLEAN_101)).toMatchObject({ status: TaskStatus.NOT_PERFORMED, notPerformedReason: NotPerformedReason.DND, inspectionStatus: InspectionStatus.NOT_REQUIRED });
    expect(task(refused, 'task-102-cleaning').notPerformedReason).toBe(NotPerformedReason.REFUSE_SERVICE);
    expect(room(refused, 'room-101').operaStatus).toBe(RoomStatus.DIRTY);
    expect(refused.syncJobs).toEqual(before.syncJobs);
    expect(refused.events.slice(0, 2).map(e => e.type)).toEqual(['SERVICE_REFUSED', 'DND_RECORDED']);
  });

  it('um impedimento não se conclui sem recomeçar; recomeçar limpa o motivo', () => {
    const blocked = next(seed(), 'recordNotPerformed', { taskId: CLEAN_101, reason: NotPerformedReason.DND });
    expect(run(blocked, 'finishTask', { taskId: CLEAN_101 }).state).toBe(blocked);

    const restarted = run(blocked, 'startTask', { taskId: CLEAN_101 }).state;
    expect(task(restarted, CLEAN_101)).toMatchObject({ status: TaskStatus.IN_PROGRESS, notPerformedReason: undefined });
  });

  it('CT-07: só se inspeciona uma limpeza concluída; aprovar escreve Inspected no Opera', () => {
    const before = seed();
    expect(run(before, 'inspectTask', { taskId: CLEAN_101 }).state).toBe(before);

    const inspected = run(before, 'inspectTask', { taskId: 'task-203-cleaning' }).state;
    expect(task(inspected, 'task-203-cleaning').inspectionStatus).toBe(InspectionStatus.APPROVED);
    expect(room(inspected, 'room-203').operaStatus).toBe(RoomStatus.INSPECTED);
    expect(inspected.events[0]).toMatchObject({ type: 'INSPECTION_APPROVED', supervisorId: 'user-filipa' });
  });

  it('CT-08: a correção não é um estado do Opera: quarto fica Clean, há alerta com a nota e só volta a inspecionar-se depois de corrigida', () => {
    const before = seed();
    const flagged = next(before, 'requestCorrection', { taskId: 'task-203-cleaning', note: 'Aspirar de novo' });

    expect(task(flagged, 'task-203-cleaning')).toMatchObject({ status: TaskStatus.COMPLETED, inspectionStatus: InspectionStatus.CORRECTION_REQUESTED, inspectionNote: 'Aspirar de novo' });
    expect(room(flagged, 'room-203').operaStatus).toBe(RoomStatus.CLEAN);
    expect(flagged.syncJobs).toEqual(before.syncJobs);
    expect(flagged.alerts[0]).toMatchObject({ type: 'REPROVAL', taskId: 'task-203-cleaning', targetWorkerName: 'Patrícia Gomes' });
    expect(run(flagged, 'inspectTask', { taskId: 'task-203-cleaning' }).state).toBe(flagged);

    const fixed = next(flagged, 'completeCorrection', { taskId: 'task-203-cleaning' }, ctx(MARIA));
    expect(task(fixed, 'task-203-cleaning').inspectionStatus).toBe(InspectionStatus.PENDING);
    expect(fixed.events[0]!.type).toBe('CORRECTION_DONE');
    expect(task(run(fixed, 'inspectTask', { taskId: 'task-203-cleaning' }).state, 'task-203-cleaning').inspectionStatus).toBe(InspectionStatus.APPROVED);
  });

  it('a governanta reabre o quarto: Dirty no Opera, limpeza do dia volta ao início, histórico mantém-se', () => {
    const reopened = run(seed(), 'reopenRoom', { roomId: 'room-302' }).state;

    expect(room(reopened, 'room-302').operaStatus).toBe(RoomStatus.DIRTY);
    expect(task(reopened, 'task-302-cleaning')).toMatchObject({ status: TaskStatus.PENDING, startedAt: undefined, executorIds: [], inspectionStatus: InspectionStatus.PENDING });
    expect(reopened.events[0]).toMatchObject({ type: 'ROOM_REOPENED', taskId: 'task-302-cleaning' });
    expect(reopened.events.some(e => e.type === 'ROOM_FINISHED' && e.roomId === 'room-302')).toBe(true);
    expect(reopened.syncJobs[0]).toMatchObject({ previousStatus: RoomStatus.INSPECTED, targetStatus: RoomStatus.DIRTY });
  });

  it('Refresh é uma tarefa própria: concluir não altera o estado do quarto e a contagem sai dos eventos', () => {
    const before = seed();
    const done = run(before, 'recordRefresh', { roomId: 'room-103' }, ctx(SUPERVISOR)).state;

    expect(task(done, 'task-103-refresh')).toMatchObject({ kind: TaskKind.REFRESH, status: TaskStatus.COMPLETED });
    expect(room(done, 'room-103').operaStatus).toBe(RoomStatus.CLEAN);
    expect(done.syncJobs).toEqual(before.syncJobs);
    expect(done.events.filter(e => e.type === 'REFRESH_RECORDED' && e.roomId === 'room-103')).toHaveLength(2);
  });

  it('Refresh não previsto cria a tarefa na sheet do quarto, sem duplicar a limpeza (§6.5)', () => {
    const state = run(seed(), 'recordRefresh', { roomId: 'room-102' }).state;
    const refresh = state.tasks.find(t => t.roomId === 'room-102' && t.kind === TaskKind.REFRESH);

    expect(refresh).toMatchObject({ sheetId: 'sheet-1', status: TaskStatus.COMPLETED });
    expect(task(state, 'task-102-cleaning').status).toBe(TaskStatus.PENDING);
  });

  it('prioridade: a receção cria com origem RECEPTION, as restantes HOUSEKEEPING; desligar limpa o motivo', () => {
    const byReception = run(seed(), 'togglePriority', { taskId: 'task-102-cleaning', reason: 'Chegada cedo' }, ctx(RECEPTION)).state;
    expect(task(byReception, 'task-102-cleaning')).toMatchObject({ isPriority: true, priorityOrigin: PriorityOrigin.RECEPTION, priorityReason: 'Chegada cedo' });

    const bySupervisor = next(seed(), 'togglePriority', { taskId: 'task-102-cleaning' });
    expect(task(bySupervisor, 'task-102-cleaning').priorityOrigin).toBe(PriorityOrigin.HOUSEKEEPING);

    const off = run(bySupervisor, 'togglePriority', { taskId: 'task-102-cleaning' }).state;
    expect(task(off, 'task-102-cleaning')).toMatchObject({ isPriority: false, priorityOrigin: undefined, priorityReason: undefined });
  });
});

describe('turndown (serviço independente)', () => {
  const TD_101 = 'task-101-turndown';

  it('CT-13/14: o mesmo quarto tem uma tarefa diurna e uma de turndown, cada uma no seu plano e com o seu estado', () => {
    const state = seed();
    const roomTasks = state.tasks.filter(t => t.roomId === 'room-101');

    expect(roomTasks.map(t => t.kind).sort()).toEqual([TaskKind.CLEANING, TaskKind.TURNDOWN]);
    expect(new Set(roomTasks.map(t => t.planId)).size).toBe(2);
  });

  it('concluir o turndown não altera a limpeza do dia, não escreve no Opera e tem evento próprio', () => {
    const before = seed();
    const done = run(before, 'finishTask', { taskId: TD_101 }, ctx(SUPERVISOR)).state;

    expect(task(done, TD_101).status).toBe(TaskStatus.COMPLETED);
    expect(task(done, CLEAN_101)).toEqual(task(before, CLEAN_101));
    expect(room(done, 'room-101').operaStatus).toBe(room(before, 'room-101').operaStatus);
    expect(done.syncJobs).toEqual(before.syncJobs);
    expect(done.events[0]).toMatchObject({ type: 'TURNDOWN_UPDATED', taskId: TD_101 });
    expect(task(done, TD_101).inspectionStatus).toBe(InspectionStatus.NOT_REQUIRED);
  });

  it('reabrir uma tarefa de turndown volta a "por iniciar" sem tocar no Opera nem na limpeza do dia', () => {
    const done = next(seed(), 'finishTask', { taskId: TD_101 });
    const reopened = run(done, 'reopenTask', { taskId: TD_101 }).state;

    expect(task(reopened, TD_101)).toMatchObject({ status: TaskStatus.PENDING, finishedAt: undefined });
    expect(reopened.syncJobs).toEqual(done.syncJobs);
    expect(task(reopened, CLEAN_101)).toEqual(task(done, CLEAN_101));
  });

  it('o plano da noite tem 14 sheets, cada uma com pessoas e tarefas de turndown', () => {
    const state = seed();
    const night = state.sheets.filter(sheet => sheet.planId === 'plan-night');

    expect(night).toHaveLength(14);
    expect(new Set(night.map(sheet => sheet.number)).size).toBe(14);
    night.forEach(sheet => {
      expect(sheet.assignments.length).toBeGreaterThan(0);
      expect(state.tasks.some(t => t.sheetId === sheet.id && t.kind === TaskKind.TURNDOWN)).toBe(true);
    });
  });

  it('DND, NQ e AC são toggles: trocam de motivo, nunca contam como feito e desligam-se reabrindo', () => {
    const dnd = next(seed(), 'recordNotPerformed', { taskId: TD_101, reason: NotPerformedReason.DND });
    const ac = next(dnd, 'recordNotPerformed', { taskId: TD_101, reason: NotPerformedReason.ALREADY_DONE });
    const off = next(ac, 'reopenTask', { taskId: TD_101 });

    expect(task(dnd, TD_101)).toMatchObject({ status: TaskStatus.NOT_PERFORMED, notPerformedReason: NotPerformedReason.DND });
    expect(task(ac, TD_101)).toMatchObject({ status: TaskStatus.NOT_PERFORMED, notPerformedReason: NotPerformedReason.ALREADY_DONE });
    expect(ac.syncJobs).toEqual(dnd.syncJobs);
    expect(task(off, TD_101)).toMatchObject({ status: TaskStatus.PENDING, notPerformedReason: undefined });
    expect(run(ac, 'recordNotPerformed', { taskId: TD_101, reason: NotPerformedReason.ALREADY_DONE }).state).toBe(ac);
  });

  it('editar uma sheet muda o nome e o bloco só dessa sheet, sem tocar na secção base', () => {
    const before = seed();
    const edited = next(before, 'updateSheet', { sheetId: 'sheet-1', title: '  Secção 01 · Piso A  ', block: 'Bloco B' });

    expect(edited.sheets.find(s => s.id === 'sheet-1')).toMatchObject({ title: 'Secção 01 · Piso A', block: 'Bloco B' });
    expect(edited.sheets.filter(s => s.id !== 'sheet-1')).toEqual(before.sheets.filter(s => s.id !== 'sheet-1'));
    expect(edited.sections).toEqual(before.sections);
    expect(run(edited, 'updateSheet', { sheetId: 'sheet-1', title: 'Secção 01 · Piso A', block: 'Bloco B' }).state).toBe(edited);
  });

  it('arrastar para fora tira a pessoa do bloco (fica no pool de apoio) sem mexer nas task sheets', () => {
    const before = seed();
    const removed = run(before, 'removeStaffFromBlock', { staffId: 'user-maria' });

    expect(removed.state.staff.find(u => u.id === 'user-maria')?.assignedArea).toBe('Apoio & Rotativas');
    expect(removed.state.sheets).toEqual(before.sheets);
    expect(removed.state.events[0]).toMatchObject({ type: 'STAFF_MOVED', roomNumber: before.staff.find(u => u.id === 'user-maria')?.name });
    expect(removed.toast).toMatchObject({ key: 'toasts.staffRemoved' });
    // - no pool de apoio não há bloco de onde sair: a segunda vez passa a Fora de serviço, e a terceira não faz nada
    const off = run(removed.state, 'removeStaffFromBlock', { staffId: 'user-maria' });
    expect(off.state.staff.find(u => u.id === 'user-maria')).toMatchObject({ assignedArea: 'Apoio & Rotativas', isOnDuty: false });
    expect(off.toast).toMatchObject({ key: 'toasts.staffOffDuty' });
    expect(run(off.state, 'removeStaffFromBlock', { staffId: 'user-maria' }).state).toBe(off.state);
  });

  it('arrastar um nome para outra sheet move a pessoa de grupo (e só dentro do mesmo plano)', () => {
    const before = seed();
    const moved = next(before, 'moveStaffToSheet', { staffId: 'user-maria', fromSheetId: 'sheet-1', toSheetId: 'sheet-4' });
    const staffOf = (state: typeof before, id: string) => state.sheets.find(s => s.id === id)?.assignments.map(a => a.staffId);

    expect(staffOf(moved, 'sheet-1')).toEqual([]);
    expect(staffOf(moved, 'sheet-4')).toEqual(['user-sandra', 'user-maria']);
    // - sem origem só acrescenta; e não duplica
    expect(run(moved, 'moveStaffToSheet', { staffId: 'user-maria', toSheetId: 'sheet-4' }).state).toBe(moved);
    // - manhã e noite são distribuições independentes
    expect(run(before, 'moveStaffToSheet', { staffId: 'user-maria', fromSheetId: 'sheet-1', toSheetId: 'td-1' }).state).toBe(before);
    // - a responsável que sai passa o papel à primeira que fica
    const lead = next(before, 'moveStaffToSheet', { staffId: 'user-extra-1', fromSheetId: 'sheet-3', toSheetId: 'sheet-4' });
    expect(lead.sheets.find(s => s.id === 'sheet-3')?.assignments).toEqual([{ staffId: 'user-celia', role: 'LEAD' }]);
  });

  it('uma sheet com gente tem sempre uma responsável: ao desmarcar a LEAD ou eliminar a pessoa, passa à primeira que fica', () => {
    const before = seed();
    const unchecked = next(before, 'assignStaffToSheet', { sheetId: 'sheet-3', assignments: [{ staffId: 'user-celia', role: SheetRole.MEMBER }] });
    expect(unchecked.sheets.find(s => s.id === 'sheet-3')?.assignments).toEqual([{ staffId: 'user-celia', role: 'LEAD' }]);
    const deleted = next(before, 'deleteStaff', { userId: 'user-extra-1' });
    expect(deleted.sheets.find(s => s.id === 'sheet-3')?.assignments).toEqual([{ staffId: 'user-celia', role: 'LEAD' }]);
  });

  it('seed coerente: uma LEAD por sheet com gente, só pessoas em serviço, ordem contínua e sem tarefas repetidas por quarto', () => {
    const state = seed();
    state.sheets.forEach(sheet => {
      if (sheet.assignments.length > 0) expect(sheet.assignments.filter(a => a.role === 'LEAD'), sheet.title).toHaveLength(1);
      sheet.assignments.forEach(a => expect(state.staff.find(u => u.id === a.staffId)?.isOnDuty, sheet.title).not.toBe(false));
      const order = state.tasks.filter(t => t.sheetId === sheet.id).map(t => t.orderIndex).sort((x, y) => x - y);
      expect(order, sheet.title).toEqual(order.map((_, i) => i));
    });
    const keys = state.tasks.map(t => `${t.planId}:${t.roomId}:${t.kind}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('auditoria: mudanças de equipa, de sheet e de escala ficam registadas com metadata', () => {
    const before = seed();
    const moved = next(before, 'moveStaffToSheet', { staffId: 'user-maria', fromSheetId: 'sheet-1', toSheetId: 'sheet-4' });
    expect(moved.events[0]).toMatchObject({ type: 'STAFF_SHEET_CHANGED', metadata: { staffId: 'user-maria', action: 'moved', fromSheetId: 'sheet-1', toSheetId: 'sheet-4' } });

    const assigned = next(before, 'assignStaffToSheet', { sheetId: 'sheet-8', assignments: [{ staffId: 'user-ana', role: SheetRole.LEAD }] });
    expect(assigned.events[0]).toMatchObject({ type: 'STAFF_SHEET_CHANGED', metadata: { staffId: 'user-ana', action: 'added' } });

    const edited = next(before, 'updateSheet', { sheetId: 'sheet-1', title: 'Nova', block: 'Bloco B' });
    expect(edited.events[0]).toMatchObject({ type: 'SHEET_UPDATED', metadata: { sheetId: 'sheet-1', after: { title: 'Nova', block: 'Bloco B' } } });

    const maria = before.staff.find(u => u.id === 'user-maria')!;
    const off = next(before, 'updateStaff', { user: { ...maria, isOnDuty: false } });
    expect(off.events[0]).toMatchObject({ type: 'STAFF_DUTY_CHANGED', metadata: { staffId: 'user-maria', from: true, to: false } });
  });

  it('apagar uma equipa devolve as pessoas ao pool de apoio', () => {
    const before = seed();
    const team = before.blockTeams.find(t => t.block === 'Bloco C')!;
    const after = next(before, 'deleteBlockTeam', { teamId: team.id });
    expect(after.blockTeams.some(t => t.id === team.id)).toBe(false);
    expect(after.staff.filter(u => u.assignedArea === 'Bloco C')).toEqual([]);
    expect(after.staff.find(u => u.id === 'user-maria')?.assignedArea).toBe('Apoio & Rotativas');
  });

  it('a limpeza do dia não se reabre por aqui (é reopenRoom, que escreve Dirty no Opera)', () => {
    const before = seed();
    expect(run(before, 'reopenTask', { taskId: CLEAN_101 }).state).toBe(before);
  });

  it('uma colaboradora pode ter uma sheet de dia e outra de noite ao mesmo tempo (CT-14)', () => {
    const celia = seed().sheets.filter(sheet => sheet.assignments.some(a => a.staffId === 'user-celia'));
    expect(celia.map(sheet => sheet.planId).sort()).toEqual(['plan-day', 'plan-night']);
  });

  it('não se mistura trabalho entre planos: mover uma tarefa de dia para uma sheet de noite não faz nada', () => {
    const before = seed();
    expect(run(before, 'moveTask', { taskId: CLEAN_101, targetSheetId: 'td-2' }).state).toBe(before);
  });

  it('mover uma tarefa de turndown entre zonas não mexe nas task sheets do dia', () => {
    const before = seed();
    const moved = run(before, 'moveTask', { taskId: TD_101, targetSheetId: 'td-3' }).state;

    expect(task(moved, TD_101).sheetId).toBe('td-3');
    expect(moved.tasks.filter(t => t.planId === 'plan-day')).toEqual(before.tasks.filter(t => t.planId === 'plan-day'));
  });
});

describe('distribuição (task sheets)', () => {
  it('CT-02: mover uma tarefa atualiza as duas sheets, reordena e não perde nada', () => {
    const before = seed();
    const result = run(before, 'moveTask', { taskId: CLEAN_101, targetSheetId: 'sheet-8' });
    const onSheet = (id: string) => result.state.tasks.filter(t => t.sheetId === id).sort((a, b) => a.orderIndex - b.orderIndex);

    expect(onSheet('sheet-1').map(t => [t.id, t.orderIndex])).toEqual([['task-102-cleaning', 0], ['task-103-refresh', 1]]);
    expect(onSheet('sheet-8').map(t => t.id)).toEqual([CLEAN_101]);
    expect(result.state.tasks).toHaveLength(before.tasks.length);
    expect(result.toast).toMatchObject({ key: 'toasts.roomMoved', params: { number: '101' } });
    expect(result.state.events[0]).toMatchObject({ type: 'MOVED_TASK_SHEET', metadata: { fromSheetId: 'sheet-1', toSheetId: 'sheet-8' } });
  });

  it('largar numa posição insere nessa posição', () => {
    const result = run(seed(), 'moveTask', { taskId: 'task-103-refresh', targetSheetId: 'sheet-1', targetIndex: 0 }).state;
    const order = result.tasks.filter(t => t.sheetId === 'sheet-1').sort((a, b) => a.orderIndex - b.orderIndex).map(t => t.id);
    expect(order).toEqual(['task-103-refresh', CLEAN_101, 'task-102-cleaning']);
  });

  it('uma tarefa já iniciada pode mudar de equipa e mantém o seu estado (decisão provisória §6.5)', () => {
    const started = next(seed(), 'startTask', { taskId: CLEAN_101 });
    const moved = run(started, 'moveTask', { taskId: CLEAN_101, targetSheetId: 'sheet-8' }).state;
    expect(task(moved, CLEAN_101)).toMatchObject({ sheetId: 'sheet-8', status: TaskStatus.IN_PROGRESS });
  });

  it('CT-15: uma sheet esvaziada continua a existir (área de reserva)', () => {
    let state = seed();
    for (const taskId of ['task-101-cleaning', 'task-102-cleaning', 'task-103-refresh']) {
      state = next(state, 'moveTask', { taskId, targetSheetId: 'sheet-26' });
    }
    expect(state.tasks.filter(t => t.sheetId === 'sheet-1')).toEqual([]);
    expect(state.sheets.find(s => s.id === 'sheet-1')).toBeDefined();
    expect(state.sheets).toHaveLength(seed().sheets.length);
  });

  it('CT-04: várias pessoas na mesma task sheet', () => {
    const state = run(seed(), 'assignStaffToSheet', { sheetId: 'sheet-8', assignments: [{ staffId: 'user-ana', role: 'LEAD' as never }, { staffId: 'user-maria', role: 'MEMBER' as never }] }).state;
    expect(state.sheets.find(s => s.id === 'sheet-8')?.assignments.map(a => a.staffId)).toEqual(['user-ana', 'user-maria']);
  });

  it('comandos sobre tarefas ou sheets inexistentes não fazem nada', () => {
    const before = seed();
    expect(run(before, 'startTask', { taskId: 'nao-existe' }).state).toBe(before);
    expect(run(before, 'moveTask', { taskId: CLEAN_101, targetSheetId: 'nao-existe' }).state).toBe(before);
  });
});

describe('abrir o serviço (CT-01)', () => {
  const DAY = '2099-03-01';

  it('cria sheets a partir das secções e tarefas só para quartos com trabalho, sem alterar a configuração base', () => {
    const before = seed();
    const result = run(before, 'openPlan', { kind: PlanKind.DAY, date: DAY });
    const plan = result.state.plans.find(p => p.operationalDate === DAY && p.kind === PlanKind.DAY);
    const sheets = result.state.sheets.filter(s => s.planId === plan?.id);
    const tasks = result.state.tasks.filter(t => t.planId === plan?.id);

    expect(sheets.filter(s => !s.isReserve)).toHaveLength(before.sections.filter(sec => sec.kind === PlanKind.DAY).length);
    expect(sheets.filter(s => s.isReserve)).toHaveLength(2);
    expect(tasks.every(t => t.kind === TaskKind.CLEANING)).toBe(true);
    expect(tasks.some(t => t.movement === Movement.VACANT)).toBe(false);
    expect(tasks.find(t => t.roomId === 'room-101')?.sheetId).toBe(sheets.find(s => s.sectionId === 'sec-1')?.id);
    expect(sheets.find(s => s.sectionId === 'sec-1')?.assignments.map(a => a.staffId)).toEqual(['user-maria']);
    expect(result.state.sections).toEqual(before.sections);
    expect(result.toast).toMatchObject({ key: 'toasts.planOpened' });
  });

  it('o turndown abre a partir das secções base de turndown (default editável), só com quem está de serviço', () => {
    const before = seed();
    const nightSections = before.sections.filter(sec => sec.kind === PlanKind.NIGHT);
    expect(nightSections).toHaveLength(14);

    // - uma secção nova de turndown com um quarto ocupado esta noite e uma pessoa fora de serviço
    const configured = next(before, 'addSection', { section: { name: 'Turndown Zona 15', kind: PlanKind.NIGHT, block: 'Bloco A', defaultRoomIds: ['room-101'], defaultStaffIds: ['user-extra-2', 'user-maria'] } });
    const result = run(configured, 'openPlan', { kind: PlanKind.NIGHT, date: DAY }).state;
    const night = result.plans.find(p => p.operationalDate === DAY && p.kind === PlanKind.NIGHT);
    const sheets = result.sheets.filter(sh => sh.planId === night?.id);
    const added = sheets.find(sh => sh.title === 'Turndown Zona 15');

    expect(sheets).toHaveLength(15);
    expect(added?.number).toBe(115);
    expect(added?.assignments).toEqual([{ staffId: 'user-maria', role: 'LEAD' }]);
    // - quartos e equipa vêm da configuração, não de uma divisão automática
    expect(result.tasks.filter(t => t.sheetId === added?.id).map(t => t.roomId).length).toBeLessThanOrEqual(1);
    expect(result.sections).toEqual(configured.sections);
  });

  it('mover um quarto entre secções de manhã não mexe nas secções de turndown', () => {
    const before = seed();
    const moved = next(before, 'moveRoomToSection', { roomId: 'room-101', targetSectionId: 'sec-3' });
    const night = (state: typeof before) => state.sections.filter(sec => sec.kind === PlanKind.NIGHT);
    expect(night(moved)).toEqual(night(before));
    expect(moved.sections.find(sec => sec.id === 'sec-3')?.defaultRoomIds).toContain('room-101');
  });

  it('só atribui por defeito quem está de serviço', () => {
    const base = seed();
    const offDuty = deepFreeze({ ...base, staff: base.staff.map(u => (u.id === 'user-maria' ? { ...u, isOnDuty: false } : u)) });
    const state = run(offDuty, 'openPlan', { kind: PlanKind.DAY, date: DAY }).state;
    expect(state.sheets.find(s => s.sectionId === 'sec-1' && s.planId !== 'plan-day')?.assignments).toEqual([]);
  });

  it('abrir um dia já aberto não faz nada', () => {
    const opened = next(seed(), 'openPlan', { kind: PlanKind.DAY, date: DAY });
    expect(run(opened, 'openPlan', { kind: PlanKind.DAY, date: DAY }).state).toBe(opened);
  });

  it('o turndown abre-se à parte, só para quartos ocupados, sem tocar no plano diurno', () => {
    const before = seed();
    const state = run(before, 'openPlan', { kind: PlanKind.NIGHT, date: DAY }).state;
    const night = state.plans.find(p => p.operationalDate === DAY && p.kind === PlanKind.NIGHT);
    const tasks = state.tasks.filter(t => t.planId === night?.id);

    expect(state.sheets.filter(s => s.planId === night?.id)).toHaveLength(14);
    expect(tasks.every(t => t.kind === TaskKind.TURNDOWN)).toBe(true);
    expect(tasks.some(t => t.roomId === 'room-104')).toBe(false);
    expect(state.tasks.filter(t => t.planId === 'plan-day')).toEqual(before.tasks.filter(t => t.planId === 'plan-day'));
  });
});

describe('Opera: estado do quarto vs execução', () => {
  it('CT-18: nenhum comando altera bloqueios comerciais (OOS/OOO são do Opera)', () => {
    const base = seed();
    const blocked = deepFreeze({ ...base, rooms: base.rooms.map(r => (r.id === 'room-101' ? { ...r, commercialBlock: CommercialBlock.OOO } : r)) });
    let state = next(blocked, 'startTask', { taskId: CLEAN_101 });
    state = next(state, 'finishTask', { taskId: CLEAN_101 });
    state = next(state, 'inspectTask', { taskId: CLEAN_101 });
    state = next(state, 'reopenRoom', { roomId: 'room-101' });

    expect(room(state, 'room-101').commercialBlock).toBe(CommercialBlock.OOO);
  });

  it('CT-20: uma alteração feita no Opera reflete-se na app sem reverter o que a app tinha guardado', () => {
    const before = seed();
    const pulled = run(before, 'receiveOperaStatus', { roomId: 'room-302', status: RoomStatus.DIRTY, observedAt: todayAt('09:30') }).state;

    expect(room(pulled, 'room-302').operaStatus).toBe(RoomStatus.DIRTY);
    expect(task(pulled, 'task-302-cleaning')).toEqual(task(before, 'task-302-cleaning'));
    expect(pulled.syncJobs[0]).toMatchObject({ direction: 'OPERA_TO_APP', previousStatus: RoomStatus.INSPECTED, targetStatus: RoomStatus.DIRTY });
    expect(pulled.events[0]!.type).toBe('OPERA_SYNC_PULL');
  });

  it('uma notificação do Opera mais antiga do que o estado atual é ignorada', () => {
    const before = seed();
    expect(run(before, 'receiveOperaStatus', { roomId: 'room-302', status: RoomStatus.DIRTY, observedAt: todayAt('07:00') }).state).toBe(before);
  });

  it('CT-20: uma escrita antiga nunca sobrescreve um estado mais recente do Opera: fica em conflito', () => {
    const afterOperaChange = next(seed(), 'receiveOperaStatus', { roomId: 'room-101', status: RoomStatus.INSPECTED, observedAt: todayAt('09:00') });
    const started = next(afterOperaChange, 'startTask', { taskId: CLEAN_101 });
    const stale = run(started, 'finishTask', { taskId: CLEAN_101, occurredAt: todayAt('08:30') }, ctx(MARIA, minutesAfter(5))).state;

    expect(room(stale, 'room-101').operaStatus).toBe(RoomStatus.INSPECTED);
    expect(task(stale, CLEAN_101).status).toBe(TaskStatus.COMPLETED);
    expect(stale.syncJobs[0]).toMatchObject({ state: SyncState.CONFLICT, targetStatus: RoomStatus.CLEAN, lastError: { key: 'opera.errors.newerStatus' } });
    expect(stale.events[0]!.type).toBe('OPERA_CONFLICT_DETECTED');
  });

  it('um conflito só se resolve se uma pessoa mandar reenviar (aplica o estado e conta a tentativa)', () => {
    const afterOperaChange = next(seed(), 'receiveOperaStatus', { roomId: 'room-101', status: RoomStatus.INSPECTED, observedAt: todayAt('09:00') });
    const stale = next(afterOperaChange, 'finishTask', { taskId: CLEAN_101, occurredAt: todayAt('08:30') });
    const conflictJob = stale.syncJobs[0]!;

    const retried = run(stale, 'retryOperaJob', { jobId: conflictJob.id }, ctx(SUPERVISOR, minutesAfter(10))).state;
    expect(room(retried, 'room-101').operaStatus).toBe(RoomStatus.CLEAN);
    expect(retried.syncJobs[0]).toMatchObject({ state: SyncState.CONFIRMED, attempts: 2, lastError: undefined });
    expect(run(retried, 'retryOperaJob', { jobId: conflictJob.id }).state).toBe(retried);
  });

  it('repetir a mesma escrita (fila offline reenviada) não duplica jobs', () => {
    const state = seed();
    const target = room(state, 'room-101');
    const input = { room: target, target: RoomStatus.CLEAN, occurredAt: todayAt('09:45'), source: { key: 'opera.source.cleanFinished' } };
    const once = writeOperaStatus(state, ctx(), input);
    const twice = writeOperaStatus(once, ctx(), input);

    expect(once.syncJobs).toHaveLength(state.syncJobs.length + 1);
    expect(twice).toBe(once);
  });

  it('night audit: Inspected volta a Clean e ganha um refresh; o no-show passa a Dirty e a limpeza recomeça', () => {
    let state = next(seed(), 'startTask', { taskId: 'task-201-cleaning' });
    state = next(state, 'finishTask', { taskId: 'task-201-cleaning' });
    const audited = run(state, 'triggerNightAudit', undefined, ctx(SUPERVISOR, minutesAfter(60))).state;

    expect(room(audited, 'room-302').operaStatus).toBe(RoomStatus.CLEAN);
    expect(audited.tasks.find(t => t.roomId === 'room-302' && t.kind === TaskKind.REFRESH)).toMatchObject({ status: TaskStatus.PENDING, sheetId: 'sheet-6' });
    expect(room(audited, 'room-201').operaStatus).toBe(RoomStatus.DIRTY);
    expect(task(audited, 'task-201-cleaning').status).toBe(TaskStatus.PENDING);
    expect(audited.events[0]).toMatchObject({ type: 'NIGHT_AUDIT_TRIGGERED', detail: { params: { clean: 1, dirty: 1 } } });
    expect(audited.syncJobs.filter(job => job.direction === 'OPERA_TO_APP').length).toBeGreaterThanOrEqual(2);
  });

  it('sincronização manual só acrescenta um job', () => {
    const before = seed();
    const synced = run(before, 'syncWithOpera', undefined).state;
    expect(synced.rooms).toBe(before.rooms);
    expect(synced.syncJobs).toHaveLength(before.syncJobs.length + 1);
    expect(synced.syncJobs[0]!.roomId).toBeNull();
  });
});

describe('pessoal, equipas e secções', () => {
  it('mover uma pessoa de bloco atualiza a área e regista STAFF_MOVED', () => {
    const result = run(seed(), 'moveStaffToBlock', { staffId: 'user-maria', targetBlock: 'Bloco B' });
    expect(result.state.staff.find(u => u.id === 'user-maria')?.assignedArea).toBe('Bloco B');
    expect(result.state.events[0]).toMatchObject({ type: 'STAFF_MOVED' });
    expect(result.toast).toMatchObject({ key: 'toasts.staffMoved' });
  });

  it('CT-05: criar uma colaboradora extra; eliminar uma pessoa retira-a das sheets e das secções', () => {
    const created = run(seed(), 'addStaff', { user: { name: 'Extra #3', email: 'extra3@x.pt', role: 'housekeeper' as never, isExtra: true } }).state;
    expect(created.staff.at(-1)).toMatchObject({ name: 'Extra #3', isExtra: true });

    const removed = run(seed(), 'deleteStaff', { userId: 'user-maria' }).state;
    expect(removed.staff.some(u => u.id === 'user-maria')).toBe(false);
    expect(removed.sheets.find(s => s.id === 'sheet-1')?.assignments).toEqual([]);
    expect(removed.sections.find(s => s.id === 'sec-1')?.defaultStaffIds).toEqual([]);
  });

  it('repor a configuração base devolve as pessoas ao bloco por defeito', () => {
    const moved = next(seed(), 'moveStaffToBlock', { staffId: 'user-maria', targetBlock: 'Bloco B' });
    expect(run(moved, 'restoreDailyToDefaultBaseline', undefined).state.staff.find(u => u.id === 'user-maria')?.assignedArea).toBe('Bloco C');
  });

  it('mudar o quarto de secção por defeito não altera um plano já aberto (estrutural ≠ diário)', () => {
    const before = seed();
    const result = run(before, 'moveRoomToSection', { roomId: 'room-101', targetSectionId: 'sec-8' }).state;

    expect(result.sections.find(s => s.id === 'sec-1')?.defaultRoomIds).not.toContain('room-101');
    expect(result.sections.find(s => s.id === 'sec-8')?.defaultRoomIds).toEqual(['room-101']);
    expect(result.tasks).toEqual(before.tasks);
    expect(result.sheets).toEqual(before.sheets);
  });
});

describe('edição manual pela governanta/admin', () => {
  it('reverte um quarto Inspected para Clean: a limpeza volta a esperar inspeção e o Opera é atualizado', () => {
    const reverted = run(seed(), 'setRoomStatus', { roomId: 'room-302', status: RoomStatus.CLEAN }).state;

    expect(room(reverted, 'room-302').operaStatus).toBe(RoomStatus.CLEAN);
    expect(task(reverted, 'task-302-cleaning')).toMatchObject({ status: TaskStatus.COMPLETED, inspectionStatus: InspectionStatus.PENDING });
    expect(reverted.syncJobs[0]).toMatchObject({ previousStatus: RoomStatus.INSPECTED, targetStatus: RoomStatus.CLEAN });
    expect(reverted.events[0]).toMatchObject({ type: 'ROOM_STATUS_CHANGED', roomId: 'room-302' });
  });

  it('passar a Inspected aprova a limpeza; passar a Dirty reabre-a; o mesmo estado não faz nada', () => {
    const inspected = run(seed(), 'setRoomStatus', { roomId: 'room-203', status: RoomStatus.INSPECTED }).state;
    expect(task(inspected, 'task-203-cleaning').inspectionStatus).toBe(InspectionStatus.APPROVED);

    const dirty = run(seed(), 'setRoomStatus', { roomId: 'room-302', status: RoomStatus.DIRTY }).state;
    expect(task(dirty, 'task-302-cleaning').status).toBe(TaskStatus.PENDING);
    expect(dirty.events[0]!.type).toBe('ROOM_REOPENED');

    const before = seed();
    expect(run(before, 'setRoomStatus', { roomId: 'room-302', status: RoomStatus.INSPECTED }).state).toBe(before);
  });

  it('edita as instruções do quarto e regista no histórico; texto igual não faz nada', () => {
    const edited = run(seed(), 'updateRoomInstructions', { roomId: 'room-102', instructions: '  Limpar só depois das 11:00  ' }).state;
    expect(edited.stays.find(s => s.roomId === 'room-102')?.instructions).toBe('Limpar só depois das 11:00');
    expect(edited.events[0]).toMatchObject({ type: 'ROOM_INSTRUCTIONS_UPDATED', roomId: 'room-102' });

    const before = seed();
    const same = before.stays.find(s => s.roomId === 'room-102')!.instructions!;
    expect(run(before, 'updateRoomInstructions', { roomId: 'room-102', instructions: same }).state).toBe(before);
  });
});

describe('alertas', () => {
  it('confirmar a receção de um alerta marca-o como lido com a hora', () => {
    const acked = run(seed(), 'acknowledgeAlert', { alertId: 'alt-init-1' }).state;
    expect(acked.alerts[0]).toMatchObject({ acknowledged: true, acknowledgedAt: T0.toISOString() });
  });

  it('enviar um trace cria um alerta para o bloco do quarto', () => {
    const sent = run(seed(), 'sendTraceAlert', { roomId: 'room-501', message: 'Berço extra' }).state;
    expect(sent.alerts[0]).toMatchObject({ type: 'RECEPTION_TRACE', roomNumber: '501', targetArea: 'Oasis Parc' });
  });
});

describe('tirar uma pessoa de uma sheet (zona de apagar)', () => {
  it('sai da sheet, passa a Apoio (continua de serviço) e fica na auditoria; a responsável passa à seguinte', () => {
    const before = seedState();
    const done = run(deepFreeze(before), 'removeStaffFromSheet', { staffId: 'user-extra-1', sheetId: 'sheet-3' }).state;

    expect(done.sheets.find(s => s.id === 'sheet-3')?.assignments).toEqual([{ staffId: 'user-celia', role: 'LEAD' }]);
    const person = done.staff.find(u => u.id === 'user-extra-1');
    expect(person?.assignedArea).toBe('Apoio & Rotativas');
    expect(person?.isOnDuty).not.toBe(false);
    expect(done.events[0]).toMatchObject({ type: 'STAFF_SHEET_CHANGED', metadata: { staffId: 'user-extra-1', action: 'removed' } });
    // - quem estava num bloco regista também a mudança para Apoio
    const fromBlock = run(deepFreeze(before), 'removeStaffFromSheet', { staffId: 'user-sandra', sheetId: 'sheet-4' }).state;
    expect(fromBlock.staff.find(u => u.id === 'user-sandra')?.assignedArea).toBe('Apoio & Rotativas');
    expect(fromBlock.events.map(e => e.type).slice(0, 2)).toEqual(['STAFF_SHEET_CHANGED', 'STAFF_MOVED']);
    // - quem não está nessa sheet não muda nada
    const none = deepFreeze(before);
    expect(run(none, 'removeStaffFromSheet', { staffId: 'user-maria', sheetId: 'sheet-3' }).state).toBe(none);
  });
});
