'use client';

import { useHousekeeping } from '../../../services/hooks/housekeeping/useHousekeeping';
import { RoomTypology, ServiceType } from '../../../types/housekeeping.types';
import {
  X,
  Award,
  Clock,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  Users
} from 'lucide-react';

interface CreditsStatsModalProps {
  onClose: () => void;
}

export const CreditsStatsModal = ({ onClose }: CreditsStatsModalProps) => {
  const { rooms, events } = useHousekeeping();

  // Compute total credits across active rooms
  const totalHotelCredits = rooms.reduce((acc, r) => {
    let cr = 1;
    const isDep = r.serviceType === ServiceType.DEPARTURE_ARRIVAL || r.serviceType === ServiceType.DEPARTURE_ONLY;
    if (r.typology === RoomTypology.STANDARD) cr = isDep ? 2 : 1;
    else if (r.typology === RoomTypology.JUNIOR_SUITE) cr = isDep ? 3 : 1.5;
    else if (r.typology === RoomTypology.SUITE) cr = isDep ? 4 : 2;
    else if (r.typology === RoomTypology.VILLA) cr = isDep ? 6 : 3;
    if (r.serviceType === ServiceType.REFRESH) cr = 0.5;
    return acc + cr;
  }, 0);

  // Completed inspections by supervisor
  const inspectionEvents = events.filter(e => e.eventType === 'INSPECTION_APPROVED');
  const inspectionsByPerson = inspectionEvents.reduce((acc, e) => {
    acc[e.userName] = (acc[e.userName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Sistema de Créditos & Estatísticas de Produtividade
              </h3>
              <p className="text-xs text-slate-500">
                Ponderação por tipologia × serviço. Meta diária: 12 créditos por empregada.
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

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 dark:text-slate-300">
          
          {/* Top KPI Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-400 block font-medium mb-1">Carga Total de Trabalho</span>
              <span className="text-2xl font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                {totalHotelCredits} créditos
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                ≈ {Math.ceil(totalHotelCredits / 12)} empregadas necessárias hoje
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-400 block font-medium mb-1">Meta por Empregada</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                12 créditos / dia
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Ex: 9 estadias (9cr) + 1 saída jr suite (3cr)
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <span className="text-slate-400 block font-medium mb-1">Inspeções Aprovadas</span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {inspectionEvents.length}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Supervisão de governantas em direto
              </span>
            </div>
          </div>

          {/* Model of Credits Matrix (as decided in Vila Vita meeting) */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              Matriz de Conversão Tipologia × Serviço (Vila Vita Parc)
            </h4>
            
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5">Tipologia</th>
                    <th className="p-2.5">Estadia (In-house)</th>
                    <th className="p-2.5">Saída (Departure)</th>
                    <th className="p-2.5">Refresh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-2.5 font-medium">Quarto Normal Deluxe</td>
                    <td className="p-2.5 tabular-nums">1.0 crédito (~30 min)</td>
                    <td className="p-2.5 tabular-nums font-semibold text-rose-600">2.0 créditos (~60 min)</td>
                    <td className="p-2.5 tabular-nums text-purple-600">0.5 crédito (~15 min)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Junior Suite</td>
                    <td className="p-2.5 tabular-nums">1.5 créditos (~45 min)</td>
                    <td className="p-2.5 tabular-nums font-semibold text-rose-600">3.0 créditos (~90 min)</td>
                    <td className="p-2.5 tabular-nums text-purple-600">0.5 crédito (~15 min)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Suite Hotel / Oasis</td>
                    <td className="p-2.5 tabular-nums">2.0 créditos (~60 min)</td>
                    <td className="p-2.5 tabular-nums font-semibold text-rose-600">4.0 créditos (~120 min)</td>
                    <td className="p-2.5 tabular-nums text-purple-600">0.5 crédito (~15 min)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">Master Villa (4+ quartos)</td>
                    <td className="p-2.5 tabular-nums">3.0 créditos (~90 min)</td>
                    <td className="p-2.5 tabular-nums font-semibold text-rose-600">6.0 créditos (~180 min)</td>
                    <td className="p-2.5 tabular-nums text-purple-600">1.0 crédito (~30 min)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Inspections per Governanta Breakdown */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              Controlo de Inspeções por Governanta
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(inspectionsByPerson).length > 0 ? (
                Object.entries(inspectionsByPerson).map(([name, count]) => (
                  <div key={name} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{name}</span>
                    <span className="font-bold text-emerald-600 tabular-nums">{count} quartos inspecionados</span>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-3 text-slate-400 italic">
                  Ainda sem inspeções realizadas no turno atual.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-700 rounded-lg hover:bg-slate-800"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
