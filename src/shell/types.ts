export interface TreeNode {
  id: string; // unique relative path
  name: string;
  relativePath: string;
  isDirectory: boolean;
  format: 'markdown' | 'txt' | 'docx' | 'binary';
  sizeBytes: number;
  children: TreeNode[];
  section?: string;
}

export interface DocumentTab {
  id: string; // DocumentId (or relativePath)
  relativePath: string;
  title: string;
  format: 'markdown' | 'txt' | 'docx' | 'binary';
  isDirty?: boolean;
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
