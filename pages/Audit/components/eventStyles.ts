import {
  AlertTriangle,
  ArrowRightLeft,
  BellOff,
  Check,
  CheckCheck,
  Clock,
  FilePlus,
  Moon,
  Play,
  RotateCw,
  Server,
  UserX,
  type LucideIcon
} from 'lucide-react';
import type { TaskEventType } from '@/types/housekeeping.types';

interface EventStyle {
  icon: LucideIcon;
  color: string;
}

const STYLES: Record<TaskEventType, EventStyle> = {
  ROOM_STARTED: { icon: Play, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/60' },
  ROOM_FINISHED: { icon: Check, color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/60' },
  INSPECTION_APPROVED: { icon: CheckCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60' },
  INSPECTION_REPROVED: { icon: AlertTriangle, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60' },
  CORRECTION_DONE: { icon: Check, color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/60' },
  REFRESH_RECORDED: { icon: RotateCw, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60' },
  DND_RECORDED: { icon: BellOff, color: 'text-stone-600 bg-stone-100 dark:bg-stone-800' },
  SERVICE_REFUSED: { icon: UserX, color: 'text-stone-600 bg-stone-100 dark:bg-stone-800' },
  PRIORITY_TOGGLED: { icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60' },
  MOVED_TASK_SHEET: { icon: ArrowRightLeft, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60' },
  ROOM_REOPENED: { icon: RotateCw, color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/60' },
  TURNDOWN_UPDATED: { icon: Moon, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60' },
  STAFF_MOVED: { icon: ArrowRightLeft, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/60' },
  PLAN_OPENED: { icon: FilePlus, color: 'text-slate-700 bg-slate-100 dark:bg-slate-800' },
  OPERA_SYNC_PUSH: { icon: Server, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/60' },
  OPERA_SYNC_PULL: { icon: Server, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/60' },
  OPERA_CONFLICT_DETECTED: { icon: AlertTriangle, color: 'text-orange-700 bg-orange-50 dark:bg-orange-950/60' },
  NIGHT_AUDIT_TRIGGERED: { icon: Moon, color: 'text-indigo-900 bg-indigo-100 dark:bg-indigo-950' }
};

export const eventStyle = (type: TaskEventType): EventStyle => STYLES[type] ?? { icon: Clock, color: 'text-slate-600 bg-slate-100' };
