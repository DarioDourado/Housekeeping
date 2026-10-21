'use client';

import { useState } from 'react';
import { useHousekeeping } from '../../../services/hooks/housekeeping/useHousekeeping';
import { RoomEvent } from '../../../types/housekeeping.types';
import {
  Clock,
  Play,
  Check,
  CheckCheck,
  AlertTriangle,
  RotateCw,
  BellOff,
  UserX,
  ArrowRightLeft,
  Server,
  Moon,
  Search,
  Filter
} from 'lucide-react';

export const AuditingTimeline = () => {
  const { events } = useHousekeeping();
  const [filterRoom, setFilterRoom] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  const getEventBadge = (type: RoomEvent['eventType']) => {
    switch (type) {
      case 'ROOM_STARTED':
        return { label: 'Início', icon: Play, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60' };
      case 'ROOM_FINISHED':
        return { label: 'Terminado (Clean)', icon: Check, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/60' };
      case 'INSPECTION_APPROVED':
        return { label: 'Inspecionado', icon: CheckCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60' };
      case 'INSPECTION_REPROVED':
        return { label: 'Reprovação c/ Nota', icon: AlertTriangle, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60' };
      case 'REFRESH_RECORDED':
        return { label: 'Refresh', icon: RotateCw, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60' };
      case 'DND_RECORDED':
        return { label: 'DND', icon: BellOff, color: 'text-stone-600 bg-stone-100 dark:bg-stone-800' };
      case 'SERVICE_REFUSED':
        return { label: 'Recusado', icon: UserX, color: 'text-stone-600 bg-stone-100 dark:bg-stone-800' };
      case 'PRIORITY_TOGGLED':
        return { label: 'Prioridade', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' };
      case 'MOVED_TASK_SHEET':
        return { label: 'Mover Secção', icon: ArrowRightLeft, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60' };
      case 'OPERA_SYNC_PULL':
      case 'OPERA_SYNC_PUSH':
        return { label: 'Opera Sync', icon: Server, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/60' };
      case 'NIGHT_AUDIT_TRIGGERED':
        return { label: 'Night Audit', icon: Moon, color: 'text-indigo-900 bg-indigo-100 dark:bg-indigo-950' };
      default:
        return { label: 'Ação', icon: Clock, color: 'text-slate-600 bg-slate-100' };
    }
  };

  const filteredEvents = events.filter(ev => {
    if (filterRoom && !ev.roomNumber.toLowerCase().includes(filterRoom.toLowerCase())) {
      return false;
    }
    if (filterType !== 'ALL' && ev.eventType !== filterType) {
      return false;
    }
    return true;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
      
      {/* Header & Filter Controls */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Auditoria de Tempos & Histórico Imutável de Eventos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tabela de eventos append-only. Registo de durações de limpeza, reprovações com notas e sincronizações.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filterRoom}
              onChange={e => setFilterRoom(e.target.value)}
              placeholder="Filtrar Quarto..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
            />
          </div>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
          >
            <option value="ALL">Todos os Tipos</option>
            <option value="ROOM_STARTED">Início de Quarto</option>
            <option value="ROOM_FINISHED">Fim de Quarto (Clean)</option>
            <option value="INSPECTION_APPROVED">Aprovação (Inspected)</option>
            <option value="INSPECTION_REPROVED">Reprovação c/ Nota</option>
            <option value="REFRESH_RECORDED">Refresh</option>
            <option value="DND_RECORDED">DND / Não Incomodar</option>
            <option value="NIGHT_AUDIT_TRIGGERED">Night Audit Opera</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
            <tr>
              <th className="py-3 px-4">Hora</th>
              <th className="py-3 px-4">Quarto</th>
              <th className="py-3 px-4">Ação / Evento</th>
              <th className="py-3 px-4">Operador</th>
              <th className="py-3 px-4">Duração</th>
              <th className="py-3 px-4">Detalhes & Notas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
            {filteredEvents.length > 0 ? (
              filteredEvents.map(ev => {
                const meta = getEventBadge(ev.eventType);
                const Icon = meta.icon;

                return (
                  <tr key={ev.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 tabular-nums whitespace-nowrap">
                      {ev.timestamp}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {ev.roomNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium ${meta.color}`}>
                        <Icon className="w-3 h-3" />
                        <span>{meta.label}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                      {ev.userName} <span className="text-slate-400 text-[11px]">({ev.userRole})</span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {ev.durationSeconds
                        ? `${Math.round(ev.durationSeconds / 60)} min (${ev.durationSeconds}s)`
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-md">
                      {ev.details || '—'}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                  Nenhum evento corresponde aos filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
