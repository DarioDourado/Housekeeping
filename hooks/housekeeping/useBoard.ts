import { useMemo } from 'react';
import { useStaff } from '@/hooks/staff';
import { buildColumns, buildTaskViews, selectActivePlan } from '@/lib/taskViews';
import type { PlanKind } from '@/types/housekeeping.types';
import { useEvents } from './useEvents';
import { usePlans } from './usePlans';
import { useRooms } from './useRooms';
import { useStays } from './useStays';
import { useTaskSheets } from './useTaskSheets';
import { useTasks } from './useTasks';

const EMPTY: never[] = [];

// - O quadro de um serviço (diurno ou noturno): plano em vigor, colunas por task sheet e as tarefas já juntas com
//   quarto, reserva e executores. Os estados de carregamento/erro vêm das consultas de que depende.
export const useBoard = (kind: PlanKind) => {
  const rooms = useRooms();
  const stays = useStays();
  const plans = usePlans();
  const sheets = useTaskSheets();
  const tasks = useTasks();
  const events = useEvents();
  const staff = useStaff();
  const queries = [rooms, stays, plans, sheets, tasks, events, staff];

  const board = useMemo(() => {
    const data = {
      rooms: rooms.data ?? EMPTY,
      stays: stays.data ?? EMPTY,
      plans: plans.data ?? EMPTY,
      sheets: sheets.data ?? EMPTY,
      tasks: tasks.data ?? EMPTY,
      events: events.data ?? EMPTY,
      staff: staff.data ?? EMPTY
    };
    const plan = selectActivePlan(data.plans, kind);
    const planTasks = data.tasks.filter(task => task.planId === plan?.id);
    const views = buildTaskViews({ ...data, tasks: planTasks });
    return { plan, views, columns: buildColumns(plan, views, data.sheets, data.staff) };
  }, [kind, rooms.data, stays.data, plans.data, sheets.data, tasks.data, events.data, staff.data]);

  return {
    ...board,
    isLoading: queries.some(query => query.isLoading),
    isError: queries.some(query => query.isError),
    refetch: () => Promise.all(queries.map(query => query.refetch()))
  };
};
