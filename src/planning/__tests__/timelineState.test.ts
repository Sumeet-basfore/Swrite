import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimelineState } from '../timeline/useTimelineState';
import { TimelineEvent } from '../../types/ipc';
import { SwriteIpc } from '../../lib/ipc';

vi.mock('../../lib/ipc', () => ({
  SwriteIpc: {
    timelineLoad: vi.fn(),
    timelineSave: vi.fn(),
  },
}));

describe('useTimelineState Hook', () => {
  const sampleEvents: TimelineEvent[] = [
    {
      id: 'evt-1',
      title: 'Fall of the Citadel',
      temporal_position: 'Year 420, High Autumn',
      narrative_marker: 'Backstory',
      linked_scene: 'Manuscript/Act 1/Chapter 01.md',
      order_index: 1,
      description: 'The ancient citadel fell to the rebels.',
      notes: 'Affects the protagonist heritage.',
    },
    {
      id: 'evt-2',
      title: 'The Great Feast',
      temporal_position: 'Present Day, Day 1',
      narrative_marker: 'Chronological',
      linked_scene: 'Manuscript/Act 1/Chapter 02.md',
      order_index: 2,
      description: 'Celebration before the envoy departs.',
      notes: 'Tension between houses.',
    },
    {
      id: 'evt-3',
      title: 'Memory of Fire',
      temporal_position: '10 Years Ago',
      narrative_marker: 'Flashback',
      linked_scene: 'Manuscript/Act 2/Chapter 04.md',
      order_index: 3,
      description: 'Recollection of childhood escape.',
      notes: 'Reveals the truth about the medallion.',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(SwriteIpc.timelineLoad).mockResolvedValue({
      events: sampleEvents,
    });
    vi.mocked(SwriteIpc.timelineSave).mockResolvedValue(undefined);
  });

  it('loads timeline events on initialization', async () => {
    const onOpenFile = vi.fn();
    const { result } = renderHook(() => useTimelineState(onOpenFile));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.events.length).toBe(3);
    expect(result.current.rawEventCount).toBe(3);
    expect(result.current.isLoading).toBe(false);
  });

  it('filters events by narrative marker', async () => {
    const onOpenFile = vi.fn();
    const { result } = renderHook(() => useTimelineState(onOpenFile));

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.setFilterMarker('Flashback');
    });

    expect(result.current.events.length).toBe(1);
    expect(result.current.events[0].title).toBe('Memory of Fire');
  });

  it('filters events by search query across title and description', async () => {
    const onOpenFile = vi.fn();
    const { result } = renderHook(() => useTimelineState(onOpenFile));

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.setSearchQuery('citadel');
    });

    expect(result.current.events.length).toBe(1);
    expect(result.current.events[0].title).toBe('Fall of the Citadel');
  });

  it('adds and updates events with persistence', async () => {
    const onOpenFile = vi.fn();
    const { result } = renderHook(() => useTimelineState(onOpenFile));

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.addEvent({
        title: 'Ambush in the Pass',
        temporal_position: 'Day 3, Nightfall',
        narrative_marker: 'Chronological',
        linked_scene: 'Manuscript/Chapter 03.md',
        description: 'Night ambush by the mountain watch.',
        notes: '',
      });
    });

    expect(result.current.events.length).toBe(4);
    expect(SwriteIpc.timelineSave).toHaveBeenCalled();
  });

  it('deletes an event by id', async () => {
    const onOpenFile = vi.fn();
    const { result } = renderHook(() => useTimelineState(onOpenFile));

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.deleteEvent('evt-2');
    });

    expect(result.current.events.length).toBe(2);
    expect(result.current.events.find((e) => e.id === 'evt-2')).toBeUndefined();
    expect(SwriteIpc.timelineSave).toHaveBeenCalled();
  });
});
