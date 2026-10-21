import { z } from 'zod';
import {
  INITIAL_ALERTS,
  INITIAL_BLOCK_TEAMS,
  INITIAL_EVENTS,
  INITIAL_PLANS,
  INITIAL_ROOMS,
  INITIAL_SECTIONS,
  INITIAL_STAFF,
  INITIAL_STAYS,
  INITIAL_SYNC_JOBS,
  INITIAL_TASKS,
  INITIAL_TASK_SHEETS
} from '@/config/hotelData';
import {
  blockTeamSchema,
  operaSyncJobSchema,
  roomAlertSchema,
  roomSchema,
  roomStaySchema,
  sectionSchema,
  servicePlanSchema,
  serviceTaskSchema,
  taskEventSchema,
  taskSheetSchema,
  userSchema
} from '@/types/housekeeping.schemas';
import type { HousekeepingState } from './types';

// - "Base de dados" de demonstração em localStorage; desaparece quando o BE existir.
//   v3: modelo do contrato (quartos/estadias/planos/tarefas); dados de versões anteriores são ignorados.
const KEYS: Record<keyof HousekeepingState, string> = {
  rooms: 'vvp_hk_rooms_v3',
  stays: 'vvp_hk_stays_v3',
  sections: 'vvp_hk_sections_v3',
  plans: 'vvp_hk_plans_v3',
  sheets: 'vvp_hk_sheets_v3',
  tasks: 'vvp_hk_tasks_v3',
  events: 'vvp_hk_events_v3',
  alerts: 'vvp_hk_alerts_v3',
  syncJobs: 'vvp_hk_sync_jobs_v3',
  blockTeams: 'vvp_hk_teams_v3',
  staff: 'vvp_hk_staff_v3'
};

const SCHEMAS = {
  rooms: z.array(roomSchema),
  stays: z.array(roomStaySchema),
  sections: z.array(sectionSchema),
  plans: z.array(servicePlanSchema),
  sheets: z.array(taskSheetSchema),
  tasks: z.array(serviceTaskSchema),
  events: z.array(taskEventSchema),
  alerts: z.array(roomAlertSchema),
  syncJobs: z.array(operaSyncJobSchema),
  blockTeams: z.array(blockTeamSchema),
  staff: z.array(userSchema)
} as const;

export const seedState = (): HousekeepingState => structuredClone({
  rooms: INITIAL_ROOMS,
  stays: INITIAL_STAYS,
  sections: INITIAL_SECTIONS,
  plans: INITIAL_PLANS,
  sheets: INITIAL_TASK_SHEETS,
  tasks: INITIAL_TASKS,
  events: INITIAL_EVENTS,
  alerts: INITIAL_ALERTS,
  syncJobs: INITIAL_SYNC_JOBS,
  blockTeams: INITIAL_BLOCK_TEAMS,
  staff: INITIAL_STAFF
});

const readCollection = <K extends keyof HousekeepingState>(name: K, seed: HousekeepingState[K]): HousekeepingState[K] => {
  const raw = localStorage.getItem(KEYS[name]);
  if (raw === null) return seed;
  try {
    return SCHEMAS[name].parse(JSON.parse(raw)) as HousekeepingState[K];
  } catch (error) {
    // - dado corrompido ou de versão antiga: recomeça da seed (com BE isto seria um erro visível)
    console.warn(`[local-api] "${name}" inválido, a repor a seed`, error);
    return seed;
  }
};

export const loadState = (): HousekeepingState => {
  const seed = seedState();
  return Object.fromEntries(
    (Object.keys(KEYS) as (keyof HousekeepingState)[]).map(name => [name, readCollection(name, seed[name])])
  ) as unknown as HousekeepingState;
};

export const saveState = (state: HousekeepingState): void => {
  (Object.keys(KEYS) as (keyof HousekeepingState)[]).forEach(name => {
    localStorage.setItem(KEYS[name], JSON.stringify(state[name]));
  });
};

export const resetState = (): void => {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
};
