import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { usePermission } from '@/hooks/auth/usePermission';
import { useRemoveStaffFromBlock, useRemoveStaffFromSheet } from '@/hooks/housekeeping';
import { useUiStore } from '@/store/uiStore';
import type { PlanKind } from '@/types/housekeeping.types';

// - Envolve a página das sheets: largar o nome de uma pessoa (vinda de uma sheet) na barra de apagar, ou em qualquer sítio
//   fora das colunas, tira-a dessa sheet e passa-a a Apoio (da barra de equipas: tira-a do bloco). As colunas e a barra de equipas tratam do seu próprio drop e
//   param a propagação. A barra aparece no topo (zona do cabeçalho), nunca por cima dos cartões.
export const SheetRemoveZone = ({ kind, className, children }: { kind: PlanKind; className: string; children: ReactNode }) => {
  const { t } = useTranslation();
  const canAssign = usePermission('staff.assign');
  const removeFromSheet = useRemoveStaffFromSheet();
  const removeFromBlock = useRemoveStaffFromBlock(kind);
  const draggingStaffId = useUiStore(state => state.draggingStaffId);
  const setDraggingStaffId = useUiStore(state => state.setDraggingStaffId);
  const [isOver, setIsOver] = useState(false);
  const active = canAssign && !!draggingStaffId;

  const remove = (data: DataTransfer | null) => {
    setIsOver(false);
    const staffId = data?.getData('application/staff-id') || draggingStaffId;
    const sheetId = data?.getData('application/from-sheet');
    setDraggingStaffId(null);
    // - vindo de uma sheet sai dela e passa a Apoio; vindo da barra de equipas sai do bloco (Apoio; quem já lá está fica fora de serviço)
    if (staffId) void (sheetId ? removeFromSheet(staffId, sheetId) : removeFromBlock(staffId));
  };

  useEffect(() => {
    if (!active) { setIsOver(false); return; }
    // - sobre uma coluna o drop é dela (move); em qualquer outro sítio tira da sheet
    const over = (event: DragEvent) => {
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
      setIsOver(!(event.target as Element | null)?.closest?.('[data-sheet-drop]'));
    };
    const drop = (event: DragEvent) => { event.preventDefault(); remove(event.dataTransfer); };
    document.addEventListener('dragover', over);
    document.addEventListener('drop', drop);
    return () => { document.removeEventListener('dragover', over); document.removeEventListener('drop', drop); };
  }, [active, draggingStaffId, removeFromSheet, removeFromBlock]);

  return (
    <div className={`${className} relative`}>
      {children}
      {active && (
        <div
          onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }}
          onDrop={event => { event.preventDefault(); event.stopPropagation(); remove(event.dataTransfer); }}
          className={`absolute top-2 left-1/2 -translate-x-1/2 z-40 px-5 py-3 rounded-xl border-2 border-dashed text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-colors ${
            isOver
              ? 'border-rose-600 bg-rose-600 text-white'
              : 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{t('sheet.dropRemove')}</span>
        </div>
      )}
    </div>
  );
};
