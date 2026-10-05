import { useState, useEffect, useCallback } from 'react';
import { SwriteIpc } from '../../lib/ipc';
import { TimelineData, TimelineEvent } from '../../types/ipc';

export function useTimelineState(onOpenFile: (path: string) => void) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sortMode, setSortMode] = useState<'chronological' | 'narrative'>('chronological');
  const [filterMarker, setFilterMarker] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const loadTimeline = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await SwriteIpc.timelineLoad();
      setEvents(data.events || []);
    } catch (e) {
      console.error('Failed to load timeline:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const saveEvents = async (newEvents: TimelineEvent[]) => {
    setEvents(newEvents);
    try {
      const data: TimelineData = { events: newEvents };
      await SwriteIpc.timelineSave(data);
    } catch (e) {
      console.error('Failed to save timeline:', e);
    }
  };

  const addEvent = (event: Omit<TimelineEvent, 'id' | 'order_index'>) => {
    const newEvent: TimelineEvent = {
      ...event,
      id: crypto.randomUUID(),
      order_index: events.length + 1,
    };
    const updated = [...events, newEvent];
    saveEvents(updated);
  };

  const updateEvent = (updated: TimelineEvent) => {
    const list = events.map((e) => (e.id === updated.id ? updated : e));
    saveEvents(list);
  };

  const deleteEvent = (id: string) => {
    const list = events.filter((e) => e.id !== id);
    saveEvents(list);
  };

  const openScene = (scenePath: string) => {
    onOpenFile(scenePath);
  };

  // Filtered & sorted events
  const displayedEvents = events
    .filter((e) => {
      if (filterMarker !== 'All' && e.narrative_marker !== filterMarker) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.temporal_position.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.notes.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortMode === 'chronological') {
        return a.order_index - b.order_index;
      } else {
        // Narrative order: group by linked scene path if available
        const aScene = a.linked_scene || 'ZZZ';
        const bScene = b.linked_scene || 'ZZZ';
        return aScene.localeCompare(bScene, undefined, { numeric: true });
      }
    });

  return {
    events: displayedEvents,
    rawEventCount: events.length,
    isLoading,
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
  };
}
