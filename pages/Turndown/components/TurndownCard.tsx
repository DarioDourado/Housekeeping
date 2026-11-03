import { useTranslation } from 'react-i18next';
import { Baby, Check, GripVertical, Info, Moon, Play, Star } from 'lucide-react';
import { usePermission } from '@/hooks/auth/usePermission';
import { useFinishTask, useRecordNotPerformed, useReopenTask, useStartTask } from '@/hooks/housekeeping';
import { useTaskDrag } from '@/hooks/housekeeping/useTaskDrag';
import { formatChildAges } from '@/lib/taskLabels';
import type { TaskView } from '@/lib/taskViews';
import { useOverlayStore } from '@/store/overlayStore';
import { NotPerformedReason, TaskStatus } from '@/types/housekeeping.types';
import { TaskStatusChip } from '@/UI/components/StatusBadges';

// - [sigla no cartão, motivo, chave i18n do título, cor ativa]: toggles extra; clicar outra vez desliga e volta a "por iniciar"
const TOGGLES = [
  ['DND', NotPerformedReason.DND, 'toggleDND', 'bg-purple-600 border-purple-600 text-white'],
  ['NQ', NotPerformedReason.REFUSE_SERVICE, 'toggleNQ', 'bg-stone-600 border-stone-600 text-white'],
  ['AC', NotPerformedReason.ALREADY_DONE, 'toggleAC', 'bg-sky-600 border-sky-600 text-white']
] as const;

const CHIP = 'inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded border';
const ACTION = 'px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed';

// - Tarefa de turndown de um quarto: tem estado e histórico próprios e nunca toca no Opera (§10.4, §10.6)
export const TurndownCard = ({ view, index }: { view: TaskView; index: number }) => {
  const { t } = useTranslation();
  const { task, room, stay } = view;
  const canDistribute = usePermission('sheets.distribute');
  const canExecute = usePermission('task.startFinish');
  const startTask = useStartTask();
  const finishTask = useFinishTask();
  const reopenTask = useReopenTask();
  const recordNotPerformed = useRecordNotPerformed();
  const openDetail = useOverlayStore(state => state.openDetail);
  const { isDragging, dropPosition, draggableProps } = useTaskDrag(task.id, task.sheetId, index, canDistribute);

  const done = task.status === TaskStatus.COMPLETED;
  const pending = task.status === TaskStatus.PENDING;
  const inProgress = task.status === TaskStatus.IN_PROGRESS;

  return (
    <div
      {...draggableProps}
      className={`relative p-3 rounded-xl border select-none ${canDistribute ? 'cursor-grab active:cursor-grabbing' : ''} ${
        isDragging
          ? 'opacity-40 scale-[0.98] ring-2 ring-indigo-500'
          : done
            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
            : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
      }`}
    >
      {dropPosition && <div className={`absolute ${dropPosition === 'top' ? '-top-1.5' : '-bottom-1.5'} left-2 right-2 h-1 bg-indigo-600 rounded-full z-20`} />}

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5">
          {canDistribute && <GripVertical className="w-3.5 h-3.5 mt-1 text-slate-400" />}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">{room.number}</span>
              <span className="text-xs text-slate-500">{room.block}</span>
            </div>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-0.5">{stay?.guestName ?? '—'}</p>
          </div>
        </div>
        <TaskStatusChip task={task} />
      </div>

      {stay?.preferences && (
        <p className="mt-2 flex items-start gap-1 text-[11px] leading-snug text-indigo-700 dark:text-indigo-300">
          <Moon className="w-3 h-3 shrink-0 mt-0.5" />
          <span>{stay.preferences}</span>
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1 empty:hidden">
        {stay?.vipType && (
          <span className={CHIP + ' font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'}>
            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />{stay.vipType}
          </span>
        )}
        {!!stay?.children && (
          <span className={CHIP + ' text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'}>
            <Baby className="w-3 h-3" />
            {t('room.detail.children', { count: stay.children })}{!!stay.childAges.length && ` (${formatChildAges(stay.childAges, t('room.detail.ageUnknown'))})`}
          </span>
        )}
        {stay?.specials.map(special => (
          <span key={special} className={CHIP + ' text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800'}>{special}</span>
        ))}
        {stay?.traces.map(trace => (
          <span key={trace} className={CHIP + ' text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}>{trace}</span>
        ))}
      </div>

      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <button disabled={!canExecute || !pending} onClick={() => startTask(task.id)} className={`${ACTION} text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 enabled:hover:bg-indigo-100`}>
            <Play className="w-3.5 h-3.5" />
            <span>{t('turndown.start')}</span>
          </button>
          <button disabled={!canExecute || !(pending || inProgress)} onClick={() => finishTask(task.id)} className={`${ACTION} text-white bg-indigo-600 enabled:hover:bg-indigo-700`}>
            <Check className="w-3.5 h-3.5" />
            <span>{t('turndown.finish')}</span>
          </button>
          {canExecute && done && (
            <button onClick={() => reopenTask(task.id)} className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">{t('turndown.reopen')}</button>
          )}
        </div>

        <div className="flex items-center gap-1">
          {TOGGLES.map(([label, reason, titleKey, activeClass]) => {
            const active = task.status === TaskStatus.NOT_PERFORMED && task.notPerformedReason === reason;
            return (
              <button
                key={reason}
                disabled={!canExecute || done}
                aria-pressed={active}
                title={t(`turndown.${titleKey}`)}
                aria-label={t(`turndown.${titleKey}`)}
                onClick={() => (active ? reopenTask(task.id) : recordNotPerformed(task.id, reason))}
                className={`px-1.5 py-0.5 text-[11px] font-bold rounded border disabled:opacity-40 disabled:cursor-not-allowed ${active ? activeClass : 'border-slate-300 dark:border-slate-600 text-slate-500 enabled:hover:text-slate-800 dark:enabled:hover:text-slate-200'}`}
              >
                {label}
              </button>
            );
          })}
          <button onClick={() => openDetail(task.id)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" title={t('turndown.viewDetail')} aria-label={t('turndown.viewDetail')}>
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
