import React from 'react';
import { TimelineEvent } from '../../types/ipc';
import { TimelineEventCard } from './TimelineEventCard';
import { EventEditModal } from './EventEditModal';
import { useTimelineState } from './useTimelineState';
import {
  Calendar,
  Plus,
  Search,
  ArrowUpDown,
  BookOpen,
} from 'lucide-react';

export interface TimelineViewProps {
  onOpenFile: (path: string) => void;
}

const MARKER_FILTERS = ['All', 'Flashback', 'Flashforward', 'Memory', 'Backstory'];

export const TimelineView: React.FC<TimelineViewProps> = ({ onOpenFile }) => {
  const {
    events,
    rawEventCount,
    sortMode,
    setSortMode,
    filterMarker,
    setFilterMarker,
    searchQuery,
    setSearchQuery,
    editingEvent,
    setEditingEvent,
    isModalOpen,
    setIsModalOpen,
    addEvent,
    updateEvent,
    deleteEvent,
    openScene,
  } = useTimelineState(onOpenFile);

  return (
    <div className="swrite-timeline-container">
      {/* Timeline Toolbar */}
      <div className="timeline-toolbar">
        <div className="toolbar-left">
          {/* Order Toggle: Chronological vs Narrative */}
          <div className="order-mode-toggle">
            <button
              className={`order-btn ${sortMode === 'chronological' ? 'active' : ''}`}
              onClick={() => setSortMode('chronological')}
              title="Order by Story Chronology (Past to Future)"
            >
              <ArrowUpDown size={14} />
              <span>Chronological Order</span>
            </button>
            <button
              className={`order-btn ${sortMode === 'narrative' ? 'active' : ''}`}
              onClick={() => setSortMode('narrative')}
              title="Order by Manuscript Scene Appearance"
            >
              <BookOpen size={14} />
              <span>Narrative Order</span>
            </button>
          </div>

          {/* Marker Filter */}
          <div className="marker-filter-pills">
            {MARKER_FILTERS.map((m) => (
              <button
                key={m}
                className={`marker-pill ${filterMarker === m ? 'active' : ''}`}
                onClick={() => setFilterMarker(m)}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Search Filter */}
          <div className="timeline-search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="timeline-search-input"
            />
          </div>
        </div>

        <div className="toolbar-right">
          <button
            onClick={() => {
              setEditingEvent(null);
              setIsModalOpen(true);
            }}
            className="timeline-add-btn"
            title="Add New Timeline Event"
          >
            <Plus size={14} />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Main Timeline Lane */}
      <div className="timeline-main-lane">
        {rawEventCount === 0 ? (
          <div className="timeline-empty-state">
            <Calendar size={32} className="empty-icon" />
            <h3>No Timeline Events Mapped</h3>
            <p>
              Map the key chronology of your story without forcing rigid database constraints.
            </p>
            <button
              onClick={() => {
                setEditingEvent(null);
                setIsModalOpen(true);
              }}
              className="timeline-add-btn primary"
            >
              + Create First Event
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="timeline-empty-state">
            <p>No events match your current filter or search query.</p>
          </div>
        ) : (
          <div className="timeline-events-vertical-list">
            <div className="timeline-vertical-line" />
            {events.map((event) => (
              <TimelineEventCard
                key={event.id}
                event={event}
                onEdit={(evt) => {
                  setEditingEvent(evt);
                  setIsModalOpen(true);
                }}
                onDelete={deleteEvent}
                onOpenScene={openScene}
              />
            ))}
          </div>
        )}
      </div>

      {/* Event Edit / Create Modal */}
      <EventEditModal
        open={isModalOpen}
        event={editingEvent}
        onSave={(data) => {
          if ('id' in data) {
            updateEvent(data as TimelineEvent);
          } else {
            addEvent(data);
          }
        }}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
      />
    </div>
  );
};
