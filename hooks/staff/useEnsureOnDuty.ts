import { isOnDuty } from '@/lib/staffDuty';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '@/hooks/common/useConfirm';
import type { User } from '@/types/auth.types';
import { useUpdateStaff } from './useUpdateStaff';

// - Antes de pôr alguém numa task sheet: se não está de serviço, pergunta se o ativa. Devolve se pode continuar.
export const useEnsureOnDuty = () => {
  const { t } = useTranslation();
  const confirm = useConfirm();
  const updateStaff = useUpdateStaff();

  return useCallback(async (user: User): Promise<boolean> => {
    if (isOnDuty(user)) return true;
    const activate = await confirm({
      title: t('staffDuty.title'),
      message: t('staffDuty.message', { name: user.name }),
      confirmLabel: t('staffDuty.confirm'),
      cancelLabel: t('actions.cancel')
    });
    if (activate) await updateStaff({ ...user, isOnDuty: true });
    return activate;
  }, [confirm, t, updateStaff]);
};
