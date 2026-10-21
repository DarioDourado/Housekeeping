import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquare, X } from 'lucide-react';
import { useAuth } from '@/hooks/auth/useAuth';
import { useChatChannels, useChatMessages, useSendChatMessage } from '@/hooks/chat';
import { useFocusTrap } from '@/hooks/common/useFocusTrap';
import { ChatComposer, type ChatDraft } from './ChatComposer';
import { ChatMessageList } from './ChatMessageList';

export const ChatDrawer = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeChannelId, setActiveChannelId] = useState('ch-general');
  const { data: channels = [] } = useChatChannels();
  const { data: messages = [] } = useChatMessages(activeChannelId);
  const sendMessage = useSendChatMessage();
  const drawerRef = useFocusTrap<HTMLDivElement>(true);

  const send = async ({ text, roomNumber, attachmentUrl }: ChatDraft) => {
    await sendMessage.mutateAsync({
      channelId: activeChannelId,
      senderId: user?.id ?? 'anon',
      senderName: user?.name ?? t('chat.defaultSender'),
      senderRole: user?.role ?? 'staff',
      roomNumber,
      text,
      isPriority: false,
      attachment: attachmentUrl ? { id: `att-${Date.now()}`, type: 'image', url: attachmentUrl, name: 'avaria_quarto.jpg' } : undefined
    });
  };

  return (
    <div
      ref={drawerRef}
      tabIndex={-1}
      role="dialog"
      aria-label={t('chat.title')}
      onKeyDown={event => event.key === 'Escape' && onClose()}
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
    >
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"><MessageSquare className="w-4 h-4" /></div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{t('chat.title')}</h3>
            <p className="text-[11px] text-slate-500">{t('chat.subtitle')}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100" aria-label={t('actions.close')}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <div role="tablist" className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/20 flex gap-1 overflow-x-auto">
        {channels.map(channel => (
          <button
            key={channel.id}
            role="tab"
            aria-selected={activeChannelId === channel.id}
            onClick={() => setActiveChannelId(channel.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
              activeChannelId === channel.id ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-white/50'
            }`}
          >
            {channel.title.split(' ').slice(0, 2).join(' ')}
          </button>
        ))}
      </div>

      <ChatMessageList messages={messages} currentUserId={user?.id} />
      <ChatComposer onSend={send} />
    </div>
  );
};
