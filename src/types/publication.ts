export type ExportFormat = 'pdf' | 'epub' | 'docx' | 'markdown' | 'txt';

export type TrimSize = '6x9' | '5.5x8.5' | 'A5' | 'Letter' | 'A4';

export type ExportFontFamily = 'garamond' | 'times' | 'courier' | 'helvetica';

export type HeaderStyle = 'recto-verso' | 'centered-title' | 'minimal' | 'none';

export type FooterStyle = 'centered-page-num' | 'outer-page-num' | 'none';

export type ChapterStartPage = 'recto' | 'next-page';

export type ChapterHeaderStyle = 'centered-classic' | 'left-modern' | 'ornate-bordered' | 'minimal';

export type SceneBreakStyle = '* * *' | '✦ ✦ ✦' | '#' | '§ § §' | '— — —' | '• • •' | '❦' | '◇' | 'blank-line';

export interface FrontMatterConfig {
  includeTitlePage: boolean;
  includeCopyright: boolean;
  copyrightYear?: string;
  publisherName?: string;
  isbn?: string;
  includeDedication: boolean;
  dedicationText?: string;
  includeEpigraph: boolean;
  epigraphQuote?: string;
  epigraphSource?: string;
  includeTableOfContents: boolean;
}

export interface BackMatterConfig {
  includeAcknowledgments: boolean;
  acknowledgmentsText?: string;
  includeAboutAuthor: boolean;
  aboutAuthorBio?: string;
}

export interface PublicationOptions {
  presetId: string;
  customProfileName?: string;
  isCustom?: boolean;
  format: ExportFormat;
  trimSize: TrimSize;
  fontFamily: ExportFontFamily;
  fontSize: number; // pt (e.g. 10.5, 11, 12)
  lineHeight: number; // multiplier (e.g. 1.3, 1.4, 2.0)
  paragraphIndent: number; // mm (e.g. 5)
  margins: {
    top: number; // mm
    bottom: number; // mm
    inner: number; // mm (gutter)
    outer: number; // mm
  };
  headerStyle: HeaderStyle;
  footerStyle: FooterStyle;
  runningHeaderAuthor?: string;
  runningHeaderTitle?: string;
  chapterStartPage: ChapterStartPage;
  chapterHeaderStyle: ChapterHeaderStyle;
  dropCap: boolean;
  dropCapLines: number;
  sceneBreak: SceneBreakStyle;
  includeChapterSynopsis: boolean;
  frontMatter: FrontMatterConfig;
  backMatter: BackMatterConfig;
  selectedChapterIds?: string[];
}

export interface PublicationPreset {
  id: string;
  name: string;
  description: string;
  badge: string;
  isCustom?: boolean;
  options: Partial<PublicationOptions>;
}

export interface PreflightIssue {
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  impact?: string;
  suggestion?: string;
  chapterId?: string;
}

export interface PreflightReport {
  totalWordCount: number;
  chapterCount: number;
  estimatedPageCount: number;
  estimatedReadingTimeMinutes: number;
  issues: PreflightIssue[];
  readyForPrint: boolean;
  formatNotes?: string[];
}
