import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { OPERATIONAL_BLOCKS, BLOCK } from '@/config/constants';
import { useAddSheet } from '@/hooks/housekeeping';
import { useEnsureOnDuty, useStaff } from '@/hooks/staff';
import { isGovernanta } from '@/lib/jobTitles';
import { isOnDuty } from '@/lib/staffDuty';

const FIELD = 'w-full rounded-md border border-slate-200 dark:border-slate-700 bg-surface px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200';
const BLOCKS = [...OPERATIONAL_BLOCKS, BLOCK.PARKING];

// - Botão "Nova sheet" do plano de hoje (manhã ou turndown): nome opcional (há um por defeito) e bloco
export const NewSheet = ({ planId }: { planId: string }) => {
  const { t } = useTranslation();
  const addSheet = useAddSheet();
  const { data: staff = [] } = useStaff();
  const ensureOnDuty = useEnsureOnDuty();
  const [leadId, setLeadId] = useState('');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [block, setBlock] = useState<string>(BLOCKS[0] ?? '');

  const create = async () => {
    // - a responsável é sempre uma governanta; fora de serviço: só fica como responsável depois de confirmar que passa a estar de serviço
    const lead = staff.find(user => user.id === leadId);
    if (lead && !(await ensureOnDuty(lead))) return;
    await addSheet(planId, title, block, lead?.id);
    setTitle('');
    setLeadId('');
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-slate-900 dark:bg-slate-700 text-white hover:opacity-90">
        <Plus className="w-3.5 h-3.5" />
        <span>{t('sheet.newSheet')}</span>
      </button>
      {open && (
        <form onSubmit={event => { event.preventDefault(); void create(); }} className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 p-3 text-xs space-y-2">
          <label className="block space-y-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{t('sheet.fieldTitle')}</span>
            <input value={title} onChange={event => setTitle(event.target.value)} placeholder={t('sheet.newSheetPlaceholder')} className={FIELD} autoFocus />
          </label>
          <label className="block space-y-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{t('sheet.fieldBlock')}</span>
            <select value={block} onChange={event => setBlock(event.target.value)} className={FIELD}>
              {BLOCKS.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{t('sheet.fieldLead')}</span>
            <select value={leadId} onChange={event => setLeadId(event.target.value)} className={FIELD}>
              <option value="">{t('sheet.noLead')}</option>
              {staff.filter(isGovernanta).sort((a, b) => Number(isOnDuty(b)) - Number(isOnDuty(a)) || a.name.localeCompare(b.name)).map(user => (
                <option key={user.id} value={user.id}>{user.name}{isOnDuty(user) ? '' : ` · ${t('sheet.offDuty')}`}</option>
              ))}
            </select>
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setOpen(false)} className="px-2.5 py-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">{t('actions.cancel')}</button>
            <button type="submit" className="px-2.5 py-1 rounded-md bg-slate-900 dark:bg-slate-600 text-white font-semibold">{t('sheet.create')}</button>
          </div>
        </form>
      )}
    </div>
  );
};
