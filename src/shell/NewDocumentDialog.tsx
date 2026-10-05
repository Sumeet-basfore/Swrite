import React, { useState, useEffect, useRef } from 'react';
import { FilePlus, FolderPlus } from 'lucide-react';

export interface NewDocumentDialogProps {
  open: boolean;
  type: 'document' | 'folder';
  parentFolder: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export const NewDocumentDialog: React.FC<NewDocumentDialogProps> = ({
  open,
  type,
  parentFolder,
  onConfirm,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(type === 'document' ? 'Untitled.md' : 'New Folder');
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [open, type]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name.trim());
    }
  };

  return (
    <div className="swrite-modal-overlay" onClick={onCancel}>
      <div
        className="swrite-dialog-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="dialog-header">
            <div className="dialog-icon-wrap">
              {type === 'document' ? <FilePlus size={18} /> : <FolderPlus size={18} />}
            </div>
            <div className="dialog-title-block">
              <h3>{type === 'document' ? 'New Document' : 'New Folder'}</h3>
              <p className="dialog-subtitle">
                Location: <code>{parentFolder}/</code>
              </p>
            </div>
          </div>

          <div className="dialog-body">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'document' ? 'document-name.md' : 'Folder name'}
              className="dialog-input"
            />
          </div>

          <div className="dialog-actions">
            <button type="button" onClick={onCancel} className="dialog-btn secondary">
              Cancel
            </button>
            <button type="submit" className="dialog-btn primary">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
