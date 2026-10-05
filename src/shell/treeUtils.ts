import { DiscoveredFile } from '../types/ipc';
import { TreeNode } from './types';

/**
 * Natural comparator for strings containing numbers: "Chapter 2" < "Chapter 10"
 */
export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Builds a hierarchical tree node structure from flat discovered files for a section
 */
export function buildSectionTree(
  files: DiscoveredFile[],
  sectionName: 'Manuscript' | 'Planning' | 'Desk' | 'Assets' | 'Other'
): TreeNode[] {
  const rootNodes: TreeNode[] = [];
  const nodeMap = new Map<string, TreeNode>();

  // Filter files that belong to this section
  const sectionFiles = files.filter((f) => {
    if (sectionName === 'Other') {
      return (
        !f.relative_path.startsWith('Manuscript') &&
        !f.relative_path.startsWith('Planning') &&
        !f.relative_path.startsWith('Desk') &&
        !f.relative_path.startsWith('Assets')
      );
    }
    return f.relative_path.startsWith(sectionName);
  });

  // First pass: create TreeNode for each item
  for (const file of sectionFiles) {
    const node: TreeNode = {
      id: file.relative_path,
      name: file.name,
      relativePath: file.relative_path,
      isDirectory: file.is_directory,
      format: file.format,
      sizeBytes: file.size_bytes,
      children: [],
      section: sectionName,
    };
    nodeMap.set(file.relative_path, node);
  }

  // Second pass: link children to parent directories
  for (const file of sectionFiles) {
    const node = nodeMap.get(file.relative_path)!;
    const pathParts = file.relative_path.split('/');

    if (pathParts.length <= 2) {
      // Direct child of Section root (e.g. "Manuscript/Chapter 01.md")
      rootNodes.push(node);
    } else {
      // Nested child (e.g. "Manuscript/Act 1/Chapter 01.md")
      const parentPath = pathParts.slice(0, -1).join('/');
      const parentNode = nodeMap.get(parentPath);
      if (parentNode) {
        parentNode.children.push(node);
      } else {
        rootNodes.push(node);
      }
    }
  }

  // Sort: Folders first, then natural alphanumeric filename order
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return naturalCompare(a.name, b.name);
    });
    for (const n of nodes) {
      if (n.children.length > 0) {
        sortNodes(n.children);
      }
    }
  };

  sortNodes(rootNodes);
  return rootNodes;
}

/**
 * Format bytes to readable string (e.g., 2.4 KB, 14.2 MB)
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
