import { useTranslation } from 'react-i18next';
import { RotateCw, Star } from 'lucide-react';
import { formatTime } from '@/lib/datetime';
import { formatChildAges } from '@/lib/taskLabels';
import type { TaskView } from '@/lib/taskViews';

// - Reserva do dia e informação especial do quarto (vem do Opera; mostrar só o necessário por perfil)
export const GuestSection = ({ view }: { view: TaskView }) => {
  const { t } = useTranslation();
  const { room, stay } = view;

  return (
    <>
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t('room.detail.guestOpera')}</span>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {stay?.guestName ?? '—'}
              {stay?.vipType && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  {stay.vipType}
                </span>
              )}
            </h3>
          </div>
          {stay?.arrivalEta && (
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">{t('room.detail.etaLabel')}</span>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">{stay.arrivalEta}</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs">
          <div>
            <span className="text-slate-500 block">{t('room.detail.adultsChildren')}</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {t('room.detail.adults', { count: stay?.adults ?? 0 })} · {t('room.detail.children', { count: stay?.children ?? 0 })}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-slate-500 block font-medium">{t('room.detail.childAgesLabel')}</span>
            <span className={`font-semibold ${stay?.childAges.length ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
              {stay?.childAges.length ? t('room.detail.ages', { ages: formatChildAges(stay.childAges, t('room.detail.ageUnknown')) }) : t('room.detail.noChildren')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-slate-400 block mb-0.5">{t('room.detail.operaSync')}</span>
          <div className="flex items-center justify-between font-medium">
            <span>{t('room.detail.lastOperaStatus', { status: t(`status.${room.operaStatus.toLowerCase()}`) })}</span>
            <span className="text-slate-500 tabular-nums">{formatTime(room.operaStatusUpdatedAt)}</span>
          </div>
        </div>
        <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <span className="text-slate-400 block mb-0.5">{t('room.detail.linenTitle')}</span>
          <div className="flex items-center gap-1.5 font-semibold">
            <RotateCw className={`w-3.5 h-3.5 ${stay?.isLinenChangeDue ? 'text-cyan-600' : 'text-slate-400'}`} />
            <span className={stay?.isLinenChangeDue ? 'text-cyan-700 dark:text-cyan-300' : 'text-slate-500'}>
              {stay?.isLinenChangeDue ? t('room.detail.linenDue') : t('room.detail.linenNotDue')}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3 text-xs">
        {stay?.instructions && (
          <div className="p-3.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900">
            <span className="font-bold text-amber-900 dark:text-amber-300 block mb-1">{t('room.detail.dailyInfo')}</span>
            <p className="text-amber-800 dark:text-amber-200 leading-relaxed">{stay.instructions}</p>
          </div>
        )}
        {!!stay?.traces.length && (
          <div className="p-3.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-900">
            <span className="font-bold text-indigo-900 dark:text-indigo-300 block mb-1">{t('room.detail.traces')}</span>
            <ul className="list-disc list-inside space-y-1 text-indigo-800 dark:text-indigo-200">
              {stay.traces.map(trace => <li key={trace}>{trace}</li>)}
            </ul>
          </div>
        )}
        {!!stay?.specials.length && (
          <div className="p-3.5 rounded-lg bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900">
            <span className="font-bold text-purple-900 dark:text-purple-300 block mb-1">{t('room.detail.specials')}</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {stay.specials.map(special => (
                <span key={special} className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 font-medium">{special}</span>
              ))}
            </div>
          </div>
        )}
        {stay?.preferences && (
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="font-semibold text-slate-500 block mb-0.5">{t('room.detail.preferences')}</span>
            <p className="text-slate-700 dark:text-slate-300">{stay.preferences}</p>
          </div>
        )}
      </div>
    </>
  );
};
