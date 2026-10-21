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
});
