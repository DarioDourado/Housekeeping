import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { OPERATIONAL_BLOCKS } from '@/config/constants';
import { useConfirm } from '@/hooks/common/useConfirm';
import { useAddSection, useDeleteSection, useRooms, useSections, useUpdateSection } from '@/hooks/housekeeping';
import { PageEmpty, PageError, PageLoading } from '@/UI/components/feedback/PageStates';

const field = 'rounded-[12px] border border-line bg-surface px-3 py-2 text-sm text-content focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary';

export const SectionsTab = () => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const { data: sections = [], isLoading, isError, refetch } = useSections();
  const { data: rooms = [] } = useRooms();
  const addSection = useAddSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();
  const [name, setName] = useState('');
  const [block, setBlock] = useState<string>(OPERATIONAL_BLOCKS[0] ?? '');

  if (isLoading) return <PageLoading />;
  if (isError) return <PageError onRetry={() => void refetch()} />;

  const create = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await addSection({ name: trimmed, block, defaultRoomIds: [], defaultStaffIds: [] });
    setName('');
  };

  const remove = async (id: string, sectionName: string) => {
    const ok = await confirm({
      title: t('settings.sections.deleteTitle'),
      message: t('settings.sections.deleteMessage', { name: sectionName }),
      confirmLabel: t('actions.delete'),
      cancelLabel: t('actions.cancel')
    });
    if (ok) await deleteSection(id);
  };

  return (
    <div className="space-y-6">
      <form
        onSubmit={event => { event.preventDefault(); void create(); }}
        className="flex flex-wrap items-end gap-3 rounded-[16px] border border-line bg-surface p-4"
      >
        <label className="flex flex-col gap-1 text-xs font-medium text-muted flex-1 min-w-[200px]">
          {t('settings.sections.name')}
          <input value={name} onChange={event => setName(event.target.value)} className={field} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          {t('settings.sections.block')}
          <select value={block} onChange={event => setBlock(event.target.value)} className={field}>
            {OPERATIONAL_BLOCKS.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <button type="submit" disabled={!name.trim()} className="rounded-[12px] bg-primary hover:bg-primary-hover text-primary-foreground px-5 py-2.5 text-sm font-medium flex items-center gap-1.5 transition-all duration-300 active:scale-[0.98] disabled:opacity-50">
          <Plus className="w-4 h-4" />{t('settings.sections.add')}
        </button>
      </form>

      {sections.length === 0 ? (
        <PageEmpty title={t('settings.sections.empty')} />
      ) : (
        <ul className="grid md:grid-cols-2 gap-4">
          {sections.map(section => (
            <li key={section.id} className="rounded-[16px] border border-line bg-surface p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  defaultValue={section.name}
                  aria-label={t('settings.sections.name')}
                  onBlur={event => {
                    const next = event.target.value.trim();
                    if (next && next !== section.name) void updateSection({ ...section, name: next });
                  }}
                  className={`${field} flex-1 font-semibold`}
                />
                <button onClick={() => void remove(section.id, section.name)} aria-label={t('actions.delete')} className="p-2 rounded-[12px] text-muted hover:text-danger hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted">
                {section.block} · {t('settings.sections.roomCount', { count: section.defaultRoomIds.length })}
              </p>
              <p className="text-xs text-content tabular-nums leading-relaxed">
                {section.defaultRoomIds.map(id => rooms.find(room => room.id === id)?.number ?? id).join(' · ') || t('settings.sections.noRooms')}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
