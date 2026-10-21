import { BLOCK, type BlockName } from '@/config/constants';
import type { User } from '@/types/auth.types';

// - A área do utilizador é texto livre ("Bloco A Piso 1"); normaliza para um bloco conhecido
export const getStaffBlock = (user: Pick<User, 'assignedArea'>): BlockName => {
  const area = user.assignedArea?.trim();
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
export const getDisplayBlock = (user: Pick<User, 'assignedArea' | 'defaultBlock'>): string => {
  if (!user.assignedArea) return user.defaultBlock || BLOCK.SUPPORT;
  const known = getStaffBlock(user);
  if (known !== BLOCK.SUPPORT) return known;
  const area = user.assignedArea.trim();
  return area.includes('Apoio') || area.includes('Rotativa') ? BLOCK.SUPPORT : area;
};

export const getDefaultBlock = (user: Pick<User, 'assignedArea' | 'defaultBlock'>): string =>
  user.defaultBlock || getDisplayBlock(user);
