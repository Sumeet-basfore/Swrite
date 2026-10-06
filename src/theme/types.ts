export type ThemeId =
  | 'studio'
  | 'oled'
  | 'cyberpunk'
  | 'nord'
  | 'solarized'
  | 'nordic_day'
  | 'literary'
  | 'typewriter'
  | 'ink_and_paper'
  | 'midnight_blue'
  | 'forest_night'
  | 'sepia_desk'
  | 'crimson_gothic'
  | 'arctic_light'
  | 'monochrome'
  | 'newsprint'
  | 'lavender_morning'
  | 'sage_field'
  | 'maritime_chart'
  | 'sandstone'
  | 'porcelain'
  | 'honeyed_manuscript'
  | 'ember_study'
  | 'abyssal_ink'
  | 'moss_fog'
  | 'oxblood_library'
  | 'midnight_garden'
  | 'graphite_mono'
  | 'lamplight';

export type ThemeMode = 'light' | 'dark';

export interface ThemeTokens {
  appBg: string;
  appSurface: string;
  appSurfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentFg: string;
  borderQuiet: string;
  divider: string;
  selectionBg: string;
  selectionFg: string;
  cursorColor: string;
  sidebarBg: string;
  editorCanvasBg: string;
  editorTextColor: string;
  linkColor: string;
  codeBg: string;
  blockquoteBorder: string;
  colorSuccess: string;
  colorWarning: string;
  colorError: string;
  focusRing: string;
  modalOverlay: string;
  statusBarBg: string;
  scrollbarThumb: string;
}

export type ThemeMoodGroup =
  | 'Studio Essentials'
  | 'Paper & Print'
  | 'Calm & Natural'
  | 'Night Writing'
  | 'Gothic & Moody'
  | 'Vivid & Playful';

export type ThemeParagraph = 'spacious' | 'compact' | 'indented';

export interface ThemeTypography {
  /** System-only font stacks (offline-safe, no downloads). */
  bodyStack: string;
  headingStack: string;
  baseSizePx: number;
  lineHeight: number;
  maxWidthPx: number;
  paragraph: ThemeParagraph;
  /** First-line indent (classic manuscript style). */
  indent: boolean;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  mode: ThemeMode;
  swatchColors: [string, string, string]; // [bg, surface, accent]
  tokens: ThemeTokens;
  /** Genre/mood group for the picker. Defaults to 'Studio Essentials'. */
  moodGroup?: ThemeMoodGroup;
  /**
   * Bundled editor typography. Optional for backward compatibility:
   * themes without it fall back to the user's current typography preset.
   */
  typography?: ThemeTypography;
}
