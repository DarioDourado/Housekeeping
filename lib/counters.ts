import { calculateTaskCredits } from '@/lib/credits';
import type { TaskView } from '@/lib/taskViews';
import { Movement, TaskKind, TaskStatus, InspectionStatus, type TaskSheetCounters } from '@/types/housekeeping.types';

// - Contadores por task sheet: recalculados sempre que as tarefas são redistribuídas (§6.6)
export const calculateCounters = (views: Pick<TaskView, 'task' | 'room'>[]): TaskSheetCounters => {
  const counters: TaskSheetCounters = {
    totalTasks: views.length,
    stayoverCount: 0,
    departureArrivalCount: 0,
    departureOnlyCount: 0,
    refreshCount: 0,
    pendingCount: 0,
    inProgressCount: 0,
    completedCount: 0,
    notPerformedCount: 0,
    inspectedCount: 0,
    estimatedCredits: 0
  };

  for (const { task, room } of views) {
    if (task.kind === TaskKind.REFRESH) counters.refreshCount++;
    else if (task.movement === Movement.STAYOVER) counters.stayoverCount++;
    else if (task.movement === Movement.DEPARTURE_ARRIVAL) counters.departureArrivalCount++;
    else if (task.movement === Movement.DEPARTURE_ONLY) counters.departureOnlyCount++;

    if (task.status === TaskStatus.PENDING) counters.pendingCount++;
    else if (task.status === TaskStatus.IN_PROGRESS) counters.inProgressCount++;
    else if (task.status === TaskStatus.COMPLETED) counters.completedCount++;
    else counters.notPerformedCount++;

    if (task.inspectionStatus === InspectionStatus.APPROVED) counters.inspectedCount++;
    counters.estimatedCredits += calculateTaskCredits(task, room.typology);
  }

  return counters;
};
