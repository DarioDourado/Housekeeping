'use client';

import { useState } from 'react';
import { Room, TaskSheet } from '../../../types/housekeeping.types';
import { useHousekeeping } from '../../../services/hooks/housekeeping/useHousekeeping';
import { X, ArrowRightLeft, Check } from 'lucide-react';

interface MoveRoomModalProps {
  room: Room;
  sheets: TaskSheet[];
  onClose: () => void;
}

export const MoveRoomModal = ({
  room,
  sheets,
  onClose
}: MoveRoomModalProps) => {
  const { moveRoomToSheet } = useHousekeeping();
  const [targetSheetId, setTargetSheetId] = useState(room.assignedSheetId);

  const handleMove = async () => {
    if (targetSheetId === room.assignedSheetId) {
      onClose();
      return;
    }
    await moveRoomToSheet(room.id, targetSheetId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Mover Quarto {room.number}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            Selecione a secção de destino para o Quarto <strong>{room.number}</strong> ({room.block}):
          </p>

          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {sheets.map(sheet => {
              const isCurrent = sheet.id === room.assignedSheetId;
              const isSelected = sheet.id === targetSheetId;

              return (
                <button
                  key={sheet.id}
                  type="button"
                  onClick={() => setTargetSheetId(sheet.id)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-300'
                  }`}
                >
                  <div>
                    <span className="block text-xs">{sheet.title}</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      {sheet.assignedUserNames.join(', ') || 'Sem pessoas atribuídas'}
                    </span>
                  </div>

                  {isCurrent ? (
                    <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      Atual
                    </span>
                  ) : isSelected ? (
                    <Check className="w-4 h-4 text-blue-600" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleMove}
              className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
            >
              Confirmar Movimento
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
