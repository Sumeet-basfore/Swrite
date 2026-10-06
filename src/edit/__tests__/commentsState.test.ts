import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCommentsState } from '../comments/useCommentsState';
import { SwriteIpc } from '../../lib/ipc';

vi.mock('../../lib/ipc', () => ({
  SwriteIpc: {
    commentsLoad: vi.fn(),
    commentsSave: vi.fn(),
    commentResolve: vi.fn(),
    commentDelete: vi.fn(),
    fileRead: vi.fn(),
  },
}));

describe('useCommentsState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (SwriteIpc.commentsLoad as any).mockResolvedValue({
      comments: [
        {
          id: 'c1',
          anchor: {
            document_id: 'doc1',
            relative_path: 'Manuscript/Chapter-01.md',
            start_offset: 0,
            end_offset: 12,
            exact_text: 'Ancient City',
            prefix_context: '',
            suffix_context: '',
          },
          created_at: '2026-10-01T00:00:00Z',
          updated_at: '2026-10-01T00:00:00Z',
          content: 'Add description of the towers',
          replies: [
            {
              id: 'r1',
              created_at: '2026-10-01T01:00:00Z',
              content: 'Will add obsidian spires',
            },
          ],
          status: 'open',
        },
      ],
    });

    (SwriteIpc.fileRead as any).mockResolvedValue('Ancient City stands upon the hill.');
  });

  it('loads comments and validates intact anchors', async () => {
    const { result } = renderHook(() => useCommentsState('Manuscript/Chapter-01.md'));

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.comments.length).toBe(1);
    expect(result.current.comments[0].replies.length).toBe(1);
    expect(result.current.staleMap['c1']?.isStale).toBe(false);
  });

  it('detects stale anchors when text moves or changes', async () => {
    (SwriteIpc.fileRead as any).mockResolvedValue('Far away, the Ancient City stands upon the hill.');

    const { result } = renderHook(() => useCommentsState('Manuscript/Chapter-01.md'));

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.staleMap['c1']?.isStale).toBe(true);
    expect(result.current.staleMap['c1']?.reason).toBe('offset_shifted');
  });

  it('adds reply to comment thread', async () => {
    const { result } = renderHook(() => useCommentsState('Manuscript/Chapter-01.md'));

    await act(async () => {
      await result.current.refresh();
    });

    await act(async () => {
      await result.current.addReply('c1', 'Second reply from editor');
    });

    expect(SwriteIpc.commentsSave).toHaveBeenCalled();
    const updated = result.current.comments.find((c) => c.id === 'c1');
    expect(updated?.replies.length).toBe(2);
    expect(updated?.replies[1].content).toBe('Second reply from editor');
  });

  it('resolves and deletes comment threads', async () => {
    const { result } = renderHook(() => useCommentsState('Manuscript/Chapter-01.md'));

    await act(async () => {
      await result.current.refresh();
    });

    await act(async () => {
      await result.current.resolveComment('c1', true);
    });

    expect(SwriteIpc.commentResolve).toHaveBeenCalledWith('c1', true);

    await act(async () => {
      await result.current.deleteComment('c1');
    });

    expect(SwriteIpc.commentDelete).toHaveBeenCalledWith('c1');
    expect(result.current.comments.length).toBe(0);
  });
});
