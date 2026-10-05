export type EditorMode = 'rich' | 'source';

export type SaveStatus = 'clean' | 'dirty' | 'saving' | 'saved' | 'error' | 'conflict';

export interface EditorStats {
  wordCount: number;
  charCount: number;
  paragraphCount: number;
  readingTimeMinutes: number;
}

export interface FocusModeConfig {
  enabled: boolean;
  typewriterMode: boolean; // Keep active line centered
  dimInactiveParagraphs: boolean; // Focus on current paragraph
}

export interface CanvasConfig {
  fontFamily: 'serif' | 'sans' | 'mono';
  fontSize: number; // in px, e.g. 17
  lineHeight: number; // e.g. 1.7
  maxWidth: number; // in px, e.g. 740
  paragraphSpacing: 'spacious' | 'compact' | 'indented';
}

export interface CommentAnchor {
  anchorId: string;
  documentId: string;
  blockIndex: number;
  from: number;
  to: number;
  selectedText: string;
  contextBefore: string;
  contextAfter: string;
}

export interface EditorCallbacks {
  onChange?: (markdown: string, stats: EditorStats) => void;
  onSave?: (markdown: string) => Promise<void>;
  onFocusChange?: (focused: boolean) => void;
  onCommentAnchorCreate?: (anchor: CommentAnchor) => void;
}
