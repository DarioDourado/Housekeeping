import { useCallback } from 'react';
import { BLOCK } from '@/config/constants';
import { useStaff } from '@/hooks/staff';
import { getStaffBlock } from '@/lib/staffBlock';
import { useUiStore } from '@/store/uiStore';
import { useBlockLoad } from './useBlockLoad';
import { useBlockTeams } from './useBlockTeams';
import { useMoveStaffToBlock } from './useMoveStaffToBlock';

// - Reforço sugerido: leva uma pessoa extra/de apoio para o bloco com mais créditos por pessoa. A decisão final continua
//   a ser da direção (não há distribuição automática aprovada; §6.3).
export const useAutoBalance = () => {
  const { data: users = [] } = useStaff();
  const { data: blockTeams = [] } = useBlockTeams();
  const { byBlock } = useBlockLoad();
  const moveStaffToBlock = useMoveStaffToBlock();
  const showToast = useUiStore(state => state.showToast);

  return useCallback(async () => {
    const available = users.filter(user => user.isExtra || getStaffBlock(user) === BLOCK.SUPPORT);
    if (available.length === 0) {
      showToast({ key: 'toasts.noExtras' });
      return;
    }

    const loaded = blockTeams
      .filter(team => team.block !== BLOCK.SUPPORT)
      .map(team => {
        const headcount = users.filter(user => getStaffBlock(user) === team.block).length;
        const credits = byBlock.get(team.block)?.credits ?? 0;
        return { block: team.block, perPerson: headcount > 0 ? credits / headcount : credits };
      })
      .sort((a, b) => b.perPerson - a.perPerson);

    const target = loaded[0];
    const person = available[0];
    if (target && person) await moveStaffToBlock(person.id, target.block);
  }, [users, blockTeams, byBlock, moveStaffToBlock, showToast]);
};
