import { describe, expect, it } from 'vitest';
import { hasPermission } from '@/lib/permissions';
import { UserRole } from '@/types/auth.types';

describe('hasPermission', () => {
  it('a chefia (governanta) inspeciona e reabre; empregada não inspeciona', () => {
    expect(hasPermission(UserRole.ADMIN, 'room.markInspected')).toBe(true);
    expect(hasPermission(UserRole.ADMIN, 'room.markDirty')).toBe(true);
    expect(hasPermission(UserRole.HOUSEKEEPER, 'room.markInspected')).toBe(false);
  });

  it('só o escritório distribui task sheets', () => {
    expect(hasPermission(UserRole.ADMIN, 'sheets.distribute')).toBe(true);
    expect(hasPermission(UserRole.HOUSEKEEPER, 'sheets.distribute')).toBe(false);
    expect(hasPermission(UserRole.RECEPTION, 'sheets.distribute')).toBe(false);
  });

  it('sem sessão ou com role desconhecida nunca tem permissão', () => {
    expect(hasPermission(undefined, 'messages.send')).toBe(false);
    expect(hasPermission('intruso' as UserRole, 'messages.send')).toBe(false);
  });
});
