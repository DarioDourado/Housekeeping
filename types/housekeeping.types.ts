// - Modelo do contrato FE↔BE (ver .agents/34-backend-fastapi/references/domain-contract.md).
//   Room (físico, vem do Opera) ≠ ServiceTask (intervenção) ≠ ServicePlan (distribuição de um dia e serviço).

export enum RoomStatus {
  DIRTY = 'DIRTY',
  CLEAN = 'CLEAN',
  INSPECTED = 'INSPECTED'
}

export enum RoomTypology {
  STANDARD = 'STANDARD',
  JUNIOR_SUITE = 'JUNIOR_SUITE',
  SUITE = 'SUITE',
  VILLA = 'VILLA'
}

export enum Movement {
  DEPARTURE_ARRIVAL = 'DEPARTURE_ARRIVAL',
  STAYOVER = 'STAYOVER',
  DEPARTURE_ONLY = 'DEPARTURE_ONLY',
  VACANT = 'VACANT'
}

export enum TaskKind {
  CLEANING = 'CLEANING',
  REFRESH = 'REFRESH',
  TURNDOWN = 'TURNDOWN'
}

export enum PlanKind {
  DAY = 'DAY',
  NIGHT = 'NIGHT'
}

export enum PlanStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED'
}

// - execução da tarefa; nunca se mistura com o estado do quarto no Opera
export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  NOT_PERFORMED = 'NOT_PERFORMED'
}

export enum NotPerformedReason {
  DND = 'DND',
  REFUSE_SERVICE = 'REFUSE_SERVICE'
}

export enum InspectionStatus {
  NOT_REQUIRED = 'NOT_REQUIRED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  CORRECTION_REQUESTED = 'CORRECTION_REQUESTED'
}

// - bloqueios comerciais são geridos no Opera: a app só os lê
export enum CommercialBlock {
  NONE = 'NONE',
  OOS = 'OOS',
  OOO = 'OOO'
}

export enum PriorityOrigin {
  RECEPTION = 'RECEPTION',
  HOUSEKEEPING = 'HOUSEKEEPING'
}

export enum SyncState {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  FAILED = 'FAILED',
  CONFLICT = 'CONFLICT'
}

export enum SheetRole {
  LEAD = 'LEAD',
  MEMBER = 'MEMBER'
}

// - Texto gerado pelo sistema: guarda-se a chave i18n + parâmetros, nunca a frase (a UI traduz ao mostrar)
export interface LocalizedText {
  key: string;
  params?: Record<string, string | number>;
}

// ---------- Opera (só leitura na app, exceto o estado de limpeza) ----------

export interface Room {
  id: string;
  number: string;
  block: string;
  floor: number;
  typology: RoomTypology;
  operaStatus: RoomStatus;
  operaStatusUpdatedAt: string;   // ISO-8601; base da deteção de conflitos
  commercialBlock: CommercialBlock;
  occupied: boolean;
}

// - Reserva do dia (snapshot do Opera). Dados pessoais: mostrar só o necessário por perfil.
export interface RoomStay {
  roomId: string;
  date: string;                   // dia operacional YYYY-MM-DD
  movement: Movement;
  guestName?: string;
  vipType?: string;
  adults: number;
  children: number;
  childAges: (number | null)[];   // null = idade não introduzida na reserva
  arrivalEta?: string;
  departureEta?: string;
  isLinenChangeDue: boolean;
  instructions?: string;
  traces: string[];
  notes?: string;
  specials: string[];
  preferences?: string;
}

// ---------- Configuração base (permanente) e distribuição do dia ----------

export interface Section {
  id: string;
  name: string;
  block: string;
  defaultRoomIds: string[];
  defaultStaffIds: string[];
}

export interface ServicePlan {
  id: string;
  operationalDate: string;
  kind: PlanKind;
  status: PlanStatus;
}

export interface SheetAssignment {
  staffId: string;
  role: SheetRole;
}

