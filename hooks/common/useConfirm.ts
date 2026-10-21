import { useContext } from 'react';
import { ConfirmContext, type AskConfirm } from '@/context/ConfirmContext';

// - uso: if (await confirm({...})) deleteUser(id)  (20-rules #16)
export const useConfirm = (): AskConfirm => {
  const ask = useContext(ConfirmContext);
  if (!ask) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ask;
};
