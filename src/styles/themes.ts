import { ThemeConfig, ThemeTokens, TypographyConfig, AppearancePreset } from '../types';

export function makeTheme(
  id: string,
  name: string,
  category: 'dark' | 'light' | 'experimental',
  isDark: boolean,
  tokens: ThemeTokens,
  highlightColors?: ThemeConfig['highlightColors']
): ThemeConfig {
  const defaultHighlights: ThemeConfig['highlightColors'] = isDark ? {
    critique: '#F87171',
    sensory: '#FBBF24',
    factcheck: '#60A5FA',
    favorite: '#34D399',
    todo: '#A78BFA',
  } : {
    critique: '#DC2626',
    sensory: '#D97706',
    factcheck: '#2563EB',
    favorite: '#059669',
    todo: '#7C3AED',
  };

  // Ensure all semantic editorial tokens have coherent defaults if not explicitly provided
  const completeTokens: ThemeTokens = {
    ...tokens,
    editorPage: tokens.editorPage || (isDark ? tokens.surface : tokens.surface),
    editorPageText: tokens.editorPageText || tokens.text,
    revisionAdded: tokens.revisionAdded || (isDark ? 'rgba(52, 211, 153, 0.18)' : 'rgba(5, 150, 105, 0.14)'),
    revisionRemoved: tokens.revisionRemoved || (isDark ? 'rgba(248, 113, 113, 0.18)' : 'rgba(220, 38, 38, 0.14)'),
    proofreadingInfo: tokens.proofreadingInfo || (isDark ? 'rgba(96, 165, 250, 0.18)' : 'rgba(37, 99, 235, 0.14)'),
    proofreadingWarning: tokens.proofreadingWarning || (isDark ? 'rgba(251, 191, 36, 0.18)' : 'rgba(217, 119, 6, 0.14)'),
    proofreadingError: tokens.proofreadingError || (isDark ? 'rgba(248, 113, 113, 0.18)' : 'rgba(220, 38, 38, 0.14)'),
  };

  return {
    id,
    name,
    category,
    isDark,
    colors: completeTokens,
    bg: completeTokens.background,
    pageBg: completeTokens.surface,
    pageBorder: completeTokens.border,
    text: completeTokens.text,
    muted: completeTokens.textMuted,
    accent: completeTokens.accent,
    highlightColors: highlightColors || defaultHighlights,
  };
}

// ==========================================
// 20 CURATED THEMES
// ==========================================

