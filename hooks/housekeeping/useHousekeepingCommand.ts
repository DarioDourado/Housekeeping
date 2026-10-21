import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/auth/useAuth';
import { SYSTEM_ACTOR, type Actor, type CommandArgs, type CommandName } from '@/services/local-api';
import { housekeepingTransporter } from '@/services/transporters/housekeeping';
import { queryKeys } from '@/services/transporters/_queryKeys';
import { useUiStore } from '@/store/uiStore';

// - Base de todos os hooks de comando: executa o comando como o utilizador da sessão, invalida o que mudou
//   e mostra a confirmação. Devolve uma função que nunca rejeita (o erro vira toast).
export const useHousekeepingCommand = <N extends CommandName>(name: N) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const showToast = useUiStore(state => state.showToast);

  const mutation = useMutation({
    mutationFn: (args: CommandArgs<N>) => {
      const actor: Actor = user ? { id: user.id, name: user.name, role: user.role } : SYSTEM_ACTOR;
      return housekeepingTransporter.command(name, args, actor);
    },
    onSuccess: toast => {
      // - os comandos podem alterar quartos, sheets, eventos e pessoal ao mesmo tempo
      void queryClient.invalidateQueries({ queryKey: queryKeys.housekeeping.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      if (toast) showToast(toast);
    },
    onError: () => showToast({ key: 'toasts.error' })
  });

  const { mutateAsync } = mutation;
  return useCallback(
    async (args: CommandArgs<N>): Promise<void> => {
      try {
        await mutateAsync(args);
      } catch {
        // - já tratado em onError (toast); não propagar evita rejeições por tratar nos cliques
      }
    },
    [mutateAsync]
  );
};
