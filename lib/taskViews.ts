import type { User } from '@/types/auth.types';
import {
  PlanStatus,
  type PlanKind,
  type Room,
  type RoomStay,
  type ServicePlan,
  type ServiceTask,
  type SheetRole,
  type TaskEvent,
  type TaskSheet
} from '@/types/housekeeping.types';

// - O que um cartão realmente representa: uma TAREFA, com o quarto, a reserva do dia, a sheet e quem a executou.
//   É a junção que a UI precisa; o servidor continua a devolver entidades separadas (contrato).

export interface TaskView {
  task: ServiceTask;
  room: Room;
  stay?: RoomStay;
  sheet: TaskSheet;
  executors: User[];
  startedBy?: User;               // quem registou o início (pode não ser quem executou)
  refreshCount: number;
}

export interface SheetColumn {
  sheet: TaskSheet;
  views: TaskView[];
  assignees: { user: User; role: SheetRole }[];
}

interface BoardData {
  tasks: ServiceTask[];
  rooms: Room[];
  stays: RoomStay[];
  plans: ServicePlan[];
  sheets: TaskSheet[];
  staff: User[];
  events: TaskEvent[];
}

// - o plano em vigor de cada serviço é o ativo do dia operacional mais recente
export const selectActivePlan = (plans: ServicePlan[], kind: PlanKind): ServicePlan | undefined =>
  plans
    .filter(plan => plan.kind === kind && plan.status === PlanStatus.ACTIVE)
    .sort((a, b) => b.operationalDate.localeCompare(a.operationalDate))[0];

export const buildTaskViews = ({ tasks, rooms, stays, plans, sheets, staff, events }: BoardData): TaskView[] => {
  const roomById = new Map(rooms.map(room => [room.id, room]));
  const sheetById = new Map(sheets.map(sheet => [sheet.id, sheet]));
  const planById = new Map(plans.map(plan => [plan.id, plan]));
  const staffById = new Map(staff.map(user => [user.id, user]));

  // - a contagem de refreshes sai do histórico, não de um contador guardado
  const refreshCounts = new Map<string, number>();
  events.forEach(event => {
    if (event.type === 'REFRESH_RECORDED') refreshCounts.set(event.roomId, (refreshCounts.get(event.roomId) ?? 0) + 1);
  });

  return tasks.flatMap(task => {
    const room = roomById.get(task.roomId);
    const sheet = sheetById.get(task.sheetId);
    if (!room || !sheet) return [];
    const date = planById.get(task.planId)?.operationalDate;
    return [{
      task,
      room,
      stay: stays.find(stay => stay.roomId === room.id && stay.date === date),
      sheet,
      executors: task.executorIds.flatMap(id => staffById.get(id) ?? []),
      startedBy: task.startedById ? staffById.get(task.startedById) : undefined,
      refreshCount: refreshCounts.get(room.id) ?? 0
    }];
  });
};

// - Colunas do quadro de um plano: sheets por número; dentro de cada uma, prioritárias primeiro e depois pela ordem escolhida
export const buildColumns = (plan: ServicePlan | undefined, views: TaskView[], sheets: TaskSheet[], staff: User[]): SheetColumn[] => {
  if (!plan) return [];
  const staffById = new Map(staff.map(user => [user.id, user]));
  return sheets
    .filter(sheet => sheet.planId === plan.id)
    .sort((a, b) => a.number - b.number)
    .map(sheet => ({
      sheet,
      views: views
        .filter(view => view.task.sheetId === sheet.id)
        .sort((a, b) => Number(b.task.isPriority) - Number(a.task.isPriority) || a.task.orderIndex - b.task.orderIndex),
      assignees: sheet.assignments.flatMap(assignment => {
        const user = staffById.get(assignment.staffId);
        return user ? [{ user, role: assignment.role }] : [];
      })
    }));
};
