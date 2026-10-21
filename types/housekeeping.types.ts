export enum RoomStatus {
  DIRTY = 'DIRTY',
  CLEAN = 'CLEAN',
  INSPECTED = 'INSPECTED'
}

export enum ServiceType {
  DEPARTURE_ARRIVAL = 'DEPARTURE_ARRIVAL', // Saída com chegada (Alta prioridade)
  STAYOVER = 'STAYOVER',                   // Estadia in-house (Média)
  DEPARTURE_ONLY = 'DEPARTURE_ONLY',       // Só saída (Baixa / Estacionamento)
  REFRESH = 'REFRESH'                      // Quarto já limpo de dias anteriores antes de chegada
}

export enum ServiceShift {
  MORNING = 'MORNING',     // Serviço da manhã (sincroniza com Opera nos 2 sentidos)
  TURNDOWN = 'TURNDOWN'    // Serviço da noite (18h-21h30, isolado do Opera)
}

export enum RoomTypology {
  STANDARD = 'STANDARD',             // Quarto normal (1 cr estadia / 2 cr saída)
  JUNIOR_SUITE = 'JUNIOR_SUITE',     // Junior Suite (1.5 cr estadia / 3 cr saída)
  SUITE = 'SUITE',                   // Suite Hotel / Oasis (2 cr estadia / 4 cr saída)
  VILLA = 'VILLA'                    // Master Villa (3 cr estadia / 6 cr saída)
}

export interface GuestOperaInfo {
  guestName: string;
  vipType?: string;            // 'VIP 1', 'VIP 2', 'VVIP', 'Repeat Guest'
  adults: number;
  children: number;
  childAges?: string;          // Ex: "2 anos (berço), 6 anos" - dor principal da governanta
  arrivalEta?: string;         // Ex: "14:30 (Transfer privado)"
  departureEta?: string;       // Ex: "11:00"
  isLinenChangeDue: boolean;   // "Muda" - troca de lençóis
  dailyInstructions?: string;  // Housekeeping room instructions
  traces?: string[];           // Pedidos e traces da receção (ex: "Colocar berço", "Rosas de boas-vindas")
  notes?: string;              // Observações gerais da receção
  specials?: string[];         // Luas de mel, aniversários, amenidades especiais
  preferences?: string;        // "Almofadas extras de penas, temperatura 21C"
}

export interface RoomOperationalState {
  activeStartTime?: string;      // ISO String
  activeEndTime?: string;        // ISO String
  activeWorkerId?: string;
  activeWorkerName?: string;
  lastDurationSeconds?: number;
  totalRefreshCount: number;
  isDND: boolean;
  dndRecordedAt?: string;
  isRefusedService: boolean;
  refusedRecordedAt?: string;
  inspectionReprovalNote?: string;
  inspectionReprovalAt?: string;
  inspectionReprovalAcknowledged?: boolean;
}

export interface Room {
  id: string;
  number: string;               // Ex: "101", "204", "Vila 1"
  block: string;                // "Bloco A", "Bloco B", "Bloco C", "Bloco D", "Oasis Parc", "Master Villas"
  defaultBlock?: string;        // Bloco de partida por default (configurável)
  floor: number;
  typology: RoomTypology;
  
  // Morning Service (com Opera)
  morningStatus: RoomStatus;
  operaStatus: RoomStatus;      // Último estado sincronizado com o Opera Cloud
  operaLastSyncedAt: string;
  serviceType: ServiceType;

  // Turndown Service (Sem Opera, isolado)
  turndownStatus: RoomStatus;
  turndownRequired: boolean;
  turndownSheetId?: string;
  turndownWorkerName?: string;
  turndownCompletedAt?: string;

  // Order & Priority
  isPriority: boolean;
  prioritySetBy?: string;       // "Receção" | "Governanta"
  priorityReason?: string;
  assignedSheetId: string;      // ID da Task Sheet da manhã
  orderIndex: number;

  // Guest & Opera fields
  guest: GuestOperaInfo;

  // Operational State & Time tracking
  operational: RoomOperationalState;
}

export interface TaskSheet {
  id: string;
  sheetNumber: number;          // Ex: 1 a 20 + 21 e 22 (estacionamento)
  title: string;                // Ex: "Secção 1 - Bloco A Piso 0"
  block: string;
  assignedUserIds: string[];    // Pode ter 1 ou mais pessoas
  assignedUserNames: string[];
  roomIds: string[];
  isParkingSheet: boolean;      // Task sheet extra para estacionar quartos não prioritários
  serviceShift: ServiceShift;
  notes?: string;
}

export type RoomEventType =
  | 'ROOM_STARTED'
  | 'ROOM_FINISHED'
  | 'INSPECTION_APPROVED'
  | 'INSPECTION_REPROVED'
  | 'REFRESH_RECORDED'
  | 'DND_RECORDED'
  | 'SERVICE_REFUSED'
  | 'PRIORITY_TOGGLED'
  | 'MOVED_TASK_SHEET'
  | 'OPERA_SYNC_PUSH'
  | 'OPERA_SYNC_PULL'
  | 'NIGHT_AUDIT_TRIGGERED';

export interface RoomEvent {
  id: string;
  timestamp: string;
  roomId: string;
  roomNumber: string;
  eventType: RoomEventType;
  userId: string;
  userName: string;
  userRole: string;
  details?: string;
  durationSeconds?: number;
  metadata?: Record<string, any>;
}

export interface RoomAlert {
  id: string;
  timestamp: string;
  roomId: string;
  roomNumber: string;
  targetWorkerName?: string;
  targetArea?: string;
  type: 'REPROVAL' | 'RECEPTION_TRACE' | 'PRIORITY_NOTICE' | 'DND_ALERT';
  message: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

export interface TaskSheetCounters {
  totalRooms: number;
  stayoverCount: number;         // Estadias
  departureArrivalCount: number; // Saídas com chegada
  departureOnlyCount: number;    // Só saídas
  refreshCount: number;          // Refreshes
  dirtyCount: number;
  cleanCount: number;
  inspectedCount: number;
  estimatedCredits: number;
}

export interface BlockTeam {
  id: string;
  block: string;                // "Bloco A", "Bloco B", "Bloco C", "Bloco D", "Oasis Parc", "Master Villas", "Apoio & Rotativas"
  name: string;                 // "Equipa Bloco A"
  description: string;          // "Pisos 0, 1 e 2 - 18 quartos"
  supervisorId?: string;
  supervisorName?: string;
  color: string;                // "blue" | "indigo" | "violet" | "emerald" | "amber" | "rose" | "slate"
}
