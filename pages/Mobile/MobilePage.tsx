import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, ListTodo, MessageSquare, Smartphone } from 'lucide-react';
import { BLOCK } from '@/config/constants';
import { useAuth } from '@/hooks/auth/useAuth';
import { usePermission } from '@/hooks/auth/usePermission';
import { useAlerts, useBoard } from '@/hooks/housekeeping';
import { useOverlayStore } from '@/store/overlayStore';
import { PlanKind } from '@/types/housekeeping.types';
import { PageError, PageLoading } from '@/UI/components/feedback/PageStates';
import { MobileAlerts } from './components/MobileAlerts';
import { MobilePhoneLogin } from './components/MobilePhoneLogin';
import { MobileTaskList } from './components/MobileTaskList';

type Tab = 'LIST' | 'ALERTS' | 'PHONE_LOGIN';

// - Telemóvel de serviço (simulador): a empregada vê as tarefas das suas sheets; a governanta as da área escolhida
export const MobilePage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const board = useBoard(PlanKind.DAY);
  const { data: alerts = [] } = useAlerts();
  const openPanel = useOverlayStore(state => state.openPanel);
  const sees = usePermission('rooms.viewArea') || usePermission('rooms.viewAll');
  const [tab, setTab] = useState<Tab>('LIST');
  const [area, setArea] = useState<string>(user?.assignedArea || BLOCK.A);

  if (board.isLoading) return <PageLoading />;
  if (board.isError) return <PageError onRetry={() => void board.refetch()} />;

  const mine = board.views
    .filter(view => {
      if (sees) return area === 'ALL' || view.room.block.toLowerCase().includes(area.toLowerCase());
      const assigned = board.columns.filter(column => column.assignees.some(a => a.user.id === user?.id)).map(column => column.sheet.id);
      return assigned.length > 0 ? assigned.includes(view.task.sheetId) : view.room.block.toLowerCase().includes((user?.assignedArea || BLOCK.A).toLowerCase());
    })
    .sort((a, b) => Number(b.task.isPriority) - Number(a.task.isPriority) || a.task.orderIndex - b.task.orderIndex);

  const pendingAlerts = alerts.filter(alert => !alert.acknowledged).length;
  const tabButton = (active: boolean) => `relative flex flex-col items-center justify-center min-h-[44px] ${active ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'}`;
  const title = tab === 'LIST' ? t('mobile.listTitle', { count: mine.length }) : tab === 'ALERTS' ? t('mobile.alertsTitle') : t('mobile.switchTitle');

  return (
    <div className="py-4">
      <div className="text-center mb-4">
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">{t('planning.simulatorBanner')}</span>
      </div>

      <div className="max-w-md mx-auto bg-slate-100 dark:bg-slate-950 min-h-[820px] rounded-3xl border-4 border-slate-800 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col relative">
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between text-xs shrink-0 select-none">
          <div className="flex items-center gap-1.5 font-bold">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>{t('mobile.brand', { device: user?.phoneDeviceId || t('mobile.defaultDevice') })}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-300 font-medium truncate max-w-[120px]">{user?.name}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
        </div>

        <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">{sees ? t('mobile.supervisorMode') : t('mobile.areaResponsible')}</span>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">{title}</h2>
          </div>
          {sees && (
            <select value={area} onChange={event => setArea(event.target.value)} aria-label={t('mobile.areaLabel')} className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium text-slate-800 dark:text-slate-200">
              {[BLOCK.A, BLOCK.B, BLOCK.C, BLOCK.OASIS].map(block => <option key={block} value={block}>{block}</option>)}
              <option value={BLOCK.VILLAS}>{t('mobile.areaVillas')}</option>
              <option value="ALL">{t('mobile.areaAll')}</option>
            </select>
          )}
        </div>

        <div className="flex-1 p-3 overflow-y-auto space-y-3 pb-6">
          {tab === 'LIST' && <MobileTaskList views={mine} pendingAlerts={pendingAlerts} onOpenAlerts={() => setTab('ALERTS')} />}
          {tab === 'ALERTS' && <MobileAlerts />}
          {tab === 'PHONE_LOGIN' && <MobilePhoneLogin onDone={() => setTab('LIST')} />}
        </div>

        <nav className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-4 items-center h-16">
          <button onClick={() => setTab('LIST')} aria-current={tab === 'LIST'} className={tabButton(tab === 'LIST')}><ListTodo className="w-5 h-5" /><span className="text-[11px] mt-0.5">{t('mobile.tabRooms')}</span></button>
          <button onClick={() => setTab('ALERTS')} aria-current={tab === 'ALERTS'} className={tabButton(tab === 'ALERTS')}>
            <Bell className="w-5 h-5" />
            {pendingAlerts > 0 && <span className="absolute top-1 right-6 w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white dark:ring-slate-900" />}
            <span className="text-[11px] mt-0.5">{t('mobile.tabAlerts')}</span>
          </button>
          <button onClick={() => openPanel('chat')} className={tabButton(false)}><MessageSquare className="w-5 h-5" /><span className="text-[11px] mt-0.5">{t('mobile.tabChat')}</span></button>
          <button onClick={() => setTab('PHONE_LOGIN')} aria-current={tab === 'PHONE_LOGIN'} className={tabButton(tab === 'PHONE_LOGIN')}><Smartphone className="w-5 h-5" /><span className="text-[11px] mt-0.5">{t('mobile.tabPhone')}</span></button>
        </nav>
      </div>
    </div>
  );
};
