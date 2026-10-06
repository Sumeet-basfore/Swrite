import { useState, useEffect, useCallback } from 'react';
import { SwriteIpc } from '../../lib/ipc';
import { DiscoveredFile, ItemPlanningMeta } from '../../types/ipc';
import { OutlineItem, SceneWorkflowStatus } from '../types';
import { naturalCompare } from '../../shell/treeUtils';
import { reportError } from '../../lib/errors';

export function useOutlineState(
  manuscriptFiles: DiscoveredFile[],
  onOpenFile: (path: string) => void,
  onRefreshFiles: () => Promise<void>
) {
  const [metaMap, setMetaMap] = useState<Map<string, ItemPlanningMeta>>(new Map());
  const [selectedItemPath, setSelectedItemPath] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [layoutMode, setLayoutMode] = useState<'tree' | 'cards'>('tree');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Load Outline Metadata
  const loadMeta = useCallback(async () => {
    try {
      const data = await SwriteIpc.outlineMetaLoad();
      const map = new Map<string, ItemPlanningMeta>();
      for (const item of data.items) {
        map.set(item.relative_path, item);
      }
      setMetaMap(map);
    } catch {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  // Build hierarchical Outline items
  const buildOutlineItems = useCallback((): OutlineItem[] => {
    const items: OutlineItem[] = [];
    const itemMap = new Map<string, OutlineItem>();

    for (const file of manuscriptFiles) {
      const pathParts = file.relative_path.split('/');
      let level: 'act' | 'chapter' | 'scene' = 'chapter';

      if (file.is_directory) {
        if (file.name.toLowerCase().startsWith('act')) {
          level = 'act';
        } else {
          level = 'chapter';
        }
      } else {
        if (file.name.toLowerCase().startsWith('scene') || pathParts.length > 2) {
          level = 'scene';
        } else {
          level = 'chapter';
        }
      }

      const meta = metaMap.get(file.relative_path);

      const outlineItem: OutlineItem = {
        id: file.relative_path,
        name: meta?.title || file.name.replace(/\.(md|txt|docx)$/, ''),
        relativePath: file.relative_path,
        level,
        isDirectory: file.is_directory,
        children: [],
        meta,
      };

      itemMap.set(file.relative_path, outlineItem);
    }

    // Link parents to children
    for (const file of manuscriptFiles) {
      const item = itemMap.get(file.relative_path)!;
      const pathParts = file.relative_path.split('/');

      if (pathParts.length <= 2) {
        items.push(item);
      } else {
        const parentPath = pathParts.slice(0, -1).join('/');
        const parent = itemMap.get(parentPath);
        if (parent) {
          parent.children.push(item);
        } else {
          items.push(item);
        }
      }
    }

    // Sort naturally: Acts, Chapters, Scenes
    const sortTree = (nodes: OutlineItem[]) => {
      nodes.sort((a, b) => naturalCompare(a.relativePath, b.relativePath));
      for (const n of nodes) {
        if (n.children.length > 0) {
          sortTree(n.children);
        }
      }
    };

    sortTree(items);
    return items;
  }, [manuscriptFiles, metaMap]);

  const outlineTree = buildOutlineItems();

  const toggleExpand = (path: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const updateItemMeta = async (
    relativePath: string,
    updates: Partial<ItemPlanningMeta>
  ) => {
    const existing = metaMap.get(relativePath) || { relative_path: relativePath };
    const updated: ItemPlanningMeta = { ...existing, ...updates };

    setMetaMap((prev) => {
      const next = new Map(prev);
      next.set(relativePath, updated);
      return next;
    });

    try {
      await SwriteIpc.outlineMetaUpdateItem(updated);
    } catch (e) {
      reportError('outline-save', e, { notify: true });
    }
  };

  const updateStatus = (relativePath: string, status: SceneWorkflowStatus) => {
    updateItemMeta(relativePath, { status });
  };

  const updateNotes = (relativePath: string, notes: string) => {
    updateItemMeta(relativePath, { notes });
  };

  const updateSummary = (relativePath: string, summary: string) => {
    updateItemMeta(relativePath, { summary });
  };

  const updateTitle = (relativePath: string, title: string) => {
    updateItemMeta(relativePath, { title });
  };

  const createChapter = async (): Promise<string> => {
    const count = manuscriptFiles.filter((f) => !f.is_directory).length + 1;
    const pad = count < 10 ? `0${count}` : `${count}`;
    const target = `Manuscript/Chapter ${pad}.md`;
    await SwriteIpc.fileCreate(target, `# Chapter ${count}\n\n`);
    await onRefreshFiles();
    setSelectedItemPath(target);
    return target;
  };

  const createScene = async (parentFolder: string): Promise<string> => {
    const target = `${parentFolder}/Scene 01.md`;
    let counter = 1;
    let finalPath = target;
    while (await SwriteIpc.fileExists(finalPath)) {
      counter++;
      const pad = counter < 10 ? `0${counter}` : `${counter}`;
      finalPath = `${parentFolder}/Scene ${pad}.md`;
    }

    await SwriteIpc.fileCreate(finalPath, `### Scene ${counter}\n\n`);
    await onRefreshFiles();
    setSelectedItemPath(finalPath);
    return finalPath;
  };

  return {
    outlineTree,
    selectedItemPath,
    setSelectedItemPath,
    expandedNodes,
    toggleExpand,
    layoutMode,
    setLayoutMode,
    searchQuery,
    setSearchQuery,
    metaMap,
    updateStatus,
    updateNotes,
    updateSummary,
    updateTitle,
    createChapter,
    createScene,
    openItem: onOpenFile,
  };
}
