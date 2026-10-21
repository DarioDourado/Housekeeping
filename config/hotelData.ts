import { Room, RoomStatus, ServiceType, RoomTypology, TaskSheet, ServiceShift, BlockTeam } from '../types/housekeeping.types';
import { User, UserRole } from '../types/auth.types';

export const INITIAL_STAFF: User[] = [
  {
    id: 'user-dario',
    name: 'Dario Dourado',
    email: 'dario@vilavitaparc.com',
    role: UserRole.ADMIN,
    assignedArea: 'Resort Geral',
    defaultBlock: 'Apoio & Rotativas',
    isOnDuty: true,
    shift: 'Geral',
    phoneDeviceId: 'ADM-01'
  },
  {
    id: 'user-filipa',
    name: 'Filipa Mendes',
    email: 'filipa.governanta@vilavitaparc.com',
    role: UserRole.SUPERVISOR,
    assignedArea: 'Bloco A',
    defaultBlock: 'Bloco A',
    isOnDuty: true,
    shift: 'Manhã',
    phoneDeviceId: 'GOV-01'
  },
  {
    id: 'user-ana',
    name: 'Ana Rodrigues',
    email: 'ana.governanta@vilavitaparc.com',
    role: UserRole.SUPERVISOR,
    assignedArea: 'Bloco C',
    defaultBlock: 'Bloco C',
    isOnDuty: true,
    shift: 'Manhã',
    phoneDeviceId: 'GOV-02'
  },
  {
    id: 'user-adriana',
    name: 'Adriana Silva',
    email: 'adriana@vilavitaparc.com',
    role: UserRole.HOUSEKEEPER,
    assignedArea: 'Bloco A',
    defaultBlock: 'Bloco A',
    isOnDuty: true,
    shift: 'Manhã',
    assignedSheetId: 'sheet-6',
    phoneDeviceId: 'TEL-AREA-06'
  },
  {
    id: 'user-patricia',
    name: 'Patrícia Gomes',
    email: 'patricia@vilavitaparc.com',
    role: UserRole.HOUSEKEEPER,
    assignedArea: 'Bloco B',
    defaultBlock: 'Bloco B',
    isOnDuty: true,
    shift: 'Manhã',
    assignedSheetId: 'sheet-7',
    phoneDeviceId: 'TEL-AREA-07'
  },
  {
    id: 'user-maria',
    name: 'Maria João',
    email: 'maria.joao@vilavitaparc.com',
    role: UserRole.HOUSEKEEPER,
    assignedArea: 'Bloco C',
    defaultBlock: 'Bloco C',
    isOnDuty: true,
    shift: 'Manhã',
    assignedSheetId: 'sheet-1',
    phoneDeviceId: 'TEL-AREA-01'
  },
  {
    id: 'user-sandra',
    name: 'Sandra Ferreira',
    email: 'sandra@vilavitaparc.com',
    role: UserRole.HOUSEKEEPER,
    assignedArea: 'Oasis Parc',
    defaultBlock: 'Oasis Parc',
    isOnDuty: true,
    shift: 'Manhã',
    assignedSheetId: 'sheet-4',
    phoneDeviceId: 'TEL-AREA-04'
  },
  {
    id: 'user-celia',
    name: 'Célia Duarte',
    email: 'celia.tarde@vilavitaparc.com',
    role: UserRole.HOUSEKEEPER,
    assignedArea: 'Master Villas',
    defaultBlock: 'Master Villas',
    isOnDuty: true,
    shift: 'Tarde 13h30',
    assignedSheetId: 'sheet-3',
    phoneDeviceId: 'TEL-AREA-02'
  },
  {
    id: 'user-extra-1',
    name: 'Extra #1 (Gás Extra)',
    email: 'extra1@vilavitaparc.com',
    role: UserRole.HOUSEKEEPER,
    assignedArea: 'Apoio & Rotativas',
    defaultBlock: 'Apoio & Rotativas',
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
    assignedArea: 'Bloco D',
    defaultBlock: 'Bloco D',
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
    defaultBlock: 'Apoio & Rotativas',
    isOnDuty: true,
    shift: 'Geral'
  }
];


