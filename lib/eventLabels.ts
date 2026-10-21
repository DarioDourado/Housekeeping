import type { TaskEventType } from '@/types/housekeeping.types';

// - chave i18n (audit.events.*) de cada tipo de evento
export const EVENT_LABEL_KEY: Record<TaskEventType, string> = {
  ROOM_STARTED: 'started',
  ROOM_FINISHED: 'finished',
  INSPECTION_APPROVED: 'approved',
  INSPECTION_REPROVED: 'reproved',
  CORRECTION_DONE: 'correctionDone',
  REFRESH_RECORDED: 'refresh',
  DND_RECORDED: 'dnd',
  SERVICE_REFUSED: 'refused',
  PRIORITY_TOGGLED: 'priority',
  MOVED_TASK_SHEET: 'moved',
  ROOM_REOPENED: 'reopened',
  TURNDOWN_UPDATED: 'turndown',
  STAFF_MOVED: 'staffMoved',
  PLAN_OPENED: 'planOpened',
  OPERA_SYNC_PUSH: 'operaSync',
  OPERA_SYNC_PULL: 'operaSync',
  OPERA_CONFLICT_DETECTED: 'operaConflict',
  NIGHT_AUDIT_TRIGGERED: 'nightAudit'
};
