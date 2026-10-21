import { expect, it } from 'vitest';
import { escapeCsvCell } from '../27-data-table/references/escapeCsvCell';

it('quotes separators, embedded quotes and null values', () => {
  expect(escapeCsvCell('a;"b"')).toBe('"a;""b"""');
  expect(escapeCsvCell(null)).toBe('""');
});

it.each(['=1+1', '+SUM(A1)', '-1', '@SUM(A1)', '  =1', '\t=1', '\r=1', '\n=1'])(
  'neutralizes spreadsheet formula prefix in %j', (value) => {
    expect(escapeCsvCell(value).startsWith('"\'')).toBe(true);
  },
);
