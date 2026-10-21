import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image as ImageIcon, Send } from 'lucide-react';

export interface ChatDraft {
  text: string;
  roomNumber?: string;
  attachmentUrl?: string;
}

// - foto simulada (ex.: TV avariada, berço colocado); o upload real fica para a Fase 2 (anexos)
const SIMULATED_PHOTO = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop';

export const ChatComposer = ({ onSend }: { onSend: (draft: ChatDraft) => Promise<void> }) => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  const send = async (attachmentUrl?: string) => {
    if (!text.trim() && !attachmentUrl) return;
    await onSend({ text: text.trim(), roomNumber: roomNumber.trim() || undefined, attachmentUrl });
    setText('');
    setRoomNumber('');
  };

  return (
    <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={roomNumber}
          onChange={event => setRoomNumber(event.target.value)}
          placeholder={t('chat.roomPlaceholder')}
          aria-label={t('chat.roomLabel')}
          className="w-16 px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        />
        <button
          type="button"
          onClick={() => send(SIMULATED_PHOTO)}
          className="p-1.5 text-slate-500 hover:text-blue-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 text-xs"
          title={t('chat.attachPhotoTitle')}
        >
          <ImageIcon className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">{t('chat.attachPhoto')}</span>
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={event => setText(event.target.value)}
          onKeyDown={event => event.key === 'Enter' && send()}
          placeholder={t('chat.messagePlaceholder')}
          aria-label={t('chat.messagePlaceholder')}
          className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        />
        <button
          onClick={() => send()}
          disabled={!text.trim()}
          className="p-2 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-xl shadow-xs"
          aria-label={t('chat.send')}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
