import React, { useState } from 'react';
import { Link as LinkIcon, Image as ImageIcon, Table as TableIcon, X } from 'lucide-react';

export interface LinkModalProps {
  initialUrl?: string;
  initialText?: string;
  onConfirm: (url: string, text: string) => void;
  onRemove?: () => void;
  onClose: () => void;
}

export const LinkModal: React.FC<LinkModalProps> = ({
  initialUrl = 'https://',
  initialText = '',
  onConfirm,
  onRemove,
  onClose,
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState(initialText);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onConfirm(url.trim(), text.trim() || url.trim());
    }
  };

  return (
    <div className="revision-modal-overlay" onClick={onClose}>
      <div className="swrite-compact-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <LinkIcon size={16} />
            <span>Insert / Edit Link</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label>Link URL</label>
            <input
              type="text"
              className="modal-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              autoFocus
            />
          </div>

          <div className="form-field">
            <label>Display Text (optional)</label>
            <input
              type="text"
              className="modal-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Link text..."
            />
          </div>

          <div className="modal-actions">
            {onRemove && (
              <button type="button" className="btn-secondary text-rose-500" onClick={onRemove}>
                Remove Link
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!url.trim()}>
              Save Link
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export interface ImageModalProps {
  onConfirm: (src: string, alt: string, title: string) => void;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ onConfirm, onClose }) => {
  const [src, setSrc] = useState('');
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (src.trim()) {
      onConfirm(src.trim(), alt.trim(), caption.trim());
    }
  };

  return (
    <div className="revision-modal-overlay" onClick={onClose}>
      <div className="swrite-compact-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <ImageIcon size={16} />
            <span>Insert Image / Illustration</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label>Image Path or URL</label>
            <input
              type="text"
              className="modal-input"
              value={src}
              onChange={(e) => setSrc(e.target.value)}
              placeholder="assets/map.png or https://..."
              autoFocus
            />
          </div>

          <div className="form-field">
            <label>Alt Text / Description</label>
            <input
              type="text"
              className="modal-input"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Map of the Obsidian Citadel"
            />
          </div>

          <div className="form-field">
            <label>Caption (optional)</label>
            <input
              type="text"
              className="modal-input"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Figure 1: Fortress Layout"
            />
          </div>

          <div className="modal-actions">
            <div style={{ flex: 1 }} />
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={!src.trim()}>
              Insert Image
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export interface TableModalProps {
  onConfirm: (rows: number, cols: number) => void;
  onClose: () => void;
}

export const TableModal: React.FC<TableModalProps> = ({ onConfirm, onClose }) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(rows, cols);
  };

  return (
    <div className="revision-modal-overlay" onClick={onClose}>
      <div className="swrite-compact-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <TableIcon size={16} />
            <span>Insert Table</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-field">
              <label>Rows (including header)</label>
              <input
                type="number"
                min="2"
                max="20"
                className="modal-input"
                value={rows}
                onChange={(e) => setRows(Math.max(2, parseInt(e.target.value, 10) || 2))}
              />
            </div>
            <div className="form-field">
              <label>Columns</label>
              <input
                type="number"
                min="1"
                max="10"
                className="modal-input"
                value={cols}
                onChange={(e) => setCols(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            </div>
          </div>

          <div className="modal-actions">
            <div style={{ flex: 1 }} />
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Table
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
