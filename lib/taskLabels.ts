import { Movement, TaskKind, type ServiceTask } from '@/types/housekeeping.types';

// - chave i18n (room.serviceShort.*) do tipo de trabalho de uma tarefa
export const serviceLabelKey = (task: Pick<ServiceTask, 'kind' | 'movement'>): string => {
  if (task.kind === TaskKind.REFRESH) return 'refresh';
  if (task.kind === TaskKind.TURNDOWN) return 'turndown';
  if (task.movement === Movement.DEPARTURE_ARRIVAL) return 'departureArrival';
  if (task.movement === Movement.DEPARTURE_ONLY) return 'departureOnly';
  return 'stayover';
};

// - idades das crianças: null = não introduzida na reserva (a API não inventa o que não foi registado)
export const formatChildAges = (ages: (number | null)[], unknown: string): string =>
  ages.map(age => (age === null ? unknown : String(age))).join(', ');
