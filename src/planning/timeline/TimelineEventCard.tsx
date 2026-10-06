import React from 'react';
import { TimelineEvent } from '../../types/ipc';
import { Clock, Tag, FileText, Edit2, Trash2, ExternalLink } from 'lucide-react';

export interface TimelineEventCardProps {
  event: TimelineEvent;
  onEdit: (event: TimelineEvent) => void;
  onDelete: (id: string) => void;
  onOpenScene: (scenePath: string) => void;
}

const MARKER_COLORS: Record<string, string> = {
  Flashback: 'marker-flashback',
  Flashforward: 'marker-flashforward',
  Memory: 'marker-memory',
  Backstory: 'marker-backstory',
};

export const TimelineEventCard: React.FC<TimelineEventCardProps> = ({
  event,
  onEdit,
  onDelete,
  onOpenScene,
}) => {
  return (
    <div className="swrite-timeline-event-card">
      <div className="event-time-column">
        <div className="timeline-node-circle" />
        <span className="temporal-position-tag">
          <Clock size={12} />
          <span>{event.temporal_position}</span>
        </span>
      </div>

      <div className="event-card-content">
        <div className="event-card-header">
          <div className="event-title-wrap">
            <h4 className="event-title">{event.title}</h4>
            {event.narrative_marker && (
              <span
                className={`narrative-marker-chip ${
                  MARKER_COLORS[event.narrative_marker] || ''
                }`}
              >
                <Tag size={11} />
                <span>{event.narrative_marker}</span>
              </span>
            )}
          </div>

          <div className="event-actions">
            <button
              onClick={() => onEdit(event)}
              className="event-action-btn"
              title="Edit Event"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => onDelete(event.id)}
              className="event-action-btn danger"
              title="Delete Event"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {event.description && (
          <p className="event-description">{event.description}</p>
        )}

        {event.notes && (
          <div className="event-notes-box">
            <strong>Notes:</strong> {event.notes}
          </div>
        )}

        {event.linked_scene && (
          <div className="event-linked-scene">
            <FileText size={13} className="text-muted" />
            <span className="scene-label">Manuscript Scene:</span>
            <button
              onClick={() => onOpenScene(event.linked_scene!)}
              className="scene-link-btn"
              title="Open scene in Writer"
            >
              <span>{event.linked_scene}</span>
              <ExternalLink size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
