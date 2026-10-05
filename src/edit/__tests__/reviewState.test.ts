import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReviewState } from '../review/useReviewState';
import { SwriteIpc } from '../../lib/ipc';
import { DiscoveredFile } from '../../types/ipc';

vi.mock('../../lib/ipc', () => ({
  SwriteIpc: {
    commentsLoad: vi.fn(),
    revisionsLoad: vi.fn(),
    dictionaryLoad: vi.fn(),
    proofreadText: vi.fn(),
    fileRead: vi.fn(),
    fileWrite: vi.fn(),
    commentResolve: vi.fn(),
    revisionUpdate: vi.fn(),
    dictionaryAddIgnore: vi.fn(),
  },
}));

describe('useReviewState', () => {
  const manuscriptFiles: DiscoveredFile[] = [
    {
      relative_path: 'Manuscript/Chapter-01.md',
      name: 'Chapter-01.md',
      is_directory: false,
      format: 'markdown',
      size_bytes: 1000,
    },
    {
      relative_path: 'Manuscript/Chapter-02.md',
      name: 'Chapter-02.md',
      is_directory: false,
      format: 'markdown',
      size_bytes: 1000,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (SwriteIpc.commentsLoad as any).mockResolvedValue({
      comments: [
        {
          id: 'c1',
          anchor: {
            document_id: 'doc1',
            relative_path: 'Manuscript/Chapter-01.md',
            start_offset: 10,
            end_offset: 25,
            exact_text: 'the ancient bell',
            prefix_context: '',
            suffix_context: '',
          },
          created_at: '2026-10-01T00:00:00Z',
          updated_at: '2026-10-01T00:00:00Z',
          content: 'Clarify bell sound',
          replies: [],
          status: 'open',
        },
      ],
    });

    (SwriteIpc.revisionsLoad as any).mockResolvedValue({
      revisions: [
        {
          id: 'r1',
          title: 'Improve dialogue cadence',
          description: 'Make lines sharper',
          category: 'Dialogue',
          severity: 'high',
          status: 'open',
          target_path: 'Manuscript/Chapter-01.md',
          created_at: '2026-10-01T00:00:00Z',
          updated_at: '2026-10-01T00:00:00Z',
        },
      ],
    });

    (SwriteIpc.dictionaryLoad as any).mockResolvedValue({
      custom_words: [],
      ignored_patterns: [],
      ignored_findings: [],
    });

    (SwriteIpc.fileRead as any).mockResolvedValue('The the quick brown fox jumped , over the lazy dog.');

    (SwriteIpc.proofreadText as any).mockResolvedValue([
      {
        id: 'dup_The_0',
        rule_id: 'repeated_consecutive_word',
        message: 'Repeated word "The"',
        severity: 'warning',
        start_offset: 0,
        end_offset: 7,
        line_number: 1,
        column_number: 1,
        matched_text: 'The the',
        suggested_replacement: 'The',
      },
    ]);
  });

  it('aggregates comments, revisions, and proofreading findings in scope', async () => {
    const { result } = renderHook(() =>
      useReviewState({
        currentDocumentPath: 'Manuscript/Chapter-01.md',
        manuscriptFiles,
      })
    );

    // Wait for async load
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.items.length).toBe(3);
    const types = result.current.items.map((i) => i.type);
    expect(types).toContain('comment');
    expect(types).toContain('revision');
    expect(types).toContain('proofreading');
  });

  it('filters items by type correctly', async () => {
    const { result } = renderHook(() =>
      useReviewState({
        currentDocumentPath: 'Manuscript/Chapter-01.md',
        manuscriptFiles,
      })
    );

    await act(async () => {
      await result.current.refresh();
    });

    act(() => {
      result.current.setFilters((prev) => ({ ...prev, typeFilter: 'comments' }));
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].type).toBe('comment');
  });

  it('resolves items and removes them from the active queue', async () => {
    const { result } = renderHook(() =>
      useReviewState({
        currentDocumentPath: 'Manuscript/Chapter-01.md',
        manuscriptFiles,
      })
    );

    await act(async () => {
      await result.current.refresh();
    });

    const commentItem = result.current.items.find((i) => i.type === 'comment')!;
    await act(async () => {
      await result.current.resolveItem(commentItem);
    });

    expect(SwriteIpc.commentResolve).toHaveBeenCalledWith('c1', true);
    expect(result.current.items.find((i) => i.id === 'c1')).toBeUndefined();
  });

  it('applies proofreading replacement and updates document', async () => {
    const { result } = renderHook(() =>
      useReviewState({
        currentDocumentPath: 'Manuscript/Chapter-01.md',
        manuscriptFiles,
      })
    );

    await act(async () => {
      await result.current.refresh();
    });

    const proofItem = result.current.items.find((i) => i.type === 'proofreading')!;
    await act(async () => {
      await result.current.applyReplacement(proofItem);
    });

    expect(SwriteIpc.fileWrite).toHaveBeenCalledWith(
      'Manuscript/Chapter-01.md',
      'The quick brown fox jumped , over the lazy dog.'
    );
    expect(SwriteIpc.dictionaryAddIgnore).toHaveBeenCalled();
  });
});
