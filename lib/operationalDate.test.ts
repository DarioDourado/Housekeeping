import { describe, expect, it } from 'vitest';
import { operationalDate } from '@/lib/operationalDate';

describe('operationalDate', () => {
  it('à 01h30 ainda é o dia operacional anterior (o Opera só fecha por volta das 02h)', () => {
    expect(operationalDate(new Date(2026, 9, 22, 1, 30))).toBe('2026-10-21');
  });

  it('a partir das 02h00 já é o dia novo', () => {
    expect(operationalDate(new Date(2026, 9, 22, 2, 0))).toBe('2026-10-22');
  });

  it('durante o dia e à noite mantém-se o mesmo dia (turndown até às 21h30)', () => {
    expect(operationalDate(new Date(2026, 9, 21, 15, 30))).toBe('2026-10-21');
    expect(operationalDate(new Date(2026, 9, 21, 23, 59))).toBe('2026-10-21');
  });

  it('vira o mês e o ano corretamente', () => {
    expect(operationalDate(new Date(2027, 0, 1, 0, 30))).toBe('2026-12-31');
  });
});
