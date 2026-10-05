export interface TreeNode {
  id: string; // unique relative path
  name: string;
  relativePath: string;
  isDirectory: boolean;
  format: 'markdown' | 'txt' | 'docx' | 'binary';
  sizeBytes: number;
  children: TreeNode[];
  section: 'Manuscript' | 'Planning' | 'Desk' | 'Assets' | 'Other';
}

export type SearchScope = 'All' | 'Manuscript' | 'Planning' | 'Desk' | 'Assets';

export interface ContextMenuState {
  open: boolean;
  x: number;
  y: number;
  targetNode: TreeNode | null;
  targetSection: string | null;
}

export interface DragItem {
  relativePath: string;
  isDirectory: boolean;
}
