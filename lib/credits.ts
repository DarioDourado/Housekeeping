import { CREDIT_TABLE, REFRESH_CREDITS } from '@/config/constants';
import { Movement, TaskKind, type RoomTypology, type ServiceTask } from '@/types/housekeeping.types';

const isDeparture = (movement: Movement) => movement === Movement.DEPARTURE_ARRIVAL || movement === Movement.DEPARTURE_ONLY;

// - Créditos = estimativa de esforço por tipologia × serviço (§15 do requisito), nunca da pessoa.
//   PENDENTE: o turndown ainda não tem regra de créditos (a reunião só valorizou o serviço diurno).
export const calculateTaskCredits = (task: Pick<ServiceTask, 'kind' | 'movement'>, typology: RoomTypology): number => {
  if (task.kind === TaskKind.TURNDOWN) return 0;
  if (task.kind === TaskKind.REFRESH) return REFRESH_CREDITS;
  const credits = CREDIT_TABLE[typology];
  return isDeparture(task.movement) ? credits.departure : credits.stayover;
};
