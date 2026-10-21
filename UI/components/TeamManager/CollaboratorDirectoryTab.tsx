'use client';

import { useState, useMemo } from 'react';
import { User, UserRole } from '../../../types/auth.types';
import { BlockTeam, TaskSheet, Room } from '../../../types/housekeeping.types';
import { getTeamColorPalette } from './teamColorUtils';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Search,
  Filter,
  Edit2,
  Trash2,
  Check,
  X,
  Smartphone,
  Clock,
  Building2,
  Shield,
  Sparkles,
  ArrowRightLeft,
  Calendar,
  AlertCircle,
  HelpCircle,
  LogIn
} from 'lucide-react';

interface CollaboratorDirectoryTabProps {
  users: User[];
  blockTeams: BlockTeam[];
  taskSheets: TaskSheet[];
  rooms: Room[];
  onAddUser: (newUser: Omit<User, 'id'>) => Promise<void>;
  onUpdateUser: (updatedUser: User) => Promise<void>;
  onDeleteUser: (userId: string) => Promise<void>;
  onSwitchUser: (userId: string) => Promise<void>;
}

// Helpers para normalizar o bloco do utilizador
const getStaffBlock = (u: User): string => {
  if (u.assignedArea) {
    const a = u.assignedArea.trim();
    if (a.includes('Bloco A')) return 'Bloco A';
    if (a.includes('Bloco B')) return 'Bloco B';
    if (a.includes('Bloco C')) return 'Bloco C';
    if (a.includes('Bloco D')) return 'Bloco D';
    if (a.includes('Oasis')) return 'Oasis Parc';
    if (a.includes('Vilas') || a.includes('Villa')) return 'Master Villas';
    if (a.includes('Apoio') || a.includes('Rotativa')) return 'Apoio & Rotativas';
    return a;
  }
  return u.defaultBlock || 'Apoio & Rotativas';
};

const getStaffDefaultBlock = (u: User): string => {
  return u.defaultBlock || getStaffBlock(u);
};

