import { DiscoveredFile, MoodboardData, MoodboardItem } from '../types/ipc';

export type DeskFilter =
  | 'all'
  | 'notes'
  | 'characters'
  | 'locations'
  | 'world'
  | 'research'
  | 'moodboards'
  | 'assets';

export type DeskViewMode = 'grid' | 'list';

export interface DeskItemEntry {
  file: DiscoveredFile;
  category: DeskFilter;
  title: string;
  preview?: string;
  thumbnailUrl?: string;
  backlinksCount?: number;
}

export interface MoodboardCanvasSelection {
  selectedItemIds: Set<string>;
  hoveredItemId: string | null;
}

export type { MoodboardData, MoodboardItem };
