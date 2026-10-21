import { BLOCK } from './constants';
import { todayAt } from '@/lib/clock';
import { operationalDate } from '@/lib/operationalDate';
import { UserRole, type User } from '@/types/auth.types';
import {
  CommercialBlock,
  InspectionStatus,
  Movement,
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

// =====================================================================================
// MOCK DE DEMONSTRAÇÃO (Vila Vita Parc). Não é código de produção: no BE estes dados vêm
// do Opera (quartos, estadias), da configuração (secções, equipas) e da base de dados
// (planos, tarefas, histórico). Está na forma do contrato FE↔BE (ver 34-backend-fastapi).
// =====================================================================================

const TODAY = operationalDate();

export const INITIAL_STAFF: User[] = [
  {
    id: 'user-dario',
    name: 'Dario Dourado',
    email: 'dario@vilavitaparc.com',
    role: UserRole.ADMIN,
    assignedArea: 'Resort Geral',
    defaultBlock: BLOCK.SUPPORT,
    isOnDuty: true,
    shift: 'Geral',
    phoneDeviceId: 'ADM-01'
  },
  {
    id: 'user-filipa',
    name: 'Filipa Mendes',
    email: 'filipa.governanta@vilavitaparc.com',
    role: UserRole.SUPERVISOR,
    assignedArea: BLOCK.A,
    defaultBlock: BLOCK.A,
    isOnDuty: true,
    shift: 'Manhã',
    phoneDeviceId: 'GOV-01'
  },
  {
    id: 'user-ana',
    name: 'Ana Rodrigues',
    email: 'ana.governanta@vilavitaparc.com',
    role: UserRole.SUPERVISOR,
    assignedArea: BLOCK.C,
    defaultBlock: BLOCK.C,
    isOnDuty: true,
    shift: 'Manhã',
    phoneDeviceId: 'GOV-02'
  },
  {
    id: 'user-adriana',
    name: 'Adriana Silva',
    email: 'adriana@vilavitaparc.com',
    role: UserRole.HOUSEKEEPER,
    assignedArea: BLOCK.A,
    defaultBlock: BLOCK.A,
    isOnDuty: true,
    shift: 'Manhã',
    phoneDeviceId: 'TEL-AREA-06'
  },
  {
    id: 'user-patricia',
    name: 'Patrícia Gomes',
    email: 'patricia@vilavitaparc.com',
    role: UserRole.HOUSEKEEPER,
    assignedArea: BLOCK.B,
    defaultBlock: BLOCK.B,
    isOnDuty: true,
    shift: 'Manhã',
    phoneDeviceId: 'TEL-AREA-07'
  },
  {
    id: 'user-maria',
    name: 'Maria João',
    email: 'maria.joao@vilavitaparc.com',
    role: UserRole.HOUSEKEEPER,
    assignedArea: BLOCK.C,
    defaultBlock: BLOCK.C,
    isOnDuty: true,
    shift: 'Manhã',
    phoneDeviceId: 'TEL-AREA-01'
  },
  {
    id: 'user-sandra',
    name: 'Sandra Ferreira',
    email: 'sandra@vilavitaparc.com',
    role: UserRole.HOUSEKEEPER,
    assignedArea: BLOCK.OASIS,
    defaultBlock: BLOCK.OASIS,
    isOnDuty: true,
    shift: 'Manhã',
    phoneDeviceId: 'TEL-AREA-04'
  },
  {
    id: 'user-celia',
    name: 'Célia Duarte',
    email: 'celia.tarde@vilavitaparc.com',
    role: UserRole.HOUSEKEEPER,
    assignedArea: BLOCK.VILLAS,
    defaultBlock: BLOCK.VILLAS,
    isOnDuty: true,
    shift: 'Tarde 13h30',
    phoneDeviceId: 'TEL-AREA-02'
  },
  {
    id: 'user-extra-1',
    name: 'Extra #1 (Gás Extra)',
    email: 'extra1@vilavitaparc.com',
    role: UserRole.HOUSEKEEPER,
    assignedArea: BLOCK.SUPPORT,
    defaultBlock: BLOCK.SUPPORT,
    isOnDuty: true,
    shift: 'Manhã',
    isExtra: true,
    phoneDeviceId: 'EXTRA-01'
  },
  {
    id: 'user-extra-2',
    name: 'Beatriz Lima (Rotativa)',
    email: 'beatriz.lima@vilavitaparc.com',
    role: UserRole.HOUSEKEEPER,
    assignedArea: BLOCK.D,
    defaultBlock: BLOCK.D,
    isOnDuty: false,
    shift: 'Manhã',
    isExtra: false,
    phoneDeviceId: 'TEL-AREA-05',
    notes: 'Em dia de folga compensatória'
  },
  {
    id: 'user-rececao',
    name: 'Receção Front Office',
    email: 'reception@vilavitaparc.com',
    role: UserRole.RECEPTION,
    assignedArea: 'Front Desk',
    defaultBlock: BLOCK.SUPPORT,
    isOnDuty: true,
    shift: 'Geral'
  }
];

export const INITIAL_BLOCK_TEAMS: BlockTeam[] = [
  {
    id: 'team-bloco-a',
    block: BLOCK.A,
    name: 'Equipa Bloco A',
    description: 'Pisos 0, 1 e 2 · Ala Nascente',
    color: 'blue',
    supervisorName: 'Filipa Mendes'
  },
  {
    id: 'team-bloco-b',
    block: BLOCK.B,
    name: 'Equipa Bloco B',
    description: 'Pisos 0, 1 e 2 · Ala Central',
    color: 'indigo',
    supervisorName: 'Filipa Mendes'
  },
  {
    id: 'team-bloco-c',
    block: BLOCK.C,
    name: 'Equipa Bloco C',
    description: 'Pisos 1 e 2 · Ala Poente',
    color: 'violet',
    supervisorName: 'Ana Rodrigues'
  },
  {
    id: 'team-bloco-d',
    block: BLOCK.D,
    name: 'Equipa Bloco D',
    description: 'Pisos 0 e 1 · Ala Norte',
    color: 'emerald',
    supervisorName: 'Ana Rodrigues'
  },
  {
    id: 'team-oasis',
    block: BLOCK.OASIS,
    name: 'Equipa Oasis Parc',
    description: 'Suites Oasis & Jardins',
    color: 'amber',
    supervisorName: 'Ana Rodrigues'
  },
  {
    id: 'team-villas',
    block: BLOCK.VILLAS,
    name: 'Equipa Master Villas',
    description: 'Vilas Privadas & Piscinas',
    color: 'rose',
    supervisorName: 'Ana Rodrigues'
  },
  {
    id: 'team-apoio',
    block: BLOCK.SUPPORT,
    name: 'Equipa de Apoio & Extras',
    description: 'Reforço, Gás Extra, Estacionamento e Turno Tarde',
    color: 'slate',
    supervisorName: 'Dario Dourado'
  }
];

// ---------- Quartos e estadias (Opera) ----------

const room = (
  id: string, number: string, block: string, floor: number, typology: RoomTypology,
  operaStatus: RoomStatus, syncedAt: string, occupied: boolean
): Room => ({
  id, number, block, floor, typology, operaStatus,
  operaStatusUpdatedAt: todayAt(syncedAt), commercialBlock: CommercialBlock.NONE, occupied
});

export const INITIAL_ROOMS: Room[] = [
  room('room-101', '101', BLOCK.A, 1, RoomTypology.STANDARD, RoomStatus.DIRTY, '08:00', false),
  room('room-102', '102', BLOCK.A, 1, RoomTypology.STANDARD, RoomStatus.DIRTY, '08:00', true),
  room('room-103', '103', BLOCK.A, 1, RoomTypology.STANDARD, RoomStatus.CLEAN, '04:00', false),
  room('room-104', '104', BLOCK.A, 1, RoomTypology.JUNIOR_SUITE, RoomStatus.DIRTY, '08:00', false),
  room('room-201', '201', BLOCK.B, 2, RoomTypology.STANDARD, RoomStatus.DIRTY, '08:00', false),
  room('room-202', '202', BLOCK.B, 2, RoomTypology.STANDARD, RoomStatus.DIRTY, '08:00', true),
  room('room-203', '203', BLOCK.B, 2, RoomTypology.STANDARD, RoomStatus.CLEAN, '09:10', true),
  room('room-301', '301', BLOCK.C, 1, RoomTypology.JUNIOR_SUITE, RoomStatus.DIRTY, '08:00', false),
  room('room-302', '302', BLOCK.C, 1, RoomTypology.STANDARD, RoomStatus.INSPECTED, '08:45', true),
  room('room-501', '501', BLOCK.OASIS, 1, RoomTypology.SUITE, RoomStatus.DIRTY, '08:00', false),
  room('room-502', '502', BLOCK.OASIS, 1, RoomTypology.SUITE, RoomStatus.CLEAN, '04:00', false),
  room('room-601', 'Vila Atlântico', BLOCK.VILLAS, 1, RoomTypology.VILLA, RoomStatus.DIRTY, '08:00', true),
  room('room-602', 'Vila Praia', BLOCK.VILLAS, 1, RoomTypology.VILLA, RoomStatus.DIRTY, '08:00', false)
];

const stay = (roomId: string, movement: Movement, rest: Partial<RoomStay> & { adults: number; children: number }): RoomStay => ({
  roomId, date: TODAY, movement, childAges: [], isLinenChangeDue: false, traces: [], specials: [], ...rest
});

export const INITIAL_STAYS: RoomStay[] = [
  stay('room-101', Movement.DEPARTURE_ARRIVAL, {
    guestName: 'Dr. Klaus Schmidt', vipType: 'VIP 1', adults: 2, children: 1, childAges: [1],
    arrivalEta: '11:30 (Transfer Privado Aeroporto Faro)', departureEta: '10:00', isLinenChangeDue: true,
    instructions: 'Preparar berço com mosquiteiro e rosas de boas-vindas. Berço solicitado com urgência (criança de 1 ano e meio).',
    traces: ['Receção: Colocar berço e banheira de bebé', 'Guest Relations: Carta GM no quarto'],
    notes: 'Hóspede regular de Munique, 8ª estadia no resort.',
    specials: ['Rosas vermelhas', 'Champanhe Vila Vita na geleira'],
    preferences: 'Almofadas de penas, temperatura regulada a 21°C'
  }),
  stay('room-102', Movement.STAYOVER, {
    guestName: 'Família Martins', adults: 2, children: 2, childAges: [4, 7],
    instructions: 'Limpeza matinal após as 10:30 (família toma pequeno-almoço tardio).',
    traces: ['Toalhas de piscina adicionais'], notes: 'Estadia até sexta-feira.'
  }),
  stay('room-103', Movement.VACANT, {
    guestName: 'Sr. Alexander Weber', adults: 1, children: 0, arrivalEta: '15:00',
    instructions: 'Quarto limpo ontem. Fazer refresh de solo, varanda e arejamento.',
    traces: ['Verificar água mineral fresca e máquina Nespresso']
  }),
  stay('room-104', Movement.DEPARTURE_ONLY, {
    guestName: 'Quarto Vago após check-out', adults: 0, children: 0, isLinenChangeDue: true,
    instructions: 'Saída sem chegada hoje. Pode ser feito no fim do turno ou passado para amanhã.'
  }),
  stay('room-201', Movement.DEPARTURE_ARRIVAL, {
    guestName: 'Mme. Claire Dupont', vipType: 'VIP 2', adults: 2, children: 0, arrivalEta: '13:00', departureEta: '11:00',
    isLinenChangeDue: true, instructions: 'Lua de Mel: decorar cama com cisnes de toalhas e flores do jardim.',
    specials: ['Lua de Mel', 'Garrafa de espumante e morangos'], preferences: 'Travesseiros antialérgicos'
  }),
  stay('room-202', Movement.STAYOVER, {
    guestName: 'Sr. James Sterling', adults: 2, children: 0, isLinenChangeDue: true,
    instructions: 'Dia de Muda completa de lençóis e toalhões.', traces: ['Trocar roupões de banho por tamanho L']
  }),
  stay('room-203', Movement.STAYOVER, {
    guestName: 'Sra. Elena Ivanova', adults: 1, children: 0,
    instructions: 'Limpeza terminada pela Patrícia. A aguardar inspeção da governanta.'
  }),
  stay('room-301', Movement.DEPARTURE_ARRIVAL, {
    guestName: 'Mr. & Mrs. Robinson', vipType: 'Repeat Guest', adults: 2, children: 1, childAges: [5],
    arrivalEta: '14:00', isLinenChangeDue: true, instructions: 'Instalar cama extra e kit infantil Vila Vita.'
  }),
  stay('room-302', Movement.STAYOVER, {
    guestName: 'Sr. António Costa', adults: 2, children: 0, instructions: 'Inspecionado e aprovado pela Filipa às 08:45.'
  }),
  stay('room-501', Movement.DEPARTURE_ARRIVAL, {
    guestName: 'Família Al-Mansoor', vipType: 'VVIP', adults: 2, children: 3, childAges: [1, 4, 8], arrivalEta: '14:00',
    isLinenChangeDue: true, instructions: 'Suite presidencial com terraço. Berço especial + cama extra júnior.',
    traces: ['Receção: Fruteira exótica + champanhe Dom Pérignon', 'GM: Acompanhar entrada pessoalmente'],
    specials: ['Aniversário da criança de 4 anos - balões e bolo infantil'], preferences: 'Serviço discreto, água Fiji'
  }),
  stay('room-502', Movement.VACANT, {
    guestName: 'Lord & Lady Harrington', vipType: 'VIP 1', adults: 2, children: 0, arrivalEta: '16:30',
    instructions: 'Refresh antes da chegada das 16:30. Flores frescas e varanda arejada.'
  }),
  stay('room-601', Movement.STAYOVER, {
    guestName: 'Sr. Henrik Lindqvist', vipType: 'VVIP', adults: 4, children: 2, childAges: [3, 10], isLinenChangeDue: true,
    instructions: 'Vila de 4 quartos com piscina privada e jardim. Requer equipa de 2 empregadas.',
    traces: ['Toalhas de piscina e praia repostas no gazebo', 'Limpeza da cozinha e barbecue']
  }),
  stay('room-602', Movement.DEPARTURE_ARRIVAL, {
    guestName: 'Dra. Sofia Carvalheiro', vipType: 'VIP 1', adults: 2, children: 0, arrivalEta: '15:00', departureEta: '11:00',
    isLinenChangeDue: true, instructions: 'Preparação completa para casamento amanhã.'
  })
];

// ---------- Configuração base (secções) ----------

export const INITIAL_SECTIONS: Section[] = [
  { id: 'sec-1', name: 'Secção 01 · Bloco A Piso 1', block: BLOCK.A, defaultRoomIds: ['room-101', 'room-102', 'room-103', 'room-104'], defaultStaffIds: ['user-maria'] },
  { id: 'sec-3', name: 'Secção 03 · Master Villas', block: BLOCK.VILLAS, defaultRoomIds: ['room-601', 'room-602'], defaultStaffIds: ['user-celia'] },
  { id: 'sec-4', name: 'Secção 04 · Oasis Parc Suites', block: BLOCK.OASIS, defaultRoomIds: ['room-501', 'room-502'], defaultStaffIds: ['user-sandra'] },
  { id: 'sec-6', name: 'Secção 06 · Bloco C Pisos 1-2', block: BLOCK.C, defaultRoomIds: ['room-301', 'room-302'], defaultStaffIds: ['user-adriana'] },
  { id: 'sec-7', name: 'Secção 07 · Bloco B Piso 2', block: BLOCK.B, defaultRoomIds: ['room-201', 'room-202', 'room-203'], defaultStaffIds: ['user-patricia'] },
  { id: 'sec-8', name: 'Secção 08 · Bloco B Piso 1', block: BLOCK.B, defaultRoomIds: [], defaultStaffIds: [] },
  { id: 'sec-9', name: 'Secção 09 · Bloco D Ala Norte', block: BLOCK.D, defaultRoomIds: [], defaultStaffIds: [] }
];

// ---------- Distribuição de hoje: plano diurno e noturno (independentes) ----------

export const DAY_PLAN_ID = 'plan-day';
export const NIGHT_PLAN_ID = 'plan-night';

export const INITIAL_PLANS: ServicePlan[] = [
  { id: DAY_PLAN_ID, operationalDate: TODAY, kind: PlanKind.DAY, status: PlanStatus.ACTIVE },
  { id: NIGHT_PLAN_ID, operationalDate: TODAY, kind: PlanKind.NIGHT, status: PlanStatus.ACTIVE }
];

const lead = (staffId: string) => ({ staffId, role: SheetRole.LEAD });
const member = (staffId: string) => ({ staffId, role: SheetRole.MEMBER });

const sheet = (
  id: string, planId: string, number: number, title: string, block: string,
  extra: Partial<TaskSheet> = {}
): TaskSheet => ({ id, planId, number, title, block, isReserve: false, assignments: [], ...extra });

export const INITIAL_TASK_SHEETS: TaskSheet[] = [
  sheet('sheet-1', DAY_PLAN_ID, 1, 'Secção 01 · Bloco A Piso 1', BLOCK.A, { sectionId: 'sec-1', assignments: [lead('user-maria')] }),
  sheet('sheet-3', DAY_PLAN_ID, 3, 'Secção 03 · Master Villas', BLOCK.VILLAS, { sectionId: 'sec-3', assignments: [lead('user-extra-1'), member('user-celia')] }),
  sheet('sheet-4', DAY_PLAN_ID, 4, 'Secção 04 · Oasis Parc Suites', BLOCK.OASIS, { sectionId: 'sec-4', assignments: [lead('user-sandra')] }),
  sheet('sheet-6', DAY_PLAN_ID, 6, 'Secção 06 · Bloco C Pisos 1-2', BLOCK.C, { sectionId: 'sec-6', assignments: [lead('user-adriana')] }),
  sheet('sheet-7', DAY_PLAN_ID, 7, 'Secção 07 · Bloco B Piso 2', BLOCK.B, { sectionId: 'sec-7', assignments: [lead('user-patricia')] }),
  // - Sheets vazias têm de continuar visíveis (reunião §6.4)
  sheet('sheet-8', DAY_PLAN_ID, 8, 'Secção 08 · Bloco B Piso 1', BLOCK.B, { sectionId: 'sec-8' }),
  sheet('sheet-9', DAY_PLAN_ID, 9, 'Secção 09 · Bloco D Ala Norte', BLOCK.D, { sectionId: 'sec-9' }),
  sheet('sheet-21', DAY_PLAN_ID, 21, 'Secção 21 [Estacionamento] · Saídas p/ Amanhã', BLOCK.PARKING, {
    isReserve: true, notes: 'Quartos de saída sem chegada previstos para limpeza no dia seguinte.'
  }),
  sheet('sheet-22', DAY_PLAN_ID, 22, 'Secção 22 [Estacionamento] · Refreshes Pendentes', BLOCK.PARKING, {
    isReserve: true, notes: 'Quartos limpos que só serão inspecionados se houver antecipação de chegada.'
  }),
  sheet('td-1', NIGHT_PLAN_ID, 101, 'Turndown Zona 1 · Bloco A & B (Hotel)', 'Blocos A & B', {
    assignments: [lead('user-celia')], notes: 'Serviço das 18h00 às 21h30. Não comunica com o Opera.'
  }),
  sheet('td-2', NIGHT_PLAN_ID, 102, 'Turndown Zona 2 · Bloco C & D', 'Blocos C & D', {
    assignments: [lead('user-extra-2')], notes: 'Preparação noturna com chocolates e água mineral de cabeceira.'
  }),
  sheet('td-3', NIGHT_PLAN_ID, 103, 'Turndown Zona 3 · Oasis Suites & Vilas', 'Oasis & Vilas', {
    assignments: [lead('user-sandra')], notes: 'Vilas e suites com recolha de cortinas e velas aromáticas exteriores.'
  })
];

const MOVEMENT_OF = new Map(INITIAL_STAYS.map(s => [s.roomId, s.movement]));

const task = (
  roomId: string, sheetId: string, orderIndex: number, kind: TaskKind,
  extra: Partial<ServiceTask> = {}
): ServiceTask => ({
  id: `task-${roomId.replace('room-', '')}-${kind.toLowerCase()}`,
  planId: sheetId.startsWith('td-') ? NIGHT_PLAN_ID : DAY_PLAN_ID,
  sheetId, roomId, kind,
  movement: MOVEMENT_OF.get(roomId) ?? Movement.VACANT,
  status: TaskStatus.PENDING,
  isPriority: false,
  orderIndex,
  inspectionStatus: kind === TaskKind.CLEANING ? InspectionStatus.PENDING : InspectionStatus.NOT_REQUIRED,
  executorIds: [],
  onBehalfOfTeam: false,
  ...extra
});

const completed = (workerId: string, from: string, to: string, seconds: number): Partial<ServiceTask> => ({
  status: TaskStatus.COMPLETED, startedAt: todayAt(from), finishedAt: todayAt(to), durationSeconds: seconds,
  startedById: workerId, executorIds: [workerId]
});

const priority = (origin: PriorityOrigin, reason: string): Partial<ServiceTask> => ({
  isPriority: true, priorityOrigin: origin, priorityReason: reason
});

const NIGHT_ROOMS: Record<string, string[]> = {
  'td-1': ['room-101', 'room-102', 'room-103', 'room-201', 'room-202', 'room-203'],
  'td-2': ['room-301', 'room-302'],
  'td-3': ['room-501', 'room-502', 'room-601', 'room-602']
};

export const INITIAL_TASKS: ServiceTask[] = [
  // Plano diurno
  task('room-101', 'sheet-1', 0, TaskKind.CLEANING, priority(PriorityOrigin.RECEPTION, 'Chegada antecipada VIP 11:30')),
  task('room-102', 'sheet-1', 1, TaskKind.CLEANING),
  task('room-103', 'sheet-1', 2, TaskKind.REFRESH),
  task('room-104', 'sheet-21', 0, TaskKind.CLEANING),
  task('room-201', 'sheet-7', 0, TaskKind.CLEANING, priority(PriorityOrigin.HOUSEKEEPING, 'Chegada às 13:00')),
  task('room-202', 'sheet-7', 1, TaskKind.CLEANING),
  task('room-203', 'sheet-7', 2, TaskKind.CLEANING, completed('user-patricia', '08:30', '09:10', 2400)),
  task('room-301', 'sheet-6', 0, TaskKind.CLEANING),
  task('room-302', 'sheet-6', 1, TaskKind.CLEANING, { ...completed('user-adriana', '08:00', '08:35', 2100), inspectionStatus: InspectionStatus.APPROVED }),
  task('room-501', 'sheet-4', 0, TaskKind.CLEANING, priority(PriorityOrigin.RECEPTION, 'Chegada VIP Suite 14:00')),
  task('room-502', 'sheet-4', 1, TaskKind.REFRESH),
  task('room-601', 'sheet-3', 0, TaskKind.CLEANING),
  task('room-602', 'sheet-3', 1, TaskKind.CLEANING, priority(PriorityOrigin.HOUSEKEEPING, 'Chegada às 15:00')),
  // Plano noturno (turndown): tarefas próprias dos mesmos quartos
  ...Object.entries(NIGHT_ROOMS).flatMap(([sheetId, roomIds]) =>
    roomIds.map((roomId, index) => task(roomId, sheetId, index, TaskKind.TURNDOWN))
  )
];

// ---------- Histórico, Opera e alertas ----------

const SYSTEM = { registeredById: 'system-opera', registeredByName: 'Opera Cloud OHIP', registeredByRole: 'PMS Sync', executorIds: [], onBehalfOfTeam: false };

const byUser = (userId: string, name: string, role: string, onBehalf = false) => ({
  registeredById: userId, registeredByName: name, registeredByRole: role, executorIds: [userId], onBehalfOfTeam: onBehalf
});

export const INITIAL_EVENTS: TaskEvent[] = [
  { id: 'ev-seed-9', occurredAt: todayAt('08:45'), type: 'INSPECTION_APPROVED', roomId: 'room-302', roomNumber: '302', taskId: 'task-302-cleaning',
    ...byUser('user-filipa', 'Filipa Mendes', 'supervisor'), executorIds: [], supervisorId: 'user-filipa',
    detail: { key: 'events.inspectionApproved', params: { name: 'Filipa Mendes' } } },
  { id: 'ev-seed-8', occurredAt: todayAt('08:35'), type: 'ROOM_FINISHED', roomId: 'room-302', roomNumber: '302', taskId: 'task-302-cleaning',
    ...byUser('user-adriana', 'Adriana Silva', 'housekeeper'), durationSeconds: 2100,
    detail: { key: 'events.roomFinished', params: { name: 'Adriana Silva', minutes: 35 } } },
  { id: 'ev-seed-7', occurredAt: todayAt('08:00'), type: 'ROOM_STARTED', roomId: 'room-302', roomNumber: '302', taskId: 'task-302-cleaning',
    ...byUser('user-adriana', 'Adriana Silva', 'housekeeper'), detail: { key: 'events.roomStarted', params: { name: 'Adriana Silva' } } },
  { id: 'ev-seed-6', occurredAt: todayAt('09:10'), type: 'ROOM_FINISHED', roomId: 'room-203', roomNumber: '203', taskId: 'task-203-cleaning',
    ...byUser('user-patricia', 'Patrícia Gomes', 'housekeeper'), durationSeconds: 2400,
    detail: { key: 'events.roomFinished', params: { name: 'Patrícia Gomes', minutes: 40 } } },
  { id: 'ev-seed-5', occurredAt: todayAt('08:30'), type: 'ROOM_STARTED', roomId: 'room-203', roomNumber: '203', taskId: 'task-203-cleaning',
    ...byUser('user-patricia', 'Patrícia Gomes', 'housekeeper'), detail: { key: 'events.roomStarted', params: { name: 'Patrícia Gomes' } } },
  { id: 'ev-seed-1', occurredAt: todayAt('08:00'), type: 'OPERA_SYNC_PULL', roomId: 'room-101', roomNumber: '101', ...SYSTEM, detail: { key: 'events.seedPull' } },
  // - refreshes de dias anteriores: a contagem por quarto sai dos eventos, não de um contador guardado
  { id: 'ev-hist-3', occurredAt: todayAt('15:00', -1), type: 'REFRESH_RECORDED', roomId: 'room-502', roomNumber: '502', ...byUser('user-filipa', 'Filipa Mendes', 'supervisor'), detail: { key: 'events.refreshRecorded', params: { name: 'Filipa Mendes' } } },
  { id: 'ev-hist-2', occurredAt: todayAt('11:00', -1), type: 'REFRESH_RECORDED', roomId: 'room-502', roomNumber: '502', ...byUser('user-filipa', 'Filipa Mendes', 'supervisor'), detail: { key: 'events.refreshRecorded', params: { name: 'Filipa Mendes' } } },
  { id: 'ev-hist-1', occurredAt: todayAt('15:00', -1), type: 'REFRESH_RECORDED', roomId: 'room-103', roomNumber: '103', ...byUser('user-filipa', 'Filipa Mendes', 'supervisor'), detail: { key: 'events.refreshRecorded', params: { name: 'Filipa Mendes' } } }
];

const job = (
  id: string, roomId: string | null, direction: OperaSyncJob['direction'], previous: RoomStatus, target: RoomStatus,
  at: string, sourceKey: string
): OperaSyncJob => ({
  id, roomId, direction, previousStatus: previous, targetStatus: target, state: SyncState.CONFIRMED, attempts: 1,
  idempotencyKey: `seed-${id}`, createdAt: todayAt(at), operaObservedAt: todayAt(at), source: { key: sourceKey }
});

export const INITIAL_SYNC_JOBS: OperaSyncJob[] = [
  job('job-seed-4', 'room-302', 'APP_TO_OPERA', RoomStatus.CLEAN, RoomStatus.INSPECTED, '08:45', 'opera.source.inspectionApproved'),
  job('job-seed-3', 'room-302', 'APP_TO_OPERA', RoomStatus.DIRTY, RoomStatus.CLEAN, '08:35', 'opera.source.cleanFinished'),
  job('job-seed-2', 'room-203', 'APP_TO_OPERA', RoomStatus.DIRTY, RoomStatus.CLEAN, '09:10', 'opera.source.cleanFinished'),
  job('job-seed-1', 'room-101', 'OPERA_TO_APP', RoomStatus.DIRTY, RoomStatus.DIRTY, '08:00', 'opera.source.openDay')
];

export const INITIAL_ALERTS: RoomAlert[] = [
  {
    id: 'alt-init-1',
    timestamp: todayAt('08:15'),
    roomId: 'room-101',
    roomNumber: '101',
    targetWorkerName: 'Maria João',
    targetArea: BLOCK.A,
    type: 'RECEPTION_TRACE',
    message: { key: 'alerts.seedTrace', params: { number: '101' } },
    acknowledged: false
  }
];

