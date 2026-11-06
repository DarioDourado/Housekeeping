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

  it('should not use text smaller than 10px', () => {
    const offenders = Object.entries(sources).filter(([, source]) => /text-\[[1-9]px\]/.test(source)).map(([file]) => file.split('/').pop());
    expect(offenders).toEqual([]);
  });

  describe('foco de teclado (WCAG 2.4.7 / 1.4.11)', () => {
    it('should use a solid action-colored outline for :focus-visible', () => {
      const rule = /:focus-visible \{([^}]*)\}/.exec(css)?.[1] ?? '';
      expect(rule).toMatch(/outline:\s*2px solid var\(--color-action-text\)/);
    });

    it('should not remove the focus outline in components', () => {
      const offenders = Object.entries(sources).filter(([, source]) => /focus:outline-none|focus:ring-primary\/20/.test(source)).map(([file]) => file.split('/').pop());
      expect(offenders).toEqual([]);
    });
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

  describe('contraste (WCAG 2.2 AA, .agents/23-accessibility)', () => {
    const channel = (hex: string, offset: number) => {
      const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
      return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    const luminance = (hex: string) => 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
    const ratio = (a: string, b: string) => {
      const [high = 0, low = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (high + 0.05) / (low + 0.05);
    };
    // - valor do token no tema; em dark, o bloco `.dark { ... }` (se o redefinir) prevalece sobre o @theme
    const darkBlock = /\n\.dark \{([^}]*)\}/.exec(css)?.[1] ?? '';
    const token = (name: string, dark = false) => {
      const pattern = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`);
      const hex = (dark ? pattern.exec(darkBlock)?.[1] : undefined) ?? pattern.exec(css.replace(darkBlock, ''))?.[1];
      if (!hex) throw new Error(`token --${name} em falta`);
      return hex;
    };
    const WHITE = '#FFFFFF';
    const CANVAS = '#F5F5F7';
    const DARK_SURFACE = '#1C1C1E';

    it('should keep action buttons readable with white text', () => {
      expect(ratio(WHITE, token('color-action'))).toBeGreaterThanOrEqual(4.5);
      expect(ratio(WHITE, token('color-action-hover'))).toBeGreaterThanOrEqual(4.5);
      expect(ratio(WHITE, token('color-blue-600'))).toBeGreaterThanOrEqual(4.5);
    });

    it('should keep action text readable in light and dark', () => {
      expect(ratio(token('action-text'), WHITE)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(token('action-text'), CANVAS)).toBeGreaterThanOrEqual(4.5);
      expect(ratio(token('action-text', true), DARK_SURFACE)).toBeGreaterThanOrEqual(4.5);
    });

    it('should keep secondary grey text readable in light and dark', () => {
      for (const name of ['color-slate-400', 'color-slate-500']) {
        expect(ratio(token(name), CANVAS), `${name} claro`).toBeGreaterThanOrEqual(4.5);
        expect(ratio(token(name, true), DARK_SURFACE), `${name} escuro`).toBeGreaterThanOrEqual(4.5);
      }
    });

    it('should keep status text readable on light surfaces', () => {
      for (const name of ['color-emerald-600', 'color-amber-600', 'color-red-600']) {
        expect(ratio(token(name), CANVAS), name).toBeGreaterThanOrEqual(4.5);
      }
    });
  });
});
