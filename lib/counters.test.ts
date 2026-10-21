import { describe, expect, it } from 'vitest';
import { calculateCounters } from '@/lib/counters';
import { buildTaskViews } from '@/lib/taskViews';
import { seedState } from '@/services/local-api/store';

const state = seedState();
const viewsOf = (sheetId: string) => buildTaskViews({ ...state, tasks: state.tasks.filter(t => t.sheetId === sheetId) });

describe('calculateCounters', () => {
  it('§6.6: conta por tipo de serviço e estado de execução e soma os créditos da sheet', () => {
    const counters = calculateCounters(viewsOf('sheet-1'));

    expect(counters).toMatchObject({
      totalTasks: 3,
      departureArrivalCount: 1,
      stayoverCount: 1,
      refreshCount: 1,
      pendingCount: 3,
      completedCount: 0,
      inspectedCount: 0
    });
    expect(counters.estimatedCredits).toBe(3.5);
  });

  it('distingue executadas, inspecionadas e não realizadas', () => {
    expect(calculateCounters(viewsOf('sheet-6'))).toMatchObject({ completedCount: 1, pendingCount: 1, inspectedCount: 1 });
  });

  it('uma sheet vazia tem tudo a zero', () => {
    expect(calculateCounters([])).toMatchObject({ totalTasks: 0, estimatedCredits: 0 });
  });
});
