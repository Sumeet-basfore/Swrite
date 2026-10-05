// Swrite Editor Enhancements Types

export type SplitOrientation = 'vertical' | 'horizontal';
export type SplitEntityType = 'scene' | 'character' | 'location' | 'faction' | 'item' | 'research';

export interface SplitPaneState {
  isOpen: boolean;
  orientation: SplitOrientation;
  entityType: SplitEntityType;
  entityId: string | null;
  ratio: number; // 0.2 to 0.8 (default 0.5)
}

export interface AnnotationComment {
  id: string;
  author: string;
  text: string;
  createdAt: number;
}

export interface AnnotationThread {
  id: string;
  sceneId: string;
  highlightedText: string;
  comments: AnnotationComment[];
  isResolved: boolean;
  color?: string; // yellow, blue, green, magenta
  createdAt: number;
}

export interface FootnoteItem {
  id: string;
  sceneId: string;
  number: number;
  text: string;
  createdAt: number;
}

export type FocusDimmingMode = 'off' | 'sentence' | 'paragraph';
export type AmbientSoundType = 'none' | 'rain' | 'whitenoise' | 'cafesound';

export interface FocusModeConfig {
  isTypewriterScrolling: boolean;
  dimmingMode: FocusDimmingMode;
  ambientSound: AmbientSoundType;
  soundVolume: number; // 0.0 to 1.0
}

export type EditorViewMode = 'editor' | 'corkboard' | 'outliner';
