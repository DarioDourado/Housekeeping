'use client';

import { useState } from 'react';
import { Room, RoomStatus, ServiceType, RoomTypology } from '../../../types/housekeeping.types';
import { UserRole } from '../../../types/auth.types';
import { useHousekeeping } from '../../../services/hooks/housekeeping/useHousekeeping';
import { useAuth } from '../../../services/hooks/auth/useAuth';
import {
  X,
  Star,
  Baby,
  RotateCw,
  Clock,
  Sparkles,
  AlertTriangle,
  Check,
  CheckCheck,
  Play,
  RotateCcw,
  BellOff,
  UserX,
  FileText,
  UserCheck,
  Send,
  Building,
  Calendar,
  HeartHandshake
} from 'lucide-react';

interface RoomDetailModalProps {
  room: Room;
  onClose: () => void;
  onOpenReproval: (room: Room) => void;
}

export const RoomDetailModal = ({
  room,
  onClose,
  onOpenReproval
}: RoomDetailModalProps) => {
  const { user } = useAuth();
  const {
    startRoom,
    finishRoom,
    inspectRoom,
    markRoomDirty,
    recordRefresh,
    recordDND,
    recordRefuseService,
    togglePriority,
    sendTraceAlert
  } = useHousekeeping();

  const [traceText, setTraceText] = useState('');
  const [showTraceInput, setShowTraceInput] = useState(false);

  const isSupervisorOrAdmin = user?.role === UserRole.SUPERVISOR || user?.role === UserRole.ADMIN;
  const isCleaningActive = !!room.operational.activeStartTime && !room.operational.activeEndTime;

  const handleSendTrace = async () => {
    if (!traceText.trim()) return;
    await sendTraceAlert(room.id, traceText);
    setTraceText('');
    setShowTraceInput(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                Quarto {room.number}
              </span>
              <span className="text-xs text-slate-500 font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">
                {room.block} · Piso {room.floor}
              </span>
            </div>

            <span className={`text-xs px-2.5 py-0.5 rounded-md font-semibold ${
              room.morningStatus === RoomStatus.DIRTY
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                : room.morningStatus === RoomStatus.CLEAN
                ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}>
              {room.morningStatus === RoomStatus.DIRTY ? 'Sujo (Dirty)' : room.morningStatus === RoomStatus.CLEAN ? 'Limpo (Clean)' : 'Inspecionado (Inspected)'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700 dark:text-slate-300">
          
          {/* Guest Identity & VIP Strip */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hóspede Opera PMS</span>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  {room.guest.guestName}
                  {room.guest.vipType && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      {room.guest.vipType}
                    </span>
                  )}
                </h3>
              </div>

              {room.guest.arrivalEta && (
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">Hora de Chegada (ETA)</span>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                    {room.guest.arrivalEta}
                  </span>
                </div>
              )}
            </div>

            {/* Occupancy details */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs">
              <div>
                <span className="text-slate-500 block">Adultos / Crianças</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {room.guest.adults} adultos · {room.guest.children} crianças
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block font-medium">Idades das Crianças (Berço / Grades)</span>
                <span className={`font-semibold ${room.guest.childAges ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                  {room.guest.childAges || 'Sem crianças registadas'}
                </span>
              </div>
            </div>
          </div>

          {/* Opera Synchronization Status & Night Audit info */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-slate-400 block mb-0.5">Sincronização Opera Cloud</span>
              <div className="flex items-center justify-between font-medium">
                <span>Último Estado Opera: <strong className="text-slate-900 dark:text-slate-100">{room.operaStatus}</strong></span>
                <span className="text-slate-500 tabular-nums">{room.operaLastSyncedAt}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-slate-400 block mb-0.5">Troca de Lençóis (Muda)</span>
              <div className="flex items-center gap-1.5 font-semibold">
                <RotateCw className={`w-3.5 h-3.5 ${room.guest.isLinenChangeDue ? 'text-cyan-600' : 'text-slate-400'}`} />
                <span className={room.guest.isLinenChangeDue ? 'text-cyan-700 dark:text-cyan-300' : 'text-slate-500'}>
                  {room.guest.isLinenChangeDue ? 'Muda Obrigatória Hoje' : 'Muda Não Necessária'}
                </span>
              </div>
            </div>
          </div>

          {/* Daily instructions & Traces */}
          <div className="space-y-3">
            {room.guest.dailyInstructions && (
              <div className="p-3.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900 text-xs">
                <span className="font-bold text-amber-900 dark:text-amber-300 block mb-1">
                  Daily Information / Instruções de Quarto:
                </span>
                <p className="text-amber-800 dark:text-amber-200 leading-relaxed">
                  {room.guest.dailyInstructions}
                </p>
              </div>
            )}

            {room.guest.traces && room.guest.traces.length > 0 && (
              <div className="p-3.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900 text-xs">
                <span className="font-bold text-indigo-900 dark:text-indigo-300 block mb-1">
                  Traces & Pedidos da Receção:
                </span>
                <ul className="list-disc list-inside space-y-1 text-indigo-800 dark:text-indigo-200">
                  {room.guest.traces.map((trace, i) => (
                    <li key={i}>{trace}</li>
                  ))}
                </ul>
              </div>
            )}

            {room.guest.specials && room.guest.specials.length > 0 && (
              <div className="p-3.5 rounded-lg bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900 text-xs">
                <span className="font-bold text-purple-900 dark:text-purple-300 block mb-1">
                  Specials & Comemorações (Flores / Champanhe / Aniversário):
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {room.guest.specials.map((sp, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-medium">
                      {sp}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {room.guest.preferences && (
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                <span className="font-semibold text-slate-500 block mb-0.5">Preferências do Hóspede:</span>
                <p className="text-slate-700 dark:text-slate-300">{room.guest.preferences}</p>
              </div>
            )}
          </div>

          {/* Quick Trace dispatch form */}
          <div>
            {!showTraceInput ? (
              <button
                onClick={() => setShowTraceInput(true)}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>+ Enviar Trace ou Pedido Urgente à Empregada de Área</span>
              </button>
            ) : (
              <div className="space-y-2 p-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20">
                <label className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                  Novo Pedido para Quarto {room.number}:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={traceText}
                    onChange={e => setTraceText(e.target.value)}
                    placeholder="Ex: Entregar berço adicional, reposição de toalhas de praia..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                  <button
                    onClick={handleSendTrace}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    Enviar
                  </button>
                  <button
                    onClick={() => setShowTraceInput(false)}
                    className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-2">
          
          {/* Quick DND & Refuse Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => recordDND(room.id)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors flex items-center gap-1 ${
                room.operational.isDND
                  ? 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                  : 'border-slate-200 hover:bg-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <BellOff className="w-3.5 h-3.5" />
              <span>DND</span>
            </button>

            <button
              onClick={() => recordRefuseService(room.id)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors flex items-center gap-1 ${
                room.operational.isRefusedService
                  ? 'bg-stone-200 border-stone-300 text-stone-800 dark:bg-stone-800 dark:text-stone-300'
                  : 'border-slate-200 hover:bg-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Recusou</span>
            </button>

            {room.morningStatus === RoomStatus.CLEAN && (
              <button
                onClick={() => recordRefresh(room.id)}
                className="px-2.5 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 rounded-md transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>+ Refresh ({room.operational.totalRefreshCount})</span>
              </button>
            )}

            {isSupervisorOrAdmin && (
              <button
                onClick={() => markRoomDirty(room.id)}
                className="px-2.5 py-1.5 text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 rounded-md transition-colors flex items-center gap-1"
                title="Reabrir quarto e colocar como DIRTY"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Marcar Dirty</span>
              </button>
            )}
          </div>

          {/* Primary State Flow Buttons */}
          <div className="flex items-center gap-2">
            {room.morningStatus === RoomStatus.DIRTY && !isCleaningActive && (
              <button
                onClick={() => {
                  startRoom(room.id);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Iniciar Limpeza</span>
              </button>
            )}

            {isCleaningActive && (
              <button
                onClick={() => {
                  finishRoom(room.id);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Terminar Limpeza (Clean)</span>
              </button>
            )}

            {room.morningStatus === RoomStatus.CLEAN && isSupervisorOrAdmin && (
              <>
                <button
                  onClick={() => {
                    inspectRoom(room.id);
                    onClose();
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Aprovar Inspeção (Inspected)</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenReproval(room);
                  }}
                  className="px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 rounded-lg transition-colors"
                >
                  Reprovar c/ Nota
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
