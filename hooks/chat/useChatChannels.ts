import { useQuery } from '@tanstack/react-query';
import { chatTransporter } from '@/services/transporters/chat/chatTransporter';
import { queryKeys } from '@/services/transporters/_queryKeys';

export const useChatChannels = () => useQuery({ queryKey: queryKeys.chat.channels(), queryFn: chatTransporter.getChannels });