export const INITIAL_ROOMS: Room[] = [
  // BLOCO A
  {
    id: 'room-101',
    number: '101',
    block: 'Bloco A',
    floor: 1,
    typology: RoomTypology.STANDARD,
    morningStatus: RoomStatus.DIRTY,
    operaStatus: RoomStatus.DIRTY,
    operaLastSyncedAt: '08:00',
    serviceType: ServiceType.DEPARTURE_ARRIVAL,
    turndownStatus: RoomStatus.DIRTY,
    turndownRequired: true,
    turndownSheetId: 'td-1',
    isPriority: true,
    prioritySetBy: 'Receção',
    priorityReason: 'Chegada antecipada VIP 11:30',
    assignedSheetId: 'sheet-1',
    orderIndex: 0,
    guest: {
      guestName: 'Dr. Klaus Schmidt',
      vipType: 'VIP 1',
      adults: 2,
      children: 1,
      childAges: '1 ano e meio (Berço solicitado com urgência)',
      arrivalEta: '11:30 (Transfer Privado Aeroporto Faro)',
      departureEta: '10:00',
      isLinenChangeDue: true,
      dailyInstructions: 'Preparar berço com mosquiteiro e rosas de boas-vindas.',
      traces: ['Receção: Colocar berço e banheira de bebé', 'Guest Relations: Carta GM no quarto'],
      notes: 'Hóspede regular de Munique, 8ª estadia no resort.',
      specials: ['Rosas vermelhas', 'Champanhe Vila Vita na geleira'],
      preferences: 'Almofadas de penas, temperatura regulada a 21°C'
    },
    operational: {
      totalRefreshCount: 0,
      isDND: false,
      isRefusedService: false
    }
  },
  {
    id: 'room-102',
    number: '102',
    block: 'Bloco A',
    floor: 1,
    typology: RoomTypology.STANDARD,
    morningStatus: RoomStatus.DIRTY,
    operaStatus: RoomStatus.DIRTY,
    operaLastSyncedAt: '08:00',
    serviceType: ServiceType.STAYOVER,
    turndownStatus: RoomStatus.DIRTY,
    turndownRequired: true,
    turndownSheetId: 'td-1',
    isPriority: false,
    assignedSheetId: 'sheet-1',
    orderIndex: 1,
    guest: {
      guestName: 'Família Martins',
      adults: 2,
      children: 2,
      childAges: '4 anos e 7 anos',
      isLinenChangeDue: false,
      dailyInstructions: 'Limpeza matinal após as 10:30 (família toma pequeno-almoço tardio).',
      traces: ['Toalhas de piscina adicionais'],
      notes: 'Estadia até sexta-feira.'
    },
    operational: {
      totalRefreshCount: 0,
      isDND: false,
      isRefusedService: false
    }
  },
  {
    id: 'room-103',
    number: '103',
    block: 'Bloco A',
    floor: 1,
    typology: RoomTypology.STANDARD,
    morningStatus: RoomStatus.CLEAN,
    operaStatus: RoomStatus.CLEAN,
    operaLastSyncedAt: '04:00 (Night Audit)',
    serviceType: ServiceType.REFRESH,
    turndownStatus: RoomStatus.DIRTY,
    turndownRequired: true,
    turndownSheetId: 'td-1',
    isPriority: false,
    assignedSheetId: 'sheet-1',
    orderIndex: 2,
    guest: {
      guestName: 'Sr. Alexander Weber',
      adults: 1,
      children: 0,
      arrivalEta: '15:00',
      isLinenChangeDue: false,
      dailyInstructions: 'Quarto limpo ontem. Fazer refresh de solo, varanda e arejamento.',
      traces: ['Verificar água mineral fresca e máquina Nespresso']
    },
    operational: {
      totalRefreshCount: 1,
      isDND: false,
      isRefusedService: false
    }
  },
  {
    id: 'room-104',
    number: '104',
    block: 'Bloco A',
    floor: 1,
    typology: RoomTypology.JUNIOR_SUITE,
    morningStatus: RoomStatus.DIRTY,
    operaStatus: RoomStatus.DIRTY,
    operaLastSyncedAt: '08:00',
    serviceType: ServiceType.DEPARTURE_ONLY,
    turndownStatus: RoomStatus.CLEAN,
    turndownRequired: false,
    isPriority: false,
    assignedSheetId: 'sheet-21', // Estacionado para amanhã conforme reunião
    orderIndex: 3,
    guest: {
      guestName: 'Quarto Vago após check-out',
      adults: 0,
      children: 0,
      isLinenChangeDue: true,
      dailyInstructions: 'Saída sem chegada hoje. Pode ser feito no fim do turno ou passado para amanhã.'
    },
    operational: {
      totalRefreshCount: 0,
      isDND: false,
      isRefusedService: false
    }
  },

  // BLOCO B
  {
    id: 'room-201',
    number: '201',
    block: 'Bloco B',
    floor: 2,
    typology: RoomTypology.STANDARD,
    morningStatus: RoomStatus.DIRTY,
    operaStatus: RoomStatus.DIRTY,
    operaLastSyncedAt: '08:00',
    serviceType: ServiceType.DEPARTURE_ARRIVAL,
    turndownStatus: RoomStatus.DIRTY,
    turndownRequired: true,
    turndownSheetId: 'td-1',
    isPriority: true,
    prioritySetBy: 'Governanta',
    priorityReason: 'Chegada às 13:00',
    assignedSheetId: 'sheet-7',
    orderIndex: 0,
    guest: {
      guestName: 'Mme. Claire Dupont',
      vipType: 'VIP 2',
      adults: 2,
      children: 0,
      arrivalEta: '13:00',
      departureEta: '11:00',
      isLinenChangeDue: true,
      dailyInstructions: 'Lua de Mel: decorar cama com cisnes de toalhas e flores do jardim.',
      specials: ['Lua de Mel', 'Garrafa de espumante e morangos'],
      preferences: 'Travesseiros antialérgicos'
    },
    operational: {
      totalRefreshCount: 0,
      isDND: false,
      isRefusedService: false
    }
  },
  {
    id: 'room-202',
    number: '202',
    block: 'Bloco B',
    floor: 2,
    typology: RoomTypology.STANDARD,
    morningStatus: RoomStatus.DIRTY,
    operaStatus: RoomStatus.DIRTY,
    operaLastSyncedAt: '08:00',
    serviceType: ServiceType.STAYOVER,
    turndownStatus: RoomStatus.DIRTY,
    turndownRequired: true,
    turndownSheetId: 'td-1',
    isPriority: false,
    assignedSheetId: 'sheet-7',
    orderIndex: 1,
    guest: {
      guestName: 'Sr. James Sterling',
      adults: 2,
      children: 0,
      isLinenChangeDue: true,
      dailyInstructions: 'Dia de Muda completa de lençóis e toalhões.',
      traces: ['Trocar roupões de banho por tamanho L']
    },
    operational: {
      totalRefreshCount: 0,
      isDND: false,
      isRefusedService: false
    }
  },
  {
    id: 'room-203',
    number: '203',
    block: 'Bloco B',
    floor: 2,
    typology: RoomTypology.STANDARD,
    morningStatus: RoomStatus.CLEAN,
    operaStatus: RoomStatus.CLEAN,
    operaLastSyncedAt: '09:10',
    serviceType: ServiceType.STAYOVER,
    turndownStatus: RoomStatus.DIRTY,
    turndownRequired: true,
    turndownSheetId: 'td-1',
    isPriority: false,
    assignedSheetId: 'sheet-7',
    orderIndex: 2,
    guest: {
      guestName: 'Sra. Elena Ivanova',
      adults: 1,
      children: 0,
      isLinenChangeDue: false,
      dailyInstructions: 'Limpeza terminada pela Patrícia. A aguardar inspeção da governanta.'
    },
    operational: {
      totalRefreshCount: 0,
      activeStartTime: '08:30',
      activeEndTime: '09:10',
      activeWorkerName: 'Patrícia Gomes',
      lastDurationSeconds: 2400, // 40 minutos
      isDND: false,
      isRefusedService: false
    }
  },

  // BLOCO C
  {
    id: 'room-301',
    number: '301',
    block: 'Bloco C',
    floor: 1,
    typology: RoomTypology.JUNIOR_SUITE,
    morningStatus: RoomStatus.DIRTY,
    operaStatus: RoomStatus.DIRTY,
    operaLastSyncedAt: '08:00',
    serviceType: ServiceType.DEPARTURE_ARRIVAL,
    turndownStatus: RoomStatus.DIRTY,
    turndownRequired: true,
    turndownSheetId: 'td-2',
    isPriority: false,
    assignedSheetId: 'sheet-6',
    orderIndex: 0,
    guest: {
      guestName: 'Mr. & Mrs. Robinson',
      vipType: 'Repeat Guest',
      adults: 2,
      children: 1,
      childAges: '5 anos (Cama extra)',
      arrivalEta: '14:00',
      isLinenChangeDue: true,
      dailyInstructions: 'Instalar cama extra e kit infantil Vila Vita.'
    },
    operational: {
      totalRefreshCount: 0,
      isDND: false,
      isRefusedService: false
    }
  },
  {
    id: 'room-302',
    number: '302',
    block: 'Bloco C',
    floor: 1,
    typology: RoomTypology.STANDARD,
    morningStatus: RoomStatus.INSPECTED,
    operaStatus: RoomStatus.INSPECTED,
    operaLastSyncedAt: '08:45',
    serviceType: ServiceType.STAYOVER,
    turndownStatus: RoomStatus.DIRTY,
    turndownRequired: true,
    turndownSheetId: 'td-2',
    isPriority: false,
    assignedSheetId: 'sheet-6',
    orderIndex: 1,
    guest: {
      guestName: 'Sr. António Costa',
      adults: 2,
      children: 0,
      isLinenChangeDue: false,
      dailyInstructions: 'Inspecionado e aprovado pela Filipa às 08:45.'
    },
    operational: {
      totalRefreshCount: 0,
      activeStartTime: '08:00',
      activeEndTime: '08:35',
      activeWorkerName: 'Adriana Silva',
      lastDurationSeconds: 2100,
      isDND: false,
      isRefusedService: false
    }
  },

  // OASIS PARC
  {
    id: 'room-501',
    number: '501',
    block: 'Oasis Parc',
    floor: 1,
    typology: RoomTypology.SUITE,
    morningStatus: RoomStatus.DIRTY,
    operaStatus: RoomStatus.DIRTY,
    operaLastSyncedAt: '08:00',
    serviceType: ServiceType.DEPARTURE_ARRIVAL,
    turndownStatus: RoomStatus.DIRTY,
    turndownRequired: true,
    turndownSheetId: 'td-3',
    isPriority: true,
    prioritySetBy: 'Receção',
    priorityReason: 'Chegada VIP Suite 14:00',
    assignedSheetId: 'sheet-4',
    orderIndex: 0,
    guest: {
      guestName: 'Família Al-Mansoor',
      vipType: 'VVIP',
      adults: 2,
      children: 3,
      childAges: '1 ano (berço), 4 anos, 8 anos',
      arrivalEta: '14:00',
      isLinenChangeDue: true,
      dailyInstructions: 'Suite presidencial com terraço. Berço especial + cama extra júnior.',
      traces: ['Receção: Fruteira exótica + champanhe Dom Pérignon', 'GM: Acompanhar entrada pessoalmente'],
      specials: ['Aniversário da criança de 4 anos - balões e bolo infantil'],
      preferences: 'Serviço discreto, água Fiji'
    },
    operational: {
      totalRefreshCount: 0,
      isDND: false,
      isRefusedService: false
    }
  },
  {
    id: 'room-502',
    number: '502',
    block: 'Oasis Parc',
    floor: 1,
    typology: RoomTypology.SUITE,
    morningStatus: RoomStatus.CLEAN,
    operaStatus: RoomStatus.CLEAN,
    operaLastSyncedAt: '04:00 (Night Audit)',
    serviceType: ServiceType.REFRESH,
    turndownStatus: RoomStatus.DIRTY,
    turndownRequired: true,
    turndownSheetId: 'td-3',
    isPriority: false,
    assignedSheetId: 'sheet-4',
    orderIndex: 1,
    guest: {
      guestName: 'Lord & Lady Harrington',
      vipType: 'VIP 1',
      adults: 2,
      children: 0,
      arrivalEta: '16:30',
      isLinenChangeDue: false,
      dailyInstructions: 'Refresh antes da chegada das 16:30. Flores frescas e varanda arejada.'
    },
    operational: {
      totalRefreshCount: 2,
      isDND: false,
      isRefusedService: false
    }
  },

  // MASTER VILLAS
  {
    id: 'room-601',
    number: 'Vila Atlântico',
    block: 'Master Villas',
    floor: 1,
    typology: RoomTypology.VILLA,
    morningStatus: RoomStatus.DIRTY,
    operaStatus: RoomStatus.DIRTY,
    operaLastSyncedAt: '08:00',
    serviceType: ServiceType.STAYOVER,
    turndownStatus: RoomStatus.DIRTY,
    turndownRequired: true,
    turndownSheetId: 'td-3',
    isPriority: false,
    assignedSheetId: 'sheet-3',
    orderIndex: 0,
    guest: {
      guestName: 'Sr. Henrik Lindqvist',
      vipType: 'VVIP',
      adults: 4,
      children: 2,
      childAges: '3 anos e 10 anos',
      isLinenChangeDue: true,
      dailyInstructions: 'Vila de 4 quartos com piscina privada e jardim. Requer equipa de 2 empregadas.',
      traces: ['Toalhas de piscina e praia repostas no gazebo', 'Limpeza da cozinha e barbecue']
    },
    operational: {
      totalRefreshCount: 0,
      isDND: false,
      isRefusedService: false
    }
  },
  {
    id: 'room-602',
    number: 'Vila Praia',
    block: 'Master Villas',
    floor: 1,
    typology: RoomTypology.VILLA,
    morningStatus: RoomStatus.DIRTY,
    operaStatus: RoomStatus.DIRTY,
    operaLastSyncedAt: '08:00',
    serviceType: ServiceType.DEPARTURE_ARRIVAL,
    turndownStatus: RoomStatus.DIRTY,
    turndownRequired: true,
    turndownSheetId: 'td-3',
    isPriority: true,
    prioritySetBy: 'Governanta',
    priorityReason: 'Chegada às 15:00',
    assignedSheetId: 'sheet-3',
    orderIndex: 1,
    guest: {
      guestName: 'Dra. Sofia Carvalheiro',
      vipType: 'VIP 1',
      adults: 2,
      children: 0,
      arrivalEta: '15:00',
      departureEta: '11:00',
      isLinenChangeDue: true,
      dailyInstructions: 'Preparação completa para casamento amanhã.'
    },
    operational: {
      totalRefreshCount: 0,
      isDND: false,
      isRefusedService: false
    }
  }
];

