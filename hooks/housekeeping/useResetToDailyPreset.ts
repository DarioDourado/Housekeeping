import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { housekeepingTransporter } from '@/services/transporters/housekeeping';
import { queryKeys } from '@/services/transporters/_queryKeys';

// - Repõe a distribuição inicial do dia (seed). Destrutivo: chamar sempre depois de um ConfirmDialog.
export const useResetToDailyPreset = () => {
  const queryClient = useQueryClient();
  return useCallback(async () => {
    await housekeepingTransporter.reset();
    await queryClient.invalidateQueries({ queryKey: queryKeys.housekeeping.all });
    await queryClient.invalidateQueries({ queryKey: queryKeys.staff.all });
  }, [queryClient]);
};
