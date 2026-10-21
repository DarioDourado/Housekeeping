import { z } from 'zod';
import { UserRole, type User } from '@/types/auth.types';
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
  TaskStatus,
  type BlockTeam,
  type LocalizedText,
  type OperaSyncJob,
  type Room,
  type RoomAlert,
  type RoomStay,
  type Section,
  type ServicePlan,
  type ServiceTask,
  type TaskEvent,
  type TaskSheet
} from '@/types/housekeeping.types';

// - Validam o que vem do transporter (hoje localStorage, amanhã a API FastAPI); espelham o contrato em 34-backend-fastapi

const localizedTextSchema: z.ZodType<LocalizedText> = z.object({
  key: z.string(),
  params: z.record(z.string(), z.union([z.string(), z.number()])).optional()
});

const roomStatusSchema = z.enum(RoomStatus);

export const roomSchema: z.ZodType<Room> = z.object({
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

export const roomStaySchema: z.ZodType<RoomStay> = z.object({
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

export const sectionSchema: z.ZodType<Section> = z.object({
  id: z.string(),
  name: z.string(),
  block: z.string(),
  defaultRoomIds: z.array(z.string()),
  defaultStaffIds: z.array(z.string())
});

export const servicePlanSchema: z.ZodType<ServicePlan> = z.object({
  id: z.string(),
  operationalDate: z.string(),
  kind: z.enum(PlanKind),
  status: z.enum(PlanStatus)
});

export const taskSheetSchema: z.ZodType<TaskSheet> = z.object({
  id: z.string(),
  planId: z.string(),
  number: z.number(),
  title: z.string(),
  block: z.string(),
  sectionId: z.string().optional(),
  isReserve: z.boolean(),
  assignments: z.array(z.object({ staffId: z.string(), role: z.enum(SheetRole) })),
  notes: z.string().optional()
});

export const serviceTaskSchema: z.ZodType<ServiceTask> = z.object({
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

export const taskEventSchema: z.ZodType<TaskEvent> = z.object({
  id: z.string(),
  occurredAt: z.string(),
  type: z.enum([
    'ROOM_STARTED', 'ROOM_FINISHED', 'INSPECTION_APPROVED', 'INSPECTION_REPROVED', 'CORRECTION_DONE',
    'REFRESH_RECORDED', 'DND_RECORDED', 'SERVICE_REFUSED', 'PRIORITY_TOGGLED', 'MOVED_TASK_SHEET',
    'ROOM_REOPENED', 'TURNDOWN_UPDATED', 'STAFF_MOVED', 'PLAN_OPENED', 'OPERA_SYNC_PUSH', 'OPERA_SYNC_PULL',
    'OPERA_CONFLICT_DETECTED', 'NIGHT_AUDIT_TRIGGERED'
  ]),
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

export const operaSyncJobSchema: z.ZodType<OperaSyncJob> = z.object({
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

export const roomAlertSchema: z.ZodType<RoomAlert> = z.object({
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

export const blockTeamSchema: z.ZodType<BlockTeam> = z.object({
  id: z.string(),
  block: z.string(),
  name: z.string(),
  description: z.string(),
  supervisorId: z.string().optional(),
  supervisorName: z.string().optional(),
  color: z.string()
});

export const userSchema: z.ZodType<User> = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(UserRole),
  assignedArea: z.string().optional(),
  defaultBlock: z.string().optional(),
  isOnDuty: z.boolean().optional(),
  shift: z.string().optional(),
  notes: z.string().optional(),
  avatar: z.string().optional(),
  isExtra: z.boolean().optional(),
  phoneDeviceId: z.string().optional()
});
