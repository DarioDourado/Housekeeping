import { Room, TaskSheet, RoomEvent, RoomAlert, RoomStatus, ServiceType, RoomTypology, TaskSheetCounters, ServiceShift, BlockTeam } from '../../../types/housekeeping.types';
import { INITIAL_ROOMS, INITIAL_TASK_SHEETS, INITIAL_TURNDOWN_GROUPS, INITIAL_BLOCK_TEAMS } from '../../../config/hotelData';

const STORAGE_ROOMS = 'vvp_hk_rooms_v1';
const STORAGE_SHEETS = 'vvp_hk_sheets_v1';
const STORAGE_TURNDOWN = 'vvp_hk_turndown_v1';
const STORAGE_TEAMS = 'vvp_hk_teams_v1';
const STORAGE_EVENTS = 'vvp_hk_events_v1';
const STORAGE_ALERTS = 'vvp_hk_alerts_v1';
const STORAGE_OPERA_LOG = 'vvp_hk_opera_log_v1';

export interface OperaSyncLogEntry {
  id: string;
  timestamp: string;
  direction: 'APP_TO_OPERA' | 'OPERA_TO_APP';
  roomNumber: string;
  previousStatus: RoomStatus;
  newStatus: RoomStatus;
  sourceEvent: string;
  success: boolean;
  httpStatus: number;
}

export const housekeepingTransporter = {
  loadData: async (): Promise<{
    rooms: Room[];
    taskSheets: TaskSheet[];
    turndownGroups: TaskSheet[];
    teams: BlockTeam[];
    events: RoomEvent[];
    alerts: RoomAlert[];
    operaLogs: OperaSyncLogEntry[];
  }> => {
    if (typeof window === 'undefined') {
      return {
        rooms: INITIAL_ROOMS,
        taskSheets: INITIAL_TASK_SHEETS,
        turndownGroups: INITIAL_TURNDOWN_GROUPS,
        teams: INITIAL_BLOCK_TEAMS,
        events: [],
        alerts: [],
        operaLogs: []
      };
    }

    const roomsStr = localStorage.getItem(STORAGE_ROOMS);
    const sheetsStr = localStorage.getItem(STORAGE_SHEETS);
    const turndownStr = localStorage.getItem(STORAGE_TURNDOWN);
    const teamsStr = localStorage.getItem(STORAGE_TEAMS);
    const eventsStr = localStorage.getItem(STORAGE_EVENTS);
    const alertsStr = localStorage.getItem(STORAGE_ALERTS);
    const operaLogsStr = localStorage.getItem(STORAGE_OPERA_LOG);

    const rooms = roomsStr ? JSON.parse(roomsStr) : INITIAL_ROOMS;
    const taskSheets = sheetsStr ? JSON.parse(sheetsStr) : INITIAL_TASK_SHEETS;
    const turndownGroups = turndownStr ? JSON.parse(turndownStr) : INITIAL_TURNDOWN_GROUPS;
    const teams = teamsStr ? JSON.parse(teamsStr) : INITIAL_BLOCK_TEAMS;
    const events = eventsStr ? JSON.parse(eventsStr) : [
      {
        id: 'ev-init-1',
        timestamp: '08:00',
        roomId: 'room-101',
        roomNumber: '101',
        eventType: 'OPERA_SYNC_PULL',
        userId: 'system-opera',
        userName: 'Opera Cloud OHIP',
        userRole: 'PMS Sync',
        details: 'Importação inicial de status e traces da manhã (Vila Vita Parc)'
      }
    ];
    const alerts = alertsStr ? JSON.parse(alertsStr) : [
      {
        id: 'alt-init-1',
        timestamp: '08:15',
        roomId: 'room-101',
        roomNumber: '101',
        targetWorkerName: 'Maria João',
        targetArea: 'Bloco A',
        type: 'RECEPTION_TRACE',
        message: 'Receção solicita Berço e Banheira no Quarto 101 antes das 11:30 (Chegada Antecipada VIP 1)',
        acknowledged: false
      }
    ];
    const operaLogs = operaLogsStr ? JSON.parse(operaLogsStr) : [
      {
        id: 'op-log-1',
        timestamp: '08:00:12',
        direction: 'OPERA_TO_APP',
        roomNumber: '101',
        previousStatus: RoomStatus.DIRTY,
        newStatus: RoomStatus.DIRTY,
        sourceEvent: 'Abertura de Serviço Diário',
        success: true,
        httpStatus: 200
      }
    ];

    return { rooms, taskSheets, turndownGroups, teams, events, alerts, operaLogs };
  },

  saveData: (
    rooms: Room[],
    taskSheets: TaskSheet[],
    turndownGroups: TaskSheet[],
    teams: BlockTeam[],
    events: RoomEvent[],
    alerts: RoomAlert[],
    operaLogs: OperaSyncLogEntry[]
  ) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_ROOMS, JSON.stringify(rooms));
    localStorage.setItem(STORAGE_SHEETS, JSON.stringify(taskSheets));
    localStorage.setItem(STORAGE_TURNDOWN, JSON.stringify(turndownGroups));
    localStorage.setItem(STORAGE_TEAMS, JSON.stringify(teams));
    localStorage.setItem(STORAGE_EVENTS, JSON.stringify(events));
    localStorage.setItem(STORAGE_ALERTS, JSON.stringify(alerts));
    localStorage.setItem(STORAGE_OPERA_LOG, JSON.stringify(operaLogs));
  },

  calculateRoomCredits: (room: Room): number => {
    if (room.serviceType === ServiceType.REFRESH) return 0.5;
    const isDeparture = room.serviceType === ServiceType.DEPARTURE_ARRIVAL || room.serviceType === ServiceType.DEPARTURE_ONLY;
    switch (room.typology) {
      case RoomTypology.STANDARD:
        return isDeparture ? 2 : 1;
      case RoomTypology.JUNIOR_SUITE:
        return isDeparture ? 3 : 1.5;
      case RoomTypology.SUITE:
        return isDeparture ? 4 : 2;
      case RoomTypology.VILLA:
        return isDeparture ? 6 : 3;
      default:
        return 1;
    }
  },

  calculateCounters: (roomsInSheet: Room[]): TaskSheetCounters => {
    let stayoverCount = 0;
    let departureArrivalCount = 0;
    let departureOnlyCount = 0;
    let refreshCount = 0;
    let dirtyCount = 0;
    let cleanCount = 0;
    let inspectedCount = 0;
    let estimatedCredits = 0;

    for (const r of roomsInSheet) {
      if (r.serviceType === ServiceType.STAYOVER) stayoverCount++;
      else if (r.serviceType === ServiceType.DEPARTURE_ARRIVAL) departureArrivalCount++;
      else if (r.serviceType === ServiceType.DEPARTURE_ONLY) departureOnlyCount++;
      else if (r.serviceType === ServiceType.REFRESH) refreshCount++;

      if (r.morningStatus === RoomStatus.DIRTY) dirtyCount++;
      else if (r.morningStatus === RoomStatus.CLEAN) cleanCount++;
      else if (r.morningStatus === RoomStatus.INSPECTED) inspectedCount++;

      estimatedCredits += housekeepingTransporter.calculateRoomCredits(r);
    }

    return {
      totalRooms: roomsInSheet.length,
      stayoverCount,
      departureArrivalCount,
      departureOnlyCount,
      refreshCount,
      dirtyCount,
      cleanCount,
      inspectedCount,
      estimatedCredits
    };
  }
};