export const INITIAL_TASK_SHEETS: TaskSheet[] = [
  {
    id: 'sheet-1',
    sheetNumber: 1,
    title: 'Secção 01 · Bloco A Piso 1',
    block: 'Bloco A',
    assignedUserIds: ['user-maria'],
    assignedUserNames: ['Maria João'],
    roomIds: ['room-101', 'room-102', 'room-103'],
    isParkingSheet: false,
    serviceShift: ServiceShift.MORNING
  },
  {
    id: 'sheet-3',
    sheetNumber: 3,
    title: 'Secção 03 · Master Villas',
    block: 'Master Villas',
    assignedUserIds: ['user-extra-1', 'user-celia'],
    assignedUserNames: ['Extra #1 (Gás Extra)', 'Célia Duarte'],
    roomIds: ['room-601', 'room-602'],
    isParkingSheet: false,
    serviceShift: ServiceShift.MORNING
  },
  {
    id: 'sheet-4',
    sheetNumber: 4,
    title: 'Secção 04 · Oasis Parc Suites',
    block: 'Oasis Parc',
    assignedUserIds: ['user-sandra'],
    assignedUserNames: ['Sandra Ferreira'],
    roomIds: ['room-501', 'room-502'],
    isParkingSheet: false,
    serviceShift: ServiceShift.MORNING
  },
  {
    id: 'sheet-6',
    sheetNumber: 6,
    title: 'Secção 06 · Bloco C Pisos 1-2',
    block: 'Bloco C',
    assignedUserIds: ['user-adriana'],
    assignedUserNames: ['Adriana Silva (Fixa)'],
    roomIds: ['room-301', 'room-302'],
    isParkingSheet: false,
    serviceShift: ServiceShift.MORNING
  },
  {
    id: 'sheet-7',
    sheetNumber: 7,
    title: 'Secção 07 · Bloco B Piso 2',
    block: 'Bloco B',
    assignedUserIds: ['user-patricia'],
    assignedUserNames: ['Patrícia Gomes (Fixa)'],
    roomIds: ['room-201', 'room-202', 'room-203'],
    isParkingSheet: false,
    serviceShift: ServiceShift.MORNING
  },
  // Sheets vazias necessárias (devem permanecer visíveis conforme reunião)
  {
    id: 'sheet-8',
    sheetNumber: 8,
    title: 'Secção 08 · Bloco B Piso 1',
    block: 'Bloco B',
    assignedUserIds: [],
    assignedUserNames: [],
    roomIds: [],
    isParkingSheet: false,
    serviceShift: ServiceShift.MORNING
  },
  {
    id: 'sheet-9',
    sheetNumber: 9,
    title: 'Secção 09 · Bloco D Ala Norte',
    block: 'Bloco D',
    assignedUserIds: [],
    assignedUserNames: [],
    roomIds: [],
    isParkingSheet: false,
    serviceShift: ServiceShift.MORNING
  },
  // Task sheets extras para estacionar quartos (Secção 4 dos requisitos: "exemplo 22 para 20 secções")
  {
    id: 'sheet-21',
    sheetNumber: 21,
    title: 'Secção 21 [Estacionamento] · Saídas p/ Amanhã',
    block: 'Estacionamento Geral',
    assignedUserIds: [],
    assignedUserNames: [],
    roomIds: ['room-104'],
    isParkingSheet: true,
    serviceShift: ServiceShift.MORNING,
    notes: 'Quartos de saída sem chegada previstos para limpeza no dia seguinte.'
  },
  {
    id: 'sheet-22',
    sheetNumber: 22,
    title: 'Secção 22 [Estacionamento] · Refreshes Pendentes',
    block: 'Estacionamento Geral',
    assignedUserIds: [],
    assignedUserNames: [],
    roomIds: [],
    isParkingSheet: true,
    serviceShift: ServiceShift.MORNING,
    notes: 'Quartos limpos que só serão inspecionados se houver antecipação de chegada.'
  }
];

