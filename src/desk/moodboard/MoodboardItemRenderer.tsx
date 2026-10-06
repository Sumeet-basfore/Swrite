import React, { useState, useEffect } from 'react';
import { MoodboardItem } from '../types';
import { SwriteIpc } from '../../lib/ipc';
import { ExternalLink, StickyNote, Image as ImageIcon, Sparkles } from 'lucide-react';

export interface MoodboardItemRendererProps {
  item: MoodboardItem;
  isSelected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onUpdate: (id: string, updates: Partial<MoodboardItem>) => void;
  onOpenDocument?: (relativePath: string) => void;
  onResizeStart: (e: React.MouseEvent, id: string, initialW: number, initialH: number) => void;
}

export const MoodboardItemRenderer: React.FC<MoodboardItemRendererProps> = ({
  item,
  isSelected,
  onSelect,
  onUpdate,
  onOpenDocument,
  onResizeStart,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    if (item.type === 'image') {
      let isMounted = true;
      SwriteIpc.assetReadBase64(item.asset_path)
        .then((dataUrl) => {
          if (isMounted) setImageSrc(dataUrl);
        })
        .catch(() => {
          if (isMounted) setImageSrc(null);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [item]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // Primary left click
      onSelect(item.id, e.shiftKey);
    }
  };

  return (
    <div
      className={`moodboard-item item-${item.type} ${isSelected ? 'selected' : ''}`}
      style={{
        transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
        width: `${item.width}px`,
        height: `${item.height}px`,
        zIndex: item.z_index,
      }}
      data-item-id={item.id}
      onMouseDown={handleMouseDown}
    >
      {/* Item Body based on type */}
      {item.type === 'text' && (
        <div className={`mb-text-container style-${item.style}`}>
          <textarea
            className="mb-text-input"
            value={item.text}
            onChange={(e) => onUpdate(item.id, { text: e.target.value })}
            placeholder="Type note text..."
          />
        </div>
      )}

      {item.type === 'color' && (
        <div className="mb-color-container">
          <div className="mb-color-preview" style={{ backgroundColor: item.hex }} />
          <div className="mb-color-info">
            <input
              type="text"
              className="mb-color-label"
              value={item.label || ''}
              onChange={(e) => onUpdate(item.id, { label: e.target.value })}
              placeholder="Swatch label"
            />
            <span className="mb-color-hex">{item.hex}</span>
          </div>
        </div>
      )}

      {item.type === 'image' && (
        <div className="mb-image-container">
          {imageSrc ? (
            <img src={imageSrc} alt={item.caption || 'Moodboard Asset'} className="mb-img" />
          ) : (
            <div className="mb-image-placeholder">
              <ImageIcon size={28} />
              <span>{item.asset_path.split('/').pop()}</span>
            </div>
          )}
          {item.caption !== undefined && (
            <input
              type="text"
              className="mb-image-caption"
              value={item.caption || ''}
              onChange={(e) => onUpdate(item.id, { caption: e.target.value })}
              placeholder="Add caption..."
            />
          )}
        </div>
      )}

      {item.type === 'note' && (
        <div className="mb-note-container">
          <div className="mb-note-header">
            <StickyNote size={14} className="note-icon" />
            <input
              type="text"
              className="mb-note-title"
              value={item.title}
              onChange={(e) => onUpdate(item.id, { title: e.target.value })}
              placeholder="Note Title"
            />
          </div>
          <textarea
            className="mb-note-content"
            value={item.content}
            onChange={(e) => onUpdate(item.id, { content: e.target.value })}
            placeholder="Write scratch thoughts..."
          />
        </div>
      )}

      {item.type === 'link' && (
        <div className="mb-link-container">
          <div className="mb-link-header">
            <Sparkles size={14} className="link-icon" />
            <input
              type="text"
              className="mb-link-title"
              value={item.title}
              onChange={(e) => onUpdate(item.id, { title: e.target.value })}
              placeholder="Link Title"
            />
          </div>
          <div className="mb-link-footer">
            <span className="mb-link-target" title={item.target_path}>
              {item.target_path}
            </span>
            {onOpenDocument && (
              <button
                className="mb-link-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDocument(item.target_path);
                }}
                title="Jump to Document"
              >
                <ExternalLink size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Resize Handle (visible when selected) */}
      {isSelected && (
        <div
          className="mb-resize-handle"
          onMouseDown={(e) => {
            e.stopPropagation();
            onResizeStart(e, item.id, item.width, item.height);
          }}
        />
      )}
    </div>
  );
};
