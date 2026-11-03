import type { TaskSheet } from '@/types/housekeeping.types';

type SheetRef = Pick<TaskSheet, 'id' | 'planId' | 'assignments'>;

// - As sheets de um plano onde a pessoa está atribuída (dia e noite são distribuições independentes: nunca se misturam)
export const sheetsOfStaff = <S extends SheetRef>(sheets: S[], planId: string, staffId: string): S[] =>
  sheets.filter(sheet => sheet.planId === planId && sheet.assignments.some(a => a.staffId === staffId));

// - Pessoas que estão em mais do que uma sheet do mesmo plano → as sheets onde estão. Mesma regra para toda a app.
export const duplicatedStaff = <S extends SheetRef>(sheets: S[], planId: string): Map<string, S[]> => {
  const byStaff = new Map<string, S[]>();
  sheets.filter(sheet => sheet.planId === planId).forEach(sheet =>
    sheet.assignments.forEach(a => byStaff.set(a.staffId, [...(byStaff.get(a.staffId) ?? []), sheet]))
  );
  return new Map([...byStaff].filter(([, list]) => list.length > 1));
};

// - Cada pessoa repetida tem a sua cor, igual em todas as sheets onde aparece (índice estável: ordem dos ids repetidos)
export const duplicateColorIndex = (duplicated: Map<string, unknown>, staffId: string): number =>
  [...duplicated.keys()].sort().indexOf(staffId);