export const INITIAL_TURNDOWN_GROUPS: TaskSheet[] = [
  {
    id: 'td-1',
    sheetNumber: 101,
    title: 'Turndown Zona 1 · Bloco A & B (Hotel)',
    block: 'Blocos A & B',
    assignedUserIds: ['user-celia'],
    assignedUserNames: ['Célia Duarte (Turno Tarde 13h30-22h)'],
    roomIds: ['room-101', 'room-102', 'room-103', 'room-201', 'room-202', 'room-203'],
    isParkingSheet: false,
    serviceShift: ServiceShift.TURNDOWN,
    notes: 'Serviço das 18h00 às 21h30. Não comunica com o Opera.'
  },
  {
    id: 'td-2',
    sheetNumber: 102,
    title: 'Turndown Zona 2 · Bloco C & D',
    block: 'Blocos C & D',
    assignedUserIds: ['user-extra-2'],
    assignedUserNames: ['Nova Admissão (Turno Noite 18h-23h)'],
    roomIds: ['room-301', 'room-302'],
    isParkingSheet: false,
    serviceShift: ServiceShift.TURNDOWN,
    notes: 'Preparação noturna com chocolates e água mineral de cabeceira.'
  },
  {
    id: 'td-3',
    sheetNumber: 103,
    title: 'Turndown Zona 3 · Oasis Suites & Vilas',
    block: 'Oasis & Vilas',
    assignedUserIds: ['user-sandra'],
    assignedUserNames: ['Sandra Ferreira'],
    roomIds: ['room-501', 'room-502', 'room-601', 'room-602'],
    isParkingSheet: false,
    serviceShift: ServiceShift.TURNDOWN,
    notes: 'Vilas e suites com recolha de cortinas e velas aromáticas exteriores.'
  }
];

