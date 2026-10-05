import React from 'react';
import { OutlineItem, SceneWorkflowStatus } from '../types';
import { ExternalLink, X, Tag } from 'lucide-react';

export interface OutlineInspectorProps {
  item: OutlineItem | null;
  onClose: () => void;
  onOpenInEditor: (path: string) => void;
  onTitleChange: (path: string, title: string) => void;
  onSummaryChange: (path: string, summary: string) => void;
  onNotesChange: (path: string, notes: string) => void;
  onStatusChange: (path: string, status: SceneWorkflowStatus) => void;
}

const STATUS_LIST: SceneWorkflowStatus[] = [
  'Idea',
  'Planned',
  'Drafted',
  'Revising',
  'Complete',
];

export const OutlineInspector: React.FC<OutlineInspectorProps> = ({
  item,
  onClose,
  onOpenInEditor,
  onTitleChange,
  onSummaryChange,
  onNotesChange,
  onStatusChange,
}) => {
  if (!item) return null;

  const meta = item.meta;

  return (
    <aside className="swrite-outline-inspector">
      <div className="inspector-header">
        <span className="inspector-badge">{item.level.toUpperCase()} DETAILS</span>
        <button onClick={onClose} className="inspector-close-btn">
          <X size={14} />
        </button>
      </div>

      <div className="inspector-body">
        {/* Title Input */}
        <div className="inspector-field">
          <label>Title</label>
          <input
            type="text"
            value={meta?.title || item.name}
            onChange={(e) => onTitleChange(item.relativePath, e.target.value)}
            className="inspector-input"
          />
        </div>

        {/* Workflow Status */}
        <div className="inspector-field">
          <label>Workflow Status</label>
          <div className="status-button-group">
            {STATUS_LIST.map((st) => (
              <button
                key={st}
                type="button"
                className={`status-chip ${(meta?.status || 'Planned') === st ? 'active' : ''}`}
                onClick={() => onStatusChange(item.relativePath, st)}
              >
                <Tag size={11} />
                <span>{st}</span>
              </button>
            ))}
          </div>
        </div>

        {/* File Path */}
        <div className="inspector-field">
          <label>Filesystem Path</label>
          <div className="inspector-path-display">
            <code>{item.relativePath}</code>
            {!item.isDirectory && (
              <button
                onClick={() => onOpenInEditor(item.relativePath)}
                className="inspector-open-link"
                title="Open in Writer"
              >
                <ExternalLink size={13} />
                <span>Open Prose</span>
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="inspector-field">
          <label>Plot Summary / Objective</label>
          <textarea
            value={meta?.summary || ''}
            onChange={(e) => onSummaryChange(item.relativePath, e.target.value)}
            placeholder="What happens in this beat or scene?"
            rows={4}
            className="inspector-textarea"
          />
        </div>

        {/* Planning Notes */}
        <div className="inspector-field">
          <label>Planning Notes</label>
          <textarea
            value={meta?.notes || ''}
            onChange={(e) => onNotesChange(item.relativePath, e.target.value)}
            placeholder="Key character decisions, lore details, pacing reminders..."
            rows={6}
            className="inspector-textarea"
          />
        </div>
      </div>
    </aside>
  );
};
