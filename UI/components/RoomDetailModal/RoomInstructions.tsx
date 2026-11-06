import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import { usePermission } from '@/hooks/auth/usePermission';
import { useUpdateRoomInstructions } from '@/hooks/housekeeping';

interface RoomInstructionsProps {
  roomId: string;
  instructions?: string | undefined;
}

// - Daily Information / instruções do quarto; a governanta e o admin podem editá-las
export const RoomInstructions = ({ roomId, instructions }: RoomInstructionsProps) => {
  const { t } = useTranslation();
  const canEdit = usePermission('room.editDetails');
  const updateInstructions = useUpdateRoomInstructions();
  const [draft, setDraft] = useState<string | null>(null);

  if (!instructions && !canEdit) return null;

  const save = async () => {
    await updateInstructions(roomId, draft ?? '');
    setDraft(null);
  };

  return (
    <div className="p-3.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900">
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-amber-900 dark:text-amber-300">{t('room.detail.dailyInfo')}</span>
        {canEdit && draft === null && (
          <button onClick={() => setDraft(instructions ?? '')} title={t('room.detail.editInstructions')} aria-label={t('room.detail.editInstructions')} className="p-1 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-md">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {draft === null ? (
        <p className="text-amber-800 dark:text-amber-200 leading-relaxed">{instructions ?? t('room.detail.noInstructions')}</p>
      ) : (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={event => setDraft(event.target.value)}
            placeholder={t('room.detail.instructionsPlaceholder')}
            rows={3}
            className="w-full rounded-md border border-amber-300 dark:border-amber-800 bg-surface p-2 text-xs text-slate-800 dark:text-slate-200"
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setDraft(null)} className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md">{t('actions.cancel')}</button>
            <button onClick={() => void save()} className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md">{t('actions.save')}</button>
          </div>
        </div>
      )}
    </div>
  );
};
