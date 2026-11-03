import { BLOCK } from './constants';
import { todayAt } from '@/lib/clock';
import { operationalDate } from '@/lib/operationalDate';
import { UserRole, type User } from '@/types/auth.types';
import {
  CommercialBlock,
  InspectionStatus,
  Movement,
  NotPerformedReason,
  PlanKind,
  PriorityOrigin,
  RoomStatus,
  RoomTypology,
  SheetRole,
  TaskKind,
  TaskStatus,
  type Room,
  type RoomStay,
  type Section,
  type ServiceTask,
  type TaskSheet
} from '@/types/housekeeping.types';

// =====================================================================================
// MOCK DE VOLUME: completa as 7 secções "à mão" de hotelData.ts até 24 secções diurnas
// (+ 2 de estacionamento = 26 sheets) para testar a distribuição da manhã com carga real.
// Gerado de forma determinística: sem aleatoriedade, os testes e a UI vêem sempre o mesmo.
// =====================================================================================

const TODAY = operationalDate();

// - [nº da secção, bloco, descrição, piso, 1º nº de quarto, tipologia, nº de quartos]
type SectionSpec = [number, string, string, number, number, RoomTypology, number];

const SECTION_SPECS: SectionSpec[] = [
  [9, BLOCK.D, 'Bloco D Ala Norte', 1, 441, RoomTypology.STANDARD, 3],
  [2, BLOCK.A, 'Bloco A Piso 2', 2, 111, RoomTypology.STANDARD, 4],
  [5, BLOCK.C, 'Bloco C Piso 2', 2, 311, RoomTypology.STANDARD, 4],
  [10, BLOCK.A, 'Bloco A Piso 3', 3, 121, RoomTypology.STANDARD, 4],
  [11, BLOCK.A, 'Bloco A Piso 4', 4, 131, RoomTypology.JUNIOR_SUITE, 3],
  [12, BLOCK.B, 'Bloco B Piso 3', 3, 221, RoomTypology.STANDARD, 4],
  [13, BLOCK.B, 'Bloco B Piso 3 Ala Sul', 3, 231, RoomTypology.STANDARD, 4],
  [14, BLOCK.B, 'Bloco B Piso 4', 4, 241, RoomTypology.JUNIOR_SUITE, 3],
  [15, BLOCK.C, 'Bloco C Piso 3', 3, 321, RoomTypology.STANDARD, 4],
  [16, BLOCK.C, 'Bloco C Piso 3 Ala Sul', 3, 331, RoomTypology.JUNIOR_SUITE, 3],
  [17, BLOCK.D, 'Bloco D Piso 0', 0, 401, RoomTypology.STANDARD, 4],
  [18, BLOCK.D, 'Bloco D Piso 1', 1, 411, RoomTypology.STANDARD, 4],
  [19, BLOCK.D, 'Bloco D Piso 1 Ala Sul', 1, 421, RoomTypology.STANDARD, 4],
  [20, BLOCK.D, 'Bloco D Piso 2', 2, 431, RoomTypology.JUNIOR_SUITE, 3],
  [21, BLOCK.OASIS, 'Oasis Parc Piso 1', 1, 511, RoomTypology.SUITE, 3],
  [22, BLOCK.OASIS, 'Oasis Parc Jardins', 0, 521, RoomTypology.SUITE, 3],
  [23, BLOCK.VILLAS, 'Master Villas Nascente', 1, 603, RoomTypology.VILLA, 2],
  [24, BLOCK.VILLAS, 'Master Villas Poente', 1, 605, RoomTypology.VILLA, 2]
];

const VILLA_NAMES: Record<number, string> = { 603: 'Vila Sol', 604: 'Vila Lua', 605: 'Vila Pinhal', 606: 'Vila Golfe' };

// - 50 camareiras: nome e apelido combinados de forma determinística (sem repetidos)
const FIRST_NAMES = [
  'Rita', 'Joana', 'Teresa', 'Carla', 'Inês', 'Marta', 'Paula', 'Sofia', 'Helena', 'Lúcia',
  'Cristina', 'Vera', 'Rosa', 'Fátima', 'Diana', 'Alice', 'Bruna', 'Susana', 'Mónica', 'Daniela'
];
const LAST_NAMES = [
  'Almeida', 'Pereira', 'Nunes', 'Sousa', 'Barros', 'Carvalho', 'Teixeira', 'Ramos', 'Pinto', 'Moreira',
  'Lopes', 'Antunes', 'Matos', 'Correia', 'Cardoso', 'Faria', 'Marques', 'Rocha', 'Vieira', 'Cunha'
];
const HOUSEKEEPER_COUNT = 50;
const HOUSEKEEPERS = Array.from({ length: HOUSEKEEPER_COUNT }, (_, i) =>
  `${FIRST_NAMES[i % 20]} ${LAST_NAMES[(i * 7 + 3 + Math.floor(i / 20)) % 20]}`);

