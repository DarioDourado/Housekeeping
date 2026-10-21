import { useTranslation } from 'react-i18next';
import { Award, Users } from 'lucide-react';
import { DAILY_CREDIT_TARGET } from '@/config/constants';
import { useBoard, useEvents } from '@/hooks/housekeeping';
import { calculateCounters } from '@/lib/counters';
import { PlanKind } from '@/types/housekeeping.types';
import { Modal } from '@/UI/components/Modal';
import { CreditsMatrix } from './CreditsMatrix';

const CARD = 'p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50';

export const CreditsStatsModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const { views } = useBoard(PlanKind.DAY);
  const { data: events = [] } = useEvents();

  const totalCredits = calculateCounters(views).estimatedCredits;

  // - inspeções aprovadas por governanta, a partir do histórico (§14.4)
  const approvals = events.filter(event => event.type === 'INSPECTION_APPROVED');
  const bySupervisor = approvals.reduce<Record<string, number>>((acc, event) => {
    acc[event.registeredByName] = (acc[event.registeredByName] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Modal
      title={t('credits.title')}
      subtitle={t('credits.subtitle', { target: DAILY_CREDIT_TARGET })}
      icon={<Award className="w-5 h-5" />}
      maxWidth="max-w-3xl"
      onClose={onClose}
      footer={
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-700 rounded-lg hover:bg-slate-800">
            {t('actions.close')}
          </button>
        </div>
      }
    >
      <div className="p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300">
        <div className="grid grid-cols-3 gap-4">
          <div className={CARD}>
            <span className="text-slate-400 block font-medium mb-1">{t('credits.totalWorkload')}</span>
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400 tabular-nums">{t('credits.totalValue', { value: totalCredits })}</span>
            <span className="text-[11px] text-slate-500 block mt-1">{t('credits.workersNeeded', { count: Math.ceil(totalCredits / DAILY_CREDIT_TARGET) })}</span>
          </div>
          <div className={CARD}>
            <span className="text-slate-400 block font-medium mb-1">{t('credits.targetPerHousekeeper')}</span>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{t('credits.targetValue', { target: DAILY_CREDIT_TARGET })}</span>
            <span className="text-[11px] text-slate-500 block mt-1">{t('credits.targetExample')}</span>
          </div>
          <div className={CARD}>
            <span className="text-slate-400 block font-medium mb-1">{t('credits.approvedInspections')}</span>
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{approvals.length}</span>
            <span className="text-[11px] text-slate-500 block mt-1">{t('credits.liveSupervision')}</span>
          </div>
        </div>

        <CreditsMatrix />

        <div className="space-y-2">
          <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-emerald-600" />
            {t('credits.inspectionsBySupervisor')}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(bySupervisor).length > 0 ? (
              Object.entries(bySupervisor).map(([name, count]) => (
                <div key={name} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{name}</span>
                  <span className="font-bold text-emerald-600 tabular-nums">{t('credits.roomsInspected', { count })}</span>
                </div>
              ))
            ) : (
              <div className="col-span-2 p-3 text-slate-400 italic">{t('credits.noInspections')}</div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
