import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOutlineState } from '../outline/useOutlineState';
import { DiscoveredFile } from '../../types/ipc';
import { SwriteIpc } from '../../lib/ipc';

vi.mock('../../lib/ipc', () => ({
  SwriteIpc: {
    outlineMetaLoad: vi.fn(),
    outlineMetaUpdateItem: vi.fn(),
    fileCreate: vi.fn(),
    fileExists: vi.fn(),
  },
}));

describe('useOutlineState Hook', () => {
  const sampleManuscriptFiles: DiscoveredFile[] = [
    {
      relative_path: 'Manuscript/Act 1',
      name: 'Act 1',
      is_directory: true,
      format: 'txt',
      size_bytes: 0,
    },
    {
      relative_path: 'Manuscript/Act 1/Chapter 01.md',
      name: 'Chapter 01.md',
      is_directory: false,
      format: 'markdown',
      size_bytes: 500,
    },
    {
      relative_path: 'Manuscript/Act 1/Chapter 02.md',
      name: 'Chapter 02.md',
      is_directory: false,
      format: 'markdown',
      size_bytes: 600,
    },
    {
      relative_path: 'Manuscript/Act 2',
      name: 'Act 2',
      is_directory: true,
      format: 'txt',
      size_bytes: 0,
    },
    {
      relative_path: 'Manuscript/Act 2/Chapter 03.md',
      name: 'Chapter 03.md',
      is_directory: false,
      format: 'markdown',
      size_bytes: 700,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(SwriteIpc.outlineMetaLoad).mockResolvedValue({
      items: [
        {
          relative_path: 'Manuscript/Act 1/Chapter 01.md',
          title: 'The Arrival',
          status: 'Drafted',
          summary: 'Hero arrives at the gate.',
          notes: 'Ensure gatekeeper has a distinct voice.',
        },
      ],
    });
  });

  it('correctly constructs hierarchical outline nodes from manuscript files', async () => {
    const onOpenFile = vi.fn();
    const onRefreshFiles = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useOutlineState(sampleManuscriptFiles, onOpenFile, onRefreshFiles)
    );

    // Initial structure
    const tree = result.current.outlineTree;
    expect(tree.length).toBe(2); // Act 1 and Act 2

    expect(tree[0].name).toBe('Act 1');
    expect(tree[0].level).toBe('act');
    expect(tree[0].children.length).toBe(2); // Chapter 01 and Chapter 02

    expect(tree[1].name).toBe('Act 2');
    expect(tree[1].level).toBe('act');
    expect(tree[1].children.length).toBe(1); // Chapter 03
  });

  it('merges outline metadata title, status, summary, and notes', async () => {
    const onOpenFile = vi.fn();
    const onRefreshFiles = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useOutlineState(sampleManuscriptFiles, onOpenFile, onRefreshFiles)
    );

    // Wait for microtasks
    await act(async () => {
      await Promise.resolve();
    });

    const act1 = result.current.outlineTree[0];
    const ch1 = act1.children[0];

    expect(ch1.name).toBe('The Arrival');
    expect(ch1.meta?.status).toBe('Drafted');
    expect(ch1.meta?.summary).toBe('Hero arrives at the gate.');
  });

  it('updates item status and persists via IPC', async () => {
    const onOpenFile = vi.fn();
    const onRefreshFiles = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useOutlineState(sampleManuscriptFiles, onOpenFile, onRefreshFiles)
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.updateStatus(
        'Manuscript/Act 1/Chapter 02.md',
        'Complete'
      );
    });

    expect(SwriteIpc.outlineMetaUpdateItem).toHaveBeenCalledWith(
      expect.objectContaining({
        relative_path: 'Manuscript/Act 1/Chapter 02.md',
        status: 'Complete',
      })
    );
  });

  it('toggles expansion state and selected item', async () => {
    const onOpenFile = vi.fn();
    const onRefreshFiles = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useOutlineState(sampleManuscriptFiles, onOpenFile, onRefreshFiles)
    );

    act(() => {
      result.current.toggleExpand('Manuscript/Act 1');
      result.current.setSelectedItemPath('Manuscript/Act 1/Chapter 01.md');
    });

    expect(result.current.expandedNodes.has('Manuscript/Act 1')).toBe(true);
    expect(result.current.selectedItemPath).toBe('Manuscript/Act 1/Chapter 01.md');

    act(() => {
      result.current.toggleExpand('Manuscript/Act 1');
    });

    expect(result.current.expandedNodes.has('Manuscript/Act 1')).toBe(false);
  });

  it('creates new chapter and invokes onRefreshFiles', async () => {
    const onOpenFile = vi.fn();
    const onRefreshFiles = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useOutlineState(sampleManuscriptFiles, onOpenFile, onRefreshFiles)
    );

    await act(async () => {
      const newPath = await result.current.createChapter();
      expect(newPath).toBe('Manuscript/Chapter 04.md');
    });

    expect(SwriteIpc.fileCreate).toHaveBeenCalledWith(
      'Manuscript/Chapter 04.md',
      expect.stringContaining('# Chapter 4')
    );
    expect(onRefreshFiles).toHaveBeenCalled();
  });
});
