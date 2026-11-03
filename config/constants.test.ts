import { describe, expect, it } from 'vitest';
import { CREDIT_TABLE, ROLE_PERMISSIONS } from '@/config/constants';
import { RoomTypology } from '@/types/housekeeping.types';
import { UserRole } from '@/types/auth.types';

describe('constants', () => {
  it('tem créditos de estadia e saída para todas as tipologias', () => {
    for (const typology of Object.values(RoomTypology)) {
      expect(CREDIT_TABLE[typology].departure).toBeGreaterThan(CREDIT_TABLE[typology].stayover);
    }
  });

  it('empregadas nunca marcam Inspected (§11.1 do requisito)', () => {
    expect(ROLE_PERMISSIONS[UserRole.HOUSEKEEPER]).not.toContain('room.markInspected');
  });

  it('todos começam e concluem; aprovar, rejeitar e reabrir é da chefia (admin, onde estão as governantas)', () => {
    Object.values(UserRole).forEach(role => expect(ROLE_PERMISSIONS[role]).toContain('task.startFinish'));
    ['room.markInspected', 'correction.request', 'room.markDirty'].forEach(permission => {
      expect(ROLE_PERMISSIONS[UserRole.ADMIN]).toContain(permission);
      expect(ROLE_PERMISSIONS[UserRole.HOUSEKEEPER]).not.toContain(permission);
      expect(ROLE_PERMISSIONS[UserRole.RECEPTION]).not.toContain(permission);
    });
  });

  it('o que ainda nenhum ecrã verifica fica só para a administração', () => {
    ['guest.view', 'messages.send', 'stats.teamTimes', 'stats.supervisors', 'rooms.viewAssigned', 'room.markClean'].forEach(permission => {
      expect(ROLE_PERMISSIONS[UserRole.ADMIN]).toContain(permission);
      [UserRole.HOUSEKEEPER, UserRole.RECEPTION].forEach(role => expect(ROLE_PERMISSIONS[role]).not.toContain(permission));
    });
  });
});
