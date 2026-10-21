import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/auth/useAuth';
import { SYSTEM_ACTOR, type Actor } from '@/services/local-api';
import { queryKeys } from '@/services/transporters/_queryKeys';
import { useUiStore } from '@/store/uiStore';

// - Base dos hooks de pessoal: executa como o utilizador da sessão, invalida pessoal e distribuição
//   (eliminar alguém altera as task sheets) e nunca rejeita (o erro vira toast).
export const useStaffMutation = <Arg,>(action: (arg: Arg, actor: Actor) => Promise<unknown>) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const showToast = useUiStore(state => state.showToast);

  const { mutateAsync } = useMutation({
    mutationFn: (arg: Arg) => action(arg, user ? { id: user.id, name: user.name, role: user.role } : SYSTEM_ACTOR),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.housekeeping.all });
    },
    onError: () => showToast({ key: 'toasts.error' })
  });

  return useCallback(
    async (arg: Arg): Promise<void> => {
      try {
        await mutateAsync(arg);
      } catch {
        // - já tratado em onError (toast)
      }
    },
    [mutateAsync]
  );
};
