import { isOnDuty } from '@/lib/staffDuty';
import { BLOCK } from '@/config/constants';
import { getStaffBlock } from '@/lib/staffBlock';
import type { User } from '@/types/auth.types';
import type { BlockTeam, LocalizedText, Section } from '@/types/housekeeping.types';
import type { Command } from './types';
import { governantaRule, withEvent, withLead } from './helpers';

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
    state: withEvent(moved, ctx, { type: 'STAFF_MOVED', roomId: 'staff', roomNumber: person.name, detail, metadata: { staffId, from: person.assignedArea ?? null, to: targetBlock } }),
    toast: { key: 'toasts.staffMoved', params: { name: person.name, block: targetBlock } }
  };
};

// - Tirar uma pessoa do bloco (arrastar para fora no quadro): vai para o pool "Apoio & Rotativas", sem equipa.
//   Quem já está no pool não tem bloco de onde sair: passa a Fora de serviço. Nunca mexe nas task sheets.
export const removeStaffFromBlock: Command<{ staffId: string }> = (state, { staffId }, ctx) => {
  const person = state.staff.find(user => user.id === staffId);
  if (!person) return { state };
  const from = getStaffBlock(person);
  if (from === BLOCK.SUPPORT) {
    if (!isOnDuty(person)) return { state };
    return {
      state: withEvent(
        { ...state, staff: state.staff.map(user => (user.id === staffId ? { ...user, isOnDuty: false } : user)) },
        ctx,
        { type: 'STAFF_MOVED', roomId: 'staff', roomNumber: person.name, detail: { key: 'events.staffOffDuty', params: { name: person.name } } }
      ),
      toast: { key: 'toasts.staffOffDuty', params: { name: person.name } }
    };
  }

  const removed: typeof state = {
    ...state,
    staff: state.staff.map(user => (user.id === staffId ? { ...user, assignedArea: BLOCK.SUPPORT } : user))
  };
  return {
    state: withEvent(removed, ctx, {
      type: 'STAFF_MOVED', roomId: 'staff', roomNumber: person.name,
      detail: { key: 'events.staffRemoved', params: { name: person.name, from } },
      metadata: { staffId, from, to: BLOCK.SUPPORT }
    }),
    toast: { key: 'toasts.staffRemoved', params: { name: person.name, block: from } }
  };
};

// - mudar a responsável do bloco fica na auditoria: metadata = { block, from, to } (ids das pessoas)
export const updateBlockTeam: Command<{ team: BlockTeam }> = (state, { team }, ctx) => {
  const current = state.blockTeams.find(item => item.id === team.id);
  const updated = { ...state, blockTeams: state.blockTeams.map(item => (item.id === team.id ? team : item)) };
  if (!current || current.supervisorId === team.supervisorId) return { state: updated };
  return {
    state: withEvent(updated, ctx, {
      type: 'BLOCK_LEAD_CHANGED', roomId: 'team', roomNumber: team.block,
      detail: { key: 'events.blockLeadChanged', params: { block: team.block, name: team.supervisorName ?? '—' } },
      metadata: { block: team.block, from: current.supervisorId ?? null, to: team.supervisorId ?? null }
    })
  };
};

export const addBlockTeam: Command<{ team: Omit<BlockTeam, 'id'> }> = (state, { team }, ctx) => ({
  state: { ...state, blockTeams: [...state.blockTeams, { ...team, id: ctx.newId('team') }] }
});

// - ao apagar uma equipa, quem lá estava volta ao pool de apoio (de serviço e sem posição); o bloco por defeito também deixa de existir
export const deleteBlockTeam: Command<{ teamId: string }> = (state, { teamId }) => {
  const block = state.blockTeams.find(team => team.id === teamId)?.block;
  const inBlock = (area?: string) => !!block && block !== BLOCK.SUPPORT && !!area && getStaffBlock({ assignedArea: area }) === block;
  return {
    state: {
      ...state,
      blockTeams: state.blockTeams.filter(team => team.id !== teamId),
      staff: state.staff.map(user => (inBlock(user.assignedArea) || inBlock(user.defaultBlock)
        ? { ...user, ...(inBlock(user.assignedArea) && { assignedArea: BLOCK.SUPPORT }), ...(inBlock(user.defaultBlock) && { defaultBlock: BLOCK.SUPPORT }) }
        : user))
    }
  };
};

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

// - mudar a escala de serviço (de serviço ↔ folga) fica na auditoria: metadata = { staffId, from, to }
export const updateStaff: Command<{ user: User }> = (state, { user }, ctx) => {
  const current = state.staff.find(person => person.id === user.id);
  const updated = { ...state, staff: state.staff.map(person => (person.id === user.id ? user : person)) };
  if (!current || isOnDuty(current) === isOnDuty(user)) return { state: updated };
  const on = isOnDuty(user);
  return {
    state: withEvent(updated, ctx, {
      type: 'STAFF_DUTY_CHANGED', roomId: 'staff', roomNumber: user.name,
      detail: { key: on ? 'events.staffDutyOn' : 'events.staffDutyOff', params: { name: user.name } },
      metadata: { staffId: user.id, from: isOnDuty(current), to: on }
    })
  };
};

// - ao eliminar uma pessoa, sai também das task sheets e das secções onde estava atribuída
export const deleteStaff: Command<{ userId: string }> = (state, { userId }) => ({
  state: {
    ...state,
    staff: state.staff.filter(user => user.id !== userId),
    sheets: state.sheets.map(sheet => ({ ...sheet, assignments: withLead(sheet.assignments.filter(assignment => assignment.staffId !== userId), governantaRule(state)) })),
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

// - um quarto só pertence a uma secção por defeito (dentro do mesmo serviço: manhã e turndown são configurações separadas)
export const moveRoomToSection: Command<{ roomId: string; targetSectionId: string }> = (state, { roomId, targetSectionId }) => {
  const kind = state.sections.find(section => section.id === targetSectionId)?.kind;
  return {
    state: {
      ...state,
      sections: state.sections.map(section => {
        if (section.kind !== kind) return section;
        const others = section.defaultRoomIds.filter(id => id !== roomId);
        return { ...section, defaultRoomIds: section.id === targetSectionId ? [...others, roomId] : others };
      })
    }
  };
};
