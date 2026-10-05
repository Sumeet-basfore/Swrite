import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistoryDiffState } from '../history/useHistoryDiffState';
import { SwriteIpc } from '../../lib/ipc';

vi.mock('../../lib/ipc', () => ({
  SwriteIpc: {
    documentRead: vi.fn(),
    fileRead: vi.fn(),
    historyList: vi.fn(),
    historyDiffCurrent: vi.fn(),
    historyDiffSnapshots: vi.fn(),
    historyRecord: vi.fn(),
    historySafeRestore: vi.fn(),
  },
}));

describe('useHistoryDiffState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (SwriteIpc.documentRead as any).mockResolvedValue({
      id: 'doc_ch1',
      title: 'Chapter 1',
    });
    (SwriteIpc.fileRead as any).mockResolvedValue('Line 1\nLine 2 updated\nLine 3\n');
    (SwriteIpc.historyList as any).mockResolvedValue([
      {
        snapshot_id: 'snap_02',
        document_id: 'doc_ch1',
        relative_path: 'Manuscript/Chapter-01.md',
        timestamp: '2026-10-02T00:00:00Z',
        content_hash: 'abc1234',
        label: 'Second revision',
      },
      {
        snapshot_id: 'snap_01',
        document_id: 'doc_ch1',
        relative_path: 'Manuscript/Chapter-01.md',
        timestamp: '2026-10-01T00:00:00Z',
        content_hash: 'def5678',
        label: 'Initial draft',
      },
    ]);

    (SwriteIpc.historyDiffCurrent as any).mockResolvedValue({
      chunks: [
        { origin: 'same', old_line_num: 1, new_line_num: 1, content: 'Line 1' },
        { origin: 'removed', old_line_num: 2, new_line_num: null, content: 'Line 2 old' },
        { origin: 'added', old_line_num: null, new_line_num: 2, content: 'Line 2 updated' },
        { origin: 'same', old_line_num: 3, new_line_num: 3, content: 'Line 3' },
      ],
      additions_count: 1,
      deletions_count: 1,
      modifications_count: 1,
    });
  });

  it('loads snapshots and computes diff against current content', async () => {
    const { result } = renderHook(() =>
      useHistoryDiffState({ currentDocumentPath: 'Manuscript/Chapter-01.md' })
    );

    // Wait for async effect to load
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    expect(result.current.documentId).toBe('doc_ch1');
    expect(result.current.snapshots.length).toBe(2);
    expect(result.current.selectedSnapshotId).toBe('snap_02');
    expect(result.current.diffResult?.additions_count).toBe(1);
    expect(result.current.diffResult?.deletions_count).toBe(1);
  });

  it('performs safe restore capturing safety snapshot', async () => {
    (SwriteIpc.historySafeRestore as any).mockResolvedValue('Restored content');

    const { result } = renderHook(() =>
      useHistoryDiffState({ currentDocumentPath: 'Manuscript/Chapter-01.md' })
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 20));
    });

    await act(async () => {
      const res = await result.current.safeRestore('snap_01');
      expect(res).toBe('Restored content');
    });

    expect(SwriteIpc.historySafeRestore).toHaveBeenCalledWith(
      'doc_ch1',
      'Manuscript/Chapter-01.md',
      'snap_01',
      'Line 1\nLine 2 updated\nLine 3\n'
    );
  });
});
