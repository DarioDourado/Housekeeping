'use client';

import { useState } from 'react';
import type { RoomCardProps } from '../../../types/components/room-card.types';
import { Room, RoomStatus, ServiceType, RoomTypology } from '../../../types/housekeeping.types';
import { UserRole } from '../../../types/auth.types';
import { useHousekeeping } from '../../../hooks/housekeeping/useHousekeeping';
import { useAuth } from '../../../hooks/auth/useAuth';
import { useI18n } from '../../../hooks/i18n/useI18n';
import {
  Play,
  Check,
  CheckCheck,
  AlertTriangle,
  RotateCw,
  BellOff,
  UserX,
  Star,
  Baby,
  Sparkles,
  ArrowRightLeft,
  Clock,
  Luggage,
  Home,
  LogOut,
  Info,
  GripVertical
} from 'lucide-react';

export const RoomCard = ({
  room,
  onOpenDetail,
  onOpenReproval,
  onMoveRoom,
  compact = false
}: RoomCardProps) => {
  const { user } = useAuth();
  const { t } = useI18n();
  const [isDragging, setIsDragging] = useState(false);
  const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | null>(null);

  const {
    startRoom,
    finishRoom,
    inspectRoom,
    recordRefresh,
    recordDND,
    recordRefuseService,
    togglePriority,
    draggingRoomId,
    setDraggingRoomId,
    moveRoomToSheet
  } = useHousekeeping();

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', room.id);
    e.dataTransfer.setData('application/json', JSON.stringify({ roomId: room.id, fromSheetId: room.assignedSheetId }));
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    setDraggingRoomId(room.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggingRoomId(null);
  };

  const handleCardDragOver = (e: React.DragEvent) => {
    if (draggingRoomId && draggingRoomId !== room.id) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      setDropPosition(e.clientY < midY ? 'top' : 'bottom');
    }
  };

  const handleCardDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDropPosition(null);
    }
  };

  const handleCardDrop = (e: React.DragEvent) => {
    if (draggingRoomId && draggingRoomId !== room.id) {
      e.preventDefault();
      e.stopPropagation();
      const pos = dropPosition;
      setDropPosition(null);
      const draggedId = e.dataTransfer.getData('text/plain') || draggingRoomId;
      if (draggedId) {
        const targetIdx = pos === 'bottom' ? room.orderIndex + 1 : room.orderIndex;
        moveRoomToSheet(draggedId, room.assignedSheetId, targetIdx);
      }
    }
  };

  const isSupervisorOrAdmin = user?.role === UserRole.SUPERVISOR || user?.role === UserRole.ADMIN;
  const isReception = user?.role === UserRole.RECEPTION;
  const isHousekeeper = user?.role === UserRole.HOUSEKEEPER;

  // Status Styling
  const getStatusBadge = (status: RoomStatus) => {
    switch (status) {
      case RoomStatus.DIRTY:
        return {
          label: 'Sujo (Dirty)',
          className: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
        };
      case RoomStatus.CLEAN:
        return {
          label: 'Limpo (Clean)',
          className: 'text-sky-700 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60'
        };
      case RoomStatus.INSPECTED:
        return {
          label: 'Inspecionado',
          className: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
        };
    }
  };

  // Service Type Styling & Icon
  const getServiceTypeMeta = (type: ServiceType) => {
    switch (type) {
      case ServiceType.DEPARTURE_ARRIVAL:
        return {
          label: 'Saída c/ Chegada',
          icon: Luggage,
          color: 'text-rose-600 dark:text-rose-400 font-semibold'
        };
      case ServiceType.STAYOVER:
        return {
          label: 'Estadia',
          icon: Home,
          color: 'text-blue-600 dark:text-blue-400'
        };
      case ServiceType.DEPARTURE_ONLY:
        return {
          label: 'Só Saída',
          icon: LogOut,
          color: 'text-stone-500 dark:text-stone-400'
        };
      case ServiceType.REFRESH:
        return {
          label: 'Refresh',
          icon: Sparkles,
          color: 'text-purple-600 dark:text-purple-400 font-medium'
        };
    }
  };

  const statusMeta = getStatusBadge(room.morningStatus);
  const serviceMeta = getServiceTypeMeta(room.serviceType);
  const ServiceIcon = serviceMeta.icon;

  const isCleaningActive = !!room.operational.activeStartTime && !room.operational.activeEndTime;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleCardDragOver}
      onDragLeave={handleCardDragLeave}
      onDrop={handleCardDrop}
      className={`relative group bg-white dark:bg-slate-900 border rounded-xl transition-all duration-150 cursor-grab active:cursor-grabbing select-none ${
        isDragging
          ? 'opacity-35 scale-[0.98] ring-2 ring-blue-500 shadow-xl'
          : room.isPriority
          ? 'border-rose-400 dark:border-rose-600 shadow-xs shadow-rose-100 dark:shadow-none'
          : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-xs hover:shadow-md'
      } ${compact ? 'p-3' : 'p-3.5'}`}
    >
      {/* Top Drop Insertion Indicator */}
      {dropPosition === 'top' && (
        <div className="absolute -top-1.5 left-2 right-2 h-1 bg-blue-600 rounded-full z-20 animate-pulse ring-2 ring-blue-400/50 flex items-center justify-between">
          <span className="w-2 h-2 rounded-full bg-blue-600 -ml-1" />
          <span className="w-2 h-2 rounded-full bg-blue-600 -mr-1" />
        </div>
      )}

      {/* Bottom Drop Insertion Indicator */}
      {dropPosition === 'bottom' && (
        <div className="absolute -bottom-1.5 left-2 right-2 h-1 bg-blue-600 rounded-full z-20 animate-pulse ring-2 ring-blue-400/50 flex items-center justify-between">
          <span className="w-2 h-2 rounded-full bg-blue-600 -ml-1" />
          <span className="w-2 h-2 rounded-full bg-blue-600 -mr-1" />
        </div>
      )}

      {/* Top Strip: Drag Handle, Room Number, Typology & Status */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <div
            className="p-1 -ml-1 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors"
            title="Arrastar e soltar (Drag & Drop) este quarto para qualquer bloco ou secção"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          <button
            onClick={() => onOpenDetail(room)}
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 tabular-nums flex items-center gap-1.5"
            title="Ver ficha completa do quarto"
          >
            <span>{room.number}</span>
          </button>

          <span className="text-xs text-slate-500 dark:text-slate-400">
            {room.block}
          </span>

          {room.typology !== RoomTypology.STANDARD && (
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
              {room.typology === RoomTypology.VILLA ? 'Villa' : room.typology === RoomTypology.SUITE ? 'Suite' : 'Jr Suite'}
            </span>
          )}
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusMeta.className}`}>
            {statusMeta.label}
          </span>
        </div>
      </div>

      {/* Service Type & Priority */}
      <div className="flex items-center gap-2 mb-2.5 text-xs">
        <span className={`flex items-center gap-1 ${serviceMeta.color}`}>
          <ServiceIcon className="w-3.5 h-3.5 shrink-0" />
          <span>{serviceMeta.label}</span>
        </span>

        {room.isPriority && (
          <>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Prioridade {room.prioritySetBy ? `(${room.prioritySetBy})` : ''}</span>
            </span>
          </>
        )}

        {room.operational.totalRefreshCount > 0 && (
          <>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-purple-600 dark:text-purple-400 tabular-nums">
              {room.operational.totalRefreshCount} {room.operational.totalRefreshCount === 1 ? 'refresh' : 'refreshes'}
            </span>
          </>
        )}
      </div>

      {/* Guest & Key Opera Indicators */}
      <div className="mb-3 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[190px]">
            {room.guest.guestName}
          </span>
          {room.guest.arrivalEta && (
            <span className="text-slate-500 dark:text-slate-400 tabular-nums text-[11px]">
              ETA {room.guest.arrivalEta.split(' ')[0]}
            </span>
          )}
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center gap-1 pt-1">
          {room.guest.vipType && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
              {room.guest.vipType}
            </span>
          )}

          {room.guest.childAges && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
              <Baby className="w-3 h-3" />
              <span>Berço / Criança</span>
            </span>
          )}

          {room.guest.isLinenChangeDue && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-200 dark:border-cyan-800">
              <RotateCw className="w-3 h-3" />
              <span>Muda Lençóis</span>
            </span>
          )}

          {room.operational.isDND && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
              <BellOff className="w-3 h-3" />
              <span>DND</span>
            </span>
          )}

          {room.operational.isRefusedService && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">
              <UserX className="w-3 h-3" />
              <span>Recusou</span>
            </span>
          )}
        </div>
      </div>

      {/* Reproval Warning Banner if any */}
      {room.operational.inspectionReprovalNote && (
        <div className="mb-3 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300">
          <div className="flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Correção Solicitada: </span>
              <span>{room.operational.inspectionReprovalNote}</span>
            </div>
          </div>
        </div>
      )}

      {/* Active Cleaning Timer feedback */}
      {isCleaningActive && (
        <div className="mb-3 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/30 p-2 rounded-lg border border-blue-200 dark:border-blue-900">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            Em limpeza por {room.operational.activeWorkerName || 'Empregada'}
          </span>
          <span className="tabular-nums">Início: {new Date(room.operational.activeStartTime!).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      )}

      {/* Action Controls Toolbar */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-1.5">
        {/* Left Side primary status flow */}
        <div className="flex items-center gap-1.5">
          {/* Housekeeper: Start / Finish */}
          {room.morningStatus === RoomStatus.DIRTY && !isCleaningActive && (
            <button
              onClick={() => startRoom(room.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors whitespace-nowrap shadow-xs active:scale-95"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Iniciar</span>
            </button>
          )}

          {isCleaningActive && (
            <button
              onClick={() => finishRoom(room.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors whitespace-nowrap shadow-xs active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Terminar (Clean)</span>
            </button>
          )}

          {/* Supervisor / Governanta: Inspect or Reprove */}
          {room.morningStatus === RoomStatus.CLEAN && isSupervisorOrAdmin && (
            <>
              <button
                onClick={() => inspectRoom(room.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors whitespace-nowrap shadow-xs active:scale-95"
                title="Aprovar inspeção e atualizar Opera para Inspected"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Aprovar</span>
              </button>

              <button
                onClick={() => onOpenReproval(room)}
                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-md border border-rose-200 dark:border-rose-800 transition-colors whitespace-nowrap"
                title="Reprovar com nota para a empregada voltar ao quarto"
              >
                <span>Reprovar</span>
              </button>
            </>
          )}

          {/* Refresh button if Clean and arrival anticipated */}
          {room.morningStatus === RoomStatus.CLEAN && (
            <button
              onClick={() => recordRefresh(room.id)}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 rounded-md border border-purple-200 dark:border-purple-800 transition-colors whitespace-nowrap"
              title="Registar refresh efetuado (toque no quarto já limpo)"
            >
              <Sparkles className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          )}

          {/* If already Inspected, supervisor can re-inspect or mark Dirty if needed */}
          {room.morningStatus === RoomStatus.INSPECTED && isSupervisorOrAdmin && (
            <button
              onClick={() => onOpenDetail(room)}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pronto p/ Receção</span>
            </button>
          )}
        </div>

        {/* Right side utility icons: Detail, Priority, Move */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => togglePriority(room.id)}
            className={`p-1.5 rounded-md transition-colors ${
              room.isPriority
                ? 'text-rose-600 bg-rose-50 dark:bg-rose-950 dark:text-rose-400'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={room.isPriority ? 'Remover Prioridade Urgente' : 'Marcar Prioridade Urgente'}
            aria-label="Prioridade"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
          </button>

          {onMoveRoom && (
            <button
              onClick={() => onMoveRoom(room)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              title="Mover quarto para outra task sheet"
              aria-label="Mover quarto"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => onOpenDetail(room)}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            title="Ver detalhe do Opera e histórico"
            aria-label="Ver detalhes"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

