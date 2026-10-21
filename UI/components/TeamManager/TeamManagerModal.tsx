'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '../../../services/hooks/auth/useAuth';
import { useHousekeeping } from '../../../context/HousekeepingContext';
import { User, UserRole } from '../../../types/auth.types';
import {
  X,
  Users,
  Plus,
  Trash2,
  Shield,
  Smartphone,
  Check,
  UserPlus,
  GripVertical,
  Building2,
  Sparkles,
  ArrowRightLeft,
  Search,
  Scale,
  Award,
  AlertTriangle,
  UserCheck,
  Palette,
  LayoutGrid
} from 'lucide-react';
import { housekeepingTransporter } from '../../../services/transporters/housekeeping/housekeepingTransporter';
import { getTeamColorPalette, AVAILABLE_TEAM_COLORS } from './teamColorUtils';
import { CollaboratorDirectoryTab } from './CollaboratorDirectoryTab';

interface TeamManagerModalProps {
  onClose: () => void;
  initialSelectedBlock?: string;
  initialTab?: 'BOARD' | 'DIRECTORY';
}

export const TeamManagerModal = ({ onClose, initialSelectedBlock, initialTab = 'BOARD' }: TeamManagerModalProps) => {
  const { users, addUser, updateUser, deleteUser, switchUser } = useAuth();
  const {
    rooms,
    taskSheets,
    blockTeams,
    moveStaffToBlock,
    updateBlockTeam,
    assignStaffToSheet,
    draggingStaffId,
    setDraggingStaffId
  } = useHousekeeping();

  const [activeTab, setActiveTab] = useState<'BOARD' | 'DIRECTORY'>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [dragOverBlock, setDragOverBlock] = useState<string | null>(null);
  const [colorPickerOpenTeamId, setColorPickerOpenTeamId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addBlockTarget, setAddBlockTarget] = useState<string>('Bloco A');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.HOUSEKEEPER);
  const [isExtra, setIsExtra] = useState(false);
  const [isNewOnDuty, setIsNewOnDuty] = useState(true);
  const [phoneDevice, setPhoneDevice] = useState('');
  const [assigningSheetUserId, setAssigningSheetUserId] = useState<string | null>(null);

  // Normalização do bloco do utilizador
  const getStaffBlock = (u: User): string => {
    if (!u.assignedArea) return 'Apoio & Rotativas';
    const area = u.assignedArea.trim();
    if (area.includes('Bloco A')) return 'Bloco A';
    if (area.includes('Bloco B')) return 'Bloco B';
    if (area.includes('Bloco C')) return 'Bloco C';
    if (area.includes('Bloco D')) return 'Bloco D';
    if (area.includes('Oasis')) return 'Oasis Parc';
    if (area.includes('Vilas') || area.includes('Villa')) return 'Master Villas';
    return 'Apoio & Rotativas';
  };

  // Filtragem de pessoal
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phoneDeviceId && u.phoneDeviceId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.assignedArea && u.assignedArea.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchRole =
        roleFilter === 'ALL' ||
        (roleFilter === 'EXTRA' && u.isExtra) ||
        (roleFilter === 'SUPERVISOR' && u.role === UserRole.SUPERVISOR) ||
        (roleFilter === 'HOUSEKEEPER' && u.role === UserRole.HOUSEKEEPER && !u.isExtra) ||
        (roleFilter === 'ADMIN' && u.role === UserRole.ADMIN);

      return matchSearch && matchRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Estatísticas por Bloco (Quartos, Créditos, Carga de Trabalho)
  const blockStats = useMemo(() => {
    const stats: Record<
      string,
      {
        totalRooms: number;
        totalCredits: number;
        departuresWithArrival: number;
        stayovers: number;
        members: User[];
        creditsPerPerson: number;
      }
    > = {};

    blockTeams.forEach(t => {
      const blockRooms = rooms.filter(r => r.block === t.block);
      let totalCredits = 0;
      let departuresWithArrival = 0;
      let stayovers = 0;

      blockRooms.forEach(r => {
        totalCredits += housekeepingTransporter.calculateRoomCredits(r);
        if (r.serviceType === 'DEPARTURE_ARRIVAL') departuresWithArrival++;
        if (r.serviceType === 'STAYOVER') stayovers++;
      });

      const members = filteredUsers.filter(u => getStaffBlock(u) === t.block);
      const creditsPerPerson = members.length > 0 ? +(totalCredits / members.length).toFixed(1) : totalCredits;

      stats[t.block] = {
        totalRooms: blockRooms.length,
        totalCredits: +totalCredits.toFixed(1),
        departuresWithArrival,
        stayovers,
        members,
        creditsPerPerson
      };
    });

    return stats;
  }, [blockTeams, rooms, filteredUsers]);

  // Totais do Hotel
  const totalActiveStaff = users.filter(u => u.role === UserRole.HOUSEKEEPER || u.isExtra).length;
  const totalSupervisors = users.filter(u => u.role === UserRole.SUPERVISOR).length;
  const totalCreditsHotel = rooms.reduce((acc, r) => acc + housekeepingTransporter.calculateRoomCredits(r), 0);
  const avgCreditsPerPerson = totalActiveStaff > 0 ? (totalCreditsHotel / totalActiveStaff).toFixed(1) : '0.0';

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, staff: User) => {
    e.dataTransfer.setData('application/staff-id', staff.id);
    e.dataTransfer.setData('text/plain', staff.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingStaffId(staff.id);
  };

  const handleDragEnd = () => {
    setDraggingStaffId(null);
    setDragOverBlock(null);
  };

  const handleDragOver = (e: React.DragEvent, blockName: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverBlock !== blockName) {
      setDragOverBlock(blockName);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverBlock(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetBlock: string) => {
    e.preventDefault();
    setDragOverBlock(null);
    const staffId = e.dataTransfer.getData('application/staff-id') || draggingStaffId;
    if (staffId) {
      await moveStaffToBlock(staffId, targetBlock);
      setDraggingStaffId(null);
    }
  };

  // Criação de Colaborador na Equipa
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    await addUser({
      name: newName.trim(),
      email: `${newName.toLowerCase().replace(/\s+/g, '.')}@vilavitaparc.com`,
      role: newRole,
      assignedArea: addBlockTarget,
      defaultBlock: addBlockTarget,
      isOnDuty: isNewOnDuty,
      isExtra,
      phoneDeviceId: phoneDevice.trim() || undefined
    });

    setNewName('');
    setIsExtra(false);
    setIsNewOnDuty(true);
    setPhoneDevice('');
    setShowAddModal(false);
  };

  // Reequilíbrio inteligente de colaboradores extras para blocos sobrecarregados
  const handleAutoBalance = async () => {
    const extraStaff = users.filter(u => u.isExtra || getStaffBlock(u) === 'Apoio & Rotativas');
    if (extraStaff.length === 0) {
      alert('Não existem colaboradoras extras ou de apoio disponíveis para equilibrar.');
      return;
    }

    // Ordenar blocos por créditos por pessoa decrescente (mais sobrecarregados primeiro)
    const sortedBlocks = [...blockTeams]
      .filter(t => t.block !== 'Apoio & Rotativas')
      .map(t => ({
        block: t.block,
        ratio: blockStats[t.block]?.creditsPerPerson || 0,
        count: blockStats[t.block]?.members.length || 0
      }))
      .sort((a, b) => b.ratio - a.ratio);

    if (sortedBlocks.length > 0) {
      const mostOverloaded = sortedBlocks[0];
      const personToMove = extraStaff[0];
      await moveStaffToBlock(personToMove.id, mostOverloaded.block);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-[96vw] xl:max-w-7xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        
        {/* MODAL HEADER WITH TABS */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                  Gestão de Equipas & Colaboradores
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                {activeTab === 'BOARD'
                  ? 'Distribuição e cartões coloridos por bloco com drag & drop entre equipas e Task Sheets.'
                  : 'Aba dedicada à gestão de colaboradores: adicione, defina o bloco por default e indique quem está de serviço.'}
              </p>
            </div>
          </div>

          {/* TAB SWITCHER */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl shrink-0 self-start md:self-center">
            <button
              onClick={() => setActiveTab('BOARD')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'BOARD'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Quadro por Bloco (Drag & Drop)</span>
            </button>

            <button
              onClick={() => setActiveTab('DIRECTORY')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'DIRECTORY'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Colaboradores & Escalas</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === 'DIRECTORY'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {users.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'BOARD' && (
              <button
                onClick={handleAutoBalance}
                className="px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 flex items-center gap-1.5 transition-colors"
                title="Alocar automaticamente colaboradores extras para os blocos com maior carga"
              >
                <Scale className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Equilibrar</span>
              </button>
            )}

            <button
              onClick={() => {
                setAddBlockTarget('Bloco A');
                setShowAddModal(true);
              }}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Novo Colaborador</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {activeTab === 'DIRECTORY' ? (
          <CollaboratorDirectoryTab
            users={users}
            blockTeams={blockTeams}
            taskSheets={taskSheets}
            rooms={rooms}
            onAddUser={addUser}
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
            onSwitchUser={switchUser}
          />
        ) : (
          <>

        {/* METRICS & FILTER SUB-HEADER */}
        <div className="px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Empregadas Ativas:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{totalActiveStaff}</span>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Governantas:</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">{totalSupervisors}</span>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Total Créditos Resort:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{totalCreditsHotel.toFixed(1)} cr</span>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Média Geral / Pessoa:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{avgCreditsPerPerson} cr</span>
            </div>
          </div>

          {/* Search & Role Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar pessoa ou telefone..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">Todos os Papéis</option>
              <option value="HOUSEKEEPER">Empregadas Fixas</option>
              <option value="EXTRA">Extras (Gás Extra)</option>
              <option value="SUPERVISOR">Governantas</option>
              <option value="ADMIN">Chefia</option>
            </select>
          </div>
        </div>

        {/* COLOR VERIFICATION & PALETTE STRIP */}
        <div className="px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Palette className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
              Cores das Equipas por Bloco:
            </span>
            <span className="text-[11px] text-slate-400 hidden md:inline">
              (Clique na paleta de cada coluna para personalizar a cor do cartão)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {blockTeams.map(t => {
              const pal = getTeamColorPalette(t.color || t.block);
              const mCount = users.filter(u => getStaffBlock(u) === t.block).length;
              return (
                <div
                  key={t.id}
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-semibold transition-all ${pal.badge}`}
                  title={`${t.block}: Cor ${pal.name} · ${mCount} colaboradores · Governanta: ${t.supervisorName || 'N/A'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${pal.dot} ring-1 ring-white/50`} />
                  <span>{t.block}</span>
                  <span className="opacity-75 font-normal text-[10px]">({pal.name.split(' ')[0]})</span>
                  <span className="ml-0.5 px-1 rounded-full bg-white/60 dark:bg-slate-900/40 text-[9px]">
                    {mCount}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* MAIN BOARD: KANBAN COLUMNS POR BLOCO COM CORES */}
        <div className="flex-1 overflow-x-auto p-4 bg-slate-100/60 dark:bg-slate-950/40">
          <div className="flex gap-4 min-h-full items-stretch">
            {blockTeams.map(team => {
              const palette = getTeamColorPalette(team.color || team.block);
              const stat = blockStats[team.block] || {
                totalRooms: 0,
                totalCredits: 0,
                departuresWithArrival: 0,
                stayovers: 0,
                members: [],
                creditsPerPerson: 0
              };

              const isOver = dragOverBlock === team.block;
              const hasDragging = !!draggingStaffId;
              const isPool = team.block === 'Apoio & Rotativas';
              const isColorMenuOpen = colorPickerOpenTeamId === team.id;

              return (
                <div
                  key={team.id}
                  onDragOver={e => handleDragOver(e, team.block)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, team.block)}
                  className={`w-72 sm:w-80 shrink-0 flex flex-col rounded-2xl border-t-4 border transition-all duration-150 ${palette.topBorder} ${
                    isOver
                      ? `${palette.borderFocused} ${palette.bgLight} shadow-xl scale-[1.01]`
                      : hasDragging
                      ? `${palette.borderLight} bg-white dark:bg-slate-900 shadow-sm`
                      : isPool
                      ? 'border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'
                      : `${palette.borderLight} bg-white dark:bg-slate-900 shadow-xs`
                  }`}
                >
                  {/* Column Header */}
                  <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-3 h-3 rounded-full ${palette.dot} shadow-xs ring-2 ring-white dark:ring-slate-800 shrink-0`} />
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                            {team.name}
                          </h4>
                          
                          {/* Quick Color Picker Trigger */}
                          <div className="relative shrink-0">
                            <button
                              onClick={() => setColorPickerOpenTeamId(isColorMenuOpen ? null : team.id)}
                              className={`p-1 rounded-md text-[10px] font-semibold flex items-center gap-1 border transition-colors ${palette.badge}`}
                              title={`Cor atual: ${palette.name} · Clique para trocar`}
                            >
                              <Palette className="w-3 h-3" />
                              <span className="hidden sm:inline">{palette.name.split(' ')[0]}</span>
                            </button>

                            {/* Color Picker Dropdown Popover */}
                            {isColorMenuOpen && (
                              <div className="absolute left-0 top-full mt-1.5 w-52 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-40 animate-in fade-in zoom-in-95 duration-100 space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block px-1">
                                  Escolher Cor do Cartão ({team.block}):
                                </span>
                                <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                                  {Object.values(AVAILABLE_TEAM_COLORS).map(c => {
                                    const isSelected = (team.color || '').toLowerCase() === c.id;
                                    return (
                                      <button
                                        key={c.id}
                                        onClick={() => {
                                          updateBlockTeam({ ...team, color: c.id });
                                          setColorPickerOpenTeamId(null);
                                        }}
                                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium border text-left transition-all ${
                                          isSelected
                                            ? `${c.badge} ring-2 ${c.ring} font-bold`
                                            : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                        }`}
                                      >
                                        <span className={`w-2.5 h-2.5 rounded-full ${c.dot} shrink-0`} />
                                        <span className="truncate">{c.name}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {team.description} {team.supervisorName ? `· Gov: ${team.supervisorName}` : ''}
                        </p>
                      </div>

                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 ${palette.badge}`}>
                        {stat.members.length} {stat.members.length === 1 ? 'pessoa' : 'pessoas'}
                      </span>
                    </div>

                    {/* Workload Indicator for Hotel Blocks */}
                    {!isPool && (
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Quartos: <b className="text-slate-800 dark:text-slate-200">{stat.totalRooms}</b> ({stat.departuresWithArrival} saídas c/ chegada)</span>
                          <span>Créditos: <b className="text-blue-600 dark:text-blue-400">{stat.totalCredits} cr</b></span>
                        </div>
                        
                        <div className="flex items-center justify-between font-semibold pt-0.5">
                          <span className="text-slate-500">Carga / Pessoa:</span>
                          <span className={`${
                            stat.members.length === 0
                              ? 'text-rose-600 dark:text-rose-400 flex items-center gap-1 font-bold'
                              : stat.creditsPerPerson > 14
                              ? 'text-amber-600 dark:text-amber-400 font-bold'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {stat.members.length === 0 ? (
                              <>
                                <AlertTriangle className="w-3 h-3" />
                                <span>Sem Pessoal!</span>
                              </>
                            ) : (
                              `${stat.creditsPerPerson} cr / pessoa`
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DROP ZONE NOTIFIER */}
                  {isOver && (
                    <div className={`mx-3 mt-2 p-3 border-2 border-dashed rounded-xl ${palette.badge} text-xs font-bold text-center animate-pulse flex items-center justify-center gap-2`}>
                      <UserCheck className="w-4 h-4" />
                      <span>Soltar para transferir para {team.block}</span>
                    </div>
                  )}

                  {/* STAFF MEMBERS LIST (DRAGGABLE CARDS COM COR DO BLOCO) */}
                  <div className="p-3 flex-1 overflow-y-auto space-y-2.5 min-h-[160px]">
                    {stat.members.length === 0 && !isOver && (
                      <div className="h-28 flex flex-col items-center justify-center text-center p-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 text-xs">
                        <Users className="w-6 h-6 mb-1 opacity-40" />
                        <span>Nenhum colaborador alocado</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          Arraste alguém para cá
                        </span>
                      </div>
                    )}

                    {stat.members.map(member => {
                      const isBeingDragged = draggingStaffId === member.id;

                      // Task sheet que tem esta pessoa
                      const assignedSheet = taskSheets.find(s => s.assignedUserIds.includes(member.id));

                      return (
                        <div
                          key={member.id}
                          draggable
                          onDragStart={e => handleDragStart(e, member)}
                          onDragEnd={handleDragEnd}
                          className={`p-3 rounded-xl border border-l-4 ${palette.bar} ${palette.borderLight} bg-white dark:bg-slate-800 transition-all select-none cursor-grab active:cursor-grabbing group shadow-2xs hover:shadow-md ${
                            isBeingDragged
                              ? 'opacity-40 scale-95 border-blue-500 ring-2 ring-blue-500'
                              : 'hover:border-slate-400'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              {/* Grip Handle */}
                              <div className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors">
                                <GripVertical className="w-4 h-4" />
                              </div>

                              {/* Avatar com cor do bloco ou papel */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                                member.isExtra
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300'
                                  : member.role === UserRole.SUPERVISOR
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 border border-purple-300'
                                  : `${palette.avatar} border border-white/20`
                              }`}>
                                {member.name.substring(0, 2).toUpperCase()}
                              </div>

                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                    {member.name}
                                  </span>
                                  {member.isOnDuty === false && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                      Folga
                                    </span>
                                  )}
                                  {member.isExtra && (
                                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                      Extra
                                    </span>
                                  )}
                                  {member.role === UserRole.SUPERVISOR && (
                                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                      Gov
                                    </span>
                                  )}
                                  {member.defaultBlock && member.defaultBlock !== team.block && (
                                    <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1 rounded" title={`Bloco Padrão: ${member.defaultBlock}`}>
                                      Def: {member.defaultBlock}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                  {member.phoneDeviceId ? (
                                    <span className="flex items-center gap-0.5">
                                      <Smartphone className="w-3 h-3" />
                                      {member.phoneDeviceId}
                                    </span>
                                  ) : (
                                    <span>{member.role.toUpperCase()}</span>
                                  )}

                                  {assignedSheet && (
                                    <span className="font-medium text-blue-600 dark:text-blue-400">
                                      · Sheet #{assignedSheet.sheetNumber}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Switch User quick button */}
                            <button
                              onClick={() => switchUser(member.id)}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                              title="Assumir sessão deste colaborador"
                            >
                              Entrar
                            </button>
                          </div>

                          {/* Quick Block Switcher (for Touch/Accessibility) */}
                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Mover para:</span>
                            <select
                              value={getStaffBlock(member)}
                              onChange={e => moveStaffToBlock(member.id, e.target.value)}
                              className="px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 font-medium"
                            >
                              {blockTeams.map(t => (
                                <option key={t.id} value={t.block}>
                                  {t.block}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>


                  {/* Column Footer: Quick Add to this Block */}
                  <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <button
                      onClick={() => {
                        setAddBlockTarget(team.block);
                        setShowAddModal(true);
                      }}
                      className="w-full py-1.5 px-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar a {team.block}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </>
      )}

        {/* MODAL FOOTER */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>As alterações de equipas sincronizam instantaneamente com as Task Sheets e o telemóvel de serviço.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 font-bold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 rounded-xl shadow-xs transition-colors"
          >
            Concluir & Guardar
          </button>
        </div>

      </div>

      {/* SUB-MODAL: ADICIONAR NOVO COLABORADOR */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>Adicionar à Equipa do {addBlockTarget}</span>
              </h4>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo ou Identificador
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Beatriz Lima ou Extra #3"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Equipa de Bloco
                  </label>
                  <select
                    value={addBlockTarget}
                    onChange={e => setAddBlockTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    {blockTeams.map(t => (
                      <option key={t.id} value={t.block}>{t.block}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Função (Role)
                  </label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value={UserRole.HOUSEKEEPER}>Empregada de Andares</option>
                    <option value={UserRole.SUPERVISOR}>Governanta</option>
                    <option value={UserRole.ADMIN}>Escritório (Chefia)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ID Telemóvel de Serviço (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: TEL-AREA-09"
                  value={phoneDevice}
                  onChange={e => setPhoneDevice(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="extraCheckbox"
                  checked={isExtra}
                  onChange={e => setIsExtra(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="extraCheckbox" className="font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  É funcionária Extra (Gás Extra / Apoio Temporário)
                </label>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="checkbox"
                  id="onDutyQuickCheckbox"
                  checked={isNewOnDuty}
                  onChange={e => setIsNewOnDuty(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="onDutyQuickCheckbox" className="font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  Colaborador está De Serviço hoje (desmarcar para Folga)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Registar na Equipa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
