import React from 'react';
import { OutlineItem, SceneWorkflowStatus } from '../types';
import { FileText, Edit3, ExternalLink } from 'lucide-react';

export interface SceneCardProps {
  item: OutlineItem;
  isSelected: boolean;
  onSelect: (path: string) => void;
  onOpenInEditor: (path: string) => void;
  onStatusChange: (path: string, status: SceneWorkflowStatus) => void;
}

const STATUS_OPTIONS: SceneWorkflowStatus[] = [
  'Idea',
  'Planned',
  'Drafted',
  'Revising',
  'Complete',
];

export const SceneCard: React.FC<SceneCardProps> = ({
  item,
  isSelected,
  onSelect,
  onOpenInEditor,
  onStatusChange,
}) => {
  const meta = item.meta;

  return (
    <div
      className={`swrite-scene-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(item.relativePath)}
    >
      <div className="card-header">
        <div className="card-title-row">
          <FileText size={15} className="card-icon" />
          <span className="card-title">{item.name}</span>
        </div>
        <button
          className="card-open-btn"
          onClick={(e) => {
            e.stopPropagation();
            onOpenInEditor(item.relativePath);
          }}
          title="Open in Editor"
        >
          <ExternalLink size={13} />
        </button>
      </div>

      <div className="card-body">
        {meta?.summary ? (
          <p className="card-summary">{meta.summary}</p>
        ) : (
          <p className="card-summary placeholder">No summary written yet.</p>
        )}

        {meta?.notes && (
          <div className="card-notes-preview">
            <Edit3 size={12} className="notes-icon" />
            <span>{meta.notes}</span>
          </div>
        )}
      </div>

      <div className="card-footer">
        <select
          value={meta?.status || 'Planned'}
          onChange={(e) => {
            e.stopPropagation();
            onStatusChange(item.relativePath, e.target.value as SceneWorkflowStatus);
          }}
          onClick={(e) => e.stopPropagation()}
          className="card-status-select"
        >
          {STATUS_OPTIONS.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
        <span className="card-path">{item.relativePath.split('/').pop()}</span>
      </div>
    </div>
  );
};
