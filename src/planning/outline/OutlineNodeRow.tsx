import React from 'react';
import { OutlineItem, SceneWorkflowStatus } from '../types';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Edit3,
  Bookmark,
  ExternalLink,
} from 'lucide-react';

export interface OutlineNodeRowProps {
  item: OutlineItem;
  isSelected: boolean;
  isExpanded: boolean;
  depth?: number;
  onSelect: (path: string) => void;
  onToggle: (path: string) => void;
  onOpenInEditor: (path: string) => void;
  onStatusChange: (path: string, status: SceneWorkflowStatus) => void;
}

const STATUS_COLORS: Record<string, string> = {
  Idea: 'status-tag-idea',
  Planned: 'status-tag-planned',
  Drafted: 'status-tag-drafted',
  Revising: 'status-tag-revising',
  Complete: 'status-tag-complete',
};

export const OutlineNodeRow: React.FC<OutlineNodeRowProps> = ({
  item,
  isSelected,
  isExpanded,
  depth = 0,
  onSelect,
  onToggle,
  onOpenInEditor,
}) => {
  const status = item.meta?.status;
  const hasNotes = Boolean(item.meta?.notes?.trim());
  const hasSummary = Boolean(item.meta?.summary?.trim());

  return (
    <div
      className={`outline-row ${isSelected ? 'selected' : ''} level-${item.level}`}
      style={{ paddingLeft: `${depth * 18 + 14}px` }}
      onClick={() => onSelect(item.relativePath)}
    >
      {/* Expand / Collapse Arrow */}
      {item.isDirectory || item.children.length > 0 ? (
        <button
          className="outline-arrow-btn"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(item.relativePath);
          }}
        >
          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      ) : (
        <span className="outline-spacer" />
      )}

      {/* Level Icon */}
      {item.level === 'act' ? (
        <Bookmark size={15} className="outline-icon act-icon" />
      ) : item.isDirectory ? (
        <Folder size={15} className="outline-icon chapter-icon" />
      ) : (
        <FileText size={15} className="outline-icon scene-icon" />
      )}

      {/* Item Title & Subtitle */}
      <div className="outline-title-block">
        <span className="outline-item-title">{item.name}</span>
        {hasSummary && (
          <span className="outline-item-summary">{item.meta?.summary}</span>
        )}
      </div>

      {/* Badges: Notes, Status */}
      <div className="outline-badges">
        {hasNotes && (
          <span className="outline-note-badge" title="Has planning notes">
            <Edit3 size={12} />
          </span>
        )}

        {status && (
          <span className={`outline-status-tag ${STATUS_COLORS[status] || ''}`}>
            {status}
          </span>
        )}

        {/* Quick Open in Editor Button */}
        {!item.isDirectory && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenInEditor(item.relativePath);
            }}
            className="outline-open-btn"
            title="Open scene in Editor"
          >
            <ExternalLink size={13} />
          </button>
        )}
      </div>
    </div>
  );
};
