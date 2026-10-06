import { describe, it, expect } from 'vitest';
import { THEMES, THEME_IDS, themeTypographyToVars } from '../themes';

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

export function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

describe('Theme contrast gate (WCAG AA)', () => {
  it('body text and editor text meet AA 4.5:1 on every theme', () => {
    const failures: string[] = [];
    for (const id of THEME_IDS) {
      const t = THEMES[id];
      const body = contrastRatio(t.tokens.textPrimary, t.tokens.appSurface);
      const editor = contrastRatio(t.tokens.editorTextColor, t.tokens.editorCanvasBg);
      const secondary = contrastRatio(t.tokens.textSecondary, t.tokens.appSurface);
      if (body < 4.5) failures.push(`${id}: textPrimary/appSurface=${body.toFixed(2)}`);
      if (editor < 4.5) failures.push(`${id}: editorText/editorCanvas=${editor.toFixed(2)}`);
      if (secondary < 4.5) failures.push(`${id}: textSecondary/appSurface=${secondary.toFixed(2)}`);
    }
    expect(failures).toEqual([]);
  });

  it('muted text stays legible (>= 3.0:1) on every theme', () => {
    const failures: string[] = [];
    for (const id of THEME_IDS) {
      const t = THEMES[id];
      const muted = contrastRatio(t.tokens.textMuted, t.tokens.appSurface);
      if (muted < 3.0) failures.push(`${id}: textMuted/appSurface=${muted.toFixed(2)}`);
    }
    expect(failures).toEqual([]);
  });

  it('every theme bundles offline-safe typography that maps to editor vars', () => {
    for (const id of THEME_IDS) {
      const t = THEMES[id];
      expect(t.typography, `${id} missing bundled typography`).toBeDefined();
      const vars = themeTypographyToVars(t.typography!);
      expect(vars['--editor-font-family']).toBeTruthy();
      expect(vars['--editor-font-size']).toMatch(/px$/);
      // No remote font URLs — system stacks only
      expect(vars['--editor-font-family']).not.toMatch(/https?:/);
    }
  });
});
