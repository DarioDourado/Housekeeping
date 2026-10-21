'use client';

import { useState } from 'react';
import { Room } from '../../../types/housekeeping.types';
import { useHousekeeping } from '../../../services/hooks/housekeeping/useHousekeeping';
import { AlertTriangle, X, Check } from 'lucide-react';

interface InspectionReprovalModalProps {
  room: Room;
  onClose: () => void;
}

export const InspectionReprovalModal = ({
  room,
  onClose
}: InspectionReprovalModalProps) => {
  const { reproveInspection } = useHousekeeping();
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const presets = [
    'Aspirar e limpar por baixo do sofá/cama',
    'Repor conjunto de toalhas de banho',
    'Limpar espelho da casa de banho e vidros da varanda',
    'Verificar máquina Nespresso e repor cápsulas',
    'Repor garrafas de água mineral de cortesia',
    'Alinhar cortinados e verificar pó no móvel de TV'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    setSubmitting(true);
    await reproveInspection(room.id, note.trim());
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 dark:border-rose-950/60 bg-rose-50/50 dark:bg-rose-950/30">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Reprovação de Inspeção · Quarto {room.number}
              </h3>
              <p className="text-xs text-slate-500">
                O quarto mantém-se <span className="font-semibold text-sky-700 dark:text-sky-400">CLEAN</span> e a empregada receberá o alerta com o que corrigir.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nota Obrigatória para a Empregada de Área:
            </label>
            <textarea
              required
              rows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Descreva exatamente o que necessita de correção..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* Quick preset chips */}
          <div>
            <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
              Motivos Frequentes (clique para preencher):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setNote(prev => prev ? `${prev}. ${preset}` : preset)}
                  className="text-xs px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 text-slate-700 dark:text-slate-300 transition-colors text-left"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !note.trim()}
              className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Enviar Alerta à Empregada</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
