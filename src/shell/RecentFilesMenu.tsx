import React, { useEffect, useRef } from 'react';
import { RecentDocumentEntry } from '../types/ipc';
import { Clock, FileText, X } from 'lucide-react';

export interface RecentFilesMenuProps {
  open: boolean;
  recents: RecentDocumentEntry[];
  onClose: () => void;
  onOpen: (path: string) => void;
}

export const RecentFilesMenu: React.FC<RecentFilesMenuProps> = ({
  open,
  recents,
  onClose,
  onOpen,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (open) {
      window.addEventListener('mousedown', handleOutsideClick);
    }
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="swrite-recents-popover" ref={menuRef}>
      <div className="recents-header">
        <div className="header-title">
          <Clock size={14} />
          <span>Recent Documents</span>
        </div>
        <button onClick={onClose} className="close-btn">
          <X size={13} />
        </button>
      </div>

      <div className="recents-list">
        {recents.length === 0 ? (
          <div className="empty-recents">No recent documents</div>
        ) : (
          recents.map((entry) => (
            <div
              key={entry.relative_path}
              className="recent-item"
              onClick={() => {
                onOpen(entry.relative_path);
                onClose();
              }}
            >
              <FileText size={14} className="recent-icon" />
              <div className="recent-info">
                <div className="recent-name">
                  {entry.relative_path.split('/').pop()}
                </div>
                <div className="recent-path">{entry.relative_path}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
