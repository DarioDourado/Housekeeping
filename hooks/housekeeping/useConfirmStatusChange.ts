import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfirm } from '@/hooks/common/useConfirm';
import { RoomStatus } from '@/types/housekeeping.types';

// - Toda a mudança de estado do quarto pede confirmação; passar a Inspected tem o seu próprio aviso (envia ao Opera)
//   e sair de Inspected (reverter) fica marcado como ação delicada.
export const useConfirmStatusChange = () => {
  const { t } = useTranslation();
  const confirm = useConfirm();

  return useCallback(
    (number: string, from: RoomStatus, to: RoomStatus): Promise<boolean> =>
      to === RoomStatus.INSPECTED
        ? confirm({
            title: t('statusChange.inspectedTitle'),
            message: t('statusChange.inspectedMessage', { number }),
            confirmLabel: t('statusChange.inspectedConfirm'),
            cancelLabel: t('actions.cancel'),
            isDangerous: false
          })
        : confirm({
            title: t('statusChange.changeTitle'),
            message: t('statusChange.changeMessage', { number, from: t(`status.${from.toLowerCase()}`), to: t(`status.${to.toLowerCase()}`) }),
            confirmLabel: t('statusChange.changeConfirm'),
            cancelLabel: t('actions.cancel'),
            isDangerous: from === RoomStatus.INSPECTED
          }),
    [confirm, t]
  );
};
