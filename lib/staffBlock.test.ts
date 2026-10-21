import { describe, expect, it } from 'vitest';
import { BLOCK } from '@/config/constants';
import { getDefaultBlock, getDisplayBlock, getStaffBlock } from '@/lib/staffBlock';

describe('getStaffBlock', () => {
  it('normaliza áreas de texto livre para o bloco', () => {
    expect(getStaffBlock({ assignedArea: 'Bloco C Piso 1' })).toBe(BLOCK.C);
    expect(getStaffBlock({ assignedArea: 'Oasis Parc' })).toBe(BLOCK.OASIS);
    expect(getStaffBlock({ assignedArea: 'Vilas' })).toBe(BLOCK.VILLAS);
  });

  it('sem área ou área desconhecida cai no pool de apoio, nunca falha', () => {
    expect(getStaffBlock({})).toBe(BLOCK.SUPPORT);
    expect(getStaffBlock({ assignedArea: '   ' })).toBe(BLOCK.SUPPORT);
    expect(getStaffBlock({ assignedArea: 'Rotativa' })).toBe(BLOCK.SUPPORT);
  });
});

describe('getDisplayBlock / getDefaultBlock', () => {
  it('uma área desconhecida mantém o texto original; blocos conhecidos normalizam', () => {
    expect(getDisplayBlock({ assignedArea: 'Spa Norte' })).toBe('Spa Norte');
    expect(getDisplayBlock({ assignedArea: 'Bloco A Piso 2' })).toBe(BLOCK.A);
    expect(getDisplayBlock({ assignedArea: 'Rotativa' })).toBe(BLOCK.SUPPORT);
  });

  it('sem área usa o bloco por defeito; o bloco por defeito explícito vence', () => {
    expect(getDisplayBlock({ defaultBlock: BLOCK.D })).toBe(BLOCK.D);
    expect(getDefaultBlock({ assignedArea: 'Bloco C', defaultBlock: BLOCK.B })).toBe(BLOCK.B);
    expect(getDefaultBlock({ assignedArea: 'Bloco C' })).toBe(BLOCK.C);
  });
});
