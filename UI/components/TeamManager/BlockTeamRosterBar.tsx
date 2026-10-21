'use client';

import { useState } from 'react';
import { useAuth } from '../../../services/hooks/auth/useAuth';
import { useHousekeeping } from '../../../context/HousekeepingContext';
import { User, UserRole } from '../../../types/auth.types';
import {
  Users,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Plus,
  Scale,
  Settings2,
  Smartphone,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';
import { housekeepingTransporter } from '../../../services/transporters/housekeeping/housekeepingTransporter';
import { getTeamColorPalette } from './teamColorUtils';

interface BlockTeamRosterBarProps {
  onOpenTeamManager: () => void;
}

export const BlockTeamRosterBar = ({ onOpenTeamManager }: BlockTeamRosterBarProps) => {
  const { users } = useAuth();
  const {
    rooms,
    blockTeams,
    moveStaffToBlock,
    draggingStaffId,
    setDraggingStaffId
  } = useHousekeeping();

  const [isExpanded, setIsExpanded] = useState(true);
  const [dragOverBlock, setDragOverBlock] = useState<string | null>(null);

  // Helper para identificar o bloco do utilizador
  const getStaffBlock = (u: User): string => {
    if (!u.assignedArea) return 'Apoio & Rotativas';
    const area = u.assignedArea.trim();
    if (area.includes('Bloco A')) return 'Bloco A';
    if (area.includes('Bloco B')) return 'Bloco B';
    if (area.includes('Bloco C')) return 'Bloco C';
    if (area.includes('Bloco D')) return 'Bloco D';
    if (area.includes('Oasis')) return 'Oasis Parc';
    if (area.includes('Vilas') || area.includes('Villa')) return 'Master Villas';
    return 'Apoio & Rotativas';
  };

  // Drag handlers para arrastar pessoas entre blocos
  const handleDragStart = (e: React.DragEvent, staff: User) => {
    e.dataTransfer.setData('application/staff-id', staff.id);
    e.dataTransfer.setData('text/plain', staff.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingStaffId(staff.id);
  };

  const handleDragEnd = () => {
    setDraggingStaffId(null);
    setDragOverBlock(null);
  };

  const handleDragOver = (e: React.DragEvent, block: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverBlock !== block) {
      setDragOverBlock(block);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverBlock(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetBlock: string) => {
    e.preventDefault();
    setDragOverBlock(null);
    const staffId = e.dataTransfer.getData('application/staff-id') || draggingStaffId;
    if (staffId) {
      await moveStaffToBlock(staffId, targetBlock);
      setDraggingStaffId(null);
    }
  };

  return (
    <div className="w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 transition-all shadow-2xs">
      
      {/* BAR HEADER */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
            <Users className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Equipas por Bloco (Cores & Drag-and-Drop)
              </span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">
                · Cartões de equipa codificados por cor. Arraste colaboradores entre blocos ou para uma Task Sheet abaixo.
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTeamManager}
            className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg flex items-center gap-1.5 border border-blue-200 dark:border-blue-900 transition-colors"
            title="Abrir painel completo de gestão e cores de equipas"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Gestor de Equipas & Cores</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isExpanded ? 'Recolher barra' : 'Expandir barra'}
            aria-label={isExpanded ? 'Recolher equipas' : 'Expandir equipas'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* EXPANDED CONTENT: HORIZONTAL ROSTER POR BLOCO COM CORES */}
      {isExpanded && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {blockTeams.map(team => {
            const palette = getTeamColorPalette(team.color || team.block);
            const members = users.filter(u => getStaffBlock(u) === team.block);
            const isOver = dragOverBlock === team.block;
            const hasDragging = !!draggingStaffId;

            return (
              <div
                key={team.id}
                onDragOver={e => handleDragOver(e, team.block)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, team.block)}
                className={`p-2 rounded-lg border-t-3 border transition-all ${palette.topBorder} ${
                  isOver
                    ? `${palette.borderFocused} ${palette.bgLight} scale-[1.02] shadow-md`
                    : hasDragging
                    ? `${palette.borderLight} ${palette.bgSoft}`
                    : `${palette.borderLight} ${palette.bgSoft} hover:shadow-2xs`
                }`}
              >
                {/* Block Title & Staff Count with Block Color Badge */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full ${palette.dot} shrink-0`} />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                      {team.block}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border shrink-0 ${palette.badge}`}>
                    {members.length}
                  </span>
                </div>

                {/* Drop Indicator when Dragging */}
                {isOver && (
                  <div className={`mb-1.5 py-1 text-[10px] font-bold text-center rounded border ${palette.badge}`}>
                    Soltar para {team.block}
                  </div>
                )}

                {/* Member Chips (Draggable with Left Color Accent) */}
                <div className="flex flex-wrap gap-1 min-h-[26px]">
                  {members.length === 0 ? (
                    <span className="text-[10px] text-slate-400 italic">Sem pessoal alocado</span>
                  ) : (
                    members.map(person => {
                      const isDragged = draggingStaffId === person.id;
                      const isOffDuty = person.isOnDuty === false;

                      return (
                        <div
                          key={person.id}
                          draggable
                          onDragStart={e => handleDragStart(e, person)}
                          onDragEnd={handleDragEnd}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium select-none cursor-grab active:cursor-grabbing transition-all border border-l-2 ${
                            palette.bar
                          } ${
                            isDragged
                              ? 'opacity-30 border-blue-500 bg-blue-100'
                              : isOffDuty
                              ? 'opacity-60 bg-slate-100 dark:bg-slate-800/80 text-slate-500 border-dashed border-slate-300 dark:border-slate-700'
                              : person.isExtra
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:border-amber-400'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-slate-400 shadow-2xs'
                          }`}
                          title={`${person.name} (${person.role.toUpperCase()}) - Equipa ${team.block} ${isOffDuty ? '· (Em Folga)' : '· (De Serviço)'}`}
                        >
                          <GripVertical className="w-2.5 h-2.5 text-slate-400 -ml-0.5 shrink-0" />
                          <span className="truncate max-w-[80px]">{person.name.split(' ')[0]}</span>
                          {isOffDuty ? (
                            <span className="text-[8px] font-bold text-slate-400">(F)</span>
                          ) : person.isExtra ? (
                            <span className="text-[8px] font-bold text-amber-600">★</span>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}


    </div>
  );
};
