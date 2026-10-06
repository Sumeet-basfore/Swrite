import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMoodboardState } from '../moodboard/useMoodboardState';
import { MoodboardData } from '../../types/ipc';
import { SwriteIpc } from '../../lib/ipc';

vi.mock('../../lib/ipc', () => ({
  SwriteIpc: {
    moodboardLoad: vi.fn(),
    moodboardSave: vi.fn(),
  },
}));

describe('useMoodboardState Hook', () => {
  const initialBoard: MoodboardData = {
    id: 'mb-1',
    name: 'Castles & High Peaks',
    canvas: {
      pan_x: 100,
      pan_y: 50,
      zoom: 1.0,
    },
    items: [
      {
        type: 'text',
        id: 'txt-1',
        x: 120,
        y: 80,
        width: 200,
        height: 60,
        text: 'Ancient Ruin Ambience',
        style: 'title',
        z_index: 1,
      },
      {
        type: 'color',
        id: 'col-1',
        x: 350,
        y: 80,
        width: 80,
        height: 80,
        hex: '#3B4252',
        label: 'Storm Grey',
        z_index: 2,
      },
    ],
    updated_at: 1700000000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(SwriteIpc.moodboardLoad).mockResolvedValue(initialBoard);
    vi.mocked(SwriteIpc.moodboardSave).mockResolvedValue(undefined);
  });

  it('loads moodboard state from disk on initialization', async () => {
    const onOpen = vi.fn();
    const { result } = renderHook(() =>
      useMoodboardState('Desk/Moodboards/Castles/board.json', onOpen)
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.board).not.toBeNull();
    expect(result.current.board?.name).toBe('Castles & High Peaks');
    expect(result.current.board?.items.length).toBe(2);
    expect(result.current.isLoading).toBe(false);
  });

  it('adds new items (text, color, note) and updates state', async () => {
    const onOpen = vi.fn();
    const { result } = renderHook(() =>
      useMoodboardState('Desk/Moodboards/Castles/board.json', onOpen)
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.addTextItem('Secret Passage', 'body');
    });

    expect(result.current.board?.items.length).toBe(3);
    const added = result.current.board?.items[2];
    expect(added?.type).toBe('text');
    if (added?.type === 'text') {
      expect(added.text).toBe('Secret Passage');
    }

    act(() => {
      result.current.addColorItem('#A3BE8C', 'Moss Green');
    });

    expect(result.current.board?.items.length).toBe(4);
  });

  it('moves and resizes selected items', async () => {
    const onOpen = vi.fn();
    const { result } = renderHook(() =>
      useMoodboardState('Desk/Moodboards/Castles/board.json', onOpen)
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.selectItem('txt-1');
      result.current.moveItems(50, 30);
    });

    const moved = result.current.board?.items.find((i) => i.id === 'txt-1');
    expect(moved?.x).toBe(170);
    expect(moved?.y).toBe(110);

    act(() => {
      result.current.resizeItem('txt-1', 250, 100);
    });

    const resized = result.current.board?.items.find((i) => i.id === 'txt-1');
    expect(resized?.width).toBe(250);
    expect(resized?.height).toBe(100);
  });

  it('duplicates and deletes selected items', async () => {
    const onOpen = vi.fn();
    const { result } = renderHook(() =>
      useMoodboardState('Desk/Moodboards/Castles/board.json', onOpen)
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.selectItem('col-1');
      result.current.duplicateSelected();
    });

    expect(result.current.board?.items.length).toBe(3);

    act(() => {
      result.current.deleteSelected();
    });

    expect(result.current.board?.items.length).toBe(2);
  });

  it('handles canvas pan and zoom clamping', async () => {
    const onOpen = vi.fn();
    const { result } = renderHook(() =>
      useMoodboardState('Desk/Moodboards/Castles/board.json', onOpen)
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.setPan(200, 150);
      result.current.setZoom(1.5);
    });

    expect(result.current.board?.canvas.pan_x).toBe(200);
    expect(result.current.board?.canvas.pan_y).toBe(150);
    expect(result.current.board?.canvas.zoom).toBe(1.5);

    // Zoom clamping below 0.2
    act(() => {
      result.current.setZoom(0.05);
    });
    expect(result.current.board?.canvas.zoom).toBe(0.2);
  });
});
