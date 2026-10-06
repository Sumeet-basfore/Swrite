import { DiscoveredFile } from '../types/ipc';
import { TreeNode } from './types';

/**
 * Natural comparator for strings containing numbers: "Chapter 2" < "Chapter 10"
 */
export function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Builds a single canonical project filesystem tree supporting arbitrary nesting.
 * Automatically provisions synthetic parent directory nodes if missing from raw scan.
 */
export function buildProjectTree(files: DiscoveredFile[]): TreeNode[] {
  const rootNodes: TreeNode[] = [];
  const nodeMap = new Map<string, TreeNode>();

  // Helper to ensure all intermediate directory nodes exist
  const ensureDirectoryNode = (dirPath: string): TreeNode => {
    let existing = nodeMap.get(dirPath);
    if (existing) return existing;

    const parts = dirPath.split('/');
    const dirName = parts[parts.length - 1];
    const newNode: TreeNode = {
      id: dirPath,
      name: dirName,
      relativePath: dirPath,
      isDirectory: true,
      format: 'txt',
      sizeBytes: 0,
      children: [],
      section: parts[0],
    };
    nodeMap.set(dirPath, newNode);

    if (parts.length === 1) {
      rootNodes.push(newNode);
    } else {
      const parentPath = parts.slice(0, -1).join('/');
      const parent = ensureDirectoryNode(parentPath);
      if (!parent.children.some((c) => c.relativePath === dirPath)) {
        parent.children.push(newNode);
      }
    }
    return newNode;
  };

  // 1. Create TreeNodes for all discovered files
  for (const file of files) {
    const parts = file.relative_path.split('/');
    const node: TreeNode = {
      id: file.relative_path,
      name: file.name,
      relativePath: file.relative_path,
      isDirectory: file.is_directory,
      format: file.format,
      sizeBytes: file.size_bytes,
      children: [],
      section: parts[0],
    };
    nodeMap.set(file.relative_path, node);
  }

  // 2. Link all nodes into the hierarchy
  for (const file of files) {
    const node = nodeMap.get(file.relative_path)!;
    const parts = file.relative_path.split('/');

    if (parts.length === 1) {
      if (!rootNodes.some((r) => r.relativePath === node.relativePath)) {
        rootNodes.push(node);
      }
    } else {
      const parentPath = parts.slice(0, -1).join('/');
      const parentNode = ensureDirectoryNode(parentPath);
      if (!parentNode.children.some((c) => c.relativePath === node.relativePath)) {
        parentNode.children.push(node);
      }
    }
  }

  // 3. Sort: Folders first, then natural alphanumeric filename order
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
 * Backwards-compatible helper for section-specific trees
 */
export function buildSectionTree(
  files: DiscoveredFile[],
  sectionName: string
): TreeNode[] {
  const allProjectNodes = buildProjectTree(files);
  const sectionNode = allProjectNodes.find(
    (n) => n.name === sectionName || n.relativePath === sectionName
  );
  if (sectionNode && sectionNode.isDirectory) {
    return sectionNode.children;
  }
  return allProjectNodes.filter((n) => n.relativePath.startsWith(sectionName));
}

/**
 * File role for tree icons. Format tells us *what* a file is;
 * role tells us what it *means* in a novel project — which is what
 * the eye actually scans for. Non-markdown formats keep format icons.
 */
export type NodeKind =
  | 'chapter'
  | 'character'
  | 'lore'
  | 'bible'
  | 'note'
  | 'document'
  | 'word'
  | 'image'
  | 'text';

export function getNodeKind(
  node: Pick<TreeNode, 'name' | 'relativePath' | 'format' | 'section'>
): NodeKind {
  if (node.format === 'binary') return 'image';
  if (node.format === 'docx') return 'word';
  if (node.format === 'txt') return 'text';

  const name = node.name.toLowerCase();
  const path = node.relativePath.toLowerCase();
  const section = (node.section || '').toLowerCase();
  const inPath = (re: RegExp) => re.test(path) || re.test(section);

  if (/^(master|readme)|bible|overview/.test(name)) return 'bible';
  if (/(^|[\s_.-])notes?([\s_.-]|$)/.test(name)) return 'note';
  if (inPath(/manuscript/) || /(chapter|scene|part|act|prologue|epilogue|interlude)/.test(name)) {
    return 'chapter';
  }
  if (inPath(/characters?/)) return 'character';
  if (inPath(/world|lore|magic|factions?|setting|timeline|locations?/)) return 'lore';
  return 'document';
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
