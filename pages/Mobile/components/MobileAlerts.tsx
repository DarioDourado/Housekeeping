import { useTranslation } from 'react-i18next';
import { Check, CheckCircle2 } from 'lucide-react';
import { useAcknowledgeAlert, useAlerts } from '@/hooks/housekeeping';
import { formatTime } from '@/lib/datetime';
import { localized } from '@/lib/localized';

export const MobileAlerts = () => {
  const { t } = useTranslation();
  const { data: alerts = [] } = useAlerts();
  const acknowledge = useAcknowledgeAlert();

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">{t('mobile.alertsHeading')}</h3>
      {alerts.length === 0 && <p className="text-xs text-slate-400 italic py-8 text-center">{t('mobile.noAlerts')}</p>}
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`p-4 rounded-xl border text-xs space-y-2 ${
            alert.acknowledged ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80' : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{t('mobile.room', { number: alert.roomNumber })}</span>
              <span className="text-[10px] text-slate-400">· {formatTime(alert.timestamp)}</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${alert.type === 'REPROVAL' ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>
              {alert.type === 'REPROVAL' ? t('mobile.alertReproval') : t('mobile.alertTrace')}
            </span>
          </div>
          <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{localized(t, alert.message)}</p>
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {alert.acknowledged ? t('mobile.acknowledgedAt', { time: formatTime(alert.acknowledgedAt ?? '') }) : t('mobile.awaiting')}
            </span>
            {alert.acknowledged ? (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold"><Check className="w-3.5 h-3.5" />{t('mobile.acknowledged')}</span>
            ) : (
              <button onClick={() => acknowledge(alert.id)} className="min-h-[44px] px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('actions.acknowledgeAlert')}</span>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
