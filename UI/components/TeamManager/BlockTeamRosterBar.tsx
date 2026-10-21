import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, GripVertical, Settings2, Users } from 'lucide-react';
import { useBlockTeams, useMoveStaffToBlock } from '@/hooks/housekeeping';
import { useStaff } from '@/hooks/staff';
import { getStaffBlock } from '@/lib/staffBlock';
import { useOverlayStore } from '@/store/overlayStore';
import { useUiStore } from '@/store/uiStore';
import type { User } from '@/types/auth.types';
import { getTeamColorPalette } from './teamColorUtils';

// - Barra de equipas por bloco no topo do planeamento: arrastar pessoas entre blocos ou para uma task sheet
export const BlockTeamRosterBar = () => {
  const { t } = useTranslation();
  const { data: users = [] } = useStaff();
  const { data: blockTeams = [] } = useBlockTeams();
  const moveStaffToBlock = useMoveStaffToBlock();
  const openPanel = useOverlayStore(state => state.openPanel);
  const draggingStaffId = useUiStore(state => state.draggingStaffId);
  const setDraggingStaffId = useUiStore(state => state.setDraggingStaffId);
  const [isExpanded, setIsExpanded] = useState(true);
  const [dragOverBlock, setDragOverBlock] = useState<string | null>(null);

  const startDrag = (event: React.DragEvent, staff: User) => {
    event.dataTransfer.setData('application/staff-id', staff.id);
    event.dataTransfer.setData('text/plain', staff.id);
    event.dataTransfer.effectAllowed = 'move';
    setDraggingStaffId(staff.id);
  };

  const drop = async (event: React.DragEvent, block: string) => {
    event.preventDefault();
    setDragOverBlock(null);
    const staffId = event.dataTransfer.getData('application/staff-id') || draggingStaffId;
    if (staffId) {
      await moveStaffToBlock(staffId, block);
      setDraggingStaffId(null);
    }
  };

  return (
    <div className="w-full bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-2xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"><Users className="w-4 h-4" /></div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{t('roster.title')}</span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">· {t('roster.hint')}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => openPanel('team')} className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg flex items-center gap-1.5 border border-blue-200 dark:border-blue-900" title={t('roster.openManagerTitle')}>
            <Settings2 className="w-3.5 h-3.5" />
            <span>{t('roster.openManager')}</span>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
            title={isExpanded ? t('roster.collapseTitle') : t('roster.expandTitle')}
            aria-label={isExpanded ? t('roster.collapseLabel') : t('roster.expandLabel')}
            aria-expanded={isExpanded}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {blockTeams.map(team => {
            const palette = getTeamColorPalette(team.color || team.block);
            const members = users.filter(user => getStaffBlock(user) === team.block);
            const isOver = dragOverBlock === team.block;

            return (
              <div
                key={team.id}
                onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDragOverBlock(team.block); }}
                onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragOverBlock(null); }}
                onDrop={event => drop(event, team.block)}
                className={`p-2 rounded-lg border ${palette.topBorder} ${isOver ? `${palette.borderFocused} ${palette.bgLight} shadow-md` : `${palette.borderLight} ${palette.bgSoft}`}`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full ${palette.dot} shrink-0`} />
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{team.block}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 rounded-full border shrink-0 ${palette.badge}`}>{members.length}</span>
                </div>

                {isOver && <div className={`mb-1.5 py-1 text-[10px] font-bold text-center rounded border ${palette.badge}`}>{t('roster.dropFor', { block: team.block })}</div>}

                <div className="flex flex-wrap gap-1 min-h-[26px]">
                  {members.length === 0 ? (
                    <span className="text-[10px] text-slate-400 italic">{t('roster.noStaff')}</span>
                  ) : (
                    members.map(person => {
                      const offDuty = person.isOnDuty === false;
                      return (
                        <div
                          key={person.id}
                          draggable
                          onDragStart={event => startDrag(event, person)}
                          onDragEnd={() => { setDraggingStaffId(null); setDragOverBlock(null); }}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium select-none cursor-grab active:cursor-grabbing border border-l-2 ${palette.bar} ${
                            draggingStaffId === person.id
                              ? 'opacity-30 border-blue-500 bg-blue-100'
                              : offDuty
                                ? 'opacity-60 bg-slate-100 dark:bg-slate-800/80 text-slate-500 border-dashed border-slate-300 dark:border-slate-700'
                                : person.isExtra
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-2xs'
                          }`}
                          title={t('roster.memberTitle', { name: person.name, role: t(`roles.${person.role}`), block: team.block, status: offDuty ? t('roster.offDuty') : t('roster.onDuty') })}
                        >
                          <GripVertical className="w-2.5 h-2.5 text-slate-400 -ml-0.5 shrink-0" />
                          <span className="truncate max-w-[80px]">{person.name.split(' ')[0]}</span>
                          {offDuty ? <span className="text-[8px] font-bold text-slate-400">{t('roster.offDutyMark')}</span> : person.isExtra ? <span className="text-[8px] font-bold text-amber-600">★</span> : null}
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
