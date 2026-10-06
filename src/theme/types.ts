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
  | 'monochrome';

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

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  mode: ThemeMode;
  swatchColors: [string, string, string]; // [bg, surface, accent]
  tokens: ThemeTokens;
}
