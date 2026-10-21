import type {
  BlockTeam,
  LocalizedText,
  OperaSyncJob,
  Room,
  RoomAlert,
  RoomStay,
  Section,
  ServicePlan,
  ServiceTask,
  TaskEvent,
  TaskSheet
} from '@/types/housekeeping.types';
import type { User } from '@/types/auth.types';

// - "Servidor" de demonstração: as regras de negócio vivem aqui, não na UI. O BE FastAPI implementa os mesmos comandos
//   (ver .agents/34-backend-fastapi/references/domain-contract.md).

export interface HousekeepingState {
  rooms: Room[];
  stays: RoomStay[];
  sections: Section[];
  plans: ServicePlan[];
  sheets: TaskSheet[];
  tasks: ServiceTask[];
  events: TaskEvent[];
  alerts: RoomAlert[];
  syncJobs: OperaSyncJob[];
  blockTeams: BlockTeam[];
  staff: User[];
}

export interface Actor {
  id: string;
  name: string;
  role: string;
  deviceId?: string | undefined;
}

export interface CommandContext {
  actor: Actor;
  now: Date;
  newId: (prefix: string) => string;
}

export interface CommandResult {
  state: HousekeepingState;
  // - mensagem de confirmação para a UI (chave i18n + parâmetros)
  toast?: LocalizedText | undefined;
}

export type Command<Args = void> = (state: HousekeepingState, args: Args, ctx: CommandContext) => CommandResult;

// - Argumentos comuns dos comandos de execução
export interface TaskArgs {
  taskId: string;
}

export interface ExecutionArgs extends TaskArgs {
  executorIds?: string[] | undefined;
}
