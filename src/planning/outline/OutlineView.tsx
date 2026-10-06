import React from 'react';
import { OutlineItem, SceneWorkflowStatus } from '../types';
import { OutlineNodeRow } from './OutlineNodeRow';
import { SceneCardGrid } from './SceneCardGrid';
import { OutlineInspector } from './OutlineInspector';
import {
  List,
  LayoutGrid,
  Plus,
  Search,
  BookOpen,
} from 'lucide-react';

export interface OutlineViewProps {
  outlineTree: OutlineItem[];
  selectedItemPath: string | null;
  expandedNodes: Set<string>;
  layoutMode: 'tree' | 'cards';
  searchQuery: string;
  onSelectItem: (path: string) => void;
  onToggleExpand: (path: string) => void;
  onOpenInEditor: (path: string) => void;
  onStatusChange: (path: string, status: SceneWorkflowStatus) => void;
  onTitleChange: (path: string, title: string) => void;
  onSummaryChange: (path: string, summary: string) => void;
  onNotesChange: (path: string, notes: string) => void;
  onChangeLayoutMode: (mode: 'tree' | 'cards') => void;
  onSearchChange: (query: string) => void;
  onCreateChapter: () => void;
  onCreateScene: (parentFolder: string) => void;
}

export const OutlineView: React.FC<OutlineViewProps> = ({
  outlineTree,
  selectedItemPath,
  expandedNodes,
  layoutMode,
  searchQuery,
  onSelectItem,
  onToggleExpand,
  onOpenInEditor,
  onStatusChange,
  onTitleChange,
  onSummaryChange,
  onNotesChange,
  onChangeLayoutMode,
  onSearchChange,
  onCreateChapter,
}) => {
  // Find currently selected item object for inspector
  const findItemByPath = (nodes: OutlineItem[], path: string | null): OutlineItem | null => {
    if (!path) return null;
    for (const node of nodes) {
      if (node.relativePath === path) return node;
      const found = findItemByPath(node.children, path);
      if (found) return found;
    }
    return null;
  };

  const selectedItem = findItemByPath(outlineTree, selectedItemPath);

  // Recursive tree renderer
  const renderTreeNodes = (nodes: OutlineItem[], depth = 0) => {
    return nodes.map((item) => {
      const isSelected = selectedItemPath === item.relativePath;
      const isExpanded = expandedNodes.has(item.relativePath);

      // Simple search query match filter
      if (
        searchQuery &&
        !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.meta?.summary?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        item.children.length === 0
      ) {
        return null;
      }

      return (
        <React.Fragment key={item.id}>
          <OutlineNodeRow
            item={item}
            isSelected={isSelected}
            isExpanded={isExpanded}
            depth={depth}
            onSelect={onSelectItem}
            onToggle={onToggleExpand}
            onOpenInEditor={onOpenInEditor}
            onStatusChange={onStatusChange}
          />
          {item.isDirectory && isExpanded && item.children.length > 0 && (
            <div className="outline-children-group">
              {renderTreeNodes(item.children, depth + 1)}
            </div>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="swrite-outline-container">
      {/* Top Outline Toolbar */}
      <div className="outline-toolbar">
        <div className="toolbar-left">
          <div className="layout-mode-toggle">
            <button
              className={`mode-btn ${layoutMode === 'tree' ? 'active' : ''}`}
              onClick={() => onChangeLayoutMode('tree')}
              title="Hierarchical Tree View"
            >
              <List size={14} />
              <span>Tree</span>
            </button>
            <button
              className={`mode-btn ${layoutMode === 'cards' ? 'active' : ''}`}
              onClick={() => onChangeLayoutMode('cards')}
              title="Scene Storyboard Cards View"
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>
          </div>

          <div className="outline-search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Filter outline..."
              className="outline-search-input"
            />
          </div>
        </div>

        <div className="toolbar-right">
          <button
            onClick={onCreateChapter}
            className="outline-add-btn"
            title="Create New Chapter"
          >
            <Plus size={14} />
            <span>Add Chapter</span>
          </button>
        </div>
      </div>

      {/* Main Outline Area */}
      <div className="outline-main-split">
        <div className="outline-content-area">
          {outlineTree.length === 0 ? (
            <div className="outline-empty-state">
              <BookOpen size={28} className="empty-icon" />
              <h3>Manuscript is Empty</h3>
              <p>Create your first chapter to start organizing your outline.</p>
              <button onClick={onCreateChapter} className="outline-add-btn primary">
                + Add Chapter 1
              </button>
            </div>
          ) : layoutMode === 'tree' ? (
            <div className="outline-tree-list">
              {renderTreeNodes(outlineTree)}
            </div>
          ) : (
            <SceneCardGrid
              items={outlineTree}
              selectedItemPath={selectedItemPath}
              onSelectItem={onSelectItem}
              onOpenInEditor={onOpenInEditor}
              onStatusChange={onStatusChange}
            />
          )}
        </div>

        {/* Contextual Inspector */}
        {selectedItem && (
          <OutlineInspector
            item={selectedItem}
            onClose={() => onSelectItem('')}
            onOpenInEditor={onOpenInEditor}
            onTitleChange={onTitleChange}
            onSummaryChange={onSummaryChange}
            onNotesChange={onNotesChange}
            onStatusChange={onStatusChange}
          />
        )}
      </div>
    </div>
  );
};
