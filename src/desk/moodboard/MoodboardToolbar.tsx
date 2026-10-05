import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Type,
  Palette,
  StickyNote,
  Sparkles,
  Image as ImageIcon,
  Copy,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export interface MoodboardToolbarProps {
  boardName: string;
  zoom: number;
  isSaving: boolean;
  hasSelection: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onAddText: () => void;
  onAddColor: () => void;
  onAddNote: () => void;
  onAddLink: () => void;
  onAddImage: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBackToDesk: () => void;
}

export const MoodboardToolbar: React.FC<MoodboardToolbarProps> = ({
  boardName,
  zoom,
  isSaving,
  hasSelection,
  onZoomIn,
  onZoomOut,
  onResetView,
  onAddText,
  onAddColor,
  onAddNote,
  onAddLink,
  onAddImage,
  onDuplicate,
  onDelete,
  onBackToDesk,
}) => {
  return (
    <div className="moodboard-toolbar">
      <div className="toolbar-left">
        <button
          className="mb-tool-btn back-btn"
          onClick={onBackToDesk}
          title="Back to Creative Desk"
        >
          <ArrowLeft size={16} />
          <span>Desk</span>
        </button>

        <div className="mb-board-title">
          <span>{boardName}</span>
        </div>

        <div className="mb-save-status">
          {isSaving ? (
            <span className="status-saving">
              <RefreshCw size={12} className="spin" />
              <span>Saving...</span>
            </span>
          ) : (
            <span className="status-saved">
              <CheckCircle2 size={12} />
              <span>Saved</span>
            </span>
          )}
        </div>
      </div>

      <div className="toolbar-center">
        {/* Creation Tools */}
        <div className="mb-tool-group">
          <button
            className="mb-tool-btn"
            onClick={onAddText}
            title="Add Text Block"
          >
            <Type size={15} />
            <span>Text</span>
          </button>

          <button
            className="mb-tool-btn"
            onClick={onAddColor}
            title="Add Color Swatch"
          >
            <Palette size={15} />
            <span>Color</span>
          </button>

          <button
            className="mb-tool-btn"
            onClick={onAddNote}
            title="Add Scratch Note"
          >
            <StickyNote size={15} />
            <span>Note</span>
          </button>

          <button
            className="mb-tool-btn"
            onClick={onAddImage}
            title="Add Project Image"
          >
            <ImageIcon size={15} />
            <span>Image</span>
          </button>

          <button
            className="mb-tool-btn"
            onClick={onAddLink}
            title="Add Document Link"
          >
            <Sparkles size={15} />
            <span>Link</span>
          </button>
        </div>

        {/* Selection Tools */}
        {hasSelection && (
          <div className="mb-tool-group selection-tools">
            <button
              className="mb-tool-btn"
              onClick={onDuplicate}
              title="Duplicate Selected (Ctrl+D)"
            >
              <Copy size={15} />
            </button>
            <button
              className="mb-tool-btn danger"
              onClick={onDelete}
              title="Delete Selected (Delete / Backspace)"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      <div className="toolbar-right">
        {/* Zoom Controls */}
        <div className="mb-tool-group zoom-group">
          <button
            className="mb-tool-btn icon-only"
            onClick={onZoomOut}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <span className="zoom-label" onClick={onResetView} title="Click to Reset 100%">
            {Math.round(zoom * 100)}%
          </span>
          <button
            className="mb-tool-btn icon-only"
            onClick={onZoomIn}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            className="mb-tool-btn icon-only"
            onClick={onResetView}
            title="Reset Pan & Zoom"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
