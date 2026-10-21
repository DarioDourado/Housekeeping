'use client';

import { useState } from 'react';
import type { MobileViewProps } from '../../../types/components/mobile-view.types';
import { useHousekeeping } from '../../../hooks/housekeeping/useHousekeeping';
import { useAuth } from '../../../hooks/auth/useAuth';
import { Room, RoomStatus, ServiceType } from '../../../types/housekeeping.types';
import { UserRole } from '../../../types/auth.types';
import { RoomCard } from '../RoomCard/RoomCard';
import {
  Smartphone,
  ListTodo,
  Bell,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Play,
  Check,
  CheckCheck,
  Sparkles,
  RotateCw,
  BellOff,
  UserX,
  X,
  ChevronRight,
  Info
} from 'lucide-react';

export const MobileView = ({
  onOpenDetail,
  onOpenReproval,
  onOpenChat
}: MobileViewProps) => {
  const { user, users, switchUser } = useAuth();
  const {
    rooms,
    taskSheets,
    alerts,
    acknowledgeAlert,
    startRoom,
    finishRoom,
    recordRefresh,
    recordDND,
    recordRefuseService
  } = useHousekeeping();

  const [activeTab, setActiveTab] = useState<'LIST' | 'ALERTS' | 'PHONE_LOGIN'>('LIST');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>(user?.assignedArea || 'Bloco A');

  // Filter rooms assigned to current user's sheet or area
  const myRooms = rooms.filter(r => {
    // Se for governanta ou admin no modo telemóvel, pode ver a área selecionada
    if (user?.role === UserRole.SUPERVISOR || user?.role === UserRole.ADMIN) {
      if (selectedAreaFilter === 'ALL') return true;
      return r.block.toLowerCase().includes(selectedAreaFilter.toLowerCase());
    }
    // Se for empregada, filtra por sheet atribuída ou área
    const userSheets = taskSheets.filter(s => s.assignedUserIds.includes(user?.id || ''));
    if (userSheets.length > 0) {
      const roomIdsInMySheets = userSheets.flatMap(s => s.roomIds);
      return roomIdsInMySheets.includes(r.id);
    }
    return r.block.toLowerCase().includes((user?.assignedArea || 'Bloco A').toLowerCase());
  }).sort((a, b) => {
    // Prioridades no topo conforme requisitos
    if (a.isPriority && !b.isPriority) return -1;
    if (!a.isPriority && b.isPriority) return 1;
    return a.orderIndex - b.orderIndex;
  });

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);

  return (
    <div className="max-w-md mx-auto bg-slate-100 dark:bg-slate-950 min-h-[820px] rounded-3xl border-4 border-slate-800 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col relative">
      
      {/* Handset Top Notch / Bezel */}
      <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between text-xs shrink-0 select-none">
        <div className="flex items-center gap-1.5 font-bold">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span>VVP Mobile · {user?.phoneDeviceId || 'TEL-GERAL'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-300 font-medium truncate max-w-[120px]">
            {user?.name}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </div>
      </div>

      {/* Mobile Top App Bar (Pattern 2: 52px sticky header) */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            {user?.role === UserRole.SUPERVISOR ? 'Modo Supervisora' : 'Responsável de Área'}
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
            {activeTab === 'LIST' ? `A Minha Lista (${myRooms.length})` : activeTab === 'ALERTS' ? 'Alertas & Traces' : 'Mudar Área / Dispositivo'}
          </h2>
        </div>

        {/* Area quick switcher if supervisor */}
        <select
          value={selectedAreaFilter}
          onChange={e => setSelectedAreaFilter(e.target.value)}
          className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-slate-800 dark:text-slate-200"
        >
          <option value="Bloco A">Bloco A</option>
          <option value="Bloco B">Bloco B</option>
          <option value="Bloco C">Bloco C</option>
          <option value="Oasis Parc">Oasis Parc</option>
          <option value="Master Villas">Vilas</option>
          <option value="ALL">Todos</option>
        </select>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 pb-24">
        
        {/* TAB 1: Minha Lista */}
        {activeTab === 'LIST' && (
          <div className="space-y-3">
            {/* Urgent Alert Banner if any pending alert */}
            {unacknowledgedAlerts.length > 0 && (
              <button
                onClick={() => setActiveTab('ALERTS')}
                className="w-full p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-left flex items-center justify-between gap-2 shadow-xs transition-colors hover:bg-rose-100"
              >
                <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 text-xs font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Tem {unacknowledgedAlerts.length} alerta(s) de governanta / receção!</span>
                </div>
                <ChevronRight className="w-4 h-4 text-rose-600 shrink-0" />
              </button>
            )}

            {/* Room cards optimized for mobile touch */}
            {myRooms.length > 0 ? (
              myRooms.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onOpenDetail={onOpenDetail}
                  onOpenReproval={onOpenReproval}
                />
              ))
            ) : (
              <div className="py-16 text-center text-slate-400">
                <ListTodo className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Nenhum quarto atribuído para esta área
                </p>
                <p className="text-xs mt-1 text-slate-400">
                  Selecione outra área acima ou solicite quartos ao escritório.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Alertas & Reprovações */}
        {activeTab === 'ALERTS' && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Notificações de Quarto & Pedidos
            </h3>

            {alerts.length > 0 ? (
              alerts.map(alt => (
                <div
                  key={alt.id}
                  className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
                    !alt.acknowledged
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        Quarto {alt.roomNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">· {alt.timestamp}</span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      alt.type === 'REPROVAL'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {alt.type === 'REPROVAL' ? 'Correção de Limpeza' : 'Trace Receção'}
                    </span>
                  </div>

                  <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    {alt.message}
                  </p>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {alt.acknowledged ? `Confirmado às ${alt.acknowledgedAt}` : 'A aguardar confirmação'}
                    </span>

                    {!alt.acknowledged ? (
                      <button
                        onClick={() => acknowledgeAlert(alt.id)}
                        className="min-h-[44px] px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirmar Receção</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        Confirmado
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic py-8 text-center">
                Sem alertas no momento.
              </p>
            )}
          </div>
        )}

        {/* TAB 3: Troca de Telemóvel / Área */}
        {activeTab === 'PHONE_LOGIN' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-300">
              <span className="font-bold block mb-1">Login por Área & Telemóvel de Serviço</span>
              <p>
                Cada telemóvel pertence a uma área (Bloco A, Bloco B, etc.). Escolha o colaborador que está a operar este telemóvel no dia de hoje:
              </p>
            </div>

            <div className="space-y-1.5">
              {users.map(person => (
                <button
                  key={person.id}
                  onClick={async () => {
                    await switchUser(person.id);
                    setActiveTab('LIST');
                  }}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-colors min-h-[48px] ${
                    user?.id === person.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <span className="font-bold text-sm block">{person.name}</span>
                    <span className={`text-xs ${user?.id === person.id ? 'text-blue-100' : 'text-slate-400'}`}>
                      {person.assignedArea || 'Geral'} · {person.role.toUpperCase()}
                    </span>
                  </div>

                  {user?.id === person.id && (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Fixed Bottom Tab Bar (Pattern 1: Navigation Anchor) */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-4 items-center h-16 pb-safe">
        
        <button
          onClick={() => setActiveTab('LIST')}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            activeTab === 'LIST'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <ListTodo className="w-5 h-5" />
          <span className="text-[11px] mt-0.5">Quartos</span>
        </button>

        <button
          onClick={() => setActiveTab('ALERTS')}
          className={`relative flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            activeTab === 'ALERTS'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Bell className="w-5 h-5" />
          {unacknowledgedAlerts.length > 0 && (
            <span className="absolute top-1 right-6 w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white dark:ring-slate-900" />
          )}
          <span className="text-[11px] mt-0.5">Alertas</span>
        </button>

        <button
          onClick={onOpenChat}
          className="flex flex-col items-center justify-center min-h-[44px] text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[11px] mt-0.5">Chat & Fotos</span>
        </button>

        <button
          onClick={() => setActiveTab('PHONE_LOGIN')}
          className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
            activeTab === 'PHONE_LOGIN'
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
          }`}
        >
          <Smartphone className="w-5 h-5" />
          <span className="text-[11px] mt-0.5">Telemóvel</span>
        </button>

      </div>

    </div>
  );
};

