import { useTranslation } from 'react-i18next';
import { AlertTriangle, Baby, BellOff, GripVertical, Home, Luggage, LogOut, RotateCw, Sparkles, Star, UserX } from 'lucide-react';
import { usePermission } from '@/hooks/auth/usePermission';
import { useTaskDrag } from '@/hooks/housekeeping/useTaskDrag';
import { formatTime } from '@/lib/datetime';
import { serviceLabelKey } from '@/lib/taskLabels';
import type { TaskView } from '@/lib/taskViews';
import { useOverlayStore } from '@/store/overlayStore';
import { CommercialBlock, InspectionStatus, NotPerformedReason, RoomTypology, TaskKind, TaskStatus } from '@/types/housekeeping.types';
import { OperaStatusBadge, TaskStatusChip } from '@/UI/components/StatusBadges';
import { RoomCardActions } from './RoomCardActions';

interface RoomCardProps {
  view: TaskView;
  index: number;
  compact?: boolean;
}

const SERVICE_STYLE: Record<string, { icon: typeof Home; color: string }> = {
  departureArrival: { icon: Luggage, color: 'text-rose-600 dark:text-rose-400 font-semibold' },
  stayover: { icon: Home, color: 'text-blue-600 dark:text-blue-400' },
  departureOnly: { icon: LogOut, color: 'text-stone-500 dark:text-stone-400' },
  refresh: { icon: Sparkles, color: 'text-purple-600 dark:text-purple-400 font-medium' },
  turndown: { icon: Home, color: 'text-indigo-600 dark:text-indigo-400' }
};

const TYPOLOGY_KEY: Record<RoomTypology, string | null> = {
  [RoomTypology.STANDARD]: null,
  [RoomTypology.JUNIOR_SUITE]: 'juniorSuite',
  [RoomTypology.SUITE]: 'suite',
  [RoomTypology.VILLA]: 'villa'
};

const CHIP = 'inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded border';

// - Um cartão = uma tarefa (limpeza ou refresh) de um quarto, na sua task sheet
export const RoomCard = ({ view, index, compact = false }: RoomCardProps) => {
  const { t } = useTranslation();
  const { task, room, stay } = view;
  const canDistribute = usePermission('sheets.distribute');
  const openDetail = useOverlayStore(state => state.openDetail);
  const { isDragging, dropPosition, draggableProps } = useTaskDrag(task.id, task.sheetId, index, canDistribute);

  const serviceKey = serviceLabelKey(task);
  const service = SERVICE_STYLE[serviceKey] ?? SERVICE_STYLE.stayover;
  const ServiceIcon = service.icon;
  const typologyKey = TYPOLOGY_KEY[room.typology];
  const inProgress = task.status === TaskStatus.IN_PROGRESS;
  const workers = view.executors.map(user => user.name).join(', ');

  return (
    <div
      data-room={view.room.number}
      {...draggableProps}
      className={`relative group bg-white dark:bg-slate-900 border rounded-xl transition-all duration-150 select-none ${canDistribute ? 'cursor-grab active:cursor-grabbing' : ''} ${
        isDragging
          ? 'opacity-35 scale-[0.98] ring-2 ring-blue-500 shadow-xl'
          : task.isPriority
            ? 'border-rose-400 dark:border-rose-600 shadow-xs'
            : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-xs hover:shadow-md'
      } ${compact ? 'p-3' : 'p-3.5'}`}
    >
      {dropPosition && (
        <div className={`absolute ${dropPosition === 'top' ? '-top-1.5' : '-bottom-1.5'} left-2 right-2 h-1 bg-blue-600 rounded-full z-20 animate-pulse ring-2 ring-blue-400/50`} />
      )}

      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {canDistribute && (
            <div className="p-1 -ml-1 text-slate-400 group-hover:text-blue-600 rounded" title={t('room.dragTitle')}>
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          <button
            onClick={() => openDetail(task.id)}
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 tabular-nums"
            title={t('room.openTitle')}
          >
            {room.number}
          </button>
          <span className="text-xs text-slate-500 dark:text-slate-400">{room.block}</span>
          {typologyKey && (
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
              {t(`room.typologyShort.${typologyKey}`)}
            </span>
          )}
          {room.commercialBlock !== CommercialBlock.NONE && (
            <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800">
              {room.commercialBlock}
            </span>
          )}
        </div>
        <OperaStatusBadge status={room.operaStatus} />
      </div>

      <div className="flex items-center gap-2 mb-2.5 text-xs flex-wrap">
        <span className={`flex items-center gap-1 ${service.color}`}>
          <ServiceIcon className="w-3.5 h-3.5 shrink-0" />
          <span>{t(`room.serviceShort.${serviceKey}`)}</span>
        </span>
        {task.isPriority && (
          <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{task.priorityOrigin ? t('room.priorityBy', { by: t(`room.priorityOrigin.${task.priorityOrigin}`) }) : t('room.priority')}</span>
          </span>
        )}
        {view.refreshCount > 0 && <span className="text-purple-600 dark:text-purple-400 tabular-nums">· {t('room.refreshCount', { count: view.refreshCount })}</span>}
        <TaskStatusChip task={task} />
      </div>

      <div className="mb-3 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[190px]">{stay?.guestName ?? '—'}</span>
          {stay?.arrivalEta && <span className="text-slate-500 tabular-nums text-[11px]">{t('room.eta', { time: stay.arrivalEta.split(' ')[0] })}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-1 pt-1">
          {stay?.vipType && (
            <span className={`${CHIP} font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800`}>
              <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
              {stay.vipType}
            </span>
          )}
          {!!stay?.childAges.length && (
            <span className={`${CHIP} text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800`}>
              <Baby className="w-3 h-3" />
              <span>{t('room.cotChild')}</span>
            </span>
          )}
          {stay?.isLinenChangeDue && task.kind === TaskKind.CLEANING && (
            <span className={`${CHIP} text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800`}>
              <RotateCw className="w-3 h-3" />
              <span>{t('badges.linenChange')}</span>
            </span>
          )}
          {task.notPerformedReason === NotPerformedReason.DND && (
            <span className={`${CHIP} text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800`}>
              <BellOff className="w-3 h-3" />
              <span>{t('room.dnd')}</span>
            </span>
          )}
          {task.notPerformedReason === NotPerformedReason.REFUSE_SERVICE && (
            <span className={`${CHIP} text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 border-transparent`}>
              <UserX className="w-3 h-3" />
              <span>{t('room.refused')}</span>
            </span>
          )}
        </div>
      </div>

      {task.inspectionStatus === InspectionStatus.CORRECTION_REQUESTED && (
        <div className="mb-3 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">{t('room.correctionRequested')} </span>
            <span>{task.inspectionNote}</span>
          </div>
        </div>
      )}

      {inProgress && task.startedAt && (
        <div className="mb-3 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/30 p-2 rounded-lg border border-blue-200 dark:border-blue-900">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            {workers ? t('room.cleaningBy', { name: workers }) : t('room.cleaningByTeam', { name: view.startedBy?.name ?? '—' })}
          </span>
          <span className="tabular-nums">{t('room.startedAt', { time: formatTime(task.startedAt) })}</span>
        </div>
      )}

      <RoomCardActions view={view} />
    </div>
  );
};
