import { describe, it, expect } from 'vitest';
import {
  TYPOGRAPHY_PRESETS,
  getPresetStyleVariables,
  TypographyPresetId,
} from '../canvas/typographyPresets';

describe('Typography Presets', () => {
  it('defines all five writer presets', () => {
    const expectedPresets: TypographyPresetId[] = ['literary', 'classic', 'modern', 'compact', 'typewriter'];
    expectedPresets.forEach((id) => {
      expect(TYPOGRAPHY_PRESETS[id]).toBeDefined();
      expect(TYPOGRAPHY_PRESETS[id].name).toBeTruthy();
      expect(TYPOGRAPHY_PRESETS[id].fontSize).toBeGreaterThan(10);
      expect(TYPOGRAPHY_PRESETS[id].lineHeight).toBeGreaterThan(1.0);
    });
  });

  it('generates valid CSS style variables for literary preset', () => {
    const vars = getPresetStyleVariables(TYPOGRAPHY_PRESETS.literary);
    expect(vars['--editor-font-size']).toBe('18px');
    expect(vars['--editor-line-height']).toBe('1.85');
    expect(vars['--editor-max-width']).toBe('720px');
    expect(vars['--editor-paragraph-margin']).toBe('1.5em');
    expect(vars['--editor-text-indent']).toBe('0');
  });

  it('generates indented paragraph style for classic manuscript preset', () => {
    const vars = getPresetStyleVariables(TYPOGRAPHY_PRESETS.classic);
    expect(vars['--editor-text-indent']).toBe('1.5em');
    expect(vars['--editor-font-size']).toBe('17px');
  });

  it('supports compact spacing preset', () => {
    const vars = getPresetStyleVariables(TYPOGRAPHY_PRESETS.compact);
    expect(vars['--editor-paragraph-margin']).toBe('0.85em');
    expect(vars['--editor-font-size']).toBe('15px');
  });
});
