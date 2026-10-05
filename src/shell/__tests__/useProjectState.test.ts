import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProjectState } from '../useProjectState';
import { SwriteIpc } from '../../lib/ipc';

vi.mock('../../lib/ipc', () => ({
  SwriteIpc: {
    projectCreate: vi.fn().mockResolvedValue({
      project_id: 'proj-123',
      name: 'Test Novel',
      root_path: '/tmp/test-novel',
      manifest: { schema_version: 1, project_id: 'proj-123', name: 'Test Novel', document_identities: {} },
      file_counts: { manuscript_count: 1, planning_count: 0, desk_count: 0, asset_count: 0 },
    }),
    projectOpen: vi.fn().mockResolvedValue({
      project_id: 'proj-123',
      name: 'Test Novel',
      root_path: '/tmp/test-novel',
      manifest: { schema_version: 1, project_id: 'proj-123', name: 'Test Novel', document_identities: {} },
      file_counts: { manuscript_count: 1, planning_count: 0, desk_count: 0, asset_count: 0 },
    }),
    projectDiscover: vi.fn().mockResolvedValue({
      manuscript_files: [
        { relative_path: 'Manuscript/Chapter 01.md', name: 'Chapter 01.md', is_directory: false, format: 'markdown', size_bytes: 100 },
      ],
      planning_files: [],
      desk_files: [],
      asset_files: [],
      other_visible_files: [],
    }),
    projectGetUiState: vi.fn().mockResolvedValue({
      expanded_folders: ['Manuscript'],
      sidebar_collapsed: false,
    }),
    projectSetUiState: vi.fn().mockResolvedValue(undefined),
    projectGetRecents: vi.fn().mockResolvedValue([]),
    projectAddRecent: vi.fn().mockResolvedValue(undefined),
    fileRead: vi.fn().mockResolvedValue('# Chapter 1\n\nProse content.'),
    fileWrite: vi.fn().mockResolvedValue(undefined),
    fileCreate: vi.fn().mockResolvedValue('Manuscript/Chapter 02.md'),
    fileMkdir: vi.fn().mockResolvedValue(undefined),
    fileRename: vi.fn().mockResolvedValue(undefined),
    fileDuplicate: vi.fn().mockResolvedValue('Manuscript/Chapter 01 copy.md'),
    fileDeleteSafe: vi.fn().mockResolvedValue(undefined),
    fileExists: vi.fn().mockResolvedValue(false),
    watchStart: vi.fn().mockResolvedValue(undefined),
    searchQuery: vi.fn().mockResolvedValue({
      query: 'Julian',
      total_matches: 1,
      matches: [
        { relative_path: 'Manuscript/Chapter 01.md', line_number: 3, character_offset: 10, matched_text: 'Julian', excerpt: 'Julian stepped forward' },
      ],
    }),
  },
}));

describe('useProjectState Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes project, loads files, and opens first chapter', async () => {
    const { result } = renderHook(() => useProjectState('/tmp/test-novel', 'Test Novel'));

    await waitFor(() => {
      expect(result.current.activeProject?.name).toBe('Test Novel');
      expect(result.current.selectedFile).toBe('Manuscript/Chapter 01.md');
      expect(result.current.fileContent).toBe('# Chapter 1\n\nProse content.');
    });
  });

  it('toggles folder expansion state', async () => {
    const { result } = renderHook(() => useProjectState('/tmp/test-novel', 'Test Novel'));

    await waitFor(() => {
      expect(result.current.activeProject).not.toBeNull();
    });

    act(() => {
      result.current.toggleFolder('Manuscript/Act 1');
    });

    expect(result.current.expandedFolders.has('Manuscript/Act 1')).toBe(true);

    act(() => {
      result.current.toggleFolder('Manuscript/Act 1');
    });

    expect(result.current.expandedFolders.has('Manuscript/Act 1')).toBe(false);
  });

  it('creates new chapter with sequential naming', async () => {
    const { result } = renderHook(() => useProjectState('/tmp/test-novel', 'Test Novel'));

    await waitFor(() => {
      expect(result.current.activeProject).not.toBeNull();
    });

    let newPath = '';
    await act(async () => {
      newPath = await result.current.createNewChapter();
    });

    expect(SwriteIpc.fileCreate).toHaveBeenCalledWith('Manuscript/Chapter 02.md', expect.stringContaining('# Chapter 2'));
    expect(newPath).toBe('Manuscript/Chapter 02.md');
  });

  it('duplicates file with independent identity', async () => {
    const { result } = renderHook(() => useProjectState('/tmp/test-novel', 'Test Novel'));

    await waitFor(() => {
      expect(result.current.activeProject).not.toBeNull();
    });

    let dupPath = '';
    await act(async () => {
      dupPath = await result.current.duplicateFile('Manuscript/Chapter 01.md');
    });

    expect(SwriteIpc.fileDuplicate).toHaveBeenCalledWith('Manuscript/Chapter 01.md');
    expect(dupPath).toBe('Manuscript/Chapter 01 copy.md');
  });

  it('performs safe delete to trash', async () => {
    const { result } = renderHook(() => useProjectState('/tmp/test-novel', 'Test Novel'));

    await waitFor(() => {
      expect(result.current.activeProject).not.toBeNull();
    });

    await act(async () => {
      await result.current.deleteFileSafe('Manuscript/Chapter 01.md');
    });

    expect(SwriteIpc.fileDeleteSafe).toHaveBeenCalledWith('Manuscript/Chapter 01.md');
    expect(result.current.selectedFile).toBeNull();
  });

  it('executes project search and updates matches', async () => {
    const { result } = renderHook(() => useProjectState('/tmp/test-novel', 'Test Novel'));

    await waitFor(() => {
      expect(result.current.activeProject).not.toBeNull();
    });

    await act(async () => {
      await result.current.searchProject('Julian');
    });

    expect(SwriteIpc.searchQuery).toHaveBeenCalledWith('Julian');
    expect(result.current.searchResult?.total_matches).toBe(1);
    expect(result.current.searchResult?.matches[0].matched_text).toBe('Julian');
  });
});