// - informação de serviço da noite (turndown): preferências, traces e specials dos hóspedes
const NIGHT_PREFERENCES = [
  'Abrir a cama e deixar chinelos e roupão',
  'Chocolates e água mineral de cabeceira',
  'Cobertor extra e cortinas fechadas',
  'Almofada extra; luzes de cabeceira acesas',
  'Ar condicionado a 21°C antes das 21:00',
  'Preparar cama de bebé e reforçar toalhas'
];
const NIGHT_TRACES = ['Prefere cama virada só de um lado', 'Não deixar chocolates (diabético)', 'Costuma pedir gelo à noite', 'Alérgico a frutos secos'];
const NIGHT_SPECIALS = ['Aniversário', 'Lua de mel', 'Aniversário de casamento'];

const GUESTS = [
  'Sr. Thomas Becker', 'Mme. Isabelle Laurent', 'Família Oliveira', 'Mr. & Mrs. Hughes', 'Sra. Marta Seixas',
  'Dr. Pieter Van Dijk', 'Família Rossi', 'Sr. Nuno Tavares', 'Ms. Emily Carter', 'Herr Jonas Keller'
];

const INSTRUCTIONS = [
  'Limpeza após as 10:30: hóspedes dormem até tarde.',
  'Repor toalhas de piscina e água mineral fresca.',
  'Preparar berço com mosquiteiro antes da chegada.',
  'Alergia a penas: usar almofadas antialérgicas.',
  'Não mexer nos pertences em cima da secretária.',
  'Arejar o quarto e limpar a varanda com cuidado.'
];

// - ciclo de movimentos por quarto gerado: cobre saída+chegada, estadia, vago e saída sem chegada
const MOVEMENTS = [Movement.DEPARTURE_ARRIVAL, Movement.STAYOVER, Movement.STAYOVER, Movement.VACANT, Movement.DEPARTURE_ONLY];

const DEPARTING_GUESTS = [
  'Sr. Paul Weissmann', 'Mme. Anne Girard', 'Família Santos', 'Mr. & Mrs. Dalton', 'Sra. Carla Pimentel',
  'Dr. Lars Nilsson', 'Família Bianchi', 'Sr. Rui Fontes'
];

// - Datas completas e nomes de quem sai/entra, derivados do movimento (sem sobrepor o que o stay já traz).
//   A hora de check-in vem do ETA; o check-out sem hora conhecida assume 11:00.
export const withTimeline = (stay: RoomStay, seed: number): RoomStay => {
  const eta = stay.arrivalEta?.match(/^\d{1,2}:\d{2}/)?.[0] ?? '15:00';
  const departing = DEPARTING_GUESTS[seed % DEPARTING_GUESTS.length]!;
  const timeline: Partial<RoomStay> = {
    [Movement.DEPARTURE_ARRIVAL]: { checkInAt: todayAt(eta), checkOutAt: todayAt('11:00', 2 + (seed % 5)), departingGuestName: departing, arrivingGuestName: stay.guestName },
    [Movement.STAYOVER]: { checkInAt: todayAt('15:00', -(1 + (seed % 3))), checkOutAt: todayAt('11:00', 1 + (seed % 4)) },
    [Movement.VACANT]: { checkInAt: todayAt(eta), checkOutAt: todayAt('11:00', 2 + (seed % 4)), arrivingGuestName: stay.guestName },
    [Movement.DEPARTURE_ONLY]: { checkInAt: todayAt('15:00', -(2 + (seed % 3))), checkOutAt: todayAt(stay.departureEta ?? '11:00'), departingGuestName: departing }
  }[stay.movement];
  return { ...timeline, ...stay };
};

export const PARKING_SHEET_IDS = ['sheet-25', 'sheet-26'] as const;
const PARKING_SHEETS = [
  { number: 25, title: 'Secção 25 [Estacionamento] · Saídas p/ Amanhã', notes: 'Quartos de saída sem chegada previstos para limpeza no dia seguinte.' },
  { number: 26, title: 'Secção 26 [Estacionamento] · Refreshes Pendentes', notes: 'Quartos limpos que só serão inspecionados se houver antecipação de chegada.' }
];

// - hotelData.ts já traz td-1..td-3; o volume gera as restantes até 14 zonas de turndown
const NIGHT_FIRST_SHEET = 4;
const NIGHT_SHEET_COUNT = 11;

