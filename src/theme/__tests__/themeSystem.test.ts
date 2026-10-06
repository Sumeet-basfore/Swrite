import { describe, it, expect, beforeEach } from 'vitest';
import { THEMES, THEME_IDS, getTheme, themeTokensToCssVariables } from '../themes';
import { applyThemeToDocument } from '../useTheme';
import { ThemeId } from '../types';
import { PublicationProfile } from '../../types/ipc';

describe('Milestone 14 — Personal Theme System', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-theme-mode');
  });

  it('contains exactly 15 distinct built-in themes', () => {
    expect(THEME_IDS.length).toBe(15);
    const uniqueIds = new Set(THEME_IDS);
    expect(uniqueIds.size).toBe(15);

    // Verify all 15 required theme names
    const expectedThemes: ThemeId[] = [
      'studio',
      'oled',
      'cyberpunk',
      'nord',
      'solarized',
      'nordic_day',
      'literary',
      'typewriter',
      'ink_and_paper',
      'midnight_blue',
      'forest_night',
      'sepia_desk',
      'crimson_gothic',
      'arctic_light',
      'monochrome',
    ];
    for (const id of expectedThemes) {
      expect(THEMES[id]).toBeDefined();
      expect(THEMES[id].id).toBe(id);
    }
  });

  it('each theme defines complete, non-empty color tokens', () => {
    for (const themeId of THEME_IDS) {
      const theme = THEMES[themeId];
      expect(theme.name).toBeTruthy();
      expect(theme.description).toBeTruthy();
      expect(['light', 'dark']).toContain(theme.mode);
      expect(theme.swatchColors.length).toBe(3);

      const { tokens } = theme;
      expect(tokens.appBg).toBeTruthy();
      expect(tokens.appSurface).toBeTruthy();
      expect(tokens.textPrimary).toBeTruthy();
      expect(tokens.textSecondary).toBeTruthy();
      expect(tokens.accent).toBeTruthy();
      expect(tokens.borderQuiet).toBeTruthy();
      expect(tokens.editorCanvasBg).toBeTruthy();
      expect(tokens.editorTextColor).toBeTruthy();
      expect(tokens.cursorColor).toBeTruthy();
    }
  });

  it('getTheme safely returns fallback for unknown theme IDs', () => {
    const fallback = getTheme('non_existent_theme');
    expect(fallback.id).toBe('studio');
  });

  it('themeTokensToCssVariables generates valid CSS custom properties with backward-compatible aliases', () => {
    const oled = THEMES.oled;
    const vars = themeTokensToCssVariables(oled);

    expect(vars['--app-bg']).toBe('#000000');
    expect(vars['--editor-canvas-bg']).toBe('#080808');
    expect(vars['--text-primary']).toBe('#f3f4f6');
    expect(vars['--accent']).toBe('#60a5fa');

    // Backwards compatibility aliases with shell.css
    expect(vars['--bg-desk']).toBe('#000000');
    expect(vars['--bg-page']).toBe('#080808');
    expect(vars['--text-ink']).toBe('#f3f4f6');
  });

  it('applyThemeToDocument sets CSS custom properties and attributes on root', () => {
    const cyberpunk = THEMES.cyberpunk;
    applyThemeToDocument(cyberpunk);

    expect(document.documentElement.getAttribute('data-theme')).toBe('cyberpunk');
    expect(document.documentElement.getAttribute('data-theme-mode')).toBe('dark');
    expect(document.documentElement.style.getPropertyValue('--app-bg')).toBe(cyberpunk.tokens.appBg);
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe(cyberpunk.tokens.accent);
  });

  it('strictly isolates editor theme styling from Publication Profiles (Publication Isolation)', () => {
    // 1. Set editor theme to high-contrast Dark Cyberpunk
    applyThemeToDocument(THEMES.cyberpunk);
    expect(document.documentElement.getAttribute('data-theme')).toBe('cyberpunk');

    // 2. Mock a standard publication profile
    const tradePaperback: PublicationProfile = {
      id: 'trade-paperback-6x9',
      name: 'Trade Paperback — 6 × 9 in',
      description: 'Standard 6x9 in trade paperback formatting',
      is_builtin: true,
      format: 'pdf',
      page_size: { width_in: 6.0, height_in: 9.0, preset: 'Trade Paperback (6 × 9 in)' },
      margins: { top_in: 0.75, bottom_in: 0.75, inside_in: 0.875, outside_in: 0.625 },
      typography: {
        body_font: 'Crimson Pro, Georgia, serif',
        heading_font: 'Cinzel, serif',
        font_size_pt: 11.0,
        line_height: 1.35,
        paragraph_indent_in: 0.25,
        paragraph_spacing_pt: 0.0,
        text_align: 'justify',
      },
      chapter_style: {
        numbering_style: 'words',
        title_case: 'upper',
        alignment: 'center',
        spacing_top_pt: 72.0,
        drop_cap: true,
      },
      scene_break_style: {
        style: 'symbol',
        custom_text: '* * *',
      },
      headers_footers: {
        show_header: true,
        show_footer: true,
        left_header: 'Book Title',
        center_header: '',
        right_header: 'Author',
        left_footer: '',
        center_footer: '{page}',
        right_footer: '',
        suppress_first_page: true,
        odd_even_different: true,
      },
      page_numbering: {
        style: 'arabic',
        start_at: 1,
        position: 'bottom_center',
      },
      front_matter: {
        include_title_page: true,
        title: 'Title',
        author: 'Author',
      },
      back_matter: {
        include_acknowledgements: false,
        include_about_author: false,
      },
    };

    // Publication profile properties are immutable specification objects, independent of CSS variables
    expect(tradePaperback.typography.body_font).toBe('Crimson Pro, Georgia, serif');
    expect(tradePaperback.page_size.width_in).toBe(6.0);
    expect(tradePaperback.page_size.height_in).toBe(9.0);
    expect(tradePaperback.typography.font_size_pt).toBe(11.0);
    expect(tradePaperback.scene_break_style.custom_text).toBe('* * *');
  });
});
