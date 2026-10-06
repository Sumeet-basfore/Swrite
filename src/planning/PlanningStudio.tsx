import React, { useState } from 'react';
import { DiscoveredFile } from '../types/ipc';
import { OutlineView } from './outline/OutlineView';
import { TimelineView } from './timeline/TimelineView';
import { useOutlineState } from './outline/useOutlineState';
import { PlanningTab } from './types';
import {
  ListTree,
  Calendar,
  FileText,
  Plus,
} from 'lucide-react';
import './planning.css';

export interface PlanningStudioProps {
  manuscriptFiles: DiscoveredFile[];
  planningFiles: DiscoveredFile[];
  onOpenFile: (relativePath: string) => void;
  onRefreshFiles: () => Promise<void>;
}

export const PlanningStudio: React.FC<PlanningStudioProps> = ({
  manuscriptFiles,
  planningFiles,
  onOpenFile,
  onRefreshFiles,
}) => {
  const [activeTab, setActiveTab] = useState<PlanningTab>('outline');

  const outlineState = useOutlineState(
    manuscriptFiles,
    onOpenFile,
    onRefreshFiles
  );

  return (
    <div className="swrite-planning-studio">
      {/* Planning Navigation Tabs */}
      <nav className="planning-tab-nav">
        <div className="tab-buttons">
          <button
            className={`plan-tab-btn ${activeTab === 'outline' ? 'active' : ''}`}
            onClick={() => setActiveTab('outline')}
          >
            <ListTree size={15} />
            <span>Story Outline</span>
          </button>

          <button
            className={`plan-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            <Calendar size={15} />
            <span>Chronology & Timeline</span>
          </button>

          <button
            className={`plan-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            <FileText size={15} />
            <span>Planning Documents</span>
          </button>
        </div>
      </nav>

      {/* Main Tab Content */}
      <div className="planning-content-pane">
        {activeTab === 'outline' && (
          <OutlineView
            outlineTree={outlineState.outlineTree}
            selectedItemPath={outlineState.selectedItemPath}
            expandedNodes={outlineState.expandedNodes}
            layoutMode={outlineState.layoutMode}
            searchQuery={outlineState.searchQuery}
            onSelectItem={outlineState.setSelectedItemPath}
            onToggleExpand={outlineState.toggleExpand}
            onOpenInEditor={outlineState.openItem}
            onStatusChange={outlineState.updateStatus}
            onTitleChange={outlineState.updateTitle}
            onSummaryChange={outlineState.updateSummary}
            onNotesChange={outlineState.updateNotes}
            onChangeLayoutMode={outlineState.setLayoutMode}
            onSearchChange={outlineState.setSearchQuery}
            onCreateChapter={outlineState.createChapter}
            onCreateScene={outlineState.createScene}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineView onOpenFile={onOpenFile} />
        )}

        {activeTab === 'notes' && (
          <div className="planning-notes-view">
            <div className="notes-view-header">
              <h3>Freeform Planning Documents</h3>
              <p>Ordinary Markdown files stored in <code>Planning/</code> on disk.</p>
            </div>

            <div className="planning-files-grid">
              {planningFiles.map((file) => (
                <div
                  key={file.relative_path}
                  className="planning-file-card"
                  onClick={() => onOpenFile(file.relative_path)}
                >
                  <FileText size={20} className="file-card-icon" />
                  <span className="file-card-name">{file.name}</span>
                  <span className="file-card-path">{file.relative_path}</span>
                </div>
              ))}

              <div
                className="planning-file-card new-card"
                onClick={() => onOpenFile('Planning/Story Notes.md')}
              >
                <Plus size={20} className="file-card-icon" />
                <span className="file-card-name">New Planning Note</span>
                <span className="file-card-path">Planning/Untitled.md</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
