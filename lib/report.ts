import { calculateCounters } from '@/lib/counters';
import type { SheetColumn } from '@/lib/taskViews';
import { NotPerformedReason, TaskStatus } from '@/types/housekeeping.types';

// - Métricas de relatório de um plano (dia ou noite), calculadas a partir das sheets visíveis
export const buildReport = (columns: SheetColumn[]) => {
  const views = columns.flatMap(column => column.views);
  const counters = calculateCounters(views);
  const blocked = (reason: NotPerformedReason) =>
    views.filter(({ task }) => task.status === TaskStatus.NOT_PERFORMED && task.notPerformedReason === reason).length;
  const durations = views.flatMap(({ task }) => (task.status === TaskStatus.COMPLETED && task.durationSeconds !== undefined ? [task.durationSeconds] : []));
  const people = new Set(columns.flatMap(column => column.assignees.map(({ user }) => user.id))).size;

  return {
    total: counters.totalTasks,
    pending: counters.pendingCount,
    inProgress: counters.inProgressCount,
    completed: counters.completedCount,
    notPerformed: counters.notPerformedCount,
    dnd: blocked(NotPerformedReason.DND),
    nq: blocked(NotPerformedReason.REFUSE_SERVICE),
    ac: blocked(NotPerformedReason.ALREADY_DONE),
    progress: counters.totalTasks > 0 ? Math.round((counters.completedCount / counters.totalTasks) * 100) : 0,
    avgMinutes: durations.length > 0 ? Math.round(durations.reduce((sum, seconds) => sum + seconds, 0) / durations.length / 60) : undefined,
    people,
    perPerson: people > 0 ? Math.round((counters.totalTasks / people) * 10) / 10 : 0,
    priority: views.filter(({ task }) => task.isPriority).length,
    credits: counters.estimatedCredits,
    inspected: counters.inspectedCount
  };
};
