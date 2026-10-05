import React from 'react';
import { ProjectSummary } from '../types/ipc';
import {
  Sidebar,
  Search,
  Clock,
  Sparkles,
  ChevronRight,
  Maximize2,
  Sliders,
  PenLine,
  Compass,
  Layout,
  Columns,
} from 'lucide-react';

export interface ShellHeaderProps {
  project: ProjectSummary | null;
  activePath: string | null;
  sidebarCollapsed: boolean;
  focusMode: boolean;
  studioMode: 'write' | 'plan' | 'desk';
  onChangeStudioMode: (mode: 'write' | 'plan' | 'desk') => void;
  isSplitOpen?: boolean;
  onToggleSplit?: () => void;
  onToggleSidebar: () => void;
  onOpenSearch: () => void;
  onToggleRecents: () => void;
  onToggleFocusMode: () => void;
  onToggleDevDrawer: () => void;
  showDevDrawer: boolean;
}

export const ShellHeader: React.FC<ShellHeaderProps> = ({
  project,
  activePath,
  sidebarCollapsed,
  focusMode,
  studioMode,
  onChangeStudioMode,
  isSplitOpen,
  onToggleSplit,
  onToggleSidebar,
  onOpenSearch,
  onToggleRecents,
  onToggleFocusMode,
  onToggleDevDrawer,
  showDevDrawer,
}) => {
  if (focusMode) return null; // Invisible during deep focus mode

  const renderBreadcrumbs = () => {
    if (!activePath) return null;
    const parts = activePath.split('/');
    return (
      <div className="shell-breadcrumbs">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight size={12} className="breadcrumb-arrow" />}
            <span
              className={`breadcrumb-item ${
                index === parts.length - 1 ? 'active' : ''
              }`}
            >
              {part}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <header className="swrite-shell-header">
      <div className="header-left">
        <button
          onClick={onToggleSidebar}
          className={`header-btn ${!sidebarCollapsed ? 'active' : ''}`}
          title="Toggle Project Sidebar (Ctrl+B)"
        >
          <Sidebar size={16} />
        </button>

        <div className="header-brand">
          <Sparkles size={15} className="brand-icon" />
          <span className="project-name">{project?.name || 'Swrite'}</span>
        </div>

        {renderBreadcrumbs()}
      </div>

      <div className="header-center">
        <div className="studio-mode-switcher">
          <button
            className={`mode-tab-btn ${studioMode === 'write' ? 'active' : ''}`}
            onClick={() => onChangeStudioMode('write')}
            title="Write Studio (Ctrl+1)"
          >
            <PenLine size={13} />
            <span>Write</span>
          </button>
          <button
            className={`mode-tab-btn ${studioMode === 'plan' ? 'active' : ''}`}
            onClick={() => onChangeStudioMode('plan')}
            title="Planning Studio (Ctrl+2)"
          >
            <Compass size={13} />
            <span>Plan</span>
          </button>
          <button
            className={`mode-tab-btn ${studioMode === 'desk' ? 'active' : ''}`}
            onClick={() => onChangeStudioMode('desk')}
            title="Creative Desk (Ctrl+3)"
          >
            <Layout size={13} />
            <span>Desk</span>
          </button>
        </div>
      </div>

      <div className="header-right">
        {onToggleSplit && (
          <button
            onClick={onToggleSplit}
            className={`header-btn ${isSplitOpen ? 'active' : ''}`}
            title="Toggle Split View with Supporting Desk Material"
          >
            <Columns size={15} />
          </button>
        )}
        <button
          onClick={onOpenSearch}
          className="header-search-btn"
          title="Search Project (Ctrl+P or Ctrl+Shift+O)"
        >
          <Search size={14} />
          <span className="search-placeholder">Search project...</span>
          <kbd className="search-kbd">Ctrl+P</kbd>
        </button>

        <button
          onClick={onToggleRecents}
          className="header-btn"
          title="Recent Documents"
        >
          <Clock size={15} />
        </button>

        <button
          onClick={onToggleDevDrawer}
          className={`header-btn ${showDevDrawer ? 'active' : ''}`}
          title="Core IPC Inspector"
        >
          <Sliders size={15} />
        </button>

        <button
          onClick={onToggleFocusMode}
          className="header-btn"
          title="Enter Distraction-Free Focus Mode (Ctrl+Shift+F)"
        >
          <Maximize2 size={15} />
        </button>
      </div>
    </header>
  );
};
