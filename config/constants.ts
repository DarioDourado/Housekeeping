import { RoomTypology } from '@/types/housekeeping.types';
import { UserRole } from '@/types/auth.types';

// - Constantes globais da app (não são dados de demonstração; ver hotelData.ts para seed).
// - Valores marcados PENDENTE vêm da reunião como exemplos, não como regra aprovada.

// - roomNumber de eventos/logs que abrangem todos os quartos
export const ALL_ROOMS = 'ALL';

export const BLOCK = {
  A: 'Bloco A',
  B: 'Bloco B',
  C: 'Bloco C',
  D: 'Bloco D',
  OASIS: 'Oasis Parc',
  VILLAS: 'Master Villas',
  SUPPORT: 'Apoio & Rotativas',
  PARKING: 'Estacionamento Geral',
} as const;

export type BlockName = (typeof BLOCK)[keyof typeof BLOCK];

export const OPERATIONAL_BLOCKS: readonly BlockName[] = [
  BLOCK.A, BLOCK.B, BLOCK.C, BLOCK.D, BLOCK.OASIS, BLOCK.VILLAS,
];

export const SHIFT = {
  MORNING: 'Manhã',
  AFTERNOON: 'Tarde 13h30',
  TURNDOWN: 'Turndown',
  GENERAL: 'Geral',
} as const;

// - Horários do turndown (§10.2); execução 18h00-21h30, distinta dos turnos de trabalho
export const TURNDOWN_SCHEDULE = {
  earlyPrepStart: '14:30',
  prepStart: '15:30',
  dayServiceStillOpenUntil: '17:30',
  start: '18:00',
  end: '21:30',
} as const;

// - Turnos de trabalho (§10.2): não confundir com o intervalo de execução do turndown
export const WORK_SHIFT_HOURS = {
  afternoon: { start: '13:30', end: '22:00' },
  evening: { start: '18:00', end: '23:00' },
} as const;

// - Fecho do dia operacional ~02h ou mais tarde (§8.4): nunca usar 00h00 para mudar de dia
export const OPERA_DAY_CLOSE_HOUR = 2;

// - 20 secções + 2 de estacionamento são exemplos da reunião (§6.4), não limites; o mock de teste usa 24 + 2 = 26
export const DEFAULT_TASK_SHEET_COUNT = 24;
export const DEFAULT_PARKING_SHEET_COUNT = 2;

// - Créditos por tipologia e serviço (§15): valores ilustrativos, tabela oficial por aprovar
// - PENDENTE: VILLA e REFRESH não constam da reunião
export const CREDIT_TABLE: Record<RoomTypology, { stayover: number; departure: number }> = {
  [RoomTypology.STANDARD]: { stayover: 1, departure: 2 },
  [RoomTypology.JUNIOR_SUITE]: { stayover: 1.5, departure: 3 },
  [RoomTypology.SUITE]: { stayover: 2, departure: 4 },
  [RoomTypology.VILLA]: { stayover: 3, departure: 6 },
};
export const REFRESH_CREDITS = 0.5;
// - PENDENTE: meta de 12 créditos/dia e ~30 min por crédito são exemplos da reunião (§15.3)
export const DAILY_CREDIT_TARGET = 12;
export const MINUTES_PER_CREDIT = 30;

export type Permission =
  | 'rooms.viewAll'
  | 'rooms.viewArea'
  | 'rooms.viewAssigned'
  | 'sheets.distribute'
  | 'staff.assign'
  | 'priority.reorder'
  | 'task.startFinish'
  | 'room.markClean'
  | 'room.markInspected'
  | 'room.markDirty'
  | 'room.editDetails'
  | 'correction.request'
  | 'stats.teamTimes'
  | 'stats.supervisors'
  | 'guest.view'
  | 'messages.send'
  | 'config.zones';

// - Grupos de permissões (as governantas e os responsáveis de andares são admin). O que ainda nenhum ecrã verifica fica só para a administração até haver regras para os restantes
//   perfis (aí passa-se de PENDING_RULES para o perfil certo, sem mexer nos ecrãs).
const EXECUTION: readonly Permission[] = ['task.startFinish'];                          // todos os perfis começam e concluem
const REVIEW: readonly Permission[] = ['room.markInspected', 'room.markDirty', 'correction.request', 'room.editDetails']; // aprovar, rejeitar e reabrir
const PENDING_RULES: readonly Permission[] = [
  'rooms.viewAssigned', 'room.markClean', 'stats.teamTimes', 'stats.supervisors', 'guest.view', 'messages.send'
];

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  [UserRole.ADMIN]: [
    'rooms.viewAll', 'sheets.distribute', 'staff.assign', 'priority.reorder', 'config.zones',
    ...EXECUTION, ...REVIEW, ...PENDING_RULES,
  ],
  [UserRole.HOUSEKEEPER]: [...EXECUTION],
  [UserRole.RECEPTION]: ['priority.reorder', ...EXECUTION],
};

// - Rotas da aplicação (fonte única; navbar e router usam isto)
export const ROUTES = {
  PLANNING: '/',
  TURNDOWN: '/turndown',
  LIVE: '/live',
  AUDIT: '/audit',
  SETTINGS: '/settings',
  MOBILE: '/mobile',
  LOGIN: '/login',
} as const;