export interface TaskSheet {
  id: string;
  planId: string;
  number: number;
  title: string;
  block: string;
  sectionId?: string;
  isReserve: boolean;             // área de reserva/estacionamento: trabalho adiado, não apagado
  assignments: SheetAssignment[];
  notes?: string;
}

export interface ServiceTask {
  id: string;
  planId: string;
  sheetId: string;
  roomId: string;
  kind: TaskKind;
  movement: Movement;
  status: TaskStatus;
  notPerformedReason?: NotPerformedReason;
  isPriority: boolean;
  priorityOrigin?: PriorityOrigin;
  priorityReason?: string;
  orderIndex: number;
  inspectionStatus: InspectionStatus;
  inspectionNote?: string;
  startedAt?: string;
  finishedAt?: string;
  durationSeconds?: number;
  startedById?: string;           // quem registou o início
  executorIds: string[];          // quem executou fisicamente (vazio = desconhecido)
  onBehalfOfTeam: boolean;        // registado em nome da equipa (telemóvel partilhado)
}

// ---------- Histórico (append-only) ----------

export type TaskEventType =
  | 'ROOM_STARTED'
  | 'ROOM_FINISHED'
  | 'INSPECTION_APPROVED'
  | 'INSPECTION_REPROVED'
  | 'CORRECTION_DONE'
  | 'REFRESH_RECORDED'
  | 'DND_RECORDED'
  | 'SERVICE_REFUSED'
  | 'PRIORITY_TOGGLED'
  | 'MOVED_TASK_SHEET'
  | 'ROOM_REOPENED'
  | 'TURNDOWN_UPDATED'
  | 'STAFF_MOVED'
  | 'PLAN_OPENED'
  | 'OPERA_SYNC_PUSH'
  | 'OPERA_SYNC_PULL'
  | 'OPERA_CONFLICT_DETECTED'
  | 'NIGHT_AUDIT_TRIGGERED';

export interface TaskEvent {
  id: string;
  occurredAt: string;             // ISO-8601, relógio do servidor
  type: TaskEventType;
  roomId: string;
  roomNumber: string;             // snapshot para a auditoria ('ALL' = vários)
  taskId?: string;
  registeredById: string;         // utilizador que registou
  registeredByName: string;
  registeredByRole: string;
  executorIds: string[];
  onBehalfOfTeam: boolean;
  supervisorId?: string;          // quem inspecionou/corrigiu
  deviceId?: string;
  detail?: LocalizedText;
  durationSeconds?: number;
  metadata?: Record<string, unknown>;
}

export interface OperaSyncJob {
  id: string;
  roomId: string | null;          // null = todos os quartos
  direction: 'APP_TO_OPERA' | 'OPERA_TO_APP';
  previousStatus?: RoomStatus;
  targetStatus: RoomStatus;
  state: SyncState;
  attempts: number;
  idempotencyKey: string;
  lastError?: LocalizedText;
  operaObservedAt?: string;
  createdAt: string;
  source: LocalizedText;
}

export interface RoomAlert {
  id: string;
  timestamp: string;              // ISO-8601
  roomId: string;
  roomNumber: string;
  taskId?: string;
  targetWorkerName?: string;
  targetArea?: string;
  type: 'REPROVAL' | 'RECEPTION_TRACE' | 'PRIORITY_NOTICE' | 'DND_ALERT';
  message: LocalizedText;
  acknowledged: boolean;
  acknowledgedAt?: string;        // ISO-8601
}

export interface TaskSheetCounters {
  totalTasks: number;
  stayoverCount: number;          // Estadias
  departureArrivalCount: number;  // Saídas com chegada
  departureOnlyCount: number;     // Só saídas
  refreshCount: number;           // Refreshes
  pendingCount: number;
  inProgressCount: number;
  completedCount: number;
  notPerformedCount: number;
  inspectedCount: number;
  estimatedCredits: number;
}

export interface BlockTeam {
  id: string;
  block: string;
  name: string;
  description: string;
  supervisorId?: string;
  supervisorName?: string;
  color: string;
}
