import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { OPERATIONAL_BLOCKS, BLOCK } from '@/config/constants';
import { useUpdateSheet } from '@/hooks/housekeeping';
import type { TaskSheet } from '@/types/housekeeping.types';

const FIELD = 'w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200';

// - Edição rápida da task sheet (nome e bloco), a partir do cabeçalho da coluna
export const SheetEditor = ({ sheet }: { sheet: Pick<TaskSheet, 'id' | 'title' | 'block'> }) => {
  const { t } = useTranslation();
  const updateSheet = useUpdateSheet();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(sheet.title);
  const [block, setBlock] = useState(sheet.block);
  // - o bloco atual entra sempre na lista (ex.: "Bloco A & Bloco B" nas zonas de turndown)
  const blocks = Array.from(new Set([...OPERATIONAL_BLOCKS, BLOCK.PARKING, sheet.block]));

  const toggle = () => {
    if (!open) { setTitle(sheet.title); setBlock(sheet.block); }
    setOpen(!open);
  };
  const save = async () => {
    await updateSheet(sheet.id, title, block);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button onClick={toggle} aria-expanded={open} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-md" title={t('sheet.editSheetTitle')} aria-label={t('sheet.editSheetTitle')}>
        <Pencil className="w-3.5 h-3.5" />
      </button>
      {open && (
        <form onSubmit={event => { event.preventDefault(); void save(); }} className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 p-3 text-xs space-y-2">
          <label className="block space-y-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{t('sheet.fieldTitle')}</span>
            <input value={title} onChange={event => setTitle(event.target.value)} className={FIELD} />
          </label>
          <label className="block space-y-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{t('sheet.fieldBlock')}</span>
            <select value={block} onChange={event => setBlock(event.target.value)} className={FIELD}>
              {blocks.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setOpen(false)} className="px-2.5 py-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700">{t('actions.cancel')}</button>
            <button type="submit" disabled={!title.trim()} className="px-2.5 py-1 rounded-md bg-slate-900 dark:bg-slate-600 text-white font-semibold disabled:opacity-50">{t('actions.save')}</button>
          </div>
        </form>
      )}
    </div>
  );
};
