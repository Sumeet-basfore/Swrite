import React from 'react';
import { DocumentTab } from './types';
import { FileText, FileCode, Image as ImageIcon, File, X, Plus } from 'lucide-react';
import './tabBar.css';

export interface DocumentTabBarProps {
  tabs: DocumentTab[];
  activeTabId: string | null;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onCloseOtherTabs?: (tabId: string) => void;
  onCloseAllTabs?: () => void;
  onNewDocument?: () => void;
}

export const DocumentTabBar: React.FC<DocumentTabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewDocument,
}) => {
  if (tabs.length === 0) {
    return null;
  }

  const renderTabIcon = (format: DocumentTab['format']) => {
    switch (format) {
      case 'markdown':
        return <FileText size={13} className="tab-icon" />;
      case 'docx':
        return <FileCode size={13} className="tab-icon" />;
      case 'binary':
        return <ImageIcon size={13} className="tab-icon" />;
      default:
        return <File size={13} className="tab-icon" />;
    }
  };

  return (
    <div className="swrite-tab-bar" role="tablist" aria-label="Open documents">
      <div className="swrite-tab-list">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId || tab.relativePath === activeTabId;

          return (
            <div
              key={tab.id}
              className={`swrite-tab-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(tab.id)}
              onMouseDown={(e) => {
                // Middle click closes tab
                if (e.button === 1) {
                  e.preventDefault();
                  onCloseTab(tab.id);
                }
              }}
              role="tab"
              aria-selected={isActive}
              title={tab.relativePath}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectTab(tab.id);
                }
              }}
            >
              {renderTabIcon(tab.format)}
              <span className="tab-title">{tab.title}</span>
              {tab.isDirty && <span className="tab-dirty-indicator" title="Unsaved changes" />}
              <button
                type="button"
                className="tab-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                title="Close tab (Middle click)"
                aria-label={`Close ${tab.title}`}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {onNewDocument && (
        <button
          type="button"
          className="tab-new-btn"
          onClick={onNewDocument}
          title="New Document"
          aria-label="New Document"
        >
          <Plus size={14} />
        </button>
      )}
    </div>
  );
};
