import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMoodboardState } from './useMoodboardState';
import { MoodboardToolbar } from './MoodboardToolbar';
import { MoodboardItemRenderer } from './MoodboardItemRenderer';
import { DiscoveredFile } from '../../types/ipc';
import { reportError } from '../../lib/errors';
import { Image as ImageIcon, Upload } from 'lucide-react';

export interface MoodboardCanvasProps {
  boardPath: string;
  projectAssets: DiscoveredFile[];
  onOpenDocument?: (relativePath: string) => void;
  onBackToDesk: () => void;
  onRefreshFiles?: () => Promise<void>;
}

export const MoodboardCanvas: React.FC<MoodboardCanvasProps> = ({
  boardPath,
  projectAssets,
  onOpenDocument,
  onBackToDesk,
  onRefreshFiles,
}) => {
  const {
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
  } = useMoodboardState(boardPath, onOpenDocument);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isDraggingItems, setIsDraggingItems] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeTarget, setResizeTarget] = useState<{
    id: string;
    startX: number;
    startY: number;
    initialW: number;
    initialH: number;
  } | null>(null);

  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [linkPickerOpen, setLinkPickerOpen] = useState(false);
  const [linkTargetInput, setLinkTargetInput] = useState('Desk/Characters/Lucan.md');

  // Keyboard Shortcuts (Delete, Duplicate Mod+D, Escape, Space pan)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when author is typing in an input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') {
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      } else if (isMod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelected();
      } else if (e.key === 'Escape') {
        clearSelection();
      } else if (e.key === '0' && isMod) {
        e.preventDefault();
        resetView();
      } else if (e.key === '+' || e.key === '=') {
        if (isMod) {
          e.preventDefault();
          setZoom((z) => z + 0.15);
        }
      } else if (e.key === '-' && isMod) {
        e.preventDefault();
        setZoom((z) => z - 0.15);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected, duplicateSelected, clearSelection, resetView, setZoom]);

  // Mouse wheel zoom & pan
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      setZoom((z) => z + delta);
    } else {
      // Regular pan
      if (!board) return;
      const zoom = board.canvas.zoom;
      setPan(board.canvas.pan_x - e.deltaX / zoom, board.canvas.pan_y - e.deltaY / zoom);
    }
  };

  // Canvas Mouse Down (Pan vs Selection)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // If middle click or space key held, start panning
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Left click on empty canvas background
    if (e.button === 0 && (e.target as HTMLElement).classList.contains('moodboard-viewport')) {
      clearSelection();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!board) return;
      const zoom = board.canvas.zoom;

      if (isPanning) {
        const dx = (e.clientX - panStart.x) / zoom;
        const dy = (e.clientY - panStart.y) / zoom;
        setPan(board.canvas.pan_x + dx, board.canvas.pan_y + dy);
        setPanStart({ x: e.clientX, y: e.clientY });
        return;
      }

      if (isDraggingItems) {
        const dx = (e.clientX - dragStartPos.x) / zoom;
        const dy = (e.clientY - dragStartPos.y) / zoom;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          moveItems(dx, dy);
          setDragStartPos({ x: e.clientX, y: e.clientY });
        }
        return;
      }

      if (isResizing && resizeTarget) {
        const dx = (e.clientX - resizeTarget.startX) / zoom;
        const dy = (e.clientY - resizeTarget.startY) / zoom;
        resizeItem(
          resizeTarget.id,
          resizeTarget.initialW + dx,
          resizeTarget.initialH + dy
        );
      }
    },
    [
      board,
      isPanning,
      panStart,
      isDraggingItems,
      dragStartPos,
      isResizing,
      resizeTarget,
      setPan,
      moveItems,
      resizeItem,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsDraggingItems(false);
    setIsResizing(false);
    setResizeTarget(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleResizeStart = (
    e: React.MouseEvent,
    id: string,
    initialW: number,
    initialH: number
  ) => {
    setIsResizing(true);
    setResizeTarget({
      id,
      startX: e.clientX,
      startY: e.clientY,
      initialW,
      initialH,
    });
  };

  const handleItemSelect = (id: string, multi: boolean) => {
    selectItem(id, multi);
    setIsDraggingItems(true);
    setDragStartPos({ x: window.event ? (window.event as MouseEvent).clientX : 0, y: window.event ? (window.event as MouseEvent).clientY : 0 });
  };

  if (isLoading || !board) {
    return (
      <div className="moodboard-loading-state">
        <div className="loading-spinner" />
        <span>Loading Moodboard Canvas...</span>
      </div>
    );
  }

  const { pan_x, pan_y, zoom } = board.canvas;

  return (
    <div className="swrite-moodboard-surface" ref={containerRef}>
      {/* Top Toolbar */}
      <MoodboardToolbar
        boardName={board.name}
        zoom={zoom}
        isSaving={isSaving}
        hasSelection={selectedItemIds.size > 0}
        onZoomIn={() => setZoom((z) => z + 0.15)}
        onZoomOut={() => setZoom((z) => z - 0.15)}
        onResetView={resetView}
        onAddText={() => addTextItem('Inspiring Thought', 'title')}
        onAddColor={() => addColorItem('#C7B79B', 'Palette Color')}
        onAddNote={() => addNoteItem('Concept Note', 'Notes & ideas for this scene...')}
        onAddLink={() => setLinkPickerOpen(true)}
        onAddImage={() => setImagePickerOpen(true)}
        onDuplicate={duplicateSelected}
        onDelete={deleteSelected}
        onBackToDesk={onBackToDesk}
      />

      {/* Main Interactive Canvas Area */}
      <div
        className={`moodboard-viewport ${isPanning ? 'panning' : ''}`}
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
      >
        <div
          className="moodboard-transform-container"
          style={{
            transform: `scale(${zoom}) translate3d(${pan_x}px, ${pan_y}px, 0)`,
            transformOrigin: '0 0',
          }}
        >
          {/* Canvas Items */}
          {board.items.map((item) => (
            <MoodboardItemRenderer
              key={item.id}
              item={item}
              isSelected={selectedItemIds.has(item.id)}
              onSelect={handleItemSelect}
              onUpdate={updateItem}
              onOpenDocument={onOpenDocument}
              onResizeStart={handleResizeStart}
            />
          ))}
        </div>
      </div>

      {/* Image Picker Modal */}
      {imagePickerOpen && (
        <div className="desk-modal-backdrop" onClick={() => setImagePickerOpen(false)}>
          <div className="desk-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Select Image Asset</h3>
              <button onClick={() => setImagePickerOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              {projectAssets.length === 0 ? (
                <div className="empty-assets-prompt">
                  <ImageIcon size={32} />
                  <p>No image assets discovered in <code>Assets/Images/</code>.</p>
                  <p>Use file import to add PNG, JPG, WebP, or SVG images.</p>
                </div>
              ) : (
                <div className="asset-selection-grid">
                  {projectAssets.map((asset) => (
                    <div
                      key={asset.relative_path}
                      className="asset-pick-card"
                      onClick={() => {
                        addImageItem(asset.relative_path, asset.name);
                        setImagePickerOpen(false);
                      }}
                    >
                      <ImageIcon size={24} />
                      <span className="asset-pick-name">{asset.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn-primary"
                onClick={async () => {
                  try {
                    // Prompt for image path
                    const path = window.prompt('Enter image file relative path: (e.g. Assets/Images/hero.png)');
                    if (path) {
                      addImageItem(path);
                      if (onRefreshFiles) await onRefreshFiles();
                      setImagePickerOpen(false);
                    }
                  } catch (e) {
                    reportError('moodboard-add-image', e, { notify: true });
                  }
                }}
              >
                <Upload size={14} /> Add by Path
              </button>
              <button className="btn-secondary" onClick={() => setImagePickerOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Link Picker Modal */}
      {linkPickerOpen && (
        <div className="desk-modal-backdrop" onClick={() => setLinkPickerOpen(false)}>
          <div className="desk-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Link Document to Moodboard</h3>
              <button onClick={() => setLinkPickerOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <label>Target Document Relative Path:</label>
              <input
                type="text"
                className="desk-input"
                value={linkTargetInput}
                onChange={(e) => setLinkTargetInput(e.target.value)}
                placeholder="e.g. Desk/Characters/Lucan.md or Manuscript/Chapter 01.md"
              />
            </div>
            <div className="modal-footer">
              <button
                className="btn-primary"
                onClick={() => {
                  if (linkTargetInput.trim()) {
                    const title = linkTargetInput.split('/').pop()?.replace('.md', '') || 'Linked Doc';
                    addLinkItem(linkTargetInput.trim(), title);
                    setLinkPickerOpen(false);
                  }
                }}
              >
                Add Link
              </button>
              <button className="btn-secondary" onClick={() => setLinkPickerOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
