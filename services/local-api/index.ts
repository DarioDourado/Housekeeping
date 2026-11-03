import { acknowledgeAlert, sendTraceAlert } from './alertCommands';
import { finishTask, recordNotPerformed, reopenRoom, reopenTask, setRoomStatus, startTask } from './executionCommands';
import { completeCorrection, inspectTask, requestCorrection } from './inspectionCommands';
import { recordRefresh, togglePriority, updateRoomInstructions } from './interventionCommands';
import { receiveOperaStatus, retryOperaJob, syncWithOpera, triggerNightAudit } from './operaCommands';
import { addSheet, assignStaffToSheet, moveStaffToSheet, moveTask, openPlan, removeStaffFromSheet, setSheetLead, updateSheet } from './planningCommands';
import {
  addBlockTeam,
  addSection,
  addStaff,
  deleteBlockTeam,
  deleteSection,
  deleteStaff,
  moveRoomToSection,
  moveStaffToBlock,
  removeStaffFromBlock,
  restoreDailyToDefaultBaseline,
  updateBlockTeam,
  updateSection,
  updateStaff
} from './teamCommands';
import type { Command } from './types';

// - registo único dos comandos; o transporter executa-os por nome (no BE, 1 endpoint por comando)
export const commands = {
  // execução
  startTask,
  finishTask,
  recordNotPerformed,
  inspectTask,
  requestCorrection,
  completeCorrection,
  reopenRoom,
  setRoomStatus,
  updateRoomInstructions,
  reopenTask,
  recordRefresh,
  togglePriority,
  // planeamento
  openPlan,
  moveTask,
  updateSheet,
  assignStaffToSheet,
  moveStaffToSheet,
  addSheet,
  setSheetLead,
  removeStaffFromSheet,
  // Opera
  receiveOperaStatus,
  triggerNightAudit,
  syncWithOpera,
  retryOperaJob,
  // pessoal, equipas e secções
  moveStaffToBlock,
  removeStaffFromBlock,
  addStaff,
  updateStaff,
  deleteStaff,
  addBlockTeam,
  updateBlockTeam,
  deleteBlockTeam,
  restoreDailyToDefaultBaseline,
  addSection,
  updateSection,
  deleteSection,
  moveRoomToSection,
  // alertas
  acknowledgeAlert,
  sendTraceAlert
} as const;

export type CommandName = keyof typeof commands;
export type CommandArgs<N extends CommandName> = (typeof commands)[N] extends Command<infer A> ? A : never;

export type { Actor, CommandContext, CommandResult, HousekeepingState } from './types';
export { SYSTEM_ACTOR, defaultNewId } from './helpers';
