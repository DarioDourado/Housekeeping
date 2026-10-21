// - Enums do contrato FE↔BE (ver .agents/34-backend-fastapi/references/domain-contract.md).

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
