export interface ChatAttachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  name: string;
  size?: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  roomNumber?: string;
  text: string;
  timestamp: string;
  attachment?: ChatAttachment;
  isPriority?: boolean;
}

export interface ChatChannel {
  id: string;
  title: string;
  type: 'GROUP' | 'DIRECT';
  areaBlock?: string;
  unreadCount: number;
  lastMessage?: string;
  lastMessageTimestamp?: string;
  participantRoles: string[];
}
