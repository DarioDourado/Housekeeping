import { useQuery } from '@tanstack/react-query';
import { chatTransporter } from '@/services/transporters/chat/chatTransporter';
import { queryKeys } from '@/services/transporters/_queryKeys';

export const useChatMessages = (channelId: string) =>
  useQuery({ queryKey: queryKeys.chat.messages(channelId), queryFn: () => chatTransporter.getMessages(channelId) });
