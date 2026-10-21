import type { User } from '@/types/auth.types';
import type { BlockTeam, LocalizedText, Section } from '@/types/housekeeping.types';
import type { Command } from './types';
import { withEvent } from './helpers';

export const moveStaffToBlock: Command<{ staffId: string; targetBlock: string }> = (state, { staffId, targetBlock }, ctx) => {
  const person = state.staff.find(user => user.id === staffId);
  if (!person) return { state };

  const moved: typeof state = {
    ...state,
    staff: state.staff.map(user => (user.id === staffId ? { ...user, assignedArea: targetBlock } : user))
  };

  const detail: LocalizedText = person.assignedArea
    ? { key: 'events.staffMoved', params: { name: person.name, from: person.assignedArea, to: targetBlock } }
    : { key: 'events.staffMovedFromNone', params: { name: person.name, to: targetBlock } };

  return {
    state: withEvent(moved, ctx, { type: 'STAFF_MOVED', roomId: 'staff', roomNumber: person.name, detail }),
    toast: { key: 'toasts.staffMoved', params: { name: person.name, block: targetBlock } }
  };
};

export const updateBlockTeam: Command<{ team: BlockTeam }> = (state, { team }) => ({
  state: { ...state, blockTeams: state.blockTeams.map(current => (current.id === team.id ? team : current)) }
});

export const addBlockTeam: Command<{ team: Omit<BlockTeam, 'id'> }> = (state, { team }, ctx) => ({
  state: { ...state, blockTeams: [...state.blockTeams, { ...team, id: ctx.newId('team') }] }
});

export const deleteBlockTeam: Command<{ teamId: string }> = (state, { teamId }) => ({
  state: { ...state, blockTeams: state.blockTeams.filter(team => team.id !== teamId) }
});

// - repõe as pessoas nos blocos por defeito de partida (a configuração base, não a distribuição do dia)
export const restoreDailyToDefaultBaseline: Command = state => ({
  state: {
    ...state,
    staff: state.staff.map(user =>
      user.defaultBlock && user.assignedArea !== user.defaultBlock ? { ...user, assignedArea: user.defaultBlock } : user
    )
  },
  toast: { key: 'toasts.baselineApplied' }
});

export const addStaff: Command<{ user: Omit<User, 'id'> }> = (state, { user }, ctx) => ({
  state: { ...state, staff: [...state.staff, { ...user, id: ctx.newId('user') }] }
});

export const updateStaff: Command<{ user: User }> = (state, { user }) => ({
  state: { ...state, staff: state.staff.map(current => (current.id === user.id ? user : current)) }
});

// - ao eliminar uma pessoa, sai também das task sheets e das secções onde estava atribuída
export const deleteStaff: Command<{ userId: string }> = (state, { userId }) => ({
  state: {
    ...state,
    staff: state.staff.filter(user => user.id !== userId),
    sheets: state.sheets.map(sheet => ({ ...sheet, assignments: sheet.assignments.filter(assignment => assignment.staffId !== userId) })),
    sections: state.sections.map(section => ({ ...section, defaultStaffIds: section.defaultStaffIds.filter(id => id !== userId) }))
  }
});

// ---------- secções (configuração base) ----------
// - Alterar uma secção é uma mudança estrutural e permanente: não mexe em planos já abertos (§6.1).

export const addSection: Command<{ section: Omit<Section, 'id'> }> = (state, { section }, ctx) => ({
  state: { ...state, sections: [...state.sections, { ...section, id: ctx.newId('sec') }] }
});

export const updateSection: Command<{ section: Section }> = (state, { section }) => ({
  state: { ...state, sections: state.sections.map(current => (current.id === section.id ? section : current)) }
});

export const deleteSection: Command<{ sectionId: string }> = (state, { sectionId }) => ({
  state: { ...state, sections: state.sections.filter(section => section.id !== sectionId) }
});

// - um quarto só pertence a uma secção por defeito
export const moveRoomToSection: Command<{ roomId: string; targetSectionId: string }> = (state, { roomId, targetSectionId }) => ({
  state: {
    ...state,
    sections: state.sections.map(section => {
      const others = section.defaultRoomIds.filter(id => id !== roomId);
      return { ...section, defaultRoomIds: section.id === targetSectionId ? [...others, roomId] : others };
    })
  }
});
