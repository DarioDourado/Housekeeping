import { describe, expect, it } from 'vitest';
import { calculateTaskCredits } from '@/lib/credits';
import { Movement, RoomTypology, TaskKind } from '@/types/housekeeping.types';

const cleaning = (movement: Movement) => ({ kind: TaskKind.CLEANING, movement });

describe('calculateTaskCredits', () => {
  it('reproduz o exemplo da reunião: 9 estadias standard + 1 saída junior suite = 12', () => {
    const stayovers = 9 * calculateTaskCredits(cleaning(Movement.STAYOVER), RoomTypology.STANDARD);
    const departure = calculateTaskCredits(cleaning(Movement.DEPARTURE_ONLY), RoomTypology.JUNIOR_SUITE);
    expect(stayovers + departure).toBe(12);
  });

  it('saída com ou sem chegada vale o mesmo; refresh não depende da tipologia', () => {
    expect(calculateTaskCredits(cleaning(Movement.DEPARTURE_ARRIVAL), RoomTypology.SUITE))
      .toBe(calculateTaskCredits(cleaning(Movement.DEPARTURE_ONLY), RoomTypology.SUITE));
    expect(calculateTaskCredits({ kind: TaskKind.REFRESH, movement: Movement.VACANT }, RoomTypology.VILLA))
      .toBe(calculateTaskCredits({ kind: TaskKind.REFRESH, movement: Movement.VACANT }, RoomTypology.STANDARD));
  });

  it('o turndown ainda não tem créditos (regra por definir)', () => {
    expect(calculateTaskCredits({ kind: TaskKind.TURNDOWN, movement: Movement.STAYOVER }, RoomTypology.SUITE)).toBe(0);
  });
});
