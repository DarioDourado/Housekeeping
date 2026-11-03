import { describe, expect, it } from 'vitest';
import { buildReport } from '@/lib/report';
import { buildColumns, buildTaskViews, selectActivePlan } from '@/lib/taskViews';
import { seedState } from '@/services/local-api/store';
import { PlanKind } from '@/types/housekeeping.types';

const state = seedState();
const report = (kind: PlanKind) => {
  const plan = selectActivePlan(state.plans, kind);
  return buildReport(buildColumns(plan, buildTaskViews({ ...state, tasks: state.tasks.filter(t => t.planId === plan?.id) }), state.sheets, state.staff));
};

describe('buildReport', () => {
  it('os estados somam o total e o progresso é a percentagem de concluídas', () => {
    [PlanKind.DAY, PlanKind.NIGHT].forEach(kind => {
      const r = report(kind);
      expect(r.pending + r.inProgress + r.completed + r.notPerformed).toBe(r.total);
      expect(r.progress).toBe(Math.round((r.completed / r.total) * 100));
      expect(r.dnd + r.nq + r.ac).toBe(r.notPerformed);
    });
  });

  it('o turndown tem gente atribuída e impedimentos de exemplo; o dia tem tempo médio das concluídas', () => {
    const night = report(PlanKind.NIGHT);
    expect(night.people).toBeGreaterThan(0);
    expect(night.dnd + night.nq + night.ac).toBeGreaterThan(0);
    expect(report(PlanKind.DAY).avgMinutes).toBeGreaterThan(0);
  });
});
