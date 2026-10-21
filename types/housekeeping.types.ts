// - Modelo do contrato FE↔BE (ver .agents/34-backend-fastapi/references/domain-contract.md).
//   Room (físico, vem do Opera) ≠ ServiceTask (intervenção) ≠ ServicePlan (distribuição de um dia e serviço).
//   Enums em housekeeping.enums.ts; entidades inferidas dos schemas em housekeeping.schemas.ts; este ficheiro é a porta de entrada.

export * from './housekeeping.enums';
export type {
  BlockTeam,
  LocalizedText,
  OperaSyncJob,
  Room,
  RoomAlert,
  RoomStay,
  Section,
  ServicePlan,
  ServiceTask,
  SheetAssignment,
  TaskEvent,
  TaskEventType,
  TaskSheet
} from './housekeeping.schemas';

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
