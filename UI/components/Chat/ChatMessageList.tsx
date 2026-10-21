import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { ChatMessage } from '@/types/chat.types';

export const ChatMessageList = ({ messages, currentUserId }: { messages: ChatMessage[]; currentUserId?: string | undefined }) => {
  const { t } = useTranslation();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30 dark:bg-slate-900/40">
      {messages.map(message => {
        const isMe = message.senderId === currentUserId;
        return (
          <div key={message.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{message.senderName}</span>
              <span>·</span>
              <span className="tabular-nums">{message.timestamp}</span>
            </div>
            <div className={`p-3 rounded-2xl max-w-[85%] text-xs shadow-xs space-y-1.5 ${
              isMe
                ? 'bg-blue-600 text-white rounded-tr-none'
                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none'
            }`}>
              {message.roomNumber && (
                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${isMe ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'}`}>
                  {t('chat.room', { number: message.roomNumber })}
                </span>
              )}
              {message.text && <p className="leading-relaxed">{message.text}</p>}
              {message.attachment && (
                <div className="rounded-lg overflow-hidden border border-black/10 mt-1">
                  <img src={message.attachment.url} alt={t('chat.attachmentAlt')} className="w-full max-h-48 object-cover" />
                  <div className="p-1 bg-black/40 text-white text-[10px] truncate">{message.attachment.name}</div>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
};
