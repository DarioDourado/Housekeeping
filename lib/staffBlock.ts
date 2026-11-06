import { isOnDuty } from '@/lib/staffDuty';
import { BLOCK, type BlockName } from '@/config/constants';
import type { User } from '@/types/auth.types';
import { PlanKind } from '@/types/housekeeping.types';

// - Os blocos são definidos por serviço: a manhã usa assignedArea/defaultBlock e o turndown nightArea/nightDefaultBlock.
type Placed = Pick<User, 'assignedArea' | 'defaultBlock' | 'nightArea' | 'nightDefaultBlock'>;

export const areaOf = (user: Placed, kind: PlanKind = PlanKind.DAY): string | undefined => (kind === PlanKind.NIGHT ? user.nightArea : user.assignedArea);
export const defaultOf = (user: Placed, kind: PlanKind = PlanKind.DAY): string | undefined => (kind === PlanKind.NIGHT ? user.nightDefaultBlock : user.defaultBlock);

// - Muda o bloco atual / por defeito de um serviço sem tocar no outro
export const withArea = <U extends Placed>(user: U, kind: PlanKind, area: string): U => ({ ...user, ...(kind === PlanKind.NIGHT ? { nightArea: area } : { assignedArea: area }) });
export const withDefault = <U extends Placed>(user: U, kind: PlanKind, block: string): U => ({ ...user, ...(kind === PlanKind.NIGHT ? { nightDefaultBlock: block } : { defaultBlock: block }) });

// - A área do utilizador é texto livre ("Bloco A Piso 1"); normaliza para um bloco conhecido
export const getStaffBlock = (user: Placed, kind: PlanKind = PlanKind.DAY): BlockName => {
  const area = areaOf(user, kind)?.trim();
  if (!area) return BLOCK.SUPPORT;
  if (area.includes(BLOCK.A)) return BLOCK.A;
  if (area.includes(BLOCK.B)) return BLOCK.B;
  if (area.includes(BLOCK.C)) return BLOCK.C;
  if (area.includes(BLOCK.D)) return BLOCK.D;
  if (area.includes('Oasis')) return BLOCK.OASIS;
  if (area.includes('Vilas') || area.includes('Villa')) return BLOCK.VILLAS;
  return BLOCK.SUPPORT;
};

// - Variante para listagens: uma área que não é um bloco conhecido mantém o texto original em vez de cair no pool de apoio
export const getDisplayBlock = (user: Placed, kind: PlanKind = PlanKind.DAY): string => {
  const current = areaOf(user, kind);
  if (!current) return defaultOf(user, kind) || BLOCK.SUPPORT;
  const known = getStaffBlock(user, kind);
  if (known !== BLOCK.SUPPORT) return known;
  const area = current.trim();
  return area.includes('Apoio') || area.includes('Rotativa') ? BLOCK.SUPPORT : area;
};

export const getDefaultBlock = (user: Placed, kind: PlanKind = PlanKind.DAY): string =>
  defaultOf(user, kind) || getDisplayBlock(user, kind);

// - Quem está num bloco. O pool de apoio são só as pessoas DE SERVIÇO que ainda não têm posição: fora de serviço não conta.
export const teamMembers = <U extends Placed & Pick<User, 'isOnDuty'>>(users: U[], block: string, kind: PlanKind = PlanKind.DAY): U[] =>
  users.filter(user => getStaffBlock(user, kind) === block && (block !== BLOCK.SUPPORT || isOnDuty(user)));