export const INITIAL_BLOCK_TEAMS: BlockTeam[] = [
  {
    id: 'team-bloco-a',
    block: 'Bloco A',
    name: 'Equipa Bloco A',
    description: 'Pisos 0, 1 e 2 · Ala Nascente',
    color: 'blue',
    supervisorName: 'Filipa Mendes'
  },
  {
    id: 'team-bloco-b',
    block: 'Bloco B',
    name: 'Equipa Bloco B',
    description: 'Pisos 0, 1 e 2 · Ala Central',
    color: 'indigo',
    supervisorName: 'Filipa Mendes'
  },
  {
    id: 'team-bloco-c',
    block: 'Bloco C',
    name: 'Equipa Bloco C',
    description: 'Pisos 1 e 2 · Ala Poente',
    color: 'violet',
    supervisorName: 'Ana Rodrigues'
  },
  {
    id: 'team-bloco-d',
    block: 'Bloco D',
    name: 'Equipa Bloco D',
    description: 'Pisos 0 e 1 · Ala Norte',
    color: 'emerald',
    supervisorName: 'Ana Rodrigues'
  },
  {
    id: 'team-oasis',
    block: 'Oasis Parc',
    name: 'Equipa Oasis Parc',
    description: 'Suites Oasis & Jardins',
    color: 'amber',
    supervisorName: 'Ana Rodrigues'
  },
  {
    id: 'team-villas',
    block: 'Master Villas',
    name: 'Equipa Master Villas',
    description: 'Vilas Privadas & Piscinas',
    color: 'rose',
    supervisorName: 'Ana Rodrigues'
  },
  {
    id: 'team-apoio',
    block: 'Apoio & Rotativas',
    name: 'Equipa de Apoio & Extras',
    description: 'Reforço, Gás Extra, Estacionamento e Turno Tarde',
    color: 'slate',
    supervisorName: 'Dario Dourado'
  }
];
