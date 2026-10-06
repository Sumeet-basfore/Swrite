export type TypographyPresetId = 'literary' | 'classic' | 'modern' | 'compact' | 'typewriter';

export interface TypographyPreset {
  id: TypographyPresetId;
  name: string;
  description: string;
  fontFamily: string;
  headingFamily: string;
  fontSize: number; // in px
  lineHeight: number;
  maxWidth: number; // in px
  paragraphSpacing: 'spacious' | 'compact' | 'indented';
  firstLineIndent: boolean;
}

export const TYPOGRAPHY_PRESETS: Record<TypographyPresetId, TypographyPreset> = {
  literary: {
    id: 'literary',
    name: 'Literary',
    description: 'Warm, elegant serif with generous line height for immersive novel drafting',
    fontFamily: '"Merriweather", "Charter", Georgia, "Times New Roman", serif',
    headingFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 18,
    lineHeight: 1.85,
    maxWidth: 720,
    paragraphSpacing: 'spacious',
    firstLineIndent: false,
  },
  classic: {
    id: 'classic',
    name: 'Classic Manuscript',
    description: 'Traditional publisher submission style with indented paragraphs',
    fontFamily: '"Charter", Georgia, "Times New Roman", serif',
    headingFamily: '"Charter", Georgia, "Times New Roman", serif',
    fontSize: 17,
    lineHeight: 1.75,
    maxWidth: 700,
    paragraphSpacing: 'indented',
    firstLineIndent: true,
  },
  modern: {
    id: 'modern',
    name: 'Modern Sans',
    description: 'Crisp, contemporary sans-serif with spacious paragraph breaks',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif',
    headingFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif',
    fontSize: 16,
    lineHeight: 1.7,
    maxWidth: 740,
    paragraphSpacing: 'spacious',
    firstLineIndent: false,
  },
  compact: {
    id: 'compact',
    name: 'Compact',
    description: 'Higher information density for fast editing and screen efficiency',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headingFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 15,
    lineHeight: 1.55,
    maxWidth: 800,
    paragraphSpacing: 'compact',
    firstLineIndent: false,
  },
  typewriter: {
    id: 'typewriter',
    name: 'Typewriter',
    description: 'Monospace, double-spaced aesthetic reminiscent of manual typewriters',
    fontFamily: 'ui-monospace, "Courier New", Courier, monospace',
    headingFamily: 'ui-monospace, "Courier New", Courier, monospace',
    fontSize: 16,
    lineHeight: 2.0,
    maxWidth: 680,
    paragraphSpacing: 'spacious',
    firstLineIndent: false,
  },
};

export function getPresetStyleVariables(preset: TypographyPreset): Record<string, string> {
  return {
    '--editor-font-family': preset.fontFamily,
    '--editor-heading-family': preset.headingFamily,
    '--editor-font-size': `${preset.fontSize}px`,
    '--editor-line-height': `${preset.lineHeight}`,
    '--editor-max-width': `${preset.maxWidth}px`,
    '--editor-paragraph-margin':
      preset.paragraphSpacing === 'spacious'
        ? '1.5em'
        : preset.paragraphSpacing === 'compact'
        ? '0.85em'
        : '0.4em',
    '--editor-text-indent': preset.firstLineIndent ? '1.5em' : '0',
  };
}
