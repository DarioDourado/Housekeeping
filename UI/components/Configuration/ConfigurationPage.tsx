'use client';

import { useState, useMemo } from 'react';
import { useHousekeeping } from '../../../hooks/housekeeping/useHousekeeping';
import { useAuth } from '../../../hooks/auth/useAuth';
import { User, UserRole } from '../../../types/auth.types';
import type { ConfigurationPageProps } from '../../../types/components/configuration-page.types';
import { Room, RoomTypology, RoomStatus, ServiceType, BlockTeam } from '../../../types/housekeeping.types';
import { getTeamColorPalette, AVAILABLE_TEAM_COLORS } from '../TeamManager/teamColorUtils';
import {
  Building2,
  Users,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  RotateCcw,
  Palette,
  ArrowRightLeft,
  Shield,
  Smartphone,
  Clock,
  Search,
  Filter,
  AlertTriangle,
  Layers,
  Home,
  Sparkles,
  LogIn,
  Scale,
  CheckCircle2,
  ArrowLeft,
  Settings,
  UserPlus
} from 'lucide-react';

export const ConfigurationPage = ({ onBackToBoard }: ConfigurationPageProps) => {
  const { users, addUser, updateUser, deleteUser, switchUser } = useAuth();
  const {
    rooms,
    blockTeams,
    updateBlockTeam,
    addBlockTeam,
    deleteBlockTeam,
    updateRoom,
    addRoom,
    deleteRoom,
    moveRoomToBlock,
    restoreDailyToDefaultBaseline
  } = useHousekeeping();

  const [activeTab, setActiveTab] = useState<'BLOCKS' | 'STAFF'>('BLOCKS');

  // FILTERS FOR BLOCKS TAB
  const [selectedBlockTab, setSelectedBlockTab] = useState<string>('ALL');
  const [roomSearch, setRoomSearch] = useState('');

  // FILTERS FOR STAFF TAB
  const [staffSearch, setStaffSearch] = useState('');
  const [staffBlockFilter, setStaffBlockFilter] = useState('ALL');
  const [staffDutyFilter, setStaffDutyFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // MODAL STATES
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [selectedRoomToEdit, setSelectedRoomToEdit] = useState<Room | null>(null);

  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [showEditBlockModal, setShowEditBlockModal] = useState(false);
  const [selectedBlockToEdit, setSelectedBlockToEdit] = useState<BlockTeam | null>(null);

  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [selectedStaffToEdit, setSelectedStaffToEdit] = useState<User | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [palettePopoverBlockId, setPalettePopoverBlockId] = useState<string | null>(null);

  // ROOM FORM STATE
  const [roomFormData, setRoomFormData] = useState<{
    number: string;
    block: string;
    floor: number;
    typology: RoomTypology;
    isPriority: boolean;
    instructions: string;
  }>({
    number: '',
    block: 'Bloco A',
    floor: 1,
    typology: RoomTypology.STANDARD,
    isPriority: false,
    instructions: ''
  });

  // BLOCK FORM STATE
  const [blockFormData, setBlockFormData] = useState<{
    block: string;
    name: string;
    description: string;
    color: string;
    supervisorName: string;
  }>({
    block: '',
    name: '',
    description: '',
    color: 'blue',
    supervisorName: ''
  });

  // STAFF FORM STATE
  const [staffFormData, setStaffFormData] = useState<{
    name: string;
    email: string;
    role: UserRole;
    defaultBlock: string;
    isOnDuty: boolean;
    shift: string;
    phoneDeviceId: string;
    isExtra: boolean;
    notes: string;
  }>({
    name: '',
    email: '',
    role: UserRole.HOUSEKEEPER,
    defaultBlock: 'Bloco A',
    isOnDuty: true,
    shift: 'Manhã',
    phoneDeviceId: '',
    isExtra: false,
    notes: ''
  });

  // Helper para normalizar o bloco default de cada utilizador
  const getStaffDefaultBlock = (u: User): string => {
    return u.defaultBlock || u.assignedArea || 'Apoio & Rotativas';
  };

  // Helper para calcular créditos de quarto
  const getRoomCredits = (r: Room) => {
    switch (r.typology) {
      case RoomTypology.STANDARD:
        return r.serviceType === ServiceType.DEPARTURE_ARRIVAL ? 2 : 1;
      case RoomTypology.JUNIOR_SUITE:
        return r.serviceType === ServiceType.DEPARTURE_ARRIVAL ? 3 : 1.5;
      case RoomTypology.SUITE:
        return r.serviceType === ServiceType.DEPARTURE_ARRIVAL ? 4 : 2;
      case RoomTypology.VILLA:
        return r.serviceType === ServiceType.DEPARTURE_ARRIVAL ? 6 : 3;
      default:
        return 1.5;
    }
  };

  // ESTATÍSTICAS POR BLOCO
  const blockStats = useMemo(() => {
    const stats: Record<string, { rooms: Room[]; totalCredits: number; staff: User[] }> = {};

    blockTeams.forEach(t => {
      const bRooms = rooms.filter(r => (r.defaultBlock || r.block) === t.block);
      const bCredits = bRooms.reduce((acc, r) => acc + getRoomCredits(r), 0);
      const bStaff = users.filter(u => getStaffDefaultBlock(u) === t.block);

      stats[t.block] = {
        rooms: bRooms,
        totalCredits: +bCredits.toFixed(1),
        staff: bStaff
      };
    });

    return stats;
  }, [blockTeams, rooms, users]);

  // Lista de quartos filtrada
  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      const roomBlock = r.defaultBlock || r.block;
      if (selectedBlockTab !== 'ALL' && roomBlock !== selectedBlockTab) {
        return false;
      }
      if (roomSearch.trim()) {
        const q = roomSearch.toLowerCase();
        const matchNum = r.number.toLowerCase().includes(q);
        const matchBlock = roomBlock.toLowerCase().includes(q);
        const matchGuest = r.guest?.guestName.toLowerCase().includes(q);
        if (!matchNum && !matchBlock && !matchGuest) return false;
      }
      return true;
    });
  }, [rooms, selectedBlockTab, roomSearch]);

  // Lista de colaboradores filtrada
  const filteredStaff = useMemo(() => {
    return users.filter(u => {
      const defBlock = getStaffDefaultBlock(u);
      if (staffBlockFilter !== 'ALL' && defBlock !== staffBlockFilter) {
        return false;
      }
      if (staffDutyFilter === 'ACTIVE' && u.isOnDuty === false) return false;
      if (staffDutyFilter === 'INACTIVE' && u.isOnDuty !== false) return false;

      if (staffSearch.trim()) {
        const q = staffSearch.toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchPda = (u.phoneDeviceId || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPda) return false;
      }
      return true;
    });
  }, [users, staffBlockFilter, staffDutyFilter, staffSearch]);

  // HANDLERS: ROOM
  const handleOpenAddRoom = (blockName?: string) => {
    setRoomFormData({
      number: '',
      block: blockName || (blockTeams[0]?.block || 'Bloco A'),
      floor: 1,
      typology: RoomTypology.STANDARD,
      isPriority: false,
      instructions: ''
    });
    setShowAddRoomModal(true);
  };

  const handleOpenEditRoom = (room: Room) => {
    setSelectedRoomToEdit(room);
    setRoomFormData({
      number: room.number,
      block: room.defaultBlock || room.block,
      floor: room.floor,
      typology: room.typology,
      isPriority: room.isPriority,
      instructions: room.guest?.dailyInstructions || ''
    });
    setShowEditRoomModal(true);
  };

  const handleSubmitRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomFormData.number.trim()) return;

    if (showEditRoomModal && selectedRoomToEdit) {
      await updateRoom({
        ...selectedRoomToEdit,
        number: roomFormData.number.trim(),
        block: roomFormData.block,
        defaultBlock: roomFormData.block,
        floor: +roomFormData.floor,
        typology: roomFormData.typology,
        isPriority: roomFormData.isPriority,
        guest: {
          ...selectedRoomToEdit.guest,
          guestName: selectedRoomToEdit.guest?.guestName || 'Hóspede Reserva',
          adults: selectedRoomToEdit.guest?.adults || 2,
          children: selectedRoomToEdit.guest?.children || 0,
          isLinenChangeDue: selectedRoomToEdit.guest?.isLinenChangeDue || false,
          dailyInstructions: roomFormData.instructions
        }
      });
      setShowEditRoomModal(false);
    } else {
      await addRoom({
        number: roomFormData.number.trim(),
        block: roomFormData.block,
        defaultBlock: roomFormData.block,
        floor: +roomFormData.floor,
        typology: roomFormData.typology,
        morningStatus: RoomStatus.DIRTY,
        operaStatus: RoomStatus.DIRTY,
        operaLastSyncedAt: '08:00',
        serviceType: ServiceType.STAYOVER,
        turndownStatus: RoomStatus.DIRTY,
        turndownRequired: true,
        isPriority: roomFormData.isPriority,
        assignedSheetId: 'UNASSIGNED',
        orderIndex: 0,
        guest: {
          guestName: 'Hóspede Previsto',
          adults: 2,
          children: 0,
          isLinenChangeDue: false,
          dailyInstructions: roomFormData.instructions
        },
        operational: {
          totalRefreshCount: 0,
          isDND: false,
          isRefusedService: false
        }
      });
      setShowAddRoomModal(false);
    }
  };

  // HANDLERS: BLOCK
  const handleOpenAddBlock = () => {
    setBlockFormData({
      block: '',
      name: '',
      description: '',
      color: 'blue',
      supervisorName: 'Ana Rodrigues'
    });
    setShowAddBlockModal(true);
  };

  const handleOpenEditBlock = (team: BlockTeam) => {
    setSelectedBlockToEdit(team);
    setBlockFormData({
      block: team.block,
      name: team.name,
      description: team.description,
      color: team.color || 'blue',
      supervisorName: team.supervisorName || ''
    });
    setShowEditBlockModal(true);
  };

  const handleSubmitBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockFormData.block.trim()) return;

    if (showEditBlockModal && selectedBlockToEdit) {
      await updateBlockTeam({
        ...selectedBlockToEdit,
        block: blockFormData.block.trim(),
        name: blockFormData.name.trim() || `Equipa ${blockFormData.block}`,
        description: blockFormData.description.trim(),
        color: blockFormData.color,
        supervisorName: blockFormData.supervisorName.trim()
      });
      setShowEditBlockModal(false);
    } else {
      await addBlockTeam({
        block: blockFormData.block.trim(),
        name: blockFormData.name.trim() || `Equipa ${blockFormData.block}`,
        description: blockFormData.description.trim() || `Zona de quartos ${blockFormData.block}`,
        color: blockFormData.color,
        supervisorName: blockFormData.supervisorName.trim() || 'Filipa Mendes'
      });
      setShowAddBlockModal(false);
    }
  };

  // HANDLERS: STAFF
  const handleOpenAddStaff = (defaultBlockName?: string) => {
    setStaffFormData({
      name: '',
      email: '',
      role: UserRole.HOUSEKEEPER,
      defaultBlock: defaultBlockName || 'Bloco A',
      isOnDuty: true,
      shift: 'Manhã',
      phoneDeviceId: `TEL-${Math.floor(Math.random() * 90 + 10)}`,
      isExtra: false,
      notes: ''
    });
    setShowAddStaffModal(true);
  };

  const handleOpenEditStaff = (user: User) => {
    setSelectedStaffToEdit(user);
    setStaffFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      defaultBlock: getStaffDefaultBlock(user),
      isOnDuty: user.isOnDuty !== false,
      shift: user.shift || 'Manhã',
      phoneDeviceId: user.phoneDeviceId || '',
      isExtra: !!user.isExtra,
      notes: user.notes || ''
    });
    setShowEditStaffModal(true);
  };

  const handleSubmitStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffFormData.name.trim()) return;

    if (showEditStaffModal && selectedStaffToEdit) {
      await updateUser({
        ...selectedStaffToEdit,
        name: staffFormData.name.trim(),
        email: staffFormData.email.trim() || selectedStaffToEdit.email,
        role: staffFormData.role,
        defaultBlock: staffFormData.defaultBlock,
        assignedArea: staffFormData.defaultBlock,
        isOnDuty: staffFormData.isOnDuty,
        shift: staffFormData.shift,
        phoneDeviceId: staffFormData.phoneDeviceId.trim(),
        isExtra: staffFormData.isExtra,
        notes: staffFormData.notes.trim()
      });
      setShowEditStaffModal(false);
    } else {
      const emailGen = staffFormData.email.trim() || `${staffFormData.name.toLowerCase().replace(/\s+/g, '.')}@vilavitaparc.com`;
      await addUser({
        name: staffFormData.name.trim(),
        email: emailGen,
        role: staffFormData.role,
        defaultBlock: staffFormData.defaultBlock,
        assignedArea: staffFormData.defaultBlock,
        isOnDuty: staffFormData.isOnDuty,
        shift: staffFormData.shift,
        phoneDeviceId: staffFormData.phoneDeviceId.trim(),
        isExtra: staffFormData.isExtra,
        notes: staffFormData.notes.trim()
      });
      setShowAddStaffModal(false);
    }
  };

  // Toggle active/inactive duty with 1 click
  const handleToggleStaffDuty = async (user: User) => {
    await updateUser({
      ...user,
      isOnDuty: user.isOnDuty === false ? true : false
    });
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-100 dark:bg-slate-950 flex flex-col">
      
      {/* TOP CONFIGURATION HEADER */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToBoard}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Voltar ao Quadro Operacional de Housekeeping"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                  <Settings className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  Configuração de Equipas, Blocos & Quartos
                </h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  Master Baseline
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Configure os quartos de cada bloco e os perfis de acesso dos colaboradores com o seu bloco padrão e estado de serviço (ativo/inativo).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={restoreDailyToDefaultBaseline}
              className="px-3.5 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Aplica a configuração default de blocos e colaboradores ao dia operacional"
            >
              <RotateCcw className="w-4 h-4 text-emerald-600" />
              <span>Aplicar Baseline ao Dia</span>
            </button>

            <button
              onClick={onBackToBoard}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
            >
              Voltar ao Quadro
            </button>
          </div>

        </div>

        {/* TABS NAVIGATION */}
        <div className="max-w-7xl mx-auto mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('BLOCKS')}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'BLOCKS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Configuração de Blocos & Quartos ({rooms.length} quartos)</span>
          </button>

          <button
            onClick={() => setActiveTab('STAFF')}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${
              activeTab === 'STAFF'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Configuração de Colaboradores & Perfis ({users.length} perfis)</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">

        {/* ============================================================== */}
        {/* TAB 1: CONFIGURAÇÃO DE BLOCOS & QUARTOS / LOCAIS               */}
        {/* ============================================================== */}
        {activeTab === 'BLOCKS' && (
          <div className="space-y-6 animate-in fade-in-50 duration-150">
            
            {/* BLOCKS SUMMARY CARDS (GRID OF CONFIGURED BLOCKS) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Blocos & Zonas do Resort Configurados</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Clique num bloco para filtrar os seus quartos ou altere a cor, supervisora responsável e capacidade.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedBlockTab('ALL')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                      selectedBlockTab === 'ALL'
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    Ver Todos ({rooms.length})
                  </button>

                  <button
                    onClick={handleOpenAddBlock}
                    className="px-3 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Criar Novo Bloco</span>
                  </button>
                </div>
              </div>

              {/* GRID OF BLOCKS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
                {blockTeams.map(team => {
                  const palette = getTeamColorPalette(team.color || team.block);
                  const stat = blockStats[team.block] || { rooms: [], totalCredits: 0, staff: [] };
                  const isSelected = selectedBlockTab === team.block;

                  return (
                    <div
                      key={team.id}
                      onClick={() => setSelectedBlockTab(isSelected ? 'ALL' : team.block)}
                      className={`p-3 rounded-2xl border-t-4 border bg-white dark:bg-slate-900 cursor-pointer transition-all shadow-2xs hover:shadow-md relative ${palette.topBorder} ${
                        isSelected
                          ? `${palette.borderFocused} ring-2 ${palette.ring} scale-[1.02]`
                          : `${palette.borderLight} hover:border-slate-400`
                      }`}
                    >
                      {/* Block Header */}
                      <div className="flex items-start justify-between gap-1 mb-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${palette.dot} shrink-0`} />
                            <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {team.block}
                            </h4>
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                            {team.supervisorName ? `Gov: ${team.supervisorName}` : 'Sem governanta'}
                          </span>
                        </div>

                        {/* Quick Edit Block */}
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditBlock(team);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded"
                            title="Editar dados deste bloco"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Block Metrics */}
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Quartos:</span>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{stat.rooms.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Créditos:</span>
                          <span className={`font-bold ${palette.text}`}>{stat.totalCredits} cr</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Colaboradoras:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{stat.staff.length}</span>
                        </div>
                      </div>

                      {/* Staff Avatars assigned to this block by default */}
                      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Equipa Default:</span>
                        <div className="flex -space-x-1 overflow-hidden">
                          {stat.staff.length === 0 ? (
                            <span className="text-slate-400 italic">Nenhum</span>
                          ) : (
                            stat.staff.slice(0, 3).map(st => (
                              <div
                                key={st.id}
                                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[8px] border border-white dark:border-slate-900 ${palette.avatar}`}
                                title={`${st.name} (${st.isOnDuty !== false ? 'De Serviço' : 'Folga'})`}
                              >
                                {st.name.substring(0, 1).toUpperCase()}
                              </div>
                            ))
                          )}
                          {stat.staff.length > 3 && (
                            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-[8px] border border-white dark:border-slate-900">
                              +{stat.staff.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ROOMS TABLE & MANAGEMENT */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              
              {/* Header and Controls */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Quartos & Locais Atribuídos por Bloco
                    {selectedBlockTab !== 'ALL' && (
                      <span className="ml-1 text-blue-600 font-semibold">({selectedBlockTab})</span>
                    )}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300">
                    {filteredRooms.length} quartos
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Search */}
                  <div className="relative w-48 sm:w-60">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Pesquisar quarto..."
                      value={roomSearch}
                      onChange={e => setRoomSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <button
                    onClick={() => handleOpenAddRoom(selectedBlockTab !== 'ALL' ? selectedBlockTab : undefined)}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Quarto</span>
                  </button>
                </div>
              </div>

              {/* Rooms Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold">
                      <th className="py-3 px-4">Quarto / Local</th>
                      <th className="py-3 px-3">Bloco Default (Configuração de Partida)</th>
                      <th className="py-3 px-3">Piso / Andar</th>
                      <th className="py-3 px-3">Tipologia</th>
                      <th className="py-3 px-3">Créditos Padrão</th>
                      <th className="py-3 px-3">Prioridade / Traces</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRooms.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <Home className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="font-medium">Nenhum quarto encontrado com os filtros selecionados.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredRooms.map(r => {
                        const roomBlock = r.defaultBlock || r.block;
                        const palette = getTeamColorPalette(roomBlock);
                        const cr = getRoomCredits(r);

                        return (
                          <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                            {/* Number & Name */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                  {r.number}
                                </span>
                                {r.isPriority && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                    VIP
                                  </span>
                                )}
                              </div>
                              {r.guest?.guestName && (
                                <span className="text-[11px] text-slate-400 block truncate max-w-[180px]">
                                  {r.guest.guestName}
                                </span>
                              )}
                            </td>

                            {/* Block Assignment Dropdown (Instant Change) */}
                            <td className="py-3 px-3">
                              <select
                                value={roomBlock}
                                onChange={e => moveRoomToBlock(r.id, e.target.value)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${palette.badge}`}
                                title="Alterar o bloco ao qual este quarto pertence na baseline"
                              >
                                {blockTeams.map(t => (
                                  <option key={t.id} value={t.block}>
                                    {t.block}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Floor */}
                            <td className="py-3 px-3">
                              <span className="font-medium text-slate-700 dark:text-slate-300">
                                Piso {r.floor}
                              </span>
                            </td>

                            {/* Typology */}
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                                {r.typology}
                              </span>
                            </td>

                            {/* Credits */}
                            <td className="py-3 px-3">
                              <span className={`font-bold ${palette.text}`}>
                                {cr} cr
                              </span>
                            </td>

                            {/* Instructions */}
                            <td className="py-3 px-3">
                              <span className="text-[11px] text-slate-500 line-clamp-1 max-w-[220px]">
                                {r.guest?.dailyInstructions || 'Sem instruções especiais'}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleOpenEditRoom(r)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                                  title="Editar quarto"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {deleteConfirmId === r.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={async () => {
                                        await deleteRoom(r.id);
                                        setDeleteConfirmId(null);
                                      }}
                                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white"
                                    >
                                      Confirmar
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="p-1 rounded text-slate-400 hover:text-slate-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirmId(r.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                    title="Remover quarto"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: CONFIGURAÇÃO DE COLABORADORES & PERFIS DE ACESSO        */}
        {/* ============================================================== */}
        {activeTab === 'STAFF' && (
          <div className="space-y-6 animate-in fade-in-50 duration-150">
            
            {/* TOP STATS FOR STAFF */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                <span className="text-[11px] text-slate-400 font-medium block">Total de Perfis Registados</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{users.length}</span>
              </div>

              <div className="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-2xs">
                <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold block">De Serviço / Ativos Hoje</span>
                <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {users.filter(u => u.isOnDuty !== false).length}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/40 shadow-2xs">
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold block">Em Folga / Inativos Hoje</span>
                <span className="text-2xl font-bold text-slate-700 dark:text-slate-300">
                  {users.filter(u => u.isOnDuty === false).length}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20 shadow-2xs">
                <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold block">Colaboradoras Extras</span>
                <span className="text-2xl font-bold text-amber-800 dark:text-amber-300">
                  {users.filter(u => u.isExtra).length}
                </span>
              </div>
            </div>

            {/* STAFF DIRECTORY TABLE */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              
              {/* Header and Controls */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Perfis de Acesso & Bloco Default dos Colaboradores
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Search */}
                  <div className="relative w-48 sm:w-56">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Pesquisar perfil..."
                      value={staffSearch}
                      onChange={e => setStaffSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  {/* Filter by Block */}
                  <select
                    value={staffBlockFilter}
                    onChange={e => setStaffBlockFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <option value="ALL">Todos os Blocos</option>
                    {blockTeams.map(t => (
                      <option key={t.id} value={t.block}>{t.block}</option>
                    ))}
                  </select>

                  {/* Filter by Duty Status */}
                  <select
                    value={staffDutyFilter}
                    onChange={e => setStaffDutyFilter(e.target.value as any)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    <option value="ALL">Todos os Estados</option>
                    <option value="ACTIVE">🟢 De Serviço (Ativos)</option>
                    <option value="INACTIVE">⚪ Em Folga (Inativos)</option>
                  </select>

                  <button
                    onClick={() => handleOpenAddStaff()}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Adicionar Perfil</span>
                  </button>
                </div>
              </div>

              {/* Staff Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold">
                      <th className="py-3 px-4">Colaborador / Perfil</th>
                      <th className="py-3 px-3">Estado Hoje (De Serviço / Folga)</th>
                      <th className="py-3 px-3">Bloco por Default (Configuração de Partida)</th>
                      <th className="py-3 px-3">Função / Papel</th>
                      <th className="py-3 px-3">Turno</th>
                      <th className="py-3 px-3">Dispositivo / PDA</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p className="font-medium">Nenhum colaborador encontrado.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredStaff.map(u => {
                        const defBlock = getStaffDefaultBlock(u);
                        const palette = getTeamColorPalette(defBlock);
                        const isOnDuty = u.isOnDuty !== false;

                        return (
                          <tr
                            key={u.id}
                            className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                              !isOnDuty ? 'opacity-65 bg-slate-50/30' : ''
                            }`}
                          >
                            {/* Profile Info */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs border ${
                                    u.isExtra
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-300'
                                      : u.role === UserRole.SUPERVISOR
                                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 border-purple-300'
                                      : `${palette.avatar} border-white/20`
                                  }`}
                                >
                                  {u.name.substring(0, 2).toUpperCase()}
                                </div>

                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 dark:text-slate-100">
                                      {u.name}
                                    </span>
                                    {u.isExtra && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                        Extra
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">
                                    {u.email}
                                  </span>
                                  {u.notes && (
                                    <span className="text-[10px] text-slate-500 italic block">
                                      {u.notes}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Active / Inactive Status Toggle */}
                            <td className="py-3 px-3">
                              <button
                                onClick={() => handleToggleStaffDuty(u)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all shadow-2xs ${
                                  isOnDuty
                                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                                }`}
                                title="Clique para alternar entre De Serviço e Folga"
                              >
                                <span className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                <span>{isOnDuty ? 'De Serviço (Ativo)' : 'Em Folga (Inativo)'}</span>
                              </button>
                            </td>

                            {/* Default Block Dropdown */}
                            <td className="py-3 px-3">
                              <select
                                value={defBlock}
                                onChange={async (e) => {
                                  await updateUser({
                                    ...u,
                                    defaultBlock: e.target.value,
                                    assignedArea: u.assignedArea === u.defaultBlock ? e.target.value : u.assignedArea
                                  });
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${palette.badge}`}
                                title="Alterar o bloco padrão deste colaborador"
                              >
                                {blockTeams.map(t => (
                                  <option key={t.id} value={t.block}>
                                    {t.block}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Role */}
                            <td className="py-3 px-3">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {u.role === UserRole.SUPERVISOR ? 'Governanta' : u.role === UserRole.ADMIN ? 'Chefia' : 'Empregada'}
                              </span>
                            </td>

                            {/* Shift */}
                            <td className="py-3 px-3">
                              <span className="text-[11px] text-slate-600 dark:text-slate-400">
                                {u.shift || 'Manhã'}
                              </span>
                            </td>

                            {/* Phone / PDA */}
                            <td className="py-3 px-3">
                              {u.phoneDeviceId ? (
                                <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  {u.phoneDeviceId}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Sem PDA</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => switchUser(u.id)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                                  title="Entrar com este perfil"
                                >
                                  <LogIn className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleOpenEditStaff(u)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                                  title="Editar perfil"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {deleteConfirmId === u.id ? (
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={async () => {
                                        await deleteUser(u.id);
                                        setDeleteConfirmId(null);
                                      }}
                                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white"
                                    >
                                      Confirmar
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirmId(null)}
                                      className="p-1 rounded text-slate-400 hover:text-slate-600"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setDeleteConfirmId(u.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                    title="Remover perfil"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ============================================================== */}
      {/* MODAL: ADICIONAR / EDITAR QUARTO                              */}
      {/* ============================================================== */}
      {(showAddRoomModal || showEditRoomModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Home className="w-4 h-4 text-blue-600" />
                <span>{showEditRoomModal ? 'Editar Quarto / Local' : 'Adicionar Novo Quarto / Local'}</span>
              </h4>
              <button
                onClick={() => {
                  setShowAddRoomModal(false);
                  setShowEditRoomModal(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRoom} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Número / Nome do Quarto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 105, Suite 503, Vila Mar"
                  value={roomFormData.number}
                  onChange={e => setRoomFormData({ ...roomFormData, number: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bloco Default de Partida *
                  </label>
                  <select
                    value={roomFormData.block}
                    onChange={e => setRoomFormData({ ...roomFormData, block: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                  >
                    {blockTeams.map(t => (
                      <option key={t.id} value={t.block}>{t.block}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Piso / Andar
                  </label>
                  <input
                    type="number"
                    value={roomFormData.floor}
                    onChange={e => setRoomFormData({ ...roomFormData, floor: +e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipologia do Quarto
                </label>
                <select
                  value={roomFormData.typology}
                  onChange={e => setRoomFormData({ ...roomFormData, typology: e.target.value as RoomTypology })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                >
                  <option value={RoomTypology.STANDARD}>Standard (1 cr estadia / 2 cr saída)</option>
                  <option value={RoomTypology.JUNIOR_SUITE}>Junior Suite (1.5 cr estadia / 3 cr saída)</option>
                  <option value={RoomTypology.SUITE}>Suite (2 cr estadia / 4 cr saída)</option>
                  <option value={RoomTypology.VILLA}>Villa (3 cr estadia / 6 cr saída)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Instruções Especiais / Notas
                </label>
                <input
                  type="text"
                  placeholder="Ex: Varanda panorâmica, cama king size"
                  value={roomFormData.instructions}
                  onChange={e => setRoomFormData({ ...roomFormData, instructions: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddRoomModal(false);
                    setShowEditRoomModal(false);
                  }}
                  className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {showEditRoomModal ? 'Guardar Quarto' : 'Criar Quarto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADICIONAR / EDITAR BLOCO                               */}
      {/* ============================================================== */}
      {(showAddBlockModal || showEditBlockModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>{showEditBlockModal ? 'Editar Bloco / Zona' : 'Criar Novo Bloco / Zona'}</span>
              </h4>
              <button
                onClick={() => {
                  setShowAddBlockModal(false);
                  setShowEditBlockModal(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitBlock} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Identificador / Nome do Bloco *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bloco E, Spa Suites, Residences"
                  value={blockFormData.block}
                  onChange={e => setBlockFormData({ ...blockFormData, block: e.target.value, name: `Equipa ${e.target.value}` })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cor do Bloco
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.values(AVAILABLE_TEAM_COLORS).map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setBlockFormData({ ...blockFormData, color: c.id })}
                      className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left transition-all text-[11px] font-semibold ${
                        blockFormData.color === c.id
                          ? `${c.badge} ring-2 ${c.ring}`
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${c.dot} shrink-0`} />
                      <span className="truncate">{c.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Supervisora / Governanta Responsável
                </label>
                <input
                  type="text"
                  placeholder="Ex: Filipa Mendes ou Ana Rodrigues"
                  value={blockFormData.supervisorName}
                  onChange={e => setBlockFormData({ ...blockFormData, supervisorName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição / Localização
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pisos 0 e 1 · Ala Sul Resort"
                  value={blockFormData.description}
                  onChange={e => setBlockFormData({ ...blockFormData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddBlockModal(false);
                    setShowEditBlockModal(false);
                  }}
                  className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {showEditBlockModal ? 'Guardar Bloco' : 'Criar Bloco'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADICIONAR / EDITAR COLABORADOR                         */}
      {/* ============================================================== */}
      {(showAddStaffModal || showEditStaffModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>{showEditStaffModal ? 'Editar Perfil de Colaborador' : 'Adicionar Novo Colaborador à Aplicação'}</span>
              </h4>
              <button
                onClick={() => {
                  setShowAddStaffModal(false);
                  setShowEditStaffModal(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Luísa Santos ou Extra #5"
                  value={staffFormData.name}
                  onChange={e => setStaffFormData({ ...staffFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email / Login de Acesso
                </label>
                <input
                  type="email"
                  placeholder="Ex: luisa.santos@vilavitaparc.com"
                  value={staffFormData.email}
                  onChange={e => setStaffFormData({ ...staffFormData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Função / Papel na Aplicação
                  </label>
                  <select
                    value={staffFormData.role}
                    onChange={e => setStaffFormData({ ...staffFormData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value={UserRole.HOUSEKEEPER}>Empregada de Andares</option>
                    <option value={UserRole.SUPERVISOR}>Governanta / Supervisora</option>
                    <option value={UserRole.ADMIN}>Chefia / Direção HK</option>
                    <option value={UserRole.RECEPTION}>Receção / Front Desk</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bloco por Default (Configuração de Partida) *
                  </label>
                  <select
                    value={staffFormData.defaultBlock}
                    onChange={e => setStaffFormData({ ...staffFormData, defaultBlock: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                  >
                    {blockTeams.map(t => (
                      <option key={t.id} value={t.block}>{t.block}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Turno Habitual
                  </label>
                  <select
                    value={staffFormData.shift}
                    onChange={e => setStaffFormData({ ...staffFormData, shift: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Manhã">Manhã (08:00 - 16:30)</option>
                    <option value="Tarde 13h30">Tarde (13:30 - 22:00)</option>
                    <option value="Turndown">Turndown (18:00 - 22:00)</option>
                    <option value="Geral">Horário Geral</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ID Dispositivo / PDA
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: TEL-AREA-10"
                    value={staffFormData.phoneDeviceId}
                    onChange={e => setStaffFormData({ ...staffFormData, phoneDeviceId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Status de Serviço e Extra */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Está Ativo / De Serviço Hoje?
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Se desmarcado, fica inativo/folga e não recebe quartos ativos no dia
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={staffFormData.isOnDuty}
                    onChange={e => setStaffFormData({ ...staffFormData, isOnDuty: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </label>

                <div className="h-px bg-slate-200 dark:bg-slate-700/60" />

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Colaborador Extra (Gás Extra)?
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Disponível para reforço e balanceamento de carga entre blocos
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={staffFormData.isExtra}
                    onChange={e => setStaffFormData({ ...staffFormData, isExtra: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notas / Observações
                </label>
                <input
                  type="text"
                  placeholder="Ex: Preferência por suites, folga fixa às quartas"
                  value={staffFormData.notes}
                  onChange={e => setStaffFormData({ ...staffFormData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddStaffModal(false);
                    setShowEditStaffModal(false);
                  }}
                  className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {showEditStaffModal ? 'Guardar Perfil' : 'Criar Perfil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