export const CURATED_THEMES: ThemeConfig[] = [
  // ─── 1. DARK / INK (8 Themes) ──────────────────────────
  makeTheme(
    'obsidian-dark',
    'Obsidian',
    'dark',
    true,
    {
      background: '#121214',
      surface: '#18181B',
      elevatedSurface: '#212126',
      text: '#E4E4E7',
      textMuted: '#8E8E93',
      textFaint: '#44444C',
      heading: '#F4F4F5',
      accent: '#9D86E9',
      accentMuted: '#38324D',
      border: '#27272A',
      borderStrong: '#3F3F46',
      selection: 'rgba(157, 134, 233, 0.28)',
      link: '#A78BFA',
      wikilink: '#C4B5FD',
      quote: '#D4D4D8',
      quoteBorder: '#4C4669',
      code: '#D8B4FE',
      codeBackground: '#221F2D',
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
    }
  ),

  makeTheme(
    'tokyo-midnight',
    'Tokyo Midnight',
    'dark',
    true,
    {
      background: '#13141C',
      surface: '#1A1B26',
      elevatedSurface: '#24283B',
      text: '#C0CAF5',
      textMuted: '#6B76A0',
      textFaint: '#3B4261',
      heading: '#E0AF68',
      accent: '#7AA2F7',
      accentMuted: '#223249',
      border: '#292E42',
      borderStrong: '#414868',
      selection: 'rgba(122, 162, 247, 0.25)',
      link: '#7DCFFF',
      wikilink: '#7AA2F7',
      quote: '#9AA5CE',
      quoteBorder: '#3D59A1',
      code: '#BB9AF7',
      codeBackground: '#1E2030',
      success: '#9ECE6A',
      warning: '#E0AF68',
      error: '#F7768E',
    }
  ),

  makeTheme(
    'pitch-black',
    'OLED',
    'dark',
    true,
    {
      background: '#000000',
      surface: '#0A0A0A',
      elevatedSurface: '#141414',
      text: '#D4D4D8',
      textMuted: '#71717A',
      textFaint: '#27272A',
      heading: '#FFFFFF',
      accent: '#E4E4E7',
      accentMuted: '#27272A',
      border: '#1E1E22',
      borderStrong: '#323238',
      selection: 'rgba(255, 255, 255, 0.22)',
      link: '#A1A1AA',
      wikilink: '#E4E4E7',
      quote: '#A1A1AA',
      quoteBorder: '#3F3F46',
      code: '#E4E4E7',
      codeBackground: '#121214',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    }
  ),

  makeTheme(
    'dracula-gothic',
    'Dracula',
    'dark',
    true,
    {
      background: '#16151E',
      surface: '#1E1C28',
      elevatedSurface: '#282536',
      text: '#F8F8F2',
      textMuted: '#8A82A5',
      textFaint: '#433E59',
      heading: '#FF79C6',
      accent: '#BD93F9',
      accentMuted: '#382D50',
      border: '#2E2B3E',
      borderStrong: '#44405C',
      selection: 'rgba(189, 147, 249, 0.28)',
      link: '#8BE9FD',
      wikilink: '#BD93F9',
      quote: '#D1CEE0',
      quoteBorder: '#6272A4',
      code: '#FFB86C',
      codeBackground: '#282436',
      success: '#50FA7B',
      warning: '#F1FA8C',
      error: '#FF5555',
    }
  ),

  makeTheme(
    'nordic-frost',
    'Nordic Night',
    'dark',
    true,
    {
      background: '#1B1E24',
      surface: '#22262F',
      elevatedSurface: '#2B313D',
      text: '#ECEFF4',
      textMuted: '#7B88A1',
      textFaint: '#3B4252',
      heading: '#88C0D0',
      accent: '#81A1C1',
      accentMuted: '#2D3B4C',
      border: '#2E3440',
      borderStrong: '#434C5E',
      selection: 'rgba(136, 192, 208, 0.24)',
      link: '#88C0D0',
      wikilink: '#8FBCBB',
      quote: '#D8DEE9',
      quoteBorder: '#4C566A',
      code: '#B48EAD',
      codeBackground: '#252B36',
      success: '#A3BE8C',
      warning: '#EBCB8B',
      error: '#BF616A',
    }
  ),

  makeTheme(
    'deep-ocean',
    'Deep Ocean',
    'dark',
    true,
    {
      background: '#0B1319',
      surface: '#101B24',
      elevatedSurface: '#172733',
      text: '#D2DFE8',
      textMuted: '#5F7A8D',
      textFaint: '#263B4A',
      heading: '#71C4D9',
      accent: '#4EA5BE',
      accentMuted: '#193946',
      border: '#1B2C3A',
      borderStrong: '#2A465B',
      selection: 'rgba(78, 165, 190, 0.25)',
      link: '#68B9D0',
      wikilink: '#88D2E4',
      quote: '#B4CAD8',
      quoteBorder: '#285168',
      code: '#77CFB8',
      codeBackground: '#13232E',
      success: '#4ADE80',
      warning: '#FBBF24',
      error: '#FB7185',
    }
  ),

  makeTheme(
    'forest-evergreen',
    'Forest Ink',
    'dark',
    true,
    {
      background: '#0F1512',
      surface: '#161F1A',
      elevatedSurface: '#1F2C25',
      text: '#DDE6E0',
      textMuted: '#688072',
      textFaint: '#2E3B33',
      heading: '#7CC79B',
      accent: '#52B788',
      accentMuted: '#1B3829',
      border: '#24342B',
      borderStrong: '#354D40',
      selection: 'rgba(82, 183, 136, 0.24)',
      link: '#74C69D',
      wikilink: '#95D5B2',
      quote: '#C1CFC6',
      quoteBorder: '#2D543F',
      code: '#A7D7C5',
      codeBackground: '#192620',
      success: '#52B788',
      warning: '#E9C46A',
      error: '#E76F51',
    }
  ),

  makeTheme(
    'crimson-archive',
    'Crimson Archive',
    'dark',
    true,
    {
      background: '#151012',
      surface: '#1D1418',
      elevatedSurface: '#291C22',
      text: '#EFE5E8',
      textMuted: '#8E6E77',
      textFaint: '#473239',
      heading: '#E57388',
      accent: '#C74A62',
      accentMuted: '#3D1C24',
      border: '#2C1D23',
      borderStrong: '#482D37',
      selection: 'rgba(199, 74, 98, 0.26)',
      link: '#E0627A',
      wikilink: '#F08AA0',
      quote: '#D5C4CA',
      quoteBorder: '#612A36',
      code: '#E8A598',
      codeBackground: '#26181E',
      success: '#4EBA86',
      warning: '#EBB44F',
      error: '#E05353',
    }
  ),

  // ─── 2. LIGHT / PAPER (7 Themes) ────────────────────────
  makeTheme(
    'warm-paper',
    'Warm Paper',
    'light',
    false,
    {
      background: '#F4F0E8',
      surface: '#FCFAF6',
      elevatedSurface: '#FFFFFF',
      text: '#2C2723',
      textMuted: '#7E7469',
      textFaint: '#C8BEB2',
      heading: '#423326',
      accent: '#8B5E3C',
      accentMuted: '#EDE4DA',
      border: '#E3DC CF',
      borderStrong: '#C5BAA9',
      selection: 'rgba(139, 94, 60, 0.18)',
      link: '#7C4A28',
      wikilink: '#A06236',
      quote: '#4E4237',
      quoteBorder: '#B89B7E',
      code: '#7A4325',
      codeBackground: '#EBE3D6',
      success: '#2E7D32',
      warning: '#C77700',
      error: '#C62828',
    }
  ),

  makeTheme(
    'ivory-book',
    'Ivory',
    'light',
    false,
    {
      background: '#F9F8F5',
      surface: '#FFFFFF',
      elevatedSurface: '#FFFFFF',
      text: '#1C1917',
      textMuted: '#78716C',
      textFaint: '#D6D3D1',
      heading: '#292524',
      accent: '#57534E',
      accentMuted: '#E7E5E4',
      border: '#E7E5E4',
      borderStrong: '#D6D3D1',
      selection: 'rgba(87, 83, 78, 0.15)',
      link: '#44403C',
      wikilink: '#78716C',
      quote: '#44403C',
      quoteBorder: '#A8A29E',
      code: '#292524',
      codeBackground: '#F5F5F4',
      success: '#15803D',
      warning: '#B45309',
      error: '#B91C1C',
    }
  ),

  makeTheme(
    'vintage-parchment',
    'Parchment',
    'light',
    false,
    {
      background: '#EAE1D2',
      surface: '#F5EFE4',
      elevatedSurface: '#FAF6ED',
      text: '#34291E',
      textMuted: '#7B6A58',
      textFaint: '#BFAF9E',
      heading: '#4A3420',
      accent: '#8A5D3B',
      accentMuted: '#DECDB8',
      border: '#D8C8B4',
      borderStrong: '#BAA58E',
      selection: 'rgba(138, 93, 59, 0.22)',
      link: '#794726',
      wikilink: '#945C33',
      quote: '#504133',
      quoteBorder: '#A6876A',
      code: '#6E3A1C',
      codeBackground: '#E4D5BF',
      success: '#2E7D32',
      warning: '#B86200',
      error: '#B71C1C',
    }
  ),

  makeTheme(
    'nordic-day',
    'Nordic Day',
    'light',
    false,
    {
      background: '#EDF1F5',
      surface: '#F8FAFC',
      elevatedSurface: '#FFFFFF',
      text: '#242933',
      textMuted: '#627282',
      textFaint: '#CBD5E1',
      heading: '#2E3440',
      accent: '#4C566A',
      accentMuted: '#E2E8F0',
      border: '#D8E2EC',
      borderStrong: '#B0C2D4',
      selection: 'rgba(76, 86, 106, 0.16)',
      link: '#3B4252',
      wikilink: '#4C566A',
      quote: '#3E4656',
      quoteBorder: '#8892B0',
      code: '#2E3440',
      codeBackground: '#E6ECF2',
      success: '#16A34A',
      warning: '#D97706',
      error: '#DC2626',
    }
  ),

  makeTheme(
    'editorial-white',
    'Editorial White',
    'light',
    false,
    {
      background: '#F0F0F2',
      surface: '#FAFAFA',
      elevatedSurface: '#FFFFFF',
      text: '#18181B',
      textMuted: '#71717A',
      textFaint: '#D4D4D8',
      heading: '#09090B',
      accent: '#27272A',
      accentMuted: '#E4E4E7',
      border: '#E4E4E7',
      borderStrong: '#A1A1AA',
      selection: 'rgba(24, 24, 27, 0.14)',
      link: '#27272A',
      wikilink: '#52525B',
      quote: '#3F3F46',
      quoteBorder: '#71717A',
      code: '#18181B',
      codeBackground: '#ECECEE',
      success: '#16A34A',
      warning: '#D97706',
      error: '#DC2626',
    }
  ),

  makeTheme(
    'classic-sepia',
    'Sepia',
    'light',
    false,
    {
      background: '#E8DEC8',
      surface: '#F3EAD8',
      elevatedSurface: '#FAF3E3',
      text: '#3D2F1D',
      textMuted: '#7D6A4E',
      textFaint: '#C0AF90',
      heading: '#4D361B',
      accent: '#7A5026',
      accentMuted: '#DDCFB4',
      border: '#D3C2A5',
      borderStrong: '#B09B7A',
      selection: 'rgba(122, 80, 38, 0.22)',
      link: '#6B4019',
      wikilink: '#855122',
      quote: '#54422D',
      quoteBorder: '#9E805B',
      code: '#5C3312',
      codeBackground: '#DFCFB1',
      success: '#2E7D32',
      warning: '#B86200',
      error: '#B71C1C',
    }
  ),

  makeTheme(
    'ash-paper',
    'Ash Paper',
    'light',
    false,
    {
      background: '#E4E5E7',
      surface: '#EEEFF1',
      elevatedSurface: '#F6F7F9',
      text: '#22252A',
      textMuted: '#686D76',
      textFaint: '#B6BAC1',
      heading: '#16181D',
      accent: '#474D58',
      accentMuted: '#D3D6DC',
      border: '#D0D4DA',
      borderStrong: '#A2A9B4',
      selection: 'rgba(71, 77, 88, 0.16)',
      link: '#353A44',
      wikilink: '#4D5462',
      quote: '#383D47',
      quoteBorder: '#838B99',
      code: '#1D2128',
      codeBackground: '#DCDEE3',
      success: '#15803D',
      warning: '#C26D00',
      error: '#C52222',
    }
  ),

  // ─── 3. EXPERIMENTAL (5 Themes) ────────────────────────
  makeTheme(
    'solarized-dark',
    'Solarized',
    'experimental',
    true,
    {
      background: '#002B36',
      surface: '#073642',
      elevatedSurface: '#0E4450',
      text: '#93A1A1',
      textMuted: '#586E75',
      textFaint: '#073642',
      heading: '#B58900',
      accent: '#268BD2',
      accentMuted: '#094B5C',
      border: '#0A4A58',
      borderStrong: '#146070',
      selection: 'rgba(38, 139, 210, 0.28)',
      link: '#2AA198',
      wikilink: '#6C71C4',
      quote: '#839496',
      quoteBorder: '#268BD2',
      code: '#859900',
      codeBackground: '#04242D',
      success: '#859900',
      warning: '#B58900',
      error: '#DC322F',
    }
  ),

  makeTheme(
    'terminal-amber',
    'Terminal',
    'experimental',
    true,
    {
      background: '#0C0A06',
      surface: '#15120B',
      elevatedSurface: '#1F1B12',
      text: '#E5C07B',
      textMuted: '#8A7347',
      textFaint: '#3D331F',
      heading: '#FFD175',
      accent: '#E5A038',
      accentMuted: '#33230C',
      border: '#292215',
      borderStrong: '#423722',
      selection: 'rgba(229, 160, 56, 0.25)',
      link: '#F2B95C',
      wikilink: '#FFCC66',
      quote: '#CCA65E',
      quoteBorder: '#6E5121',
      code: '#FFDF99',
      codeBackground: '#1C180E',
      success: '#98C379',
      warning: '#E5C07B',
      error: '#E06C75',
    }
  ),

  makeTheme(
    'copper-ink',
    'Copper & Ink',
    'experimental',
    true,
    {
      background: '#141210',
      surface: '#1C1916',
      elevatedSurface: '#26221E',
      text: '#EADFD5',
      textMuted: '#8A7B70',
      textFaint: '#423932',
      heading: '#E8985E',
      accent: '#D47E43',
      accentMuted: '#3D2517',
      border: '#2C2621',
      borderStrong: '#473D35',
      selection: 'rgba(212, 126, 67, 0.25)',
      link: '#E28B52',
      wikilink: '#E8A374',
      quote: '#D1C2B6',
      quoteBorder: '#6E4226',
      code: '#E8AB80',
      codeBackground: '#241F1A',
      success: '#5BA87E',
      warning: '#E8B65A',
      error: '#E05D52',
    }
  ),

  makeTheme(
    'midnight-paper',
    'Midnight Paper',
    'experimental',
    true,
    {
      background: '#111418',
      surface: '#181C22',
      elevatedSurface: '#222830',
      text: '#D6DEE8',
      textMuted: '#68778A',
      textFaint: '#303A47',
      heading: '#A8BED6',
      accent: '#628CB2',
      accentMuted: '#1E3144',
      border: '#232B36',
      borderStrong: '#3A4657',
      selection: 'rgba(98, 140, 178, 0.25)',
      link: '#79A6D2',
      wikilink: '#95BDE4',
      quote: '#B4C4D6',
      quoteBorder: '#385573',
      code: '#97C0E8',
      codeBackground: '#161B21',
      success: '#4ADE80',
      warning: '#FBBF24',
      error: '#F87171',
    }
  ),

  makeTheme(
    'library-green',
    'Library Green',
    'experimental',
    true,
    {
      background: '#0D1412',
      surface: '#131D1A',
      elevatedSurface: '#1C2925',
      text: '#D4E2DC',
      textMuted: '#647D74',
      textFaint: '#2B3D37',
      heading: '#85BFA9',
      accent: '#5E9E86',
      accentMuted: '#183329',
      border: '#1E302A',
      borderStrong: '#304A41',
      selection: 'rgba(94, 158, 134, 0.24)',
      link: '#72B59C',
      wikilink: '#91CCA8',
      quote: '#B4CCC2',
      quoteBorder: '#335E4E',
      code: '#A2D9C2',
      codeBackground: '#14211D',
      success: '#48BB78',
      warning: '#ECC94B',
      error: '#F56565',
    }
  )
];

