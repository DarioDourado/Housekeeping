import { describe, expect, it } from 'vitest';
import { duplicateColorIndex, duplicatedStaff, sheetsOfStaff } from '@/lib/staffSheets';
import { isOnDuty } from '@/lib/staffDuty';
import { SheetRole } from '@/types/housekeeping.types';

const sheet = (id: string, planId: string, ...staff: string[]) => ({ id, planId, assignments: staff.map(staffId => ({ staffId, role: SheetRole.MEMBER })) });
const sheets = [sheet('a', 'day', 'x', 'y'), sheet('b', 'day', 'x'), sheet('c', 'night', 'x')];

describe('staffSheets', () => {
  it('só conta sheets do mesmo plano', () => {
    expect(sheetsOfStaff(sheets, 'day', 'x').map(s => s.id)).toEqual(['a', 'b']);
    expect(sheetsOfStaff(sheets, 'night', 'x').map(s => s.id)).toEqual(['c']);
  });

  it('assinala quem está em mais do que uma sheet do plano', () => {
    const dup = duplicatedStaff(sheets, 'day');
    expect([...dup.keys()]).toEqual(['x']);
    expect(dup.get('x')?.map(s => s.id)).toEqual(['a', 'b']);
    expect(duplicatedStaff(sheets, 'night').size).toBe(0);
  });
});

describe('isOnDuty', () => {
  it('só false é fora de serviço', () => {
    expect(isOnDuty({})).toBe(true);
    expect(isOnDuty({ isOnDuty: true })).toBe(true);
    expect(isOnDuty({ isOnDuty: false })).toBe(false);
  });
});

describe('duplicateColorIndex', () => {
  it('dá um índice por pessoa repetida, igual em todas as sheets', () => {
    const dup = duplicatedStaff([sheet('a', 'day', 'x', 'y'), sheet('b', 'day', 'y', 'x')], 'day');
    expect(duplicateColorIndex(dup, 'x')).toBe(0);
    expect(duplicateColorIndex(dup, 'y')).toBe(1);
    expect(duplicateColorIndex(dup, 'z')).toBe(-1);
  });
});
