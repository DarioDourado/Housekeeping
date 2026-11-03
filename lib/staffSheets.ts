import { SheetRole, type TaskSheet } from '@/types/housekeeping.types';

type SheetRef = Pick<TaskSheet, 'id' | 'planId' | 'assignments'>;

// - As sheets de um plano onde a pessoa está atribuída (dia e noite são distribuições independentes: nunca se misturam)
export const sheetsOfStaff = <S extends SheetRef>(sheets: S[], planId: string, staffId: string): S[] =>
  sheets.filter(sheet => sheet.planId === planId && sheet.assignments.some(a => a.staffId === staffId));

// - Pessoas repetidas: em mais do que uma sheet do mesmo plano → as sheets onde estão. Mesma regra para toda a app.
//   A regra não vale para responsáveis: quem é responsável de sheets (LEAD) ou de blocos (`exempt`) pode ter várias.
//   (Estar ou não de serviço é outra regra: isOnDuty.)
export const duplicatedStaff = <S extends SheetRef>(sheets: S[], planId: string, exempt: ReadonlySet<string> = new Set()): Map<string, S[]> => {
  const byStaff = new Map<string, S[]>();
  sheets.filter(sheet => sheet.planId === planId).forEach(sheet =>
    sheet.assignments
      .filter(a => a.role !== SheetRole.LEAD && !exempt.has(a.staffId))
      .forEach(a => byStaff.set(a.staffId, [...(byStaff.get(a.staffId) ?? []), sheet]))
  );
  return new Map([...byStaff].filter(([, list]) => list.length > 1));
};

// - Cada pessoa repetida tem a sua cor, igual em todas as sheets onde aparece (índice estável: ordem dos ids repetidos)
export const duplicateColorIndex = (duplicated: Map<string, unknown>, staffId: string): number =>
  [...duplicated.keys()].sort().indexOf(staffId);
