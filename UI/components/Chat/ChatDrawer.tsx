'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatChannel, ChatMessage } from '../../../types/chat.types';
import { chatTransporter, INITIAL_CHANNELS } from '../../../services/transporters/chat/chatTransporter';
import { useAuth } from '../../../services/hooks/auth/useAuth';
import {
  X,
  Send,
  Image as ImageIcon,
  MessageSquare,
  AlertCircle,
  Paperclip,
  CheckCheck
} from 'lucide-react';

interface ChatDrawerProps {
  onClose: () => void;
}

export const ChatDrawer = ({ onClose }: ChatDrawerProps) => {
  const { user } = useAuth();
  const [channels, setChannels] = useState<ChatChannel[]>(INITIAL_CHANNELS);
  const [activeChannelId, setActiveChannelId] = useState<string>('ch-general');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [roomNumberInput, setRoomNumberInput] = useState('');
  const [isPriority, setIsPriority] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const ch = await chatTransporter.getChannels();
      setChannels(ch);
      const msgs = await chatTransporter.getMessages(activeChannelId);
      setMessages(msgs);
    };
    load();
  }, [activeChannelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (attachmentUrl?: string) => {
    if (!inputText.trim() && !attachmentUrl) return;

    const newMsg = await chatTransporter.sendMessage({
      channelId: activeChannelId,
      senderId: user?.id || 'anon',
      senderName: user?.name || 'Operador',
      senderRole: user?.role || 'staff',
      roomNumber: roomNumberInput.trim() || undefined,
      text: inputText.trim(),
      isPriority,
      attachment: attachmentUrl
        ? {
            id: `att-${Date.now()}`,
            type: 'image',
            url: attachmentUrl,
            name: 'avaria_quarto.jpg'
          }
        : undefined
    });

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setRoomNumberInput('');
    setIsPriority(false);
  };

  const simulatePhotoUpload = () => {
    // Foto simulada (ex: TV avariada ou berço colocado)
    handleSendMessage('https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop');
  };

  const activeChannel = channels.find(c => c.id === activeChannelId);

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Comunicação & Chat Interno
            </h3>
            <p className="text-[11px] text-slate-500">
              Vila Vita Parc · Equipa de Andares & Receção
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Channels Tab Bar */}
      <div className="p-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-800/20 flex gap-1 overflow-x-auto">
        {channels.map(ch => (
          <button
            key={ch.id}
            onClick={() => setActiveChannelId(ch.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeChannelId === ch.id
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-white/50'
            }`}
          >
            <span>{ch.title.split(' ')[0]} {ch.title.split(' ')[1] || ''}</span>
          </button>
        ))}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30 dark:bg-slate-900/40">
        {messages.map(msg => {
          const isMe = msg.senderId === user?.id;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {msg.senderName}
                </span>
                <span>·</span>
                <span className="tabular-nums">{msg.timestamp}</span>
              </div>

              <div className={`p-3 rounded-2xl max-w-[85%] text-xs shadow-xs space-y-1.5 ${
                isMe
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-tl-none'
              }`}>
                {msg.roomNumber && (
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    isMe ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}>
                    Quarto {msg.roomNumber}
                  </span>
                )}

                {msg.text && <p className="leading-relaxed">{msg.text}</p>}

                {msg.attachment && (
                  <div className="rounded-lg overflow-hidden border border-black/10 mt-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={msg.attachment.url}
                      alt="Anexo de fotografia"
                      className="w-full max-h-48 object-cover"
                    />
                    <div className="p-1 bg-black/40 text-white text-[10px] truncate">
                      {msg.attachment.name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Input Box */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={roomNumberInput}
            onChange={e => setRoomNumberInput(e.target.value)}
            placeholder="Qto #"
            className="w-16 px-2 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
          />

          <button
            type="button"
            onClick={simulatePhotoUpload}
            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 text-xs"
            title="Tirar e anexar foto (ex: avaria / berço)"
          >
            <ImageIcon className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Anexar Foto</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            placeholder="Escreva uma mensagem..."
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            className="p-2 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 rounded-xl transition-colors shadow-xs"
            aria-label="Enviar mensagem"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
};
