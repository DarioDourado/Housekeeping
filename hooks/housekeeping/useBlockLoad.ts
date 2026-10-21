import { useMemo } from 'react';
import { calculateCounters } from '@/lib/counters';
import { PlanKind } from '@/types/housekeeping.types';
import { useBoard } from './useBoard';

export interface BlockLoad {
  tasks: number;
  credits: number;
  departureArrivals: number;
}

// - Carga de trabalho do dia por bloco (tarefas, créditos estimados, saídas com chegada), para equilibrar equipas
export const useBlockLoad = () => {
  const { views } = useBoard(PlanKind.DAY);

  return useMemo(() => {
    const blocks = Array.from(new Set(views.map(view => view.room.block)));
    const byBlock = new Map<string, BlockLoad>(
      blocks.map(block => {
        const counters = calculateCounters(views.filter(view => view.room.block === block));
        return [block, { tasks: counters.totalTasks, credits: counters.estimatedCredits, departureArrivals: counters.departureArrivalCount }];
      })
    );
    return { byBlock, totalCredits: calculateCounters(views).estimatedCredits };
  }, [views]);
};
