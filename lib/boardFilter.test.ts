import { describe, expect, it } from 'vitest';
import { filterColumnViews } from '@/lib/boardFilter';
import { buildColumns, buildTaskViews, selectActivePlan } from '@/lib/taskViews';
import { seedState } from '@/services/local-api/store';
import { Movement, PlanKind } from '@/types/housekeeping.types';

const state = seedState();
const dayPlan = selectActivePlan(state.plans, PlanKind.DAY);
const columns = buildColumns(dayPlan, buildTaskViews({ ...state, tasks: state.tasks.filter(t => t.planId === dayPlan?.id) }), state.sheets, state.staff);
const sheet1 = columns.find(c => c.sheet.id === 'sheet-1')!;
const ids = (movement: Parameters<typeof filterColumnViews>[1], query = '') => filterColumnViews(sheet1, movement, query).map(v => v.task.id);

describe('filterColumnViews', () => {
  it('sem filtros devolve todos os cartões', () => {
    expect(ids('ALL')).toEqual(sheet1.views.map(v => v.task.id));
  });

  it('filtra pelo tipo de movimento', () => {
    expect(ids(Movement.DEPARTURE_ARRIVAL)).toEqual(['task-101-cleaning']);
    expect(ids(Movement.STAYOVER)).toEqual(['task-102-cleaning']);
    expect(ids(Movement.VACANT)).toEqual(['task-103-refresh']);
    expect(ids(Movement.DEPARTURE_ONLY)).toEqual([]);
  });

  it('a pesquisa ignora acentos e maiúsculas e procura em hóspedes, instruções e equipa', () => {
    expect(ids('ALL', 'KLAUS')).toEqual(['task-101-cleaning']);
    expect(ids('ALL', 'familia toma pequeno-almoco')).toEqual(['task-102-cleaning']);
    expect(ids('ALL', 'klaus martins')).toEqual([]);
    expect(ids('ALL', 'maria joao')).toEqual(sheet1.views.map(v => v.task.id));
  });

  it('o movimento e a pesquisa combinam-se', () => {
    expect(ids(Movement.STAYOVER, 'klaus')).toEqual([]);
  });
});