export const CollaboratorDirectoryTab = ({
  users,
  blockTeams,
  taskSheets,
  rooms,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onSwitchUser
}: CollaboratorDirectoryTabProps) => {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [blockFilter, setBlockFilter] = useState<string>('ALL');
  const [dutyFilter, setDutyFilter] = useState<'ALL' | 'ON_DUTY' | 'OFF_DUTY'>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modal de Adicionar / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: UserRole;
    defaultBlock: string;
    assignedArea: string;
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
    assignedArea: 'Bloco A',
    isOnDuty: true,
    shift: 'Manhã',
    phoneDeviceId: '',
    isExtra: false,
    notes: ''
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Abrir modal para adicionar
  const handleOpenAdd = () => {
    setEditingUserId(null);
    setFormData({
      name: '',
      email: '',
      role: UserRole.HOUSEKEEPER,
      defaultBlock: 'Bloco A',
      assignedArea: 'Bloco A',
      isOnDuty: true,
      shift: 'Manhã',
      phoneDeviceId: `TEL-${Math.floor(Math.random() * 90 + 10)}`,
      isExtra: false,
      notes: ''
    });
    setIsModalOpen(true);
  };

  // Abrir modal para editar
  const handleOpenEdit = (user: User) => {
    setEditingUserId(user.id);
    const defBlock = getStaffDefaultBlock(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      defaultBlock: defBlock,
      assignedArea: user.assignedArea || defBlock,
      isOnDuty: user.isOnDuty !== false,
      shift: user.shift || 'Manhã',
      phoneDeviceId: user.phoneDeviceId || '',
      isExtra: !!user.isExtra,
      notes: user.notes || ''
    });
    setIsModalOpen(true);
  };

  // Submeter formulário (Criar ou Atualizar)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingUserId) {
      // Editar
      const target = users.find(u => u.id === editingUserId);
      if (target) {
        await onUpdateUser({
          ...target,
          name: formData.name.trim(),
          email: formData.email.trim() || target.email,
          role: formData.role,
          defaultBlock: formData.defaultBlock,
          assignedArea: formData.assignedArea || formData.defaultBlock,
          isOnDuty: formData.isOnDuty,
          shift: formData.shift,
          phoneDeviceId: formData.phoneDeviceId.trim(),
          isExtra: formData.isExtra,
          notes: formData.notes.trim()
        });
      }
    } else {
      // Adicionar novo
      const emailGenerated = formData.email.trim() || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@vilavitaparc.com`;
      await onAddUser({
        name: formData.name.trim(),
        email: emailGenerated,
        role: formData.role,
        defaultBlock: formData.defaultBlock,
        assignedArea: formData.defaultBlock,
        isOnDuty: formData.isOnDuty,
        shift: formData.shift,
        phoneDeviceId: formData.phoneDeviceId.trim(),
        isExtra: formData.isExtra,
        notes: formData.notes.trim()
      });
    }

    setIsModalOpen(false);
  };

  // Alternar status de serviço com 1 clique
  const handleToggleDuty = async (user: User) => {
    const nextStatus = user.isOnDuty === false ? true : false;
    await onUpdateUser({
      ...user,
      isOnDuty: nextStatus
    });
  };

  // Mudar bloco default diretamente
  const handleChangeDefaultBlock = async (user: User, newDefault: string) => {
    await onUpdateUser({
      ...user,
      defaultBlock: newDefault,
      // Se não estiver atribuído a outra área, acompanha o default
      assignedArea: user.assignedArea === user.defaultBlock ? newDefault : user.assignedArea
    });
  };

  // Restaurar para bloco default
  const handleRestoreToDefault = async (user: User) => {
    const def = getStaffDefaultBlock(user);
    await onUpdateUser({
      ...user,
      assignedArea: def
    });
  };

  // Lista filtrada
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchPhone = (u.phoneDeviceId || '').toLowerCase().includes(q);
        const matchNotes = (u.notes || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchNotes) return false;
      }

      // Bloco Default
      if (blockFilter !== 'ALL') {
        const def = getStaffDefaultBlock(u);
        if (def !== blockFilter) return false;
      }

      // Status de Serviço
      if (dutyFilter === 'ON_DUTY' && u.isOnDuty === false) return false;
      if (dutyFilter === 'OFF_DUTY' && u.isOnDuty !== false) return false;

      // Papel
      if (roleFilter !== 'ALL') {
        if (roleFilter === 'EXTRA') {
          if (!u.isExtra) return false;
        } else if (u.role !== roleFilter) {
          return false;
        }
      }

      return true;
    });
  }, [users, searchQuery, blockFilter, dutyFilter, roleFilter]);

  // Métricas
  const totalUsers = users.length;
  const onDutyCount = users.filter(u => u.isOnDuty !== false).length;
  const offDutyCount = users.filter(u => u.isOnDuty === false).length;
  const extraCount = users.filter(u => u.isExtra).length;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-950/40">
      
      {/* STATS & FILTER BAR */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 space-y-3">
        
        {/* Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[11px] text-slate-400 font-medium block">Total Colaboradores</span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{totalUsers}</span>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold block">De Serviço Hoje</span>
              <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{onDutyCount}</span>
            </div>
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/40 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold block">Em Folga / Ausente</span>
              <span className="text-xl font-bold text-slate-700 dark:text-slate-300">{offDutyCount}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
              <UserX className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/40 dark:bg-amber-950/20 flex items-center justify-between shadow-2xs">
            <div>
              <span className="text-[11px] text-amber-800 dark:text-amber-300 font-semibold block">Extras / Apoio</span>
              <span className="text-xl font-bold text-amber-800 dark:text-amber-300">{extraCount}</span>
            </div>
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters and Add Button */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Search */}
            <div className="relative flex-1 sm:w-64 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar por nome, email ou PDA..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Filter by Status */}
            <select
              value={dutyFilter}
              onChange={e => setDutyFilter(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">Todos os Estados</option>
              <option value="ON_DUTY">🟢 De Serviço Hoje</option>
              <option value="OFF_DUTY">⚪ Em Folga / Ausente</option>
            </select>

            {/* Filter by Default Block */}
            <select
              value={blockFilter}
              onChange={e => setBlockFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">Todos os Blocos Default</option>
              {blockTeams.map(t => (
                <option key={t.id} value={t.block}>
                  {t.block}
                </option>
              ))}
            </select>

            {/* Filter by Role */}
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">Todos os Papéis</option>
              <option value={UserRole.HOUSEKEEPER}>Empregadas Fixas</option>
              <option value="EXTRA">Extras (Gás Extra)</option>
              <option value={UserRole.SUPERVISOR}>Governantas</option>
              <option value={UserRole.ADMIN}>Chefia</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Adicionar Colaborador</span>
            </button>
          </div>

        </div>

      </div>

      {/* TABLE / LIST OF COLLABORATORS */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 font-semibold">
                <th className="py-3 px-4">Colaborador</th>
                <th className="py-3 px-3">Status de Serviço</th>
                <th className="py-3 px-3">Bloco por Default</th>
                <th className="py-3 px-3">Bloco Atual Hoje</th>
                <th className="py-3 px-3">Turno</th>
                <th className="py-3 px-3">Dispositivo / PDA</th>
                <th className="py-3 px-3">Task Sheet</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-medium">Nenhum colaborador encontrado com os filtros atuais.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setBlockFilter('ALL');
                        setDutyFilter('ALL');
                        setRoleFilter('ALL');
                      }}
                      className="mt-2 text-blue-600 hover:underline text-xs"
                    >
                      Limpar filtros
                    </button>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const defBlock = getStaffDefaultBlock(u);
                  const currBlock = getStaffBlock(u);
                  const defPalette = getTeamColorPalette(defBlock);
                  const currPalette = getTeamColorPalette(currBlock);
                  const isOnDuty = u.isOnDuty !== false;
                  const isMoved = currBlock !== defBlock;
                  const assignedSheet = taskSheets.find(s => s.assignedUserIds.includes(u.id));

                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50 ${
                        !isOnDuty ? 'opacity-65 bg-slate-50/40 dark:bg-slate-900/40' : ''
                      }`}
                    >
                      {/* Name & Role */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs border ${
                              u.isExtra
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border-amber-300'
                                : u.role === UserRole.SUPERVISOR
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200 border-purple-300'
                                : `${defPalette.avatar} border-white/20`
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
                              {u.role === UserRole.SUPERVISOR && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                  Governanta
                                </span>
                              )}
                              {u.role === UserRole.ADMIN && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                  Chefia
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block mt-0.5 truncate max-w-[200px]">
                              {u.email}
                            </span>
                            {u.notes && (
                              <span className="text-[10px] text-slate-500 italic block mt-0.5">
                                Nota: {u.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status de Serviço (Interactive Toggle) */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleDuty(u)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all shadow-2xs ${
                            isOnDuty
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                          }`}
                          title={`Clique para alternar para ${isOnDuty ? 'Folga' : 'De Serviço'}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          <span>{isOnDuty ? 'De Serviço' : 'Em Folga'}</span>
                        </button>
                      </td>

                      {/* Bloco por Default */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={defBlock}
                            onChange={e => handleChangeDefaultBlock(u, e.target.value)}
                            className={`px-2 py-1 rounded-md text-[11px] font-bold border ${defPalette.badge}`}
                            title="Alterar o bloco padrão/fixo deste colaborador"
                          >
                            {blockTeams.map(t => (
                              <option key={t.id} value={t.block}>
                                {t.block}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Bloco Atual Hoje */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${currPalette.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${currPalette.dot}`} />
                            <span>{currBlock}</span>
                          </span>

                          {isMoved && (
                            <button
                              onClick={() => handleRestoreToDefault(u)}
                              className="p-1 rounded text-amber-600 dark:text-amber-400 hover:bg-amber-100/60 dark:hover:bg-amber-950/40"
                              title={`Transferido hoje de ${defBlock}. Clique para repor ao bloco default.`}
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Turno */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{u.shift || 'Manhã'}</span>
                        </span>
                      </td>

                      {/* Dispositivo / PDA */}
                      <td className="py-3 px-3">
                        {u.phoneDeviceId ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            <Smartphone className="w-3 h-3 text-slate-400" />
                            <span>{u.phoneDeviceId}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Sem PDA</span>
                        )}
                      </td>

                      {/* Task Sheet */}
                      <td className="py-3 px-3">
                        {assignedSheet ? (
                          <span className="font-semibold text-blue-600 dark:text-blue-400 text-[11px]">
                            Sheet #{assignedSheet.sheetNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Nenhuma</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          
                          {/* Switch session */}
                          <button
                            onClick={() => onSwitchUser(u.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                            title="Entrar como este colaborador"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title="Editar dados do colaborador"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          {deleteConfirmId === u.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={async () => {
                                  await onDeleteUser(u.id);
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
                              title="Eliminar colaborador"
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

      {/* MODAL PARA ADICIONAR OU EDITAR COLABORADOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  {editingUserId ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {editingUserId ? 'Editar Colaborador' : 'Adicionar Novo Colaborador'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Configure o bloco fixo por default e o status de serviço
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
              
              {/* Nome */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Marta Pinheiro ou Extra #4"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email ou Identificador de Login
                </label>
                <input
                  type="email"
                  placeholder="Ex: marta.pinheiro@vilavitaparc.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Grid: Papel & Bloco Default */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Função / Papel
                  </label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as UserRole })}
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
                    Bloco por Default *
                  </label>
                  <select
                    value={formData.defaultBlock}
                    onChange={e => setFormData({ ...formData, defaultBlock: e.target.value, assignedArea: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold"
                  >
                    {blockTeams.map(t => (
                      <option key={t.id} value={t.block}>
                        {t.block}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid: Turno & Dispositivo PDA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Turno de Trabalho
                  </label>
                  <select
                    value={formData.shift}
                    onChange={e => setFormData({ ...formData, shift: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Manhã">Turno Manhã (08:00 - 16:30)</option>
                    <option value="Tarde 13h30">Turno Tarde (13:30 - 22:00)</option>
                    <option value="Turndown">Turno Turndown (18:00 - 22:00)</option>
                    <option value="Geral">Horário Geral / Flexível</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ID Telemóvel / PDA de Serviço
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: TEL-AREA-08"
                    value={formData.phoneDeviceId}
                    onChange={e => setFormData({ ...formData, phoneDeviceId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              {/* Status de Serviço Toggle & Extra Checkbox */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2.5">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Está de Serviço Hoje?
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Se desmarcado, fica de folga/ausente e não acumula créditos ativos
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isOnDuty}
                    onChange={e => setFormData({ ...formData, isOnDuty: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                </label>

                <div className="h-px bg-slate-200 dark:bg-slate-700/60" />

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      Colaborador Extra (Gás Extra)?
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Reforço temporário para distribuição flexível entre blocos
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isExtra}
                    onChange={e => setFormData({ ...formData, isExtra: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                  />
                </label>
              </div>

              {/* Notas */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notas / Observações
                </label>
                <input
                  type="text"
                  placeholder="Ex: Folga semanal agendada para 5ª feira"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {editingUserId ? 'Guardar Alterações' : 'Criar Colaborador'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
