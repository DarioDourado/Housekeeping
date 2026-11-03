import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Star, Users } from 'lucide-react';
import { useAssignStaffToSheet, useBlockTeams, useSetSheetLead, useTaskSheets } from '@/hooks/housekeeping';
import { useEnsureOnDuty, useStaff } from '@/hooks/staff';
import { useUiStore } from '@/store/uiStore';
import { isGovernanta } from '@/lib/jobTitles';
import { isOnDuty } from '@/lib/staffDuty';
import { duplicateColorIndex, duplicatedStaff } from '@/lib/staffSheets';
import type { SheetColumn } from '@/lib/taskViews';
import { SheetRole, type SheetAssignment } from '@/types/housekeeping.types';

// - uma cor por pessoa repetida (classes literais para o Tailwind as encontrar; só famílias do tema; sem azul/ciano (chip normal), laranja/âmbar (extras) nem cinzento (fora de serviço))
const DUPLICATE_COLORS = [
  'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-rose-500 dark:border-rose-600',
  'bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border-purple-500 dark:border-purple-600',
  'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-500 dark:border-emerald-600',
  'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border-indigo-500 dark:border-indigo-600',
  'bg-red-100 dark:bg-red-950/60 text-red-900 dark:text-red-200 border-red-500 dark:border-red-600',
  'bg-green-100 dark:bg-green-950/60 text-green-900 dark:text-green-200 border-green-500 dark:border-green-600'
] as const;

interface SheetAssigneesProps {
  sheetId: string;
  assignments: SheetAssignment[];
  assignees: SheetColumn['assignees'];
  canEdit: boolean;
}

// - Quem está atribuído a uma task sheet (várias pessoas, uma "responsável"). Quem planeia ≠ quem executa (§5.1).
export const SheetAssignees = ({ sheetId, assignments, assignees, canEdit }: SheetAssigneesProps) => {
  const { t } = useTranslation();
  const { data: staff = [] } = useStaff();
  const assignStaff = useAssignStaffToSheet();
  const setLead = useSetSheetLead();
  const ensureOnDuty = useEnsureOnDuty();
  const { data: sheets = [] } = useTaskSheets();
  const setDraggingStaffId = useUiStore(state => state.setDraggingStaffId);
  const [open, setOpen] = useState(false);

  const toggle = async (staffId: string) => {
    if (assignments.some(a => a.staffId === staffId)) {
      await assignStaff(sheetId, assignments.filter(a => a.staffId !== staffId));
      return;
    }
    // - quem está fora de serviço só entra depois de confirmar que se ativa
    const person = staff.find(user => user.id === staffId);
    if (person && !(await ensureOnDuty(person))) return;
    await assignStaff(sheetId, [...assignments, { staffId, role: SheetRole.MEMBER }]);
  };

  // - quem está em mais do que uma sheet do mesmo plano fica assinalado (dia e noite são independentes)
  const planId = sheets.find(sheet => sheet.id === sheetId)?.planId ?? '';
  // - responsáveis de bloco podem estar em várias sheets sem serem assinalados
  const { data: teams = [] } = useBlockTeams();
  const blockLeads = new Set(staff.filter(user => teams.some(team => team.supervisorId === user.id || team.supervisorName === user.name)).map(user => user.id));
  const duplicated = duplicatedStaff(sheets, planId, blockLeads);
  const lead = assignees.find(a => a.role === SheetRole.LEAD);

  return (
    <div className="relative">
      {/* - a responsável da sheet (★) no cabeçalho da sheet; a do bloco aparece no cabeçalho do bloco */}
      {!lead && assignees.length > 0 && (
        <p className="text-[11px] font-medium text-slate-400 italic">{t('sheet.noLeadHint')}</p>
      )}
      {lead && (
        <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200" title={t('sheet.responsibleHint')}>
          <Star className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />
          <span className="text-slate-400 font-medium">{t('sheet.responsible')}</span>
          <span className="truncate">{lead.user.name}</span>
        </p>
      )}
      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1"><Users className="w-3 h-3" />{t('sheet.assignedTeam')}</span>
        {canEdit && (
          <button onClick={() => setOpen(!open)} aria-expanded={open} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-0.5">
            <Plus className="w-3 h-3" />
            {assignees.length === 0 ? t('sheet.assignPerson') : t('sheet.edit')}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1 mt-1.5 min-h-[24px]">
        {assignees.length > 0 ? (
          assignees.map(({ user, role }) => {
            const others = role === SheetRole.LEAD ? [] : (duplicated.get(user.id) ?? []).filter(sheet => sheet.id !== sheetId);
            const off = !isOnDuty(user);
            return (
            <span
              key={user.id}
              title={others.length > 0 ? t('sheet.multiSheet', { sheets: others.map(sheet => sheet.title).join(', ') }) : off ? t('sheet.offDutyHint') : undefined}
              draggable={canEdit}
              // - arrastar o nome para outra sheet move a pessoa de grupo
              onDragStart={event => {
                event.dataTransfer.setData('application/staff-id', user.id);
                event.dataTransfer.setData('application/from-sheet', sheetId);
                event.dataTransfer.effectAllowed = 'move';
                setDraggingStaffId(user.id);
              }}
              onDragEnd={() => setDraggingStaffId(null)}
              className={`${canEdit ? 'cursor-grab active:cursor-grabbing ' : ''}inline-flex items-center gap-1 text-[11px] font-medium border px-2 py-0.5 rounded-full ${
                others.length > 0
                  ? DUPLICATE_COLORS[duplicateColorIndex(duplicated, user.id) % DUPLICATE_COLORS.length]
                  : off
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-dashed border-slate-400 dark:border-slate-600'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900'
              }`}>
              {user.name}{user.isExtra ? t('sheet.extraSuffix') : ''}{role === SheetRole.LEAD && assignees.length > 1 ? ' ★' : ''}
              {off && <span className="text-[10px] font-bold">· {t('sheet.offDuty')}</span>}
              {others.length > 0 && <span className="text-[10px] font-bold">⚠ {others.length + 1}</span>}
              {canEdit && role !== SheetRole.LEAD && isGovernanta(user) && (
                <button onClick={() => void setLead(sheetId, user.id)} className="opacity-40 hover:opacity-100" title={t('sheet.makeLead')} aria-label={t('sheet.makeLead')}>
                  <Star className="w-3 h-3" />
                </button>
              )}
            </span>
            );
          })
        ) : (
          <span className="text-[11px] text-slate-400 italic">{t('sheet.noPerson')}</span>
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 p-2.5 text-xs">
          <div className="flex items-center justify-between mb-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <span>{t('sheet.choosePeople')}</span>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">{t('sheet.ok')}</button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1">
            {staff.map(person => (
              <label key={person.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                <input type="checkbox" checked={assignments.some(a => a.staffId === person.id)} onChange={() => void toggle(person.id)} />
                <span className="text-slate-800 dark:text-slate-200 font-medium truncate">{person.name}{person.isExtra ? t('sheet.extraGasSuffix') : ''}{!isOnDuty(person) && <span className="ml-1 text-[10px] text-slate-400 font-normal">· {t('sheet.offDuty')}</span>}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
