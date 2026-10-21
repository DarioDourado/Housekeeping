import { useMemo } from 'react';
import { useStaff } from '@/hooks/staff';
import { buildTaskViews } from '@/lib/taskViews';
import { useEvents } from './useEvents';
import { usePlans } from './usePlans';
import { useRooms } from './useRooms';
import { useStays } from './useStays';
import { useTaskSheets } from './useTaskSheets';
import { useTasks } from './useTasks';

const EMPTY: never[] = [];

// - Uma tarefa (diurna ou noturna) já junta com quarto, reserva, sheet e executores; undefined se não existir
export const useTaskView = (taskId: string | null) => {
  const rooms = useRooms();
  const stays = useStays();
  const plans = usePlans();
  const sheets = useTaskSheets();
  const tasks = useTasks();
  const events = useEvents();
  const staff = useStaff();

  return useMemo(() => {
    if (!taskId) return undefined;
    const task = tasks.data?.find(candidate => candidate.id === taskId);
    if (!task) return undefined;
    return buildTaskViews({
      tasks: [task],
      rooms: rooms.data ?? EMPTY,
      stays: stays.data ?? EMPTY,
      plans: plans.data ?? EMPTY,
      sheets: sheets.data ?? EMPTY,
      staff: staff.data ?? EMPTY,
      events: events.data ?? EMPTY
    })[0];
  }, [taskId, tasks.data, rooms.data, stays.data, plans.data, sheets.data, staff.data, events.data]);
};
