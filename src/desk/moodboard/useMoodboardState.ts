import { useState, useEffect, useCallback, useRef } from 'react';
import { SwriteIpc } from '../../lib/ipc';
import { MoodboardData, MoodboardItem } from '../types';

export function useMoodboardState(
  boardPath: string,
  onOpenDocument?: (relativePath: string) => void
) {
  const [board, setBoard] = useState<MoodboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestBoardRef = useRef<MoodboardData | null>(null);
  latestBoardRef.current = board;

  const selectedItemIdsRef = useRef<Set<string>>(new Set());

  // Load moodboard from disk
  const loadBoard = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await SwriteIpc.moodboardLoad(boardPath);
      latestBoardRef.current = data;
      setBoard(data);
    } catch (e) {
      console.error('Failed to load moodboard:', e);
    } finally {
      setIsLoading(false);
    }
  }, [boardPath]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  // Debounced auto-save
  const scheduleSave = useCallback((newBoard: MoodboardData) => {
    latestBoardRef.current = newBoard;
    setBoard(newBoard);
    setIsSaving(true);

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      try {
        await SwriteIpc.moodboardSave(boardPath, newBoard);
      } catch (err) {
        console.error('Failed to persist moodboard:', err);
      } finally {
        setIsSaving(false);
      }
    }, 400);
  }, [boardPath]);

  // Canvas Pan & Zoom
  const setPan = useCallback((panX: number, panY: number) => {
    if (!latestBoardRef.current) return;
    const updated: MoodboardData = {
      ...latestBoardRef.current,
      canvas: { ...latestBoardRef.current.canvas, pan_x: panX, pan_y: panY },
    };
    scheduleSave(updated);
  }, [scheduleSave]);

  const setZoom = useCallback((zoomFactor: number | ((prev: number) => number)) => {
    if (!latestBoardRef.current) return;
    const currentZoom = latestBoardRef.current.canvas.zoom;
    const newZoom = typeof zoomFactor === 'function' ? zoomFactor(currentZoom) : zoomFactor;
    const clamped = Math.min(3.0, Math.max(0.2, Math.round(newZoom * 100) / 100));

    const updated: MoodboardData = {
      ...latestBoardRef.current,
      canvas: { ...latestBoardRef.current.canvas, zoom: clamped },
    };
    scheduleSave(updated);
  }, [scheduleSave]);

  const resetView = useCallback(() => {
    if (!latestBoardRef.current) return;
    const updated: MoodboardData = {
      ...latestBoardRef.current,
      canvas: { pan_x: 0, pan_y: 0, zoom: 1.0 },
    };
    scheduleSave(updated);
  }, [scheduleSave]);

  // Selection
  const selectItem = useCallback((id: string, multi: boolean = false) => {
    let next: Set<string>;
    if (multi) {
      next = new Set(selectedItemIdsRef.current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
    } else {
      next = new Set([id]);
    }
    selectedItemIdsRef.current = next;
    setSelectedItemIds(next);
  }, []);

  const clearSelection = useCallback(() => {
    selectedItemIdsRef.current = new Set();
    setSelectedItemIds(new Set());
  }, []);

  // Item Transformations
  const moveItems = useCallback((dx: number, dy: number) => {
    const selected = selectedItemIdsRef.current;
    if (!latestBoardRef.current || selected.size === 0) return;
    const updatedItems = latestBoardRef.current.items.map((item) => {
      if (selected.has(item.id)) {
        return { ...item, x: Math.round(item.x + dx), y: Math.round(item.y + dy) };
      }
      return item;
    });

    scheduleSave({ ...latestBoardRef.current, items: updatedItems });
  }, [scheduleSave]);

  const resizeItem = useCallback((id: string, width: number, height: number) => {
    if (!latestBoardRef.current) return;
    const clampedW = Math.max(40, Math.round(width));
    const clampedH = Math.max(40, Math.round(height));

    const updatedItems = latestBoardRef.current.items.map((item) => {
      if (item.id === id) {
        return { ...item, width: clampedW, height: clampedH };
      }
      return item;
    });

    scheduleSave({ ...latestBoardRef.current, items: updatedItems });
  }, [scheduleSave]);

  const updateItem = useCallback((id: string, updates: Partial<MoodboardItem>) => {
    if (!latestBoardRef.current) return;
    const updatedItems = latestBoardRef.current.items.map((item) => {
      if (item.id === id) {
        return { ...item, ...updates } as MoodboardItem;
      }
      return item;
    });

    scheduleSave({ ...latestBoardRef.current, items: updatedItems });
  }, [scheduleSave]);

  // Item Creation
  const getNextZIndex = useCallback(() => {
    if (!latestBoardRef.current || latestBoardRef.current.items.length === 0) return 1;
    return Math.max(...latestBoardRef.current.items.map((i) => i.z_index)) + 1;
  }, []);

  const addTextItem = useCallback((text = 'Inspiring Note', style: 'title' | 'body' | 'label' = 'body') => {
    if (!latestBoardRef.current) return;
    const id = `txt-${crypto.randomUUID().slice(0, 8)}`;
    const newItem: MoodboardItem = {
      type: 'text',
      id,
      x: 150 - latestBoardRef.current.canvas.pan_x,
      y: 150 - latestBoardRef.current.canvas.pan_y,
      width: style === 'title' ? 260 : 200,
      height: style === 'title' ? 60 : 100,
      text,
      style,
      z_index: getNextZIndex(),
    };

    scheduleSave({
      ...latestBoardRef.current,
      items: [...latestBoardRef.current.items, newItem],
    });
    setSelectedItemIds(new Set([id]));
  }, [getNextZIndex, scheduleSave]);

  const addColorItem = useCallback((hex = '#C7B79B', label = 'Sandstone') => {
    if (!latestBoardRef.current) return;
    const id = `col-${crypto.randomUUID().slice(0, 8)}`;
    const newItem: MoodboardItem = {
      type: 'color',
      id,
      x: 200 - latestBoardRef.current.canvas.pan_x,
      y: 200 - latestBoardRef.current.canvas.pan_y,
      width: 100,
      height: 100,
      hex,
      label,
      z_index: getNextZIndex(),
    };

    scheduleSave({
      ...latestBoardRef.current,
      items: [...latestBoardRef.current.items, newItem],
    });
    setSelectedItemIds(new Set([id]));
  }, [getNextZIndex, scheduleSave]);

  const addImageItem = useCallback((assetPath: string, caption?: string) => {
    if (!latestBoardRef.current) return;
    const id = `img-${crypto.randomUUID().slice(0, 8)}`;
    const newItem: MoodboardItem = {
      type: 'image',
      id,
      x: 220 - latestBoardRef.current.canvas.pan_x,
      y: 180 - latestBoardRef.current.canvas.pan_y,
      width: 280,
      height: 200,
      asset_path: assetPath,
      caption: caption || null,
      z_index: getNextZIndex(),
    };

    scheduleSave({
      ...latestBoardRef.current,
      items: [...latestBoardRef.current.items, newItem],
    });
    setSelectedItemIds(new Set([id]));
  }, [getNextZIndex, scheduleSave]);

  const addNoteItem = useCallback((title = 'Concept Note', content = 'Key thoughts...') => {
    if (!latestBoardRef.current) return;
    const id = `note-${crypto.randomUUID().slice(0, 8)}`;
    const newItem: MoodboardItem = {
      type: 'note',
      id,
      x: 250 - latestBoardRef.current.canvas.pan_x,
      y: 220 - latestBoardRef.current.canvas.pan_y,
      width: 220,
      height: 160,
      title,
      content,
      z_index: getNextZIndex(),
    };

    scheduleSave({
      ...latestBoardRef.current,
      items: [...latestBoardRef.current.items, newItem],
    });
    setSelectedItemIds(new Set([id]));
  }, [getNextZIndex, scheduleSave]);

  const addLinkItem = useCallback((targetPath: string, title = 'Linked Document') => {
    if (!latestBoardRef.current) return;
    const id = `link-${crypto.randomUUID().slice(0, 8)}`;
    const newItem: MoodboardItem = {
      type: 'link',
      id,
      x: 260 - latestBoardRef.current.canvas.pan_x,
      y: 240 - latestBoardRef.current.canvas.pan_y,
      width: 200,
      height: 80,
      title,
      target_path: targetPath,
      z_index: getNextZIndex(),
    };

    scheduleSave({
      ...latestBoardRef.current,
      items: [...latestBoardRef.current.items, newItem],
    });
    setSelectedItemIds(new Set([id]));
  }, [getNextZIndex, scheduleSave]);

  // Item Deletion & Duplication
  const deleteSelected = useCallback(() => {
    const selected = selectedItemIdsRef.current;
    if (!latestBoardRef.current || selected.size === 0) return;
    const updatedItems = latestBoardRef.current.items.filter(
      (i) => !selected.has(i.id)
    );
    scheduleSave({ ...latestBoardRef.current, items: updatedItems });
    setSelectedItemIds(new Set());
  }, [scheduleSave]);

  const duplicateSelected = useCallback(() => {
    const selected = selectedItemIdsRef.current;
    if (!latestBoardRef.current || selected.size === 0) return;
    const newItems: MoodboardItem[] = [];
    const newSelectedIds = new Set<string>();

    let currentZ = getNextZIndex();
    for (const item of latestBoardRef.current.items) {
      if (selected.has(item.id)) {
        const dupId = `${item.type}-${crypto.randomUUID().slice(0, 8)}`;
        const duplicated = {
          ...item,
          id: dupId,
          x: item.x + 24,
          y: item.y + 24,
          z_index: currentZ++,
        } as MoodboardItem;
        newItems.push(duplicated);
        newSelectedIds.add(dupId);
      }
    }

    scheduleSave({
      ...latestBoardRef.current,
      items: [...latestBoardRef.current.items, ...newItems],
    });
    setSelectedItemIds(newSelectedIds);
  }, [getNextZIndex, scheduleSave]);

  return {
    board,
    isLoading,
    isSaving,
    selectedItemIds,
    setPan,
    setZoom,
    resetView,
    selectItem,
    clearSelection,
    moveItems,
    resizeItem,
    updateItem,
    addTextItem,
    addColorItem,
    addImageItem,
    addNoteItem,
    addLinkItem,
    deleteSelected,
    duplicateSelected,
    openDocument: onOpenDocument,
  };
}
