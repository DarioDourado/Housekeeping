import { describe, expect, it } from 'vitest';
import { buildColumns, buildTaskViews, selectActivePlan } from '@/lib/taskViews';
import { seedState } from '@/services/local-api/store';
import { PlanKind, PlanStatus, SheetRole } from '@/types/housekeeping.types';

const state = seedState();
const dayPlan = selectActivePlan(state.plans, PlanKind.DAY);
const dayViews = buildTaskViews({ ...state, tasks: state.tasks.filter(t => t.planId === dayPlan?.id) });
const columns = buildColumns(dayPlan, dayViews, state.sheets, state.staff);

describe('buildTaskViews', () => {
  it('junta cada tarefa com o quarto, a reserva do dia da sua distribuição e a sheet', () => {
    const view = dayViews.find(v => v.task.id === 'task-101-cleaning');
    expect(view?.room.number).toBe('101');
    expect(view?.stay?.guestName).toBe('Dr. Klaus Schmidt');
    expect(view?.sheet.id).toBe('sheet-1');
  });

  it('a contagem de refreshes sai do histórico de eventos', () => {
    expect(dayViews.find(v => v.task.id === 'task-103-refresh')?.refreshCount).toBe(1);
    expect(dayViews.find(v => v.task.id === 'task-502-refresh')?.refreshCount).toBe(2);
    expect(dayViews.find(v => v.task.id === 'task-101-cleaning')?.refreshCount).toBe(0);
  });

  it('resolve os executores a partir do pessoal e ignora ids desconhecidos', () => {
    expect(dayViews.find(v => v.task.id === 'task-203-cleaning')?.executors.map(u => u.name)).toEqual(['Patrícia Gomes']);
    const ghost = buildTaskViews({ ...state, tasks: [{ ...state.tasks[0]!, executorIds: ['ninguem'] }] });
    expect(ghost[0]!.executors).toEqual([]);
  });

  it('distingue quem registou o início de quem executou', () => {
    const view = buildTaskViews({ ...state, tasks: [{ ...state.tasks[0]!, startedById: 'user-filipa', executorIds: [] }] })[0]!;
    expect(view.startedBy?.name).toBe('Filipa Mendes');
    expect(view.executors).toEqual([]);
  });

  it('descarta tarefas cujo quarto ou sheet já não existem', () => {
    const orphan = { ...state.tasks[0]!, roomId: 'nao-existe' };
    expect(buildTaskViews({ ...state, tasks: [orphan] })).toEqual([]);
  });
});

describe('buildColumns', () => {
  it('uma coluna por sheet do plano, ordenadas por número, incluindo as vazias e as de reserva', () => {
    expect(columns.map(c => c.sheet.number)).toEqual([1, 3, 4, 6, 7, 8, 9, 21, 22]);
    expect(columns.find(c => c.sheet.id === 'sheet-8')?.views).toEqual([]);
    expect(columns.find(c => c.sheet.id === 'sheet-21')?.sheet.isReserve).toBe(true);
  });

  it('dentro da coluna, as tarefas prioritárias vêm primeiro e depois a ordem escolhida', () => {
    const villas = columns.find(c => c.sheet.id === 'sheet-3');
    expect(villas?.views.map(v => v.task.id)).toEqual(['task-602-cleaning', 'task-601-cleaning']);
    expect(columns.find(c => c.sheet.id === 'sheet-1')?.views.map(v => v.task.id)).toEqual(['task-101-cleaning', 'task-102-cleaning', 'task-103-refresh']);
  });

  it('resolve as pessoas atribuídas com o seu papel', () => {
    const villas = columns.find(c => c.sheet.id === 'sheet-3');
    expect(villas?.assignees.map(a => [a.user.id, a.role])).toEqual([['user-extra-1', SheetRole.LEAD], ['user-celia', SheetRole.MEMBER]]);
  });

  it('sem plano não há colunas', () => {
    expect(buildColumns(undefined, dayViews, state.sheets, state.staff)).toEqual([]);
  });
});

describe('selectActivePlan', () => {
  it('escolhe o plano ativo do dia operacional mais recente e ignora os fechados', () => {
    const plans = [
      { id: 'a', operationalDate: '2026-01-01', kind: PlanKind.DAY, status: PlanStatus.ACTIVE },
      { id: 'b', operationalDate: '2026-01-02', kind: PlanKind.DAY, status: PlanStatus.CLOSED },
      { id: 'c', operationalDate: '2026-01-03', kind: PlanKind.DAY, status: PlanStatus.ACTIVE },
      { id: 'd', operationalDate: '2026-01-04', kind: PlanKind.NIGHT, status: PlanStatus.ACTIVE }
    ];
    expect(selectActivePlan(plans, PlanKind.DAY)?.id).toBe('c');
    expect(selectActivePlan([], PlanKind.DAY)).toBeUndefined();
  });
});
