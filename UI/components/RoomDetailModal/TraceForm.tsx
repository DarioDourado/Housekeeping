import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Send } from 'lucide-react';
import { useSendTraceAlert } from '@/hooks/housekeeping';

// - Pedido ou trace urgente para a equipa do quarto (§13.3)
export const TraceForm = ({ roomId, roomNumber }: { roomId: string; roomNumber: string }) => {
  const { t } = useTranslation();
  const sendTraceAlert = useSendTraceAlert();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    await sendTraceAlert(roomId, text.trim());
    setText('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1">
        <Send className="w-3.5 h-3.5" />
        <span>{t('room.detail.sendTraceOpen')}</span>
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2 p-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20">
      <label htmlFor="trace-text" className="text-xs font-semibold text-blue-900 dark:text-blue-300">
        {t('room.detail.newRequest', { number: roomNumber })}
      </label>
      <div className="flex gap-2">
        <input
          id="trace-text"
          type="text"
          value={text}
          onChange={event => setText(event.target.value)}
          placeholder={t('room.detail.tracePlaceholder')}
          className="flex-1 px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        />
        <button type="submit" className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md">
          {t('room.detail.send')}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700">
          {t('actions.cancel')}
        </button>
      </div>
    </form>
  );
};
