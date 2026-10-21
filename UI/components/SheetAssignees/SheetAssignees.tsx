import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Users } from 'lucide-react';
import { useAssignStaffToSheet } from '@/hooks/housekeeping';
import { useStaff } from '@/hooks/staff';
import type { SheetColumn } from '@/lib/taskViews';
import { SheetRole, type SheetAssignment } from '@/types/housekeeping.types';

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
  const [open, setOpen] = useState(false);

  const toggle = (staffId: string) => {
    const next = assignments.some(a => a.staffId === staffId)
      ? assignments.filter(a => a.staffId !== staffId)
      : [...assignments, { staffId, role: assignments.length === 0 ? SheetRole.LEAD : SheetRole.MEMBER }];
    void assignStaff(sheetId, next);
  };

  return (
    <div className="relative">
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
          assignees.map(({ user, role }) => (
            <span key={user.id} className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900 px-2 py-0.5 rounded-full">
              {user.name}{user.isExtra ? t('sheet.extraSuffix') : ''}{role === SheetRole.LEAD && assignees.length > 1 ? ' ★' : ''}
            </span>
          ))
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
                <input type="checkbox" checked={assignments.some(a => a.staffId === person.id)} onChange={() => toggle(person.id)} />
                <span className="text-slate-800 dark:text-slate-200 font-medium truncate">{person.name}{person.isExtra ? t('sheet.extraGasSuffix') : ''}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
