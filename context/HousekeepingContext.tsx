'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo
} from 'react';
import {
  Room,
  TaskSheet,
  RoomEvent,
  RoomAlert,
  RoomStatus,
  ServiceShift,
  ServiceType,
  BlockTeam
} from '../types/housekeeping.types';
import {
  housekeepingTransporter,
  OperaSyncLogEntry
} from '../services/transporters/housekeeping/housekeepingTransporter';
import { useAuth } from '../hooks/auth/useAuth';

interface HousekeepingContextType {
  rooms: Room[];
  taskSheets: TaskSheet[];
  turndownGroups: TaskSheet[];
  blockTeams: BlockTeam[];
  events: RoomEvent[];
  alerts: RoomAlert[];
  operaLogs: OperaSyncLogEntry[];
  loading: boolean;
  selectedRoom: Room | null;
  setSelectedRoom: (room: Room | null) => void;

  // Operational Actions
  startRoom: (roomId: string) => Promise<void>;
  finishRoom: (roomId: string) => Promise<void>;
  inspectRoom: (roomId: string) => Promise<void>;
  reproveInspection: (roomId: string, note: string) => Promise<void>;
  markRoomDirty: (roomId: string, reason?: string) => Promise<void>;
  recordRefresh: (roomId: string) => Promise<void>;
  recordDND: (roomId: string) => Promise<void>;
  recordRefuseService: (roomId: string) => Promise<void>;
  togglePriority: (roomId: string, reason?: string) => Promise<void>;
  
  // Drag and Drop & Notifications
  draggingRoomId: string | null;
  setDraggingRoomId: (id: string | null) => void;
  draggingStaffId: string | null;
  setDraggingStaffId: (id: string | null) => void;
  moveToast: { message: string; timestamp: number } | null;
  dismissMoveToast: () => void;

  // Sheet Management
  moveRoomToSheet: (roomId: string, targetSheetId: string, targetIndex?: number) => Promise<void>;
  mergeSheets: (sourceSheetId: string, targetSheetId: string) => Promise<void>;
  reorderRoomsInSheet: (sheetId: string, roomIds: string[]) => Promise<void>;
  assignStaffToSheet: (sheetId: string, userIds: string[], userNames: string[]) => Promise<void>;

  // Team & Block Configuration (Configuração de Blocos & Baseline)
  moveStaffToBlock: (staffId: string, targetBlock: string) => Promise<void>;
  updateBlockTeam: (team: BlockTeam) => Promise<void>;
  addBlockTeam: (team: Omit<BlockTeam, 'id'>) => Promise<void>;
  deleteBlockTeam: (teamId: string) => Promise<void>;
  updateRoom: (room: Room) => Promise<void>;
  addRoom: (room: Omit<Room, 'id'>) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
  moveRoomToBlock: (roomId: string, targetBlock: string) => Promise<void>;
  restoreDailyToDefaultBaseline: () => Promise<void>;
  
  // Turndown Actions
  updateTurndownStatus: (roomId: string, status: RoomStatus) => Promise<void>;
  assignTurndownGroup: (groupId: string, userIds: string[], userNames: string[]) => Promise<void>;
  moveRoomToTurndownGroup: (roomId: string, targetGroupId: string) => Promise<void>;

  // Opera Integration Simulation
  triggerNightAudit: () => Promise<void>;
  syncWithOpera: (roomId?: string) => Promise<void>;

  // Alerts
  acknowledgeAlert: (alertId: string) => Promise<void>;
  sendTraceAlert: (roomId: string, message: string) => Promise<void>;

  // Reset to default factory preset
  resetToDailyPreset: () => Promise<void>;
}

export const HousekeepingContext = createContext<HousekeepingContextType | undefined>(undefined);

export const useHousekeeping = () => {
  const context = useContext(HousekeepingContext);
  if (!context) {
    throw new Error('useHousekeeping must be used within a HousekeepingProvider');
  }
  return context;
};