// ==========================================
// CONTRAST & ACCESSIBILITY UTILITIES
// ==========================================

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return { r, g, b };
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

export function getRelativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map(val => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const fgRgb = hexToRgb(foregroundHex);
  const bgRgb = hexToRgb(backgroundHex);
  if (!fgRgb || !bgRgb) return 4.5; // fallback safe ratio

  const l1 = getRelativeLuminance(fgRgb);
  const l2 = getRelativeLuminance(bgRgb);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function validateThemeContrast(theme: ThemeConfig): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  const bg = theme.colors.background;
  const surface = theme.colors.surface;

  // Check Body Text against Background
  const textBgRatio = getContrastRatio(theme.colors.text, bg);
  if (textBgRatio < 4.5) {
    issues.push(`Body text contrast with background is ${textBgRatio.toFixed(2)}:1 (minimum 4.5:1 recommended)`);
  }

  // Check Heading Text against Background
  const headingBgRatio = getContrastRatio(theme.colors.heading, bg);
  if (headingBgRatio < 3.0) {
    issues.push(`Heading contrast with background is ${headingBgRatio.toFixed(2)}:1 (minimum 3.0:1 recommended)`);
  }

  // Check Muted Text against Surface
  const mutedSurfaceRatio = getContrastRatio(theme.colors.textMuted, surface);
  if (mutedSurfaceRatio < 2.5) {
    issues.push(`Muted text contrast with surface is low (${mutedSurfaceRatio.toFixed(2)}:1)`);
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

export function getReadableFallback(foregroundHex: string, backgroundHex: string, minRatio: number = 4.5): string {
  const ratio = getContrastRatio(foregroundHex, backgroundHex);
  if (ratio >= minRatio) return foregroundHex;

  const bgRgb = hexToRgb(backgroundHex);
  if (!bgRgb) return foregroundHex;

  const bgLum = getRelativeLuminance(bgRgb);
  // If background is dark, return light text; if background is light, return dark text
  return bgLum < 0.5 ? '#F4F4F5' : '#18181B';
}

// ==========================================
// CURATED FONT PALETTES
// ==========================================

export const MANUSCRIPT_FONTS = [
  { id: 'literata', name: 'Literata', value: '"Literata", serif', category: 'Modern Serif' },
  { id: 'source-serif', name: 'Source Serif', value: '"Source Serif 4", serif', category: 'Book Editorial' },
  { id: 'lora', name: 'Lora', value: '"Lora", serif', category: 'Contemporary' },
  { id: 'crimson-pro', name: 'Crimson Pro', value: '"Crimson Pro", serif', category: 'Literary Classic' },
  { id: 'eb-garamond', name: 'EB Garamond', value: '"EB Garamond", serif', category: 'Classic Renaissance' },
  { id: 'merriweather', name: 'Merriweather', value: '"Merriweather", serif', category: 'Screen Optimized' },
  { id: 'atkinson', name: 'Atkinson Hyperlegible', value: '"Atkinson Hyperlegible", sans-serif', category: 'High Legibility' },
];

export const UI_FONTS = [
  { id: 'inter', name: 'Inter', value: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif' },
  { id: 'ibm-plex-sans', name: 'IBM Plex Sans', value: '"IBM Plex Sans", -apple-system, sans-serif' },
  { id: 'source-sans', name: 'Source Sans 3', value: '"Source Sans 3", -apple-system, sans-serif' },
  { id: 'jakarta-sans', name: 'Plus Jakarta Sans', value: '"Plus Jakarta Sans", sans-serif' },
  { id: 'system-sans', name: 'System Sans', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
];

export const HEADING_FONTS = [
  { id: 'cormorant', name: 'Cormorant Garamond', value: '"Cormorant Garamond", Georgia, serif' },
  { id: 'crimson-heading', name: 'Crimson Pro', value: '"Crimson Pro", Georgia, serif' },
  { id: 'garamond-heading', name: 'EB Garamond', value: '"EB Garamond", Georgia, serif' },
  { id: 'source-serif-heading', name: 'Source Serif 4', value: '"Source Serif 4", Georgia, serif' },
  { id: 'playfair', name: 'Playfair Display', value: '"Playfair Display", Georgia, serif' },
  { id: 'cinzel', name: 'Cinzel', value: '"Cinzel", serif' },
  { id: 'match-manuscript', name: 'Match Manuscript', value: 'inherit' },
];

export const MONO_FONTS = [
  { id: 'jetbrains-mono', name: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
  { id: 'ibm-plex-mono', name: 'IBM Plex Mono', value: '"IBM Plex Mono", monospace' },
  { id: 'fira-code', name: 'Fira Code', value: '"Fira Code", monospace' },
  { id: 'system-mono', name: 'System Mono', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
];

// ==========================================
// DEFAULT TYPOGRAPHY
// ==========================================

export const DEFAULT_TYPOGRAPHY: TypographyConfig = {
  fontFamily: '"Source Serif 4", serif',
  manuscriptFont: '"Source Serif 4", serif',
  uiFont: '"Inter", sans-serif',
  headingFont: '"Cormorant Garamond", serif',
  monoFont: '"JetBrains Mono", monospace',
  fontSize: 18,
  lineHeight: 1.75,
  letterSpacing: 0,
  paragraphSpacing: 0,
  paragraphIndent: 1.5,
  pageWidth: 700,
  headingScale: 'classic',
  textAlign: 'justify',
  typewriterMode: false,
  dropCap: false,
  sceneOrnament: '* * *',
};

// ==========================================
// CURATED APPEARANCE PRESETS
// ==========================================

export const CURATED_PRESETS: AppearancePreset[] = [
  {
    id: 'midnight-novel',
    name: 'Midnight Novel',
    description: 'Tokyo Midnight palette, Literata prose, and Cormorant Garamond chapter headings for atmospheric night sessions.',
    themeId: 'tokyo-midnight',
    manuscriptFont: '"Literata", serif',
    uiFont: '"Inter", sans-serif',
    headingFont: '"Cormorant Garamond", Georgia, serif',
    monoFont: '"JetBrains Mono", monospace',
    fontSize: 18,
    lineHeight: 1.75,
    paragraphIndent: 1.5,
    pageWidth: 700,
    textAlign: 'justify',
    dropCap: false,
    sceneOrnament: '✦ ✦ ✦',
  },
  {
    id: 'old-library',
    name: 'Old Library',
    description: 'Warm cream book paper, Renaissance EB Garamond, and dramatic classic chapter titling.',
    themeId: 'warm-paper',
    manuscriptFont: '"EB Garamond", serif',
    uiFont: '"Source Sans 3", -apple-system, sans-serif',
    headingFont: '"Cormorant Garamond", Georgia, serif',
    monoFont: '"IBM Plex Mono", monospace',
    fontSize: 19,
    lineHeight: 1.8,
    paragraphIndent: 1.5,
    pageWidth: 680,
    textAlign: 'justify',
    dropCap: true,
    sceneOrnament: '✦ ✦ ✦',
  },
  {
    id: 'writers-desk',
    name: "Writer's Desk",
    description: 'Crisp Ivory folio, Source Serif modern editorial rhythm, and clean Inter navigation.',
    themeId: 'ivory-book',
    manuscriptFont: '"Source Serif 4", serif',
    uiFont: '"Inter", sans-serif',
    headingFont: '"Source Serif 4", Georgia, serif',
    monoFont: '"JetBrains Mono", monospace',
    fontSize: 18,
    lineHeight: 1.75,
    paragraphIndent: 1.25,
    pageWidth: 720,
    textAlign: 'justify',
    dropCap: false,
    sceneOrnament: '• • •',
  },
  {
    id: 'terminal-writer',
    name: 'Terminal Writer',
    description: 'OLED pitch black background paired with IBM Plex Mono for high-focus distraction-free drafting.',
    themeId: 'pitch-black',
    manuscriptFont: '"IBM Plex Mono", monospace',
    uiFont: '"Inter", sans-serif',
    headingFont: '"IBM Plex Mono", monospace',
    monoFont: '"IBM Plex Mono", monospace',
    fontSize: 16,
    lineHeight: 1.7,
    paragraphIndent: 0,
    pageWidth: 720,
    textAlign: 'left',
    dropCap: false,
    sceneOrnament: '# # #',
  },
  {
    id: 'nordic-contemplation',
    name: 'Nordic Contemplation',
    description: 'Pale frost slate, quiet Lora typography, and generous margins for contemplative drafting.',
    themeId: 'nordic-day',
    manuscriptFont: '"Lora", serif',
    uiFont: '"IBM Plex Sans", -apple-system, sans-serif',
    headingFont: '"Playfair Display", Georgia, serif',
    monoFont: '"IBM Plex Mono", monospace',
    fontSize: 18,
    lineHeight: 1.8,
    paragraphIndent: 1.25,
    pageWidth: 720,
    textAlign: 'justify',
    dropCap: false,
    sceneOrnament: '• • •',
  },
  {
    id: 'crimson-gothic',
    name: 'Crimson Gothic',
    description: 'Deep velvet wine hues, Crimson Pro serif, and Cinzel monumental chapter headings.',
    themeId: 'crimson-archive',
    manuscriptFont: '"Crimson Pro", serif',
    uiFont: '"Inter", sans-serif',
    headingFont: '"Cinzel", serif',
    monoFont: '"JetBrains Mono", monospace',
    fontSize: 18,
    lineHeight: 1.75,
    paragraphIndent: 1.5,
    pageWidth: 680,
    textAlign: 'justify',
    dropCap: true,
    sceneOrnament: '✦ ✦ ✦',
  },
  {
    id: 'copper-typist',
    name: 'Copper & Ink',
    description: 'Warm glowing amber-copper tones, robust Merriweather body, and Playfair Display headings.',
    themeId: 'copper-ink',
    manuscriptFont: '"Merriweather", serif',
    uiFont: '"Plus Jakarta Sans", sans-serif',
    headingFont: '"Playfair Display", Georgia, serif',
    monoFont: '"Fira Code", monospace',
    fontSize: 17,
    lineHeight: 1.8,
    paragraphIndent: 1.25,
    pageWidth: 700,
    textAlign: 'justify',
    dropCap: false,
    sceneOrnament: '* * *',
  },
];

// ==========================================
// DOCUMENT APPLICATION RUNTIME HELPER
// ==========================================

export function applyThemeToDocument(theme: ThemeConfig, typography?: TypographyConfig) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Semantic color tokens
  root.style.setProperty('--theme-bg', theme.colors.background);
  root.style.setProperty('--theme-surface', theme.colors.surface);
  root.style.setProperty('--theme-elevated', theme.colors.elevatedSurface);
  root.style.setProperty('--theme-text', theme.colors.text);
  root.style.setProperty('--theme-text-muted', theme.colors.textMuted);
  root.style.setProperty('--theme-text-faint', theme.colors.textFaint);
  root.style.setProperty('--theme-heading', theme.colors.heading);
  root.style.setProperty('--theme-accent', theme.colors.accent);
  root.style.setProperty('--theme-accent-muted', theme.colors.accentMuted);
  root.style.setProperty('--theme-border', theme.colors.border);
  root.style.setProperty('--theme-border-strong', theme.colors.borderStrong);
  root.style.setProperty('--theme-selection', theme.colors.selection);
  root.style.setProperty('--theme-link', theme.colors.link);
  root.style.setProperty('--theme-wikilink', theme.colors.wikilink);
  root.style.setProperty('--theme-quote', theme.colors.quote);
  root.style.setProperty('--theme-quote-border', theme.colors.quoteBorder);
  root.style.setProperty('--theme-code', theme.colors.code);
  root.style.setProperty('--theme-code-bg', theme.colors.codeBackground);
  root.style.setProperty('--theme-success', theme.colors.success);
  root.style.setProperty('--theme-warning', theme.colors.warning);
  root.style.setProperty('--theme-error', theme.colors.error);

  // Editorial & Markdown Semantic Tokens
  root.style.setProperty('--theme-editor-page', theme.colors.editorPage || theme.colors.surface);
  root.style.setProperty('--theme-editor-page-text', theme.colors.editorPageText || theme.colors.text);
  root.style.setProperty('--theme-revision-added', theme.colors.revisionAdded || 'rgba(52, 211, 153, 0.18)');
  root.style.setProperty('--theme-revision-removed', theme.colors.revisionRemoved || 'rgba(248, 113, 113, 0.18)');
  root.style.setProperty('--theme-proofreading-info', theme.colors.proofreadingInfo || 'rgba(96, 165, 250, 0.18)');
  root.style.setProperty('--theme-proofreading-warning', theme.colors.proofreadingWarning || 'rgba(251, 191, 36, 0.18)');
  root.style.setProperty('--theme-proofreading-error', theme.colors.proofreadingError || 'rgba(248, 113, 113, 0.18)');

  // Backward compatibility legacy variables
  root.style.setProperty('--accent-color', theme.colors.accent);
  root.style.setProperty('--muted-color', theme.colors.textMuted);
  root.style.setProperty('--panel-bg', theme.colors.surface);
  root.style.setProperty('--panel-border', theme.colors.border);

  // Typography tokens
  if (typography) {
    const manuscript = typography.manuscriptFont || typography.fontFamily || '"Source Serif 4", serif';
    const ui = typography.uiFont || '"Inter", sans-serif';
    const heading = typography.headingFont && typography.headingFont !== 'inherit' ? typography.headingFont : manuscript;
    const mono = typography.monoFont || '"JetBrains Mono", monospace';

    root.style.setProperty('--font-manuscript', manuscript);
    root.style.setProperty('--font-ui', ui);
    root.style.setProperty('--font-heading', heading);
    root.style.setProperty('--font-mono', mono);
    root.style.setProperty('--font-size-manuscript', `${typography.fontSize}px`);
    root.style.setProperty('--line-height-manuscript', `${typography.lineHeight}`);
    root.style.setProperty('--letter-spacing-manuscript', `${typography.letterSpacing || 0}em`);
    root.style.setProperty('--paragraph-spacing-manuscript', `${typography.paragraphSpacing || 0}em`);
    root.style.setProperty('--novel-indent', `${typography.paragraphIndent}em`);
    root.style.setProperty('--scene-ornament', `"${typography.sceneOrnament || '* * *'}"`);
  }
}

// ==========================================
// CUSTOM THEME / PRESET PERSISTENCE HELPERS
// ==========================================

const STORAGE_CUSTOM_THEMES_KEY = 'swrite_custom_themes_list';
const STORAGE_CUSTOM_PRESETS_KEY = 'swrite_custom_presets_list';

export function getCustomThemes(): ThemeConfig[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_THEMES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveCustomTheme(theme: ThemeConfig): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getCustomThemes().filter(t => t.id !== theme.id);
    localStorage.setItem(STORAGE_CUSTOM_THEMES_KEY, JSON.stringify([...existing, theme]));
  } catch (e) {}
}

export function deleteCustomTheme(themeId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getCustomThemes().filter(t => t.id !== themeId);
    localStorage.setItem(STORAGE_CUSTOM_THEMES_KEY, JSON.stringify(existing));
  } catch (e) {}
}

export function getCustomPresets(): AppearancePreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_PRESETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveCustomPreset(preset: AppearancePreset): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getCustomPresets().filter(p => p.id !== preset.id);
    localStorage.setItem(STORAGE_CUSTOM_PRESETS_KEY, JSON.stringify([...existing, { ...preset, isCustom: true }]));
  } catch (e) {}
}

export function deleteCustomPreset(presetId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getCustomPresets().filter(p => p.id !== presetId);
    localStorage.setItem(STORAGE_CUSTOM_PRESETS_KEY, JSON.stringify(existing));
  } catch (e) {}
}
