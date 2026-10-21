import { ChatChannel, ChatMessage } from '../../../types/chat.types';

const STORAGE_CHANNELS = 'vvp_hk_chat_channels_v1';
const STORAGE_MESSAGES = 'vvp_hk_chat_messages_v1';

export const INITIAL_CHANNELS: ChatChannel[] = [
  {
    id: 'ch-general',
    title: 'Geral Housekeeping Vila Vita',
    type: 'GROUP',
    unreadCount: 0,
    lastMessage: 'Bom serviço a todas! Atenção redobrada aos berços no Bloco A.',
    lastMessageTimestamp: '08:05',
    participantRoles: ['admin', 'supervisor', 'housekeeper', 'reception']
  },
  {
    id: 'ch-reception',
    title: 'Receção ↔ Housekeeping (Traces & Pedidos)',
    type: 'GROUP',
    unreadCount: 1,
    lastMessage: 'Quarto 101: Hóspede VIP 1 chega às 11:30 no transfer.',
    lastMessageTimestamp: '08:14',
    participantRoles: ['admin', 'supervisor', 'reception']
  },
  {
    id: 'ch-supervisors',
    title: 'Governanta Filipa Mendes',
    type: 'DIRECT',
    areaBlock: 'Bloco A & B',
    unreadCount: 0,
    lastMessage: 'Adriana, já validei a inspeção do 302, ficou impecável.',
    lastMessageTimestamp: '08:46',
    participantRoles: ['supervisor', 'housekeeper']
  }
];

export const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    channelId: 'ch-general',
    senderId: 'user-filipa',
    senderName: 'Filipa Mendes (Governanta)',
    senderRole: 'supervisor',
    text: 'Bom dia equipa! Task sheets enviadas para todos os telemóveis de serviço. Qualquer alteração ou dúvida com berços, avisem no chat.',
    timestamp: '08:00'
  },
  {
    id: 'msg-2',
    channelId: 'ch-reception',
    senderId: 'user-rececao',
    senderName: 'Receção Front Desk',
    senderRole: 'reception',
    roomNumber: '101',
    text: 'Atenção quarto 101: O Dr. Klaus Schmidt telefonou a confirmar chegada antecipada para as 11:30. Já ativámos prioridade urgente na app.',
    timestamp: '08:14',
    isPriority: true
  },
  {
    id: 'msg-3',
    channelId: 'ch-supervisors',
    senderId: 'user-adriana',
    senderName: 'Adriana Silva',
    senderRole: 'housekeeper',
    roomNumber: '302',
    text: 'Governanta Filipa, quarto 302 finalizado com muda de roupa de cama e toalhas novas.',
    timestamp: '08:35'
  },
  {
    id: 'msg-4',
    channelId: 'ch-supervisors',
    senderId: 'user-filipa',
    senderName: 'Filipa Mendes (Governanta)',
    senderRole: 'supervisor',
    roomNumber: '302',
    text: 'Inspecionei agora mesmo. Aprovado e passado a Inspected no Opera! Muito bom trabalho.',
    timestamp: '08:46'
  }
];

export const chatTransporter = {
  getChannels: async (): Promise<ChatChannel[]> => {
    if (typeof window === 'undefined') return INITIAL_CHANNELS;
    const stored = localStorage.getItem(STORAGE_CHANNELS);
    if (!stored) {
      localStorage.setItem(STORAGE_CHANNELS, JSON.stringify(INITIAL_CHANNELS));
      return INITIAL_CHANNELS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_CHANNELS;
    }
  },

  getMessages: async (channelId: string): Promise<ChatMessage[]> => {
    if (typeof window === 'undefined') return INITIAL_MESSAGES.filter(m => m.channelId === channelId);
    const stored = localStorage.getItem(STORAGE_MESSAGES);
    let allMessages = INITIAL_MESSAGES;
    if (stored) {
      try {
        allMessages = JSON.parse(stored);
      } catch {
        allMessages = INITIAL_MESSAGES;
      }
    } else {
      localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(INITIAL_MESSAGES));
    }
    return allMessages.filter(m => m.channelId === channelId);
  },

  sendMessage: async (message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> => {
    const time = new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    const fullMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}`,
      timestamp: time
    };

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_MESSAGES);
      const all: ChatMessage[] = stored ? JSON.parse(stored) : INITIAL_MESSAGES;
      all.push(fullMessage);
      localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(all));

      // Atualiza último preview no canal
      const channelsStored = localStorage.getItem(STORAGE_CHANNELS);
      const channels: ChatChannel[] = channelsStored ? JSON.parse(channelsStored) : INITIAL_CHANNELS;
      const target = channels.find(c => c.id === message.channelId);
      if (target) {
        target.lastMessage = fullMessage.text || (fullMessage.attachment ? 'Fotografia anexada' : '');
        target.lastMessageTimestamp = time;
        localStorage.setItem(STORAGE_CHANNELS, JSON.stringify(channels));
      }
    }

    return fullMessage;
  }
};
