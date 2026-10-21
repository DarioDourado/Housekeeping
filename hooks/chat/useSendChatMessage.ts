import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatTransporter } from '@/services/transporters/chat/chatTransporter';
import { queryKeys } from '@/services/transporters/_queryKeys';

export const useSendChatMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatTransporter.sendMessage,
    // - atualiza a conversa e o preview do canal
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.chat.all })
  });
};
