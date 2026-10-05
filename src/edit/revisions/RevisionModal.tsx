import React, { useState } from 'react';
import { RevisionCategory, RevisionNote, RevisionSeverity } from '../../types/ipc';

interface RevisionModalProps {
  initialRevision?: RevisionNote | null;
  currentDocumentPath: string | null;
  onSave: (
    title: string,
    description: string,
    category: RevisionCategory,
    severity: RevisionSeverity,
    targetPath?: string | null
  ) => void;
  onClose: () => void;
}

const CATEGORIES: RevisionCategory[] = [
  'Structure',
  'Plot',
  'Character',
  'Pacing',
  'Dialogue',
  'Worldbuilding',
  'Continuity',
  'Prose',
  'Proofreading',
  'General',
];

export const RevisionModal: React.FC<RevisionModalProps> = ({
  initialRevision,
  currentDocumentPath,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState(initialRevision?.title || '');
  const [description, setDescription] = useState(initialRevision?.description || '');
  const [category, setCategory] = useState<RevisionCategory>(
    initialRevision?.category || 'General'
  );
  const [severity, setSeverity] = useState<RevisionSeverity>(
    initialRevision?.severity || 'medium'
  );
  const [targetPath, setTargetPath] = useState(
    initialRevision?.target_path || currentDocumentPath || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(title.trim(), description.trim(), category, severity, targetPath || null);
    onClose();
  };

  return (
    <div className="revision-modal-overlay" onClick={onClose}>
      <div className="revision-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="revision-modal-header">
          <h3>{initialRevision ? 'Edit Revision Note' : 'New Revision Note'}</h3>
          <button type="button" className="revision-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="revision-modal-form">
          <div className="revision-form-group">
            <label className="revision-label">Title</label>
            <input
              type="text"
              className="revision-input"
              placeholder="e.g., Rewrite Chapter 2 reveal pacing"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="revision-form-row">
            <div className="revision-form-group">
              <label className="revision-label">Category</label>
              <select
                className="revision-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as RevisionCategory)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="revision-form-group">
              <label className="revision-label">Severity</label>
              <select
                className="revision-select"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as RevisionSeverity)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="revision-form-group">
            <label className="revision-label">Target Document (Optional)</label>
            <input
              type="text"
              className="revision-input"
              placeholder="e.g., Manuscript/Chapter-01.md"
              value={targetPath}
              onChange={(e) => setTargetPath(e.target.value)}
            />
          </div>

          <div className="revision-form-group">
            <label className="revision-label">Description / Instructions</label>
            <textarea
              className="revision-textarea"
              rows={4}
              placeholder="Detailed notes on what needs to be changed, motivation, and references..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="revision-modal-actions">
            <button
              type="button"
              className="revision-btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="revision-btn-primary"
              disabled={!title.trim()}
            >
              {initialRevision ? 'Update Note' : 'Add Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
