import React, { useState, useMemo } from 'react';
import { DiscoveredFile } from '../types/ipc';
import { DeskFilter, DeskItemEntry, DeskViewMode } from './types';
import { DeskSidebar } from './DeskSidebar';
import { DeskGridView } from './DeskGridView';
import { DeskListView } from './DeskListView';
import { DeskBacklinksPanel } from './DeskBacklinksPanel';
import { MoodboardCanvas } from './moodboard/MoodboardCanvas';
import { DESK_TEMPLATES } from './templates';
import { SwriteIpc } from '../lib/ipc';
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  User,
  MapPin,
  Globe,
  BookOpen,
  FileText,
  FolderPlus,
  Trash2,
} from 'lucide-react';
import './desk.css';

export interface DeskStudioProps {
  deskFiles: DiscoveredFile[];
  assetFiles: DiscoveredFile[];
  onOpenFile: (relativePath: string) => void;
  onOpenSplitFile?: (relativePath: string) => void;
  onRefreshFiles: () => Promise<void>;
}

export const DeskStudio: React.FC<DeskStudioProps> = ({
  deskFiles,
  assetFiles,
  onOpenFile,
  onOpenSplitFile,
  onRefreshFiles,
}) => {
  const [activeFilter, setActiveFilter] = useState<DeskFilter>('all');
  const [viewMode, setViewMode] = useState<DeskViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [activeMoodboardPath, setActiveMoodboardPath] = useState<string | null>(null);
  const [backlinksTarget, setBacklinksTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeskItemEntry | null>(null);

  // Categorize desk files
  const categorizedEntries = useMemo((): DeskItemEntry[] => {
    const entries: DeskItemEntry[] = [];

    // Desk Files
    for (const file of deskFiles) {
      if (file.is_directory) continue;

      const pathLower = file.relative_path.toLowerCase();
      let category: DeskFilter = 'notes';

      if (pathLower.includes('/characters/')) {
        category = 'characters';
      } else if (pathLower.includes('/locations/')) {
        category = 'locations';
      } else if (pathLower.includes('/world/')) {
        category = 'world';
      } else if (pathLower.includes('/research/')) {
        category = 'research';
      } else if (pathLower.includes('/moodboards/') || file.name.endsWith('board.json')) {
        category = 'moodboards';
      }

      let title = file.name.replace(/\.(md|json|txt)$/, '');
      if (file.name === 'board.json') {
        const parts = file.relative_path.split('/');
        title = parts[parts.length - 2] || 'Moodboard';
      }

      entries.push({
        file,
        category,
        title,
      });
    }

    // Asset Files
    for (const file of assetFiles) {
      if (file.is_directory) continue;
      entries.push({
        file,
        category: 'assets',
        title: file.name,
      });
    }

    return entries;
  }, [deskFiles, assetFiles]);

  // Counts by category
  const counts = useMemo((): Record<DeskFilter, number> => {
    const c: Record<DeskFilter, number> = {
      all: categorizedEntries.length,
      notes: 0,
      characters: 0,
      locations: 0,
      world: 0,
      research: 0,
      moodboards: 0,
      assets: 0,
    };

    for (const entry of categorizedEntries) {
      c[entry.category] = (c[entry.category] || 0) + 1;
    }
    return c;
  }, [categorizedEntries]);

  // Filter & Search entries
  const displayedEntries = useMemo(() => {
    return categorizedEntries.filter((entry) => {
      if (activeFilter !== 'all' && entry.category !== activeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          entry.title.toLowerCase().includes(q) ||
          entry.file.relative_path.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [categorizedEntries, activeFilter, searchQuery]);

  // New Document Handlers
  const handleCreateFromTemplate = async (templateKey: string) => {
    const template = DESK_TEMPLATES[templateKey];
    if (!template) return;

    const name = window.prompt(`Enter title for ${template.name}:`, template.name.replace(' Note', ''));
    if (!name || !name.trim()) return;

    const cleanTitle = name.trim();
    const fileName = `${cleanTitle}.md`;
    const targetPath = `${template.folder}/${fileName}`;

    try {
      const content = template.templateContent(cleanTitle);
      await SwriteIpc.fileCreate(targetPath, content);
      await onRefreshFiles();
      onOpenFile(targetPath);
    } catch (e) {
      console.error('Failed to create desk document:', e);
    } finally {
      setNewMenuOpen(false);
    }
  };

  const handleCreateMoodboard = async () => {
    const name = window.prompt('Enter Moodboard Name:', 'New Moodboard');
    if (!name || !name.trim()) return;

    try {
      const boardPath = await SwriteIpc.moodboardCreate(name.trim());
      await onRefreshFiles();
      setActiveMoodboardPath(boardPath);
    } catch (e) {
      console.error('Failed to create moodboard:', e);
    } finally {
      setNewMenuOpen(false);
    }
  };

  const handleCreateFolder = async () => {
    const folder = window.prompt('Enter new folder path inside Desk/ (e.g. Desk/Creatures):', 'Desk/Custom');
    if (!folder || !folder.trim()) return;

    try {
      await SwriteIpc.fileMkdir(folder.trim());
      await onRefreshFiles();
    } catch (e) {
      console.error('Failed to create folder:', e);
    } finally {
      setNewMenuOpen(false);
    }
  };

  const handleOpenItem = (item: DeskItemEntry) => {
    if (item.category === 'moodboards') {
      setActiveMoodboardPath(item.file.relative_path);
    } else {
      onOpenFile(item.file.relative_path);
    }
  };

  const handleOpenSplit = (item: DeskItemEntry) => {
    if (onOpenSplitFile) {
      onOpenSplitFile(item.file.relative_path);
    } else {
      handleOpenItem(item);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await SwriteIpc.fileDeleteSafe(deleteTarget.file.relative_path);
      await onRefreshFiles();
    } catch (e) {
      console.error('Failed to delete desk item:', e);
    } finally {
      setDeleteTarget(null);
    }
  };

  // If a moodboard is actively open full-screen in Desk
  if (activeMoodboardPath) {
    return (
      <MoodboardCanvas
        boardPath={activeMoodboardPath}
        projectAssets={assetFiles}
        onOpenDocument={onOpenFile}
        onBackToDesk={() => setActiveMoodboardPath(null)}
        onRefreshFiles={onRefreshFiles}
      />
    );
  }

  return (
    <div className="swrite-desk-studio">
      {/* Navigation Sidebar */}
      <DeskSidebar
        activeFilter={activeFilter}
        onSelectFilter={setActiveFilter}
        counts={counts}
      />

      {/* Main Content Workspace */}
      <main className="desk-main-pane">
        {/* Desk Header Toolbar */}
        <div className="desk-toolbar">
          <div className="desk-search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search notes, characters, world lore, moodboards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
                ✕
              </button>
            )}
          </div>

          <div className="desk-toolbar-actions">
            {/* View Mode Switcher */}
            <div className="desk-view-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid Card View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List Table View"
              >
                <List size={15} />
              </button>
            </div>

            {/* + New Dropdown */}
            <div className="new-dropdown-wrapper">
              <button
                className="desk-new-btn"
                onClick={() => setNewMenuOpen((prev) => !prev)}
                title="Create New Supporting Material"
              >
                <Plus size={15} />
                <span>New</span>
              </button>

              {newMenuOpen && (
                <div
                  className="desk-new-menu"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button onClick={() => handleCreateFromTemplate('character')}>
                    <User size={14} />
                    <span>New Character Note</span>
                  </button>
                  <button onClick={() => handleCreateFromTemplate('location')}>
                    <MapPin size={14} />
                    <span>New Location Note</span>
                  </button>
                  <button onClick={() => handleCreateFromTemplate('world')}>
                    <Globe size={14} />
                    <span>New World Lore Note</span>
                  </button>
                  <button onClick={() => handleCreateFromTemplate('research')}>
                    <BookOpen size={14} />
                    <span>New Research Note</span>
                  </button>
                  <button onClick={() => handleCreateFromTemplate('note')}>
                    <FileText size={14} />
                    <span>New Freeform Note</span>
                  </button>
                  <hr />
                  <button onClick={handleCreateMoodboard}>
                    <LayoutGrid size={14} />
                    <span>New Moodboard</span>
                  </button>
                  <button onClick={handleCreateFolder}>
                    <FolderPlus size={14} />
                    <span>New Folder</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="desk-content-viewport">
          {viewMode === 'grid' ? (
            <DeskGridView
              items={displayedEntries}
              onOpenItem={handleOpenItem}
              onOpenSplit={handleOpenSplit}
              onInspectBacklinks={(item) => setBacklinksTarget(item.file.relative_path)}
              onDeleteItem={(item) => setDeleteTarget(item)}
            />
          ) : (
            <DeskListView
              items={displayedEntries}
              onOpenItem={handleOpenItem}
              onOpenSplit={handleOpenSplit}
              onInspectBacklinks={(item) => setBacklinksTarget(item.file.relative_path)}
              onDeleteItem={(item) => setDeleteTarget(item)}
            />
          )}
        </div>
      </main>

      {/* Backlinks Side Panel */}
      {backlinksTarget && (
        <DeskBacklinksPanel
          activeFilePath={backlinksTarget}
          onOpenFile={onOpenFile}
          onClose={() => setBacklinksTarget(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="desk-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="desk-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Desk Material</h3>
              <button onClick={() => setDeleteTarget(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete <strong>{deleteTarget.title}</strong> (
                <code>{deleteTarget.file.relative_path}</code>)?
              </p>
              <p className="hint">This file will be safely moved to <code>.swrite/trash/</code>.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-danger" onClick={handleDeleteConfirm}>
                <Trash2 size={14} /> Delete File
              </button>
              <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