export const HousekeepingProvider = ({ children }: { children: ReactNode }) => {
  const { user, users, updateUser } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [taskSheets, setTaskSheets] = useState<TaskSheet[]>([]);
  const [turndownGroups, setTurndownGroups] = useState<TaskSheet[]>([]);
  const [blockTeams, setBlockTeams] = useState<BlockTeam[]>([]);
  const [events, setEvents] = useState<RoomEvent[]>([]);
  const [alerts, setAlerts] = useState<RoomAlert[]>([]);
  const [operaLogs, setOperaLogs] = useState<OperaSyncLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [draggingRoomId, setDraggingRoomId] = useState<string | null>(null);
  const [draggingStaffId, setDraggingStaffId] = useState<string | null>(null);
  const [moveToast, setMoveToast] = useState<{ message: string; timestamp: number } | null>(null);

  const dismissMoveToast = useCallback(() => {
    setMoveToast(null);
  }, []);

  // Carregar dados na inicialização
  useEffect(() => {
    const init = async () => {
      const data = await housekeepingTransporter.loadData();
      setRooms(data.rooms);
      setTaskSheets(data.taskSheets);
      setTurndownGroups(data.turndownGroups);
      setBlockTeams(data.teams);
      setEvents(data.events);
      setAlerts(data.alerts);
      setOperaLogs(data.operaLogs);
      setLoading(false);
    };
    init();
  }, []);

  // Helper para salvar dados
  const saveState = useCallback((
    newRooms: Room[],
    newSheets: TaskSheet[],
    newTurndown: TaskSheet[],
    newEvents: RoomEvent[],
    newAlerts: RoomAlert[],
    newLogs: OperaSyncLogEntry[],
    newTeams?: BlockTeam[]
  ) => {
    const teamsToSave = newTeams || blockTeams;
    setRooms(newRooms);
    setTaskSheets(newSheets);
    setTurndownGroups(newTurndown);
    if (newTeams) setBlockTeams(newTeams);
    setEvents(newEvents);
    setAlerts(newAlerts);
    setOperaLogs(newLogs);
    housekeepingTransporter.saveData(newRooms, newSheets, newTurndown, teamsToSave, newEvents, newAlerts, newLogs);
  }, [blockTeams]);

  const addEvent = useCallback((
    roomId: string,
    roomNumber: string,
    eventType: RoomEvent['eventType'],
    details?: string,
    durationSeconds?: number
  ): RoomEvent => {
    const time = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const ev: RoomEvent = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: time,
      roomId,
      roomNumber,
      eventType,
      userId: user?.id || 'sys',
      userName: user?.name || 'Sistema',
      userRole: user?.role || 'operator',
      details,
      durationSeconds
    };
    return ev;
  }, [user]);

  // AÇÃO: Iniciar Quarto
  const startRoom = useCallback(async (roomId: string) => {
    const nowIso = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    let targetNumber = '';

    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        targetNumber = r.number;
        return {
          ...r,
          operational: {
            ...r.operational,
            activeStartTime: nowIso,
            activeWorkerId: user?.id,
            activeWorkerName: user?.name,
            isDND: false,
            isRefusedService: false
          }
        };
      }
      return r;
    });

    const ev = addEvent(roomId, targetNumber, 'ROOM_STARTED', `Início de serviço às ${timeStr} por ${user?.name}`);
    const newEvents = [ev, ...events];
    saveState(updatedRooms, taskSheets, turndownGroups, newEvents, alerts, operaLogs);
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, user, addEvent, saveState]);

  // AÇÃO: Terminar Quarto (Dirty -> Clean, sincroniza com Opera)
  const finishRoom = useCallback(async (roomId: string) => {
    const now = new Date();
    const nowIso = now.toISOString();
    const timeStr = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    let targetNumber = '';
    let duration = 1800; // default 30 min se não houver startTime

    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        targetNumber = r.number;
        if (r.operational.activeStartTime) {
          const start = new Date(r.operational.activeStartTime).getTime();
          duration = Math.max(60, Math.floor((now.getTime() - start) / 1000));
        }
        return {
          ...r,
          morningStatus: RoomStatus.CLEAN,
          operaStatus: RoomStatus.CLEAN,
          operaLastSyncedAt: timeStr,
          operational: {
            ...r.operational,
            activeEndTime: nowIso,
            lastDurationSeconds: duration
          }
        };
      }
      return r;
    });

    const ev = addEvent(
      roomId,
      targetNumber,
      'ROOM_FINISHED',
      `Quarto finalizado por ${user?.name} (Duração: ${Math.round(duration / 60)} min). Estado Opera: CLEAN.`,
      duration
    );

    const operaLog: OperaSyncLogEntry = {
      id: `op-${Date.now()}`,
      timestamp: timeStr,
      direction: 'APP_TO_OPERA',
      roomNumber: targetNumber,
      previousStatus: RoomStatus.DIRTY,
      newStatus: RoomStatus.CLEAN,
      sourceEvent: 'Empregada finalizou limpeza na app',
      success: true,
      httpStatus: 200
    };

    saveState(updatedRooms, taskSheets, turndownGroups, [ev, ...events], alerts, [operaLog, ...operaLogs]);
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, user, addEvent, saveState]);

  // AÇÃO: Inspecionar e Aprovar (Clean -> Inspected, sincroniza com Opera)
  const inspectRoom = useCallback(async (roomId: string) => {
    const timeStr = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    let targetNumber = '';

    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        targetNumber = r.number;
        return {
          ...r,
          morningStatus: RoomStatus.INSPECTED,
          operaStatus: RoomStatus.INSPECTED,
          operaLastSyncedAt: timeStr,
          operational: {
            ...r.operational,
            inspectionReprovalNote: undefined
          }
        };
      }
      return r;
    });

    const ev = addEvent(
      roomId,
      targetNumber,
      'INSPECTION_APPROVED',
      `Aprovado pela Governanta ${user?.name}. Quarto pronto para a Receção atribuir. Estado Opera: INSPECTED.`
    );

    const operaLog: OperaSyncLogEntry = {
      id: `op-${Date.now()}`,
      timestamp: timeStr,
      direction: 'APP_TO_OPERA',
      roomNumber: targetNumber,
      previousStatus: RoomStatus.CLEAN,
      newStatus: RoomStatus.INSPECTED,
      sourceEvent: 'Governanta aprovou inspeção',
      success: true,
      httpStatus: 200
    };

    saveState(updatedRooms, taskSheets, turndownGroups, [ev, ...events], alerts, [operaLog, ...operaLogs]);
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, user, addEvent, saveState]);

  // AÇÃO: Reprovar Inspeção (mantém Clean, NÃO é um estado no Opera, envia alerta com nota para a empregada)
  const reproveInspection = useCallback(async (roomId: string, note: string) => {
    const timeStr = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    let targetNumber = '';
    let areaBlock = '';
    let workerName = '';

    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        targetNumber = r.number;
        areaBlock = r.block;
        workerName = r.operational.activeWorkerName || 'Responsável de Área';
        return {
          ...r,
          morningStatus: RoomStatus.CLEAN, // Permanece Clean conforme regra do requisito!
          operational: {
            ...r.operational,
            inspectionReprovalNote: note,
            inspectionReprovalAt: timeStr,
            inspectionReprovalAcknowledged: false
          }
        };
      }
      return r;
    });

    const ev = addEvent(
      roomId,
      targetNumber,
      'INSPECTION_REPROVED',
      `Inspeção Reprovada pela Governanta ${user?.name}. Nota: "${note}". Quarto permanece Clean.`
    );

    const alert: RoomAlert = {
      id: `alt-${Date.now()}`,
      timestamp: timeStr,
      roomId,
      roomNumber: targetNumber,
      targetWorkerName: workerName,
      targetArea: areaBlock,
      type: 'REPROVAL',
      message: `Correção solicitada no Quarto ${targetNumber} por ${user?.name}: "${note}"`,
      acknowledged: false
    };

    saveState(updatedRooms, taskSheets, turndownGroups, [ev, ...events], [alert, ...alerts], operaLogs);
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, user, addEvent, saveState]);

  // AÇÃO: Voltar a marcar Dirty (governanta ou reabertura)
  const markRoomDirty = useCallback(async (roomId: string, reason = 'Reabertura pela Governanta') => {
    const timeStr = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    let targetNumber = '';

    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        targetNumber = r.number;
        return {
          ...r,
          morningStatus: RoomStatus.DIRTY,
          operaStatus: RoomStatus.DIRTY,
          operaLastSyncedAt: timeStr
        };
      }
      return r;
    });

    const ev = addEvent(roomId, targetNumber, 'PRIORITY_TOGGLED', `Quarto colocado como DIRTY: ${reason}`);
    saveState(updatedRooms, taskSheets, turndownGroups, [ev, ...events], alerts, operaLogs);
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, addEvent, saveState]);

  // AÇÃO: Registar Refresh
  const recordRefresh = useCallback(async (roomId: string) => {
    const timeStr = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    let targetNumber = '';

    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        targetNumber = r.number;
        return {
          ...r,
          operational: {
            ...r.operational,
            totalRefreshCount: (r.operational.totalRefreshCount || 0) + 1
          }
        };
      }
      return r;
    });

    const ev = addEvent(roomId, targetNumber, 'REFRESH_RECORDED', `Refresh executado por ${user?.name} às ${timeStr}`);
    saveState(updatedRooms, taskSheets, turndownGroups, [ev, ...events], alerts, operaLogs);
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, user, addEvent, saveState]);

  // AÇÃO: Registar DND (Não incomodar)
  const recordDND = useCallback(async (roomId: string) => {
    const timeStr = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    let targetNumber = '';

    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        targetNumber = r.number;
        return {
          ...r,
          operational: {
            ...r.operational,
            isDND: true,
            dndRecordedAt: timeStr
          }
        };
      }
      return r;
    });

    const ev = addEvent(roomId, targetNumber, 'DND_RECORDED', `Hóspede colocou sinal Do Not Disturb às ${timeStr}`);
    saveState(updatedRooms, taskSheets, turndownGroups, [ev, ...events], alerts, operaLogs);
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, addEvent, saveState]);

  // AÇÃO: Registar Recusa de Serviço
  const recordRefuseService = useCallback(async (roomId: string) => {
    const timeStr = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    let targetNumber = '';

    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        targetNumber = r.number;
        return {
          ...r,
          operational: {
            ...r.operational,
            isRefusedService: true,
            refusedRecordedAt: timeStr
          }
        };
      }
      return r;
    });

    const ev = addEvent(roomId, targetNumber, 'SERVICE_REFUSED', `Hóspede recusou serviço de housekeeping às ${timeStr}`);
    saveState(updatedRooms, taskSheets, turndownGroups, [ev, ...events], alerts, operaLogs);
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, addEvent, saveState]);

  // AÇÃO: Alternar Prioridade Urgente
  const togglePriority = useCallback(async (roomId: string, reason?: string) => {
    let targetNumber = '';
    let newPriority = false;

    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        targetNumber = r.number;
        newPriority = !r.isPriority;
        return {
          ...r,
          isPriority: newPriority,
          prioritySetBy: newPriority ? (user?.role === 'reception' ? 'Receção' : 'Governanta') : undefined,
          priorityReason: newPriority ? (reason || 'Pedido urgente de entrada') : undefined
        };
      }
      return r;
    });

    const ev = addEvent(
      roomId,
      targetNumber,
      'PRIORITY_TOGGLED',
      newPriority ? `Prioridade URGENTE ativada por ${user?.name}: ${reason || 'Sem nota'}` : `Prioridade desativada`
    );

    saveState(updatedRooms, taskSheets, turndownGroups, [ev, ...events], alerts, operaLogs);
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, user, addEvent, saveState]);

  // AÇÃO: Mover Quarto entre Task Sheets (Drag & Drop)
  const moveRoomToSheet = useCallback(async (roomId: string, targetSheetId: string, targetIndex?: number) => {
    let targetNumber = '';
    const updatedSheets = taskSheets.map(s => {
      const roomFiltered = s.roomIds.filter(id => id !== roomId);
      if (s.id === targetSheetId) {
        if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= roomFiltered.length) {
          const newRoomIds = [...roomFiltered];
          newRoomIds.splice(targetIndex, 0, roomId);
          return { ...s, roomIds: newRoomIds };
        }
        return { ...s, roomIds: [...roomFiltered, roomId] };
      }
      return { ...s, roomIds: roomFiltered };
    });

    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        targetNumber = r.number;
        return { ...r, assignedSheetId: targetSheetId };
      }
      return r;
    });

    const targetSheet = taskSheets.find(s => s.id === targetSheetId);
    const targetTitle = targetSheet?.title || `Secção #${targetSheet?.sheetNumber || targetSheetId}`;

    const ev = addEvent(
      roomId,
      targetNumber,
      'MOVED_TASK_SHEET',
      `Quarto ${targetNumber} deslocado por drag-and-drop para ${targetTitle}`
    );

    setMoveToast({
      message: `Quarto ${targetNumber} deslocado com sucesso para ${targetTitle}!`,
      timestamp: Date.now()
    });

    saveState(updatedRooms, updatedSheets, turndownGroups, [ev, ...events], alerts, operaLogs);
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, addEvent, saveState]);

  // AÇÃO: Juntar duas Task Sheets (ex: vilas juntas)
  const mergeSheets = useCallback(async (sourceSheetId: string, targetSheetId: string) => {
    const source = taskSheets.find(s => s.id === sourceSheetId);
    const target = taskSheets.find(s => s.id === targetSheetId);
    if (!source || !target) return;

    const combinedRoomIds = Array.from(new Set([...target.roomIds, ...source.roomIds]));
    const combinedUserIds = Array.from(new Set([...target.assignedUserIds, ...source.assignedUserIds]));
    const combinedUserNames = Array.from(new Set([...target.assignedUserNames, ...source.assignedUserNames]));

    const updatedSheets = taskSheets.map(s => {
      if (s.id === targetSheetId) {
        return {
          ...s,
          roomIds: combinedRoomIds,
          assignedUserIds: combinedUserIds,
          assignedUserNames: combinedUserNames
        };
      }
      if (s.id === sourceSheetId) {
        return {
          ...s,
          roomIds: [] // fica vazia mas visível conforme regras!
        };
      }
      return s;
    });

    const updatedRooms = rooms.map(r => {
      if (source.roomIds.includes(r.id)) {
        return { ...r, assignedSheetId: targetSheetId };
      }
      return r;
    });

    const ev = addEvent(
      'batch',
      'Multi',
      'MOVED_TASK_SHEET',
      `Secção ${source.title} fundida na Secção ${target.title}`
    );

    saveState(updatedRooms, updatedSheets, turndownGroups, [ev, ...events], alerts, operaLogs);
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, addEvent, saveState]);

  // AÇÃO: Reordenar quartos
  const reorderRoomsInSheet = useCallback(async (sheetId: string, roomIds: string[]) => {
    const updatedSheets = taskSheets.map(s => s.id === sheetId ? { ...s, roomIds } : s);
    saveState(rooms, updatedSheets, turndownGroups, events, alerts, operaLogs);
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, saveState]);

  // AÇÃO: Atribuir Pessoal à Sheet
  const assignStaffToSheet = useCallback(async (sheetId: string, userIds: string[], userNames: string[]) => {
    const updatedSheets = taskSheets.map(s => s.id === sheetId ? { ...s, assignedUserIds: userIds, assignedUserNames: userNames } : s);
    saveState(rooms, updatedSheets, turndownGroups, events, alerts, operaLogs);
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, saveState]);

  // AÇÃO: Mover/Associar Pessoa a um Bloco (Drag & Drop de Equipas por Bloco)
  const moveStaffToBlock = useCallback(async (staffId: string, targetBlock: string) => {
    const targetUser = users.find(u => u.id === staffId);
    if (!targetUser) return;

    const previousArea = targetUser.assignedArea || 'Geral';
    const updated = {
      ...targetUser,
      assignedArea: targetBlock
    };
    await updateUser(updated);

    const ev = addEvent(
      'staff',
      targetUser.name,
      'MOVED_TASK_SHEET',
      `Colaboradora ${targetUser.name} transferida da equipa "${previousArea}" para a equipa "${targetBlock}" (Drag & Drop).`
    );

    setMoveToast({
      message: `${targetUser.name} associada com sucesso à Equipa do ${targetBlock}!`,
      timestamp: Date.now()
    });

    saveState(rooms, taskSheets, turndownGroups, [ev, ...events], alerts, operaLogs, blockTeams);
  }, [users, updateUser, addEvent, rooms, taskSheets, turndownGroups, blockTeams, events, alerts, operaLogs, saveState]);

  // AÇÃO: Atualizar e Criar Equipas de Bloco
  const updateBlockTeam = useCallback(async (updatedTeam: BlockTeam) => {
    const newTeams = blockTeams.map(t => t.id === updatedTeam.id ? updatedTeam : t);
    saveState(rooms, taskSheets, turndownGroups, events, alerts, operaLogs, newTeams);
  }, [blockTeams, rooms, taskSheets, turndownGroups, events, alerts, operaLogs, saveState]);

  const addBlockTeam = useCallback(async (newTeam: Omit<BlockTeam, 'id'>) => {
    const created: BlockTeam = {
      ...newTeam,
      id: `team-${Date.now()}`
    };
    const newTeams = [...blockTeams, created];
    saveState(rooms, taskSheets, turndownGroups, events, alerts, operaLogs, newTeams);
  }, [blockTeams, rooms, taskSheets, turndownGroups, events, alerts, operaLogs, saveState]);

  // AÇÃO: Eliminar Bloco / Equipa
  const deleteBlockTeam = useCallback(async (teamId: string) => {
    const newTeams = blockTeams.filter(t => t.id !== teamId);
    saveState(rooms, taskSheets, turndownGroups, events, alerts, operaLogs, newTeams);
  }, [blockTeams, rooms, taskSheets, turndownGroups, events, alerts, operaLogs, saveState]);

  // AÇÃO: Atualizar Quarto (Configuração de Locais / Quartos)
  const updateRoom = useCallback(async (updatedRoom: Room) => {
    const updatedRooms = rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r);
    saveState(updatedRooms, taskSheets, turndownGroups, events, alerts, operaLogs, blockTeams);
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, blockTeams, saveState]);

  // AÇÃO: Adicionar Novo Quarto / Local
  const addRoom = useCallback(async (newRoom: Omit<Room, 'id'>) => {
    const created: Room = {
      ...newRoom,
      id: `room-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
      defaultBlock: newRoom.defaultBlock || newRoom.block
    };
    const updatedRooms = [...rooms, created];
    saveState(updatedRooms, taskSheets, turndownGroups, events, alerts, operaLogs, blockTeams);
    setMoveToast({
      message: `Quarto ${created.number} adicionado com sucesso ao ${created.block}!`,
      timestamp: Date.now()
    });
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, blockTeams, saveState]);

  // AÇÃO: Eliminar Quarto / Local
  const deleteRoom = useCallback(async (roomId: string) => {
    const target = rooms.find(r => r.id === roomId);
    const updatedRooms = rooms.filter(r => r.id !== roomId);
    const updatedSheets = taskSheets.map(s => ({
      ...s,
      roomIds: s.roomIds.filter(id => id !== roomId)
    }));
    saveState(updatedRooms, updatedSheets, turndownGroups, events, alerts, operaLogs, blockTeams);
    if (target) {
      setMoveToast({
        message: `Quarto ${target.number} removido do sistema.`,
        timestamp: Date.now()
      });
    }
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, blockTeams, saveState]);

  // AÇÃO: Mover Quarto para Bloco (Configuração Default de Partida)
  const moveRoomToBlock = useCallback(async (roomId: string, targetBlock: string) => {
    const targetRoom = rooms.find(r => r.id === roomId);
    if (!targetRoom) return;

    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        return {
          ...r,
          block: targetBlock,
          defaultBlock: targetBlock
        };
      }
      return r;
    });

    // Encontrar sheet correspondente ao novo bloco
    const matchingSheet = taskSheets.find(s => s.block === targetBlock && !s.isParkingSheet);
    const updatedSheets = taskSheets.map(s => {
      const roomRemoved = s.roomIds.filter(id => id !== roomId);
      if (matchingSheet && s.id === matchingSheet.id) {
        return { ...s, roomIds: [...roomRemoved, roomId] };
      }
      return { ...s, roomIds: roomRemoved };
    });

    setMoveToast({
      message: `Quarto ${targetRoom.number} configurado para o ${targetBlock}!`,
      timestamp: Date.now()
    });

    saveState(updatedRooms, updatedSheets, turndownGroups, events, alerts, operaLogs, blockTeams);
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, blockTeams, saveState]);

  // AÇÃO: Restaurar Distribuição para o Baseline Default
  const restoreDailyToDefaultBaseline = useCallback(async () => {
    // Restaura colaboradores para os seus blocos default
    for (const u of users) {
      if (u.defaultBlock && u.assignedArea !== u.defaultBlock) {
        await updateUser({ ...u, assignedArea: u.defaultBlock });
      }
    }
    // Restaura quartos para os blocos default
    const updatedRooms = rooms.map(r => ({
      ...r,
      block: r.defaultBlock || r.block
    }));
    saveState(updatedRooms, taskSheets, turndownGroups, events, alerts, operaLogs, blockTeams);
    setMoveToast({
      message: 'Configuração default de partida aplicada com sucesso!',
      timestamp: Date.now()
    });
  }, [users, updateUser, rooms, taskSheets, turndownGroups, events, alerts, operaLogs, blockTeams, saveState]);

  // AÇÃO: Turndown Status (Isolado do Opera)
  const updateTurndownStatus = useCallback(async (roomId: string, status: RoomStatus) => {
    const timeStr = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    let targetNumber = '';

    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        targetNumber = r.number;
        return {
          ...r,
          turndownStatus: status,
          turndownCompletedAt: status === RoomStatus.CLEAN ? timeStr : r.turndownCompletedAt,
          turndownWorkerName: user?.name
        };
      }
      return r;
    });

    const ev = addEvent(
      roomId,
      targetNumber,
      'ROOM_FINISHED',
      `[TURNDOWN NOITE] Quarto marcado como ${status} por ${user?.name}. Sem envio ao Opera.`
    );

    saveState(updatedRooms, taskSheets, turndownGroups, [ev, ...events], alerts, operaLogs);
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, user, addEvent, saveState]);

  // AÇÃO: Atribuir grupo de Turndown
  const assignTurndownGroup = useCallback(async (groupId: string, userIds: string[], userNames: string[]) => {
    const updatedGroups = turndownGroups.map(g => g.id === groupId ? { ...g, assignedUserIds: userIds, assignedUserNames: userNames } : g);
    saveState(rooms, taskSheets, updatedGroups, events, alerts, operaLogs);
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, saveState]);

  // AÇÃO: Mover quarto para grupo de Turndown
  const moveRoomToTurndownGroup = useCallback(async (roomId: string, targetGroupId: string) => {
    const updatedGroups = turndownGroups.map(g => {
      const roomFiltered = g.roomIds.filter(id => id !== roomId);
      if (g.id === targetGroupId) {
        return { ...g, roomIds: [...roomFiltered, roomId] };
      }
      return { ...g, roomIds: roomFiltered };
    });
    const updatedRooms = rooms.map(r => r.id === roomId ? { ...r, turndownSheetId: targetGroupId } : r);
    saveState(updatedRooms, taskSheets, updatedGroups, events, alerts, operaLogs);
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, saveState]);

  // AÇÃO: Simular Night Audit (2h-4h da manhã no Opera)
  // Regra dos requisitos:
  // - Quartos Inspected não ocupados passam a Clean (no dia seguinte são refreshes)
  // - No-shows passam a Dirty
  const triggerNightAudit = useCallback(async () => {
    const timeStr = '03:15';
    let convertedToCleanCount = 0;
    let convertedToDirtyCount = 0;

    const updatedRooms = rooms.map(r => {
      // Se estava Inspected e é estadia ou vago, volta a Clean para forçar refresh
      if (r.morningStatus === RoomStatus.INSPECTED) {
        convertedToCleanCount++;
        return {
          ...r,
          morningStatus: RoomStatus.CLEAN,
          operaStatus: RoomStatus.CLEAN,
          operaLastSyncedAt: `${timeStr} (Night Audit)`,
          serviceType: ServiceType.REFRESH, // Torna-se refresh para o novo dia!
          operational: {
            ...r.operational,
            totalRefreshCount: r.operational.totalRefreshCount + 1
          }
        };
      }
      // Se era chegada esperada e não compareceu (no-show)
      if (r.serviceType === ServiceType.DEPARTURE_ARRIVAL && r.morningStatus === RoomStatus.CLEAN) {
        convertedToDirtyCount++;
        return {
          ...r,
          morningStatus: RoomStatus.DIRTY,
          operaStatus: RoomStatus.DIRTY,
          operaLastSyncedAt: `${timeStr} (Night Audit - No-Show)`,
          guest: {
            ...r.guest,
            traces: [...(r.guest.traces || []), 'Opera Night Audit: Hóspede No-Show. Reaberto para inspeção/limpeza']
          }
        };
      }
      return r;
    });

    const ev = addEvent(
      'night-audit',
      'All',
      'NIGHT_AUDIT_TRIGGERED',
      `Fecho do dia Opera executado às 03:15: ${convertedToCleanCount} quartos Inspected revertidos para Clean (Refreshes); ${convertedToDirtyCount} No-Shows revertidos para Dirty.`
    );

    const auditLog: OperaSyncLogEntry = {
      id: `op-audit-${Date.now()}`,
      timestamp: timeStr,
      direction: 'OPERA_TO_APP',
      roomNumber: 'TODOS',
      previousStatus: RoomStatus.INSPECTED,
      newStatus: RoomStatus.CLEAN,
      sourceEvent: 'Opera Cloud Night Audit automático',
      success: true,
      httpStatus: 200
    };

    saveState(updatedRooms, taskSheets, turndownGroups, [ev, ...events], alerts, [auditLog, ...operaLogs]);
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, addEvent, saveState]);

  // Sincronizar com Opera Cloud
  const syncWithOpera = useCallback(async (roomId?: string) => {
    const timeStr = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const log: OperaSyncLogEntry = {
      id: `op-${Date.now()}`,
      timestamp: timeStr,
      direction: 'APP_TO_OPERA',
      roomNumber: roomId ? (rooms.find(r => r.id === roomId)?.number || 'Q') : 'TODOS',
      previousStatus: RoomStatus.CLEAN,
      newStatus: RoomStatus.CLEAN,
      sourceEvent: 'Sincronização manual bidirecional OHIP',
      success: true,
      httpStatus: 200
    };
    saveState(rooms, taskSheets, turndownGroups, events, alerts, [log, ...operaLogs]);
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, saveState]);

  // Alertas
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    const timeStr = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    const updatedAlerts = alerts.map(a => a.id === alertId ? { ...a, acknowledged: true, acknowledgedAt: timeStr } : a);
    saveState(rooms, taskSheets, turndownGroups, events, updatedAlerts, operaLogs);
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, saveState]);

  const sendTraceAlert = useCallback(async (roomId: string, message: string) => {
    const timeStr = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    const targetRoom = rooms.find(r => r.id === roomId);
    const alert: RoomAlert = {
      id: `alt-${Date.now()}`,
      timestamp: timeStr,
      roomId,
      roomNumber: targetRoom?.number || 'Quarto',
      targetArea: targetRoom?.block,
      type: 'RECEPTION_TRACE',
      message: `Receção para Quarto ${targetRoom?.number}: ${message}`,
      acknowledged: false
    };
    saveState(rooms, taskSheets, turndownGroups, events, [alert, ...alerts], operaLogs);
  }, [rooms, taskSheets, turndownGroups, events, alerts, operaLogs, saveState]);

  // Resetar para preset inicial do dia
  const resetToDailyPreset = useCallback(async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('vvp_hk_rooms_v1');
      localStorage.removeItem('vvp_hk_sheets_v1');
      localStorage.removeItem('vvp_hk_turndown_v1');
      localStorage.removeItem('vvp_hk_teams_v1');
      localStorage.removeItem('vvp_hk_events_v1');
      localStorage.removeItem('vvp_hk_alerts_v1');
      localStorage.removeItem('vvp_hk_opera_log_v1');
    }
    const data = await housekeepingTransporter.loadData();
    setRooms(data.rooms);
    setTaskSheets(data.taskSheets);
    setTurndownGroups(data.turndownGroups);
    setBlockTeams(data.teams);
    setEvents(data.events);
    setAlerts(data.alerts);
    setOperaLogs(data.operaLogs);
  }, []);

  const value = useMemo(() => ({
    rooms,
    taskSheets,
    turndownGroups,
    blockTeams,
    events,
    alerts,
    operaLogs,
    loading,
    selectedRoom,
    setSelectedRoom,
    draggingRoomId,
    setDraggingRoomId,
    draggingStaffId,
    setDraggingStaffId,
    moveToast,
    dismissMoveToast,
    startRoom,
    finishRoom,
    inspectRoom,
    reproveInspection,
    markRoomDirty,
    recordRefresh,
    recordDND,
    recordRefuseService,
    togglePriority,
    moveRoomToSheet,
    mergeSheets,
    reorderRoomsInSheet,
    assignStaffToSheet,
    moveStaffToBlock,
    updateBlockTeam,
    addBlockTeam,
    deleteBlockTeam,
    updateRoom,
    addRoom,
    deleteRoom,
    moveRoomToBlock,
    restoreDailyToDefaultBaseline,
    updateTurndownStatus,
    assignTurndownGroup,
    moveRoomToTurndownGroup,
    triggerNightAudit,
    syncWithOpera,
    acknowledgeAlert,
    sendTraceAlert,
    resetToDailyPreset
  }), [
    rooms,
    taskSheets,
    turndownGroups,
    blockTeams,
    events,
    alerts,
    operaLogs,
    loading,
    selectedRoom,
    draggingRoomId,
    draggingStaffId,
    moveToast,
    dismissMoveToast,
    startRoom,
    finishRoom,
    inspectRoom,
    reproveInspection,
    markRoomDirty,
    recordRefresh,
    recordDND,
    recordRefuseService,
    togglePriority,
    moveRoomToSheet,
    mergeSheets,
    reorderRoomsInSheet,
    assignStaffToSheet,
    moveStaffToBlock,
    updateBlockTeam,
    addBlockTeam,
    deleteBlockTeam,
    updateRoom,
    addRoom,
    deleteRoom,
    moveRoomToBlock,
    restoreDailyToDefaultBaseline,
    updateTurndownStatus,
    assignTurndownGroup,
    moveRoomToTurndownGroup,
    triggerNightAudit,
    syncWithOpera,
    acknowledgeAlert,
    sendTraceAlert,
    resetToDailyPreset
  ]);

  return (
    <HousekeepingContext.Provider value={value}>
      {children}
    </HousekeepingContext.Provider>
  );
};

