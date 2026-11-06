import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const sources = {
  ...import.meta.glob<string>('../UI/**/*.tsx', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob<string>('../pages/**/*.tsx', { query: '?raw', import: 'default', eager: true }),
  ...import.meta.glob<string>('../routes/**/*.tsx', { query: '?raw', import: 'default', eager: true })
};

// - Theme.txt: "nunca inventes cores". Só famílias com escala definida em src/index.css.
const ALLOWED = ['blue', 'slate', 'emerald', 'red', 'amber', 'purple', 'indigo', 'white', 'black', 'primary', 'canvas', 'surface', 'content', 'muted', 'line', 'success', 'danger', 'warning', 'transparent', 'current', 'inherit'];
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
    const families = ['blue', 'slate', 'emerald', 'red', 'amber', 'purple', 'indigo'];
    for (const family of families) {
      for (const step of [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) {
        expect(css.includes(`--color-${family}-${step}:`), `${family}-${step}`).toBe(true);
      }
    }
  });

  it('should not use text smaller than 10px', () => {
    const offenders = Object.entries(sources).filter(([, source]) => /text-\[[1-9]px\]/.test(source)).map(([file]) => file.split('/').pop());
    expect(offenders).toEqual([]);
  });

  describe('movimento reduzido (WCAG 2.3.3)', () => {
    const reduced = /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';

    it('should remove pulsing, sliding and scaling motion', () => {
      expect(reduced).toMatch(/\.animate-pulse/);
      expect(reduced).toMatch(/--tw-enter-translate-y:\s*0/);
      expect(reduced).toMatch(/scale:\s*none/);
    });

    it('should not kill every animation with a global near-zero duration', () => {
      expect(css).not.toMatch(/animation-duration:\s*0\.01ms/);
    });
  });

  // - Theme.txt é contrato do cliente: "usa estas cores exclusivamente, não inventes hexadecimais novos".
  //   Os tokens abaixo vêm de lá e não se alteram; escalas derivadas (500 = claro, 400 = escuro) têm de manter o valor do Theme.txt.
  describe('fidelidade ao Theme.txt', () => {
    // - valor claro (@theme / :root); o bloco `.dark { ... }` é verificado à parte pelos tokens que só existem lá
    const lightCss = css.replace(/\n\.dark \{[^}]*\}/, '');
    const value = (name: string) => new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})`).exec(lightCss)?.[1]?.toUpperCase();
    const THEME: Record<string, string> = {
      '--color-primary': '#00A9C5',
      '--color-primary-hover': '#00879E',
      '--canvas': '#F5F5F7',
      '--surface': '#FFFFFF',
      '--content': '#1D1D1F',
      '--success': '#34C759',
      '--danger': '#FF3B30',
      '--warning': '#FF9500',
      '--color-blue-600': '#00A9C5',
      '--color-blue-700': '#00879E',
      '--color-slate-500': '#86868B',
      '--color-slate-400': '#8E8E93',
      '--color-slate-600': '#636366',
      '--color-emerald-600': '#279543',
      '--color-amber-600': '#BF7000',
      '--color-emerald-500': '#34C759',
      '--color-emerald-400': '#30D158',
      '--color-red-500': '#FF3B30',
      '--color-red-400': '#FF453A',
      '--color-amber-500': '#FF9500',
      '--color-amber-400': '#FF9F0A'
    };

    it.each(Object.entries(THEME))('should keep %s at its Theme.txt value %s', (name, hex) => {
      expect(value(name)).toBe(hex);
    });

    it('should not invent action colors outside the brand', () => {
      expect(css).not.toMatch(/--(color-)?action/);
    });

    it('should keep the soft brand halo as keyboard focus (Theme.txt rule 5)', () => {
      expect(css).toMatch(/:focus-visible \{[^}]*rgb\(0 169 197 \/ 0\.2\)/);
    });
  });
});
