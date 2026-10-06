import React, { useState, useEffect } from 'react';
import { TimelineEvent } from '../../types/ipc';
import { X, Calendar } from 'lucide-react';

export interface EventEditModalProps {
  open: boolean;
  event: TimelineEvent | null;
  onSave: (event: Omit<TimelineEvent, 'id' | 'order_index'> | TimelineEvent) => void;
  onClose: () => void;
}

const NARRATIVE_MARKERS = [
  'None',
  'Flashback',
  'Flashforward',
  'Memory',
  'Backstory',
];

export const EventEditModal: React.FC<EventEditModalProps> = ({
  open,
  event,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [temporalPosition, setTemporalPosition] = useState('');
  const [narrativeMarker, setNarrativeMarker] = useState('None');
  const [linkedScene, setLinkedScene] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setTemporalPosition(event.temporal_position);
      setNarrativeMarker(event.narrative_marker || 'None');
      setLinkedScene(event.linked_scene || '');
      setDescription(event.description || '');
      setNotes(event.notes || '');
    } else {
      setTitle('');
      setTemporalPosition('');
      setNarrativeMarker('None');
      setLinkedScene('');
      setDescription('');
      setNotes('');
    }
  }, [event, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title: title.trim(),
      temporal_position: temporalPosition.trim() || 'Unknown',
      narrative_marker: narrativeMarker === 'None' ? null : narrativeMarker,
      linked_scene: linkedScene.trim() || null,
      description: description.trim(),
      notes: notes.trim(),
    };

    if (event) {
      onSave({ ...event, ...payload });
    } else {
      onSave(payload);
    }
    onClose();
  };

  return (
    <div className="swrite-modal-overlay" onClick={onClose}>
      <div
        className="swrite-dialog-modal wide"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="dialog-header">
            <div className="dialog-icon-wrap">
              <Calendar size={18} />
            </div>
            <div className="dialog-title-block">
              <h3>{event ? 'Edit Story Event' : 'New Story Event'}</h3>
              <p className="dialog-subtitle">
                Place this event on the chronological or narrative story timeline.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="modal-close-icon-btn"
            >
              <X size={14} />
            </button>
          </div>

          <div className="dialog-body-form">
            {/* Event Title */}
            <div className="form-group">
              <label>Event Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Siege of Vareth / Discovery of Astrolabe"
                required
                className="dialog-input"
                autoFocus
              />
            </div>

            <div className="form-row">
              {/* Temporal Position */}
              <div className="form-group flex-1">
                <label>Temporal Position / Date</label>
                <input
                  type="text"
                  value={temporalPosition}
                  onChange={(e) => setTemporalPosition(e.target.value)}
                  placeholder="e.g. 14 March 2042 / 3 years before / Before the Siege"
                  className="dialog-input"
                />
              </div>

              {/* Narrative Marker */}
              <div className="form-group">
                <label>Narrative Presentation</label>
                <select
                  value={narrativeMarker}
                  onChange={(e) => setNarrativeMarker(e.target.value)}
                  className="dialog-select"
                >
                  {NARRATIVE_MARKERS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Linked Manuscript Scene */}
            <div className="form-group">
              <label>Linked Manuscript Scene (Optional)</label>
              <input
                type="text"
                value={linkedScene}
                onChange={(e) => setLinkedScene(e.target.value)}
                placeholder="e.g. Manuscript/Chapter 01.md"
                className="dialog-input"
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label>Event Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What actually happens during this timeline event?"
                rows={3}
                className="dialog-textarea"
              />
            </div>

            {/* Notes */}
            <div className="form-group">
              <label>Chronology Notes & Context</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Historical background, hidden implications, or dependencies..."
                rows={3}
                className="dialog-textarea"
              />
            </div>
          </div>

          <div className="dialog-actions">
            <button
              type="button"
              onClick={onClose}
              className="dialog-btn secondary"
            >
              Cancel
            </button>
            <button type="submit" className="dialog-btn primary">
              {event ? 'Save Changes' : 'Add Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
