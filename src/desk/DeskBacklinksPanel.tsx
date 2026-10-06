import React, { useEffect, useState } from 'react';
import { SwriteIpc } from '../lib/ipc';
import { reportError } from '../lib/errors';
import { Link2, FileText, ArrowRight } from 'lucide-react';

export interface DeskBacklinksPanelProps {
  activeFilePath: string | null;
  onOpenFile: (relativePath: string) => void;
  onClose: () => void;
}

export const DeskBacklinksPanel: React.FC<DeskBacklinksPanelProps> = ({
  activeFilePath,
  onOpenFile,
  onClose,
}) => {
  const [backlinks, setBacklinks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!activeFilePath) {
      setBacklinks([]);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    SwriteIpc.deskScanBacklinks(activeFilePath)
      .then((links) => {
        if (isMounted) setBacklinks(links);
      })
      .catch((e) => {
        reportError('desk-backlinks-scan', e);
        if (isMounted) setBacklinks([]);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeFilePath]);

  if (!activeFilePath) return null;

  const fileName = activeFilePath.split('/').pop() || activeFilePath;

  return (
    <aside className="desk-backlinks-panel">
      <div className="panel-header">
        <div className="header-title">
          <Link2 size={15} />
          <span>Backlinks & References</span>
        </div>
        <button className="panel-close-btn" onClick={onClose} title="Close Panel">
          ✕
        </button>
      </div>

      <div className="panel-target-info">
        <span className="target-label">Referenced Document:</span>
        <span className="target-name">{fileName}</span>
        <span className="target-path">{activeFilePath}</span>
      </div>

      <div className="panel-body">
        {isLoading ? (
          <div className="panel-loading">Scanning project references...</div>
        ) : backlinks.length === 0 ? (
          <div className="panel-empty">
            <p>No project documents currently reference <code>[[{fileName.replace(/\.md$/, '')}]]</code>.</p>
            <p className="hint">Use <code>[[{fileName.replace(/\.md$/, '')}]]</code> in your manuscript or notes to create references.</p>
          </div>
        ) : (
          <div className="backlinks-list">
            <div className="list-heading">Mentioned in ({backlinks.length}):</div>
            {backlinks.map((link) => (
              <div
                key={link}
                className="backlink-item"
                onClick={() => onOpenFile(link)}
                title={`Jump to ${link}`}
              >
                <FileText size={14} className="backlink-icon" />
                <div className="backlink-details">
                  <span className="backlink-name">{link.split('/').pop()}</span>
                  <span className="backlink-path">{link}</span>
                </div>
                <ArrowRight size={12} className="jump-arrow" />
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
