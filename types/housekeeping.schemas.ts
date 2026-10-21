import { z } from 'zod';
import { userSchema } from '@/types/auth.types';
import {
  CommercialBlock,
  InspectionStatus,
  Movement,
  NotPerformedReason,
  PlanKind,
  PlanStatus,
  PriorityOrigin,
  RoomStatus,
  RoomTypology,
  SheetRole,
  SyncState,
  TaskKind,
  TaskStatus
} from '@/types/housekeeping.enums';

// - Fonte única de verdade (14-types): o schema valida o que vem do transporter (hoje localStorage, amanhã a API FastAPI)
//   e o tipo da entidade é inferido dele. Espelha o contrato em 34-backend-fastapi.

export { userSchema };

// - Texto gerado pelo sistema: guarda-se a chave i18n + parâmetros, nunca a frase (a UI traduz ao mostrar)
export const localizedTextSchema = z.object({
  key: z.string(),
  params: z.record(z.string(), z.union([z.string(), z.number()])).optional()
});

const roomStatusSchema = z.enum(RoomStatus);

export const roomSchema = z.object({
  id: z.string(),
  number: z.string(),
  block: z.string(),
  floor: z.number(),
  typology: z.enum(RoomTypology),
  operaStatus: roomStatusSchema,
  operaStatusUpdatedAt: z.string(),
  commercialBlock: z.enum(CommercialBlock),
  occupied: z.boolean()
});

export const roomStaySchema = z.object({
  roomId: z.string(),
  date: z.string(),
  movement: z.enum(Movement),
  guestName: z.string().optional(),
  vipType: z.string().optional(),
  adults: z.number(),
  children: z.number(),
  childAges: z.array(z.number().nullable()),
  arrivalEta: z.string().optional(),
  departureEta: z.string().optional(),
  isLinenChangeDue: z.boolean(),
  instructions: z.string().optional(),
  traces: z.array(z.string()),
  notes: z.string().optional(),
  specials: z.array(z.string()),
  preferences: z.string().optional()
});

export const sectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  block: z.string(),
  defaultRoomIds: z.array(z.string()),
  defaultStaffIds: z.array(z.string())
});

export const servicePlanSchema = z.object({
  id: z.string(),
  operationalDate: z.string(),
  kind: z.enum(PlanKind),
  status: z.enum(PlanStatus)
});

export const sheetAssignmentSchema = z.object({ staffId: z.string(), role: z.enum(SheetRole) });

export const taskSheetSchema = z.object({
  id: z.string(),
  planId: z.string(),
  number: z.number(),
  title: z.string(),
  block: z.string(),
  sectionId: z.string().optional(),
  isReserve: z.boolean(),
  assignments: z.array(sheetAssignmentSchema),
  notes: z.string().optional()
});

export const serviceTaskSchema = z.object({
  id: z.string(),
  planId: z.string(),
  sheetId: z.string(),
  roomId: z.string(),
  kind: z.enum(TaskKind),
  movement: z.enum(Movement),
  status: z.enum(TaskStatus),
  notPerformedReason: z.enum(NotPerformedReason).optional(),
  isPriority: z.boolean(),
  priorityOrigin: z.enum(PriorityOrigin).optional(),
  priorityReason: z.string().optional(),
  orderIndex: z.number(),
  inspectionStatus: z.enum(InspectionStatus),
  inspectionNote: z.string().optional(),
  startedAt: z.string().optional(),
  finishedAt: z.string().optional(),
  durationSeconds: z.number().optional(),
  startedById: z.string().optional(),
  executorIds: z.array(z.string()),
  onBehalfOfTeam: z.boolean()
});

export const TASK_EVENT_TYPES = [
  'ROOM_STARTED',
  'ROOM_FINISHED',
  'INSPECTION_APPROVED',
  'INSPECTION_REPROVED',
  'CORRECTION_DONE',
  'REFRESH_RECORDED',
  'DND_RECORDED',
  'SERVICE_REFUSED',
  'PRIORITY_TOGGLED',
  'MOVED_TASK_SHEET',
  'ROOM_REOPENED',
  'TURNDOWN_UPDATED',
  'STAFF_MOVED',
  'PLAN_OPENED',
  'OPERA_SYNC_PUSH',
  'OPERA_SYNC_PULL',
  'OPERA_CONFLICT_DETECTED',
  'NIGHT_AUDIT_TRIGGERED'
] as const;

export const taskEventSchema = z.object({
  id: z.string(),
  occurredAt: z.string(),
  type: z.enum(TASK_EVENT_TYPES),
  roomId: z.string(),
  roomNumber: z.string(),
  taskId: z.string().optional(),
  registeredById: z.string(),
  registeredByName: z.string(),
  registeredByRole: z.string(),
  executorIds: z.array(z.string()),
  onBehalfOfTeam: z.boolean(),
  supervisorId: z.string().optional(),
  deviceId: z.string().optional(),
  detail: localizedTextSchema.optional(),
  durationSeconds: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const operaSyncJobSchema = z.object({
  id: z.string(),
  roomId: z.string().nullable(),
  direction: z.enum(['APP_TO_OPERA', 'OPERA_TO_APP']),
  previousStatus: roomStatusSchema.optional(),
  targetStatus: roomStatusSchema,
  state: z.enum(SyncState),
  attempts: z.number(),
  idempotencyKey: z.string(),
  lastError: localizedTextSchema.optional(),
  operaObservedAt: z.string().optional(),
  createdAt: z.string(),
  source: localizedTextSchema
});

export const roomAlertSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  roomId: z.string(),
  roomNumber: z.string(),
  taskId: z.string().optional(),
  targetWorkerName: z.string().optional(),
  targetArea: z.string().optional(),
  type: z.enum(['REPROVAL', 'RECEPTION_TRACE', 'PRIORITY_NOTICE', 'DND_ALERT']),
  message: localizedTextSchema,
  acknowledged: z.boolean(),
  acknowledgedAt: z.string().optional()
});

export const blockTeamSchema = z.object({
  id: z.string(),
  block: z.string(),
  name: z.string(),
  description: z.string(),
  supervisorId: z.string().optional(),
  supervisorName: z.string().optional(),
  color: z.string()
});

// ---------- Tipos das entidades (inferidos dos schemas) ----------

export type LocalizedText = z.infer<typeof localizedTextSchema>;
export type SheetAssignment = z.infer<typeof sheetAssignmentSchema>;
export type TaskEventType = (typeof TASK_EVENT_TYPES)[number];
export type Room = z.infer<typeof roomSchema>;
export type RoomStay = z.infer<typeof roomStaySchema>;
export type Section = z.infer<typeof sectionSchema>;
export type ServicePlan = z.infer<typeof servicePlanSchema>;
export type TaskSheet = z.infer<typeof taskSheetSchema>;
export type ServiceTask = z.infer<typeof serviceTaskSchema>;
export type TaskEvent = z.infer<typeof taskEventSchema>;
export type OperaSyncJob = z.infer<typeof operaSyncJobSchema>;
export type RoomAlert = z.infer<typeof roomAlertSchema>;
export type BlockTeam = z.infer<typeof blockTeamSchema>;
