import { NotPerformedReason, TaskStatus, type Movement } from '@/types/housekeeping.types';
import type { SheetColumn, TaskView } from './taskViews';

export type MovementFilter = 'ALL' | Movement;
// - filtros do turndown: tarefa a decorrer, concluída ou com um dos impedimentos (DND, NQ, AC)
export type StateFilter = 'ALL' | TaskStatus.IN_PROGRESS | TaskStatus.COMPLETED | NotPerformedReason;

const matchesState = ({ task }: TaskView, state: StateFilter): boolean =>
  state === 'ALL' ||
  (state === TaskStatus.IN_PROGRESS || state === TaskStatus.COMPLETED
    ? task.status === state
    : task.status === TaskStatus.NOT_PERFORMED && task.notPerformedReason === state);

// - sem acentos e sem maiúsculas: "saida" encontra "Saída"
const normalize = (text: string): string => text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

// - tudo o que a distribuição mostra ou guarda sobre o cartão: quarto, hóspedes, instruções, traces, equipa e sheet
const searchText = (view: TaskView, column: SheetColumn): string => {
  const { room, stay } = view;
  return normalize([
    room.number, room.block, room.typology, view.sheet.title,
    ...column.assignees.map(({ user }) => user.name),
    ...view.executors.map(user => user.name),
    stay?.guestName, stay?.departingGuestName, stay?.arrivingGuestName, stay?.vipType,
    stay?.instructions, stay?.notes, stay?.preferences, ...(stay?.traces ?? []), ...(stay?.specials ?? [])
  ].filter(Boolean).join(' '));
};

// - Cartões de uma sheet que passam o filtro de movimento e a pesquisa (todas as palavras têm de aparecer, por qualquer ordem)
export const filterColumnViews = (column: SheetColumn, movement: MovementFilter, query: string, state: StateFilter = 'ALL'): TaskView[] => {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return column.views.filter(view => {
    if (movement !== 'ALL' && view.task.movement !== movement) return false;
    if (!matchesState(view, state)) return false;
    if (terms.length === 0) return true;
    const text = searchText(view, column);
    return terms.every(term => text.includes(term));
  });
};
