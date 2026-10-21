'use client';

import { useHousekeeping } from '../../../hooks/housekeeping/useHousekeeping';
import type { OperaSyncModalProps } from '../../../types/components/opera-sync-modal.types';
import {
  X,
  RefreshCw,
  Server,
  ArrowUpRight,
  ArrowDownLeft,
  Moon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const OperaSyncModal = ({ onClose }: OperaSyncModalProps) => {
  const { operaLogs, triggerNightAudit, syncWithOpera } = useHousekeeping();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Opera Cloud PMS · Sincronização Bidirecional (OHIP API)
              </h3>
              <p className="text-xs text-slate-500">
                Estados Dirty, Clean e Inspected sincronizados nos dois sentidos. Vila Vita Parc property endpoint.
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

        {/* Action Controls Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => syncWithOpera()}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Forçar Sincronização OHIP</span>
            </button>
          </div>

          {/* Night audit simulator button */}
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                await triggerNightAudit();
              }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
              title="Executa as regras do fecho do dia no Opera: Inspected revertem a Clean e No-shows revertem a Dirty"
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Simular Night Audit (Fecho 03:00)</span>
            </button>
          </div>
        </div>

        {/* OHIP Log stream */}
        <div className="p-6 overflow-y-auto space-y-2 flex-1">
          <span className="text-xs font-semibold text-slate-400 block mb-2">
            Transações Recentes da API OHIP (Oracle Hospitality Integration Platform):
          </span>

          {operaLogs.length > 0 ? (
            operaLogs.map(log => (
              <div
                key={log.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${
                    log.direction === 'APP_TO_OPERA'
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                      : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                  }`}>
                    {log.direction === 'APP_TO_OPERA' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownLeft className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        Quarto {log.roomNumber}
                      </span>
                      <span className="text-slate-400">·</span>
                      <span className="font-medium text-slate-600 dark:text-slate-300">
                        {log.previousStatus} → <strong className="text-blue-600 dark:text-blue-400">{log.newStatus}</strong>
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">{log.sourceEvent}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    HTTP 200 OK
                  </span>
                  <span className="text-[11px] text-slate-400 block tabular-nums">{log.timestamp}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">Sem eventos de sincronização registados.</p>
          )}
        </div>

      </div>
    </div>
  );
};