export const buildVolumeData = (dayPlanId: string, nightPlanId: string) => {
  const staff: User[] = HOUSEKEEPERS.map((name, index) => ({
    id: `user-hk-${index + 1}`, name, email: `${name.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/\s+/g, '.')}@vilavitaparc.com`,
    role: UserRole.HOUSEKEEPER, isOnDuty: true, shift: 'Manhã', phoneDeviceId: `TEL-AREA-${String(index + 10).padStart(2, '0')}`
  }));
  const rooms: Room[] = [];
  const stays: RoomStay[] = [];
  const sections: Section[] = [];
  const sheets: TaskSheet[] = [];
  const tasks: ServiceTask[] = [];

  // - as primeiras camareiras lideram uma secção cada; as restantes entram como membros, à vez
  const teamNumbers = [...SECTION_SPECS.map(spec => spec[0]), ...PARKING_SHEETS.map(sheet => sheet.number)];
  const teams = new Map(teamNumbers.map((n, i) => [n, [staff[i]!.id]]));
  staff.slice(teamNumbers.length).forEach((user, i) => teams.get(teamNumbers[i % teamNumbers.length]!)!.push(user.id));
  const assignTeam = (n: number, block: string) => {
    const staffIds = teams.get(n)!;
    staffIds.forEach(id => Object.assign(staff.find(user => user.id === id)!, { assignedArea: block, defaultBlock: block }));
    return staffIds;
  };
  const assignments = (staffIds: string[]) =>
    staffIds.map((staffId, i) => ({ staffId, role: i === 0 ? SheetRole.LEAD : SheetRole.MEMBER }));

  let roomIndex = 0;
  SECTION_SPECS.forEach(([n, block, label, floor, first, typology, count]) => {
    const staffIds = assignTeam(n, block);
    const staffId = staffIds[0];
    const sectionId = `sec-${n}`;
    const sheetId = `sheet-${n}`;
    const title = `Secção ${String(n).padStart(2, '0')} · ${label}`;
    const roomIds: string[] = [];

    Array.from({ length: count }, (_, i) => first + i).forEach(number => {
      const g = roomIndex++;
      const movement = MOVEMENTS[g % MOVEMENTS.length]!;
      const roomId = `room-${number}`;
      const finished = movement === Movement.STAYOVER && g % 4 === 1 && !!staffId;
      const clean = movement === Movement.VACANT || finished;
      roomIds.push(roomId);
      rooms.push({
        id: roomId, number: VILLA_NAMES[number] ?? String(number), block, floor, typology,
        operaStatus: clean ? RoomStatus.CLEAN : RoomStatus.DIRTY, operaStatusUpdatedAt: todayAt(clean ? '08:50' : '08:00'),
        commercialBlock: CommercialBlock.NONE, occupied: movement === Movement.STAYOVER
      });

      const arrives = movement === Movement.DEPARTURE_ARRIVAL;
      const guestName = movement === Movement.DEPARTURE_ONLY ? 'Quarto Vago após check-out' : GUESTS[g % GUESTS.length];
      stays.push(withTimeline({
        roomId, date: TODAY, movement, guestName, adults: movement === Movement.DEPARTURE_ONLY ? 0 : 2, children: g % 3 === 0 ? 1 + (g % 2) : 0,
        childAges: g % 3 === 0 ? [6, 3].slice(0, 1 + (g % 2)) : [], isLinenChangeDue: arrives || g % 3 === 0,
        arrivalEta: arrives || movement === Movement.VACANT ? `${13 + (g % 4)}:00` : undefined,
        departureEta: arrives ? '11:00' : undefined, traces: g % 4 === 0 ? [NIGHT_TRACES[(g / 4) % NIGHT_TRACES.length]!] : [], specials: g % 5 === 0 ? [NIGHT_SPECIALS[(g / 5) % NIGHT_SPECIALS.length]!] : [],
        instructions: INSTRUCTIONS[g % INSTRUCTIONS.length], preferences: NIGHT_PREFERENCES[g % NIGHT_PREFERENCES.length],
        ...(g % 7 === 0 && { vipType: 'VIP 1', preferences: 'Almofadas extra e água mineral fresca' })
      }, g));

      // - saída sem chegada vai para o estacionamento (como o room-104); vago só precisa de refresh
      const kind = movement === Movement.VACANT ? TaskKind.REFRESH : TaskKind.CLEANING;
      const onSheet = movement === Movement.DEPARTURE_ONLY ? PARKING_SHEET_IDS[0] : kind === TaskKind.REFRESH && g % 2 === 1 ? PARKING_SHEET_IDS[1] : sheetId;
      tasks.push({
        id: `task-${number}-${kind.toLowerCase()}`, planId: dayPlanId, sheetId: onSheet, roomId, kind, movement,
        status: finished ? TaskStatus.COMPLETED : TaskStatus.PENDING, isPriority: false,
        // - o room-104 (hotelData) já ocupa a posição 0 do primeiro estacionamento
        orderIndex: tasks.filter(t => t.sheetId === onSheet).length + (onSheet === PARKING_SHEET_IDS[0] ? 1 : 0),
        inspectionStatus: kind === TaskKind.CLEANING ? InspectionStatus.PENDING : InspectionStatus.NOT_REQUIRED,
        executorIds: finished ? [staffId!] : [], onBehalfOfTeam: false,
        ...(finished && { startedAt: todayAt('08:20'), finishedAt: todayAt('08:50'), durationSeconds: 1800, startedById: staffId }),
        ...(arrives && g % 2 === 0 && { isPriority: true, priorityOrigin: PriorityOrigin.RECEPTION, priorityReason: `Chegada às ${13 + (g % 4)}:00` })
      });
    });

    sections.push({ id: sectionId, name: title, kind: PlanKind.DAY, block, defaultRoomIds: roomIds, defaultStaffIds: staffIds });
    sheets.push({
      id: sheetId, planId: dayPlanId, number: n, title, block, sectionId, isReserve: false,
      assignments: assignments(staffIds)
    });
  });

  PARKING_SHEETS.forEach(({ number, title, notes }) =>
    sheets.push({
      id: `sheet-${number}`, planId: dayPlanId, number, title, block: BLOCK.PARKING, isReserve: true, notes,
      assignments: assignments(assignTeam(number, BLOCK.PARKING))
    })
  );

  // - Turndown: quartos ocupados esta noite (estadia ou chegada, como no plano gerado em planningCommands) repartidos
  //   por NIGHT_SHEET_COUNT zonas contíguas; cada zona tem 2 pessoas (a 1ª lidera). Alguns estados de exemplo.
  const occupied = stays.filter(stay => stay.movement === Movement.STAYOVER || stay.movement === Movement.DEPARTURE_ARRIVAL);
  const nightStates: Partial<ServiceTask>[] = [
    { status: TaskStatus.IN_PROGRESS, startedAt: todayAt('18:40') },
    { status: TaskStatus.NOT_PERFORMED, notPerformedReason: NotPerformedReason.DND },
    { status: TaskStatus.NOT_PERFORMED, notPerformedReason: NotPerformedReason.REFUSE_SERVICE },
    { status: TaskStatus.NOT_PERFORMED, notPerformedReason: NotPerformedReason.ALREADY_DONE }
  ];
  Array.from({ length: NIGHT_SHEET_COUNT }, (_, zone) => {
    const zoneStays = occupied.slice(Math.floor(zone * occupied.length / NIGHT_SHEET_COUNT), Math.floor((zone + 1) * occupied.length / NIGHT_SHEET_COUNT));
    const crew = [staff[2 * zone]!, staff[2 * zone + 1]!];
    const blocks = Array.from(new Set(zoneStays.map(stay => rooms.find(room => room.id === stay.roomId)!.block)));
    const sheetId = `td-${NIGHT_FIRST_SHEET + zone}`;
    sheets.push({
      id: sheetId, planId: nightPlanId, number: 101 + NIGHT_FIRST_SHEET + zone - 1, title: `Turndown Zona ${NIGHT_FIRST_SHEET + zone} · ${blocks.join(' & ')}`,
      block: blocks.join(' & '), isReserve: false, assignments: assignments(crew.map(user => user.id))
    });
    zoneStays.forEach((stay, index) => {
      const sample = (zone + index) % 3 === 0 ? nightStates[(zone * 2 + index) % nightStates.length] : undefined;
      tasks.push({
        id: `task-${stay.roomId.replace('room-', '')}-turndown`, planId: nightPlanId, sheetId, roomId: stay.roomId, kind: TaskKind.TURNDOWN,
        movement: stay.movement, status: TaskStatus.PENDING, isPriority: false, orderIndex: index, inspectionStatus: InspectionStatus.NOT_REQUIRED,
        executorIds: [], onBehalfOfTeam: false,
        ...(sample && { ...sample, startedById: crew[0]!.id, ...(sample.status !== TaskStatus.NOT_PERFORMED && { executorIds: [crew[0]!.id] }) })
      });
    });
  });

  return { staff, rooms, stays, sections, sheets, tasks };
};
