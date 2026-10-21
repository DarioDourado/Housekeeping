import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const sources = {
  ...import.meta.glob<string>('../UI/**/*.tsx', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob<string>('../pages/**/*.tsx', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob<string>('../routes/**/*.tsx', { query: '?raw', import: 'default', eager: true })
};

// - Theme.txt: "nunca inventes cores". Só famílias com escala definida em src/index.css.
const ALLOWED = ['blue', 'slate', 'emerald', 'green', 'red', 'rose', 'amber', 'orange', 'purple', 'indigo', 'sky', 'cyan', 'stone', 'white', 'black', 'primary', 'canvas', 'surface', 'content', 'muted', 'line', 'success', 'danger', 'warning', 'transparent', 'current', 'inherit'];
const UTILITY = /\b(?:bg|text|border|ring|from|to|via|divide|fill|stroke|outline|decoration|accent|caret|placeholder|shadow)-([a-z]+)(?:-\d{2,3})?(?:\/\d+)?\b/g;
const COLOR_FAMILIES = /^(red|rose|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|slate|gray|zinc|neutral|stone)$/;

const css = readFileSync('src/index.css', 'utf-8');

describe('tema', () => {
  it('nenhum componente usa famílias de cor sem escala no tema', () => {
    const offenders = new Set<string>();
    for (const [file, source] of Object.entries(sources)) {
      for (const match of source.matchAll(UTILITY)) {
        const family = match[1] ?? '';
        if (COLOR_FAMILIES.test(family) && !ALLOWED.includes(family)) offenders.add(`${file.split('/').pop()}: ${match[0]}`);
      }
    }
    expect([...offenders]).toEqual([]);
  });

  it('nenhum componente usa cores cruas (#hex, rgb())', () => {
    const offenders = Object.entries(sources).flatMap(([file, source]) =>
      [...source.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![\w-])|\brgba?\(/g)].map(match => `${file.split('/').pop()}: ${match[0]}`)
    );
    expect(offenders).toEqual([]);
  });

  it('cada família permitida tem escala completa no CSS do tema', () => {
    const families = ['blue', 'slate', 'emerald', 'red', 'amber', 'purple', 'indigo', 'green', 'rose', 'orange', 'sky', 'cyan', 'stone'];
    for (const family of families) {
      for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
        expect(css.includes(`--color-${family}-${step}:`), `${family}-${step}`).toBe(true);
      }
    }
  });
});
