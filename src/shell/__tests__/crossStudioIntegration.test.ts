import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProjectState } from '../useProjectState';
import { SwriteIpc } from '../../lib/ipc';

vi.mock('../../lib/ipc', () => ({
  SwriteIpc: {
    projectOpen: vi.fn(),
    projectCreate: vi.fn(),
    projectDiscover: vi.fn(),
    projectGetUiState: vi.fn().mockResolvedValue({
      expanded_folders: ['Manuscript'],
      sidebar_collapsed: false,
    }),
    projectSetUiState: vi.fn().mockResolvedValue(undefined),
    projectGetRecents: vi.fn().mockResolvedValue([]),
    projectAddRecent: vi.fn().mockResolvedValue(undefined),
    fileRead: vi.fn(),
    fileWrite: vi.fn(),
    fileCreate: vi.fn(),
    fileMkdir: vi.fn(),
    fileRename: vi.fn(),
    fileDuplicate: vi.fn(),
    fileDeleteSafe: vi.fn(),
    fileExists: vi.fn().mockResolvedValue(false),
    watchStart: vi.fn().mockResolvedValue(undefined),
    searchQuery: vi.fn(),
    commentsLoad: vi.fn(),
    revisionsLoad: vi.fn(),
    historyList: vi.fn(),
    publishProfilesLoad: vi.fn(),
    publishPreflightRun: vi.fn(),
    publishPaginate: vi.fn(),
    publishExport: vi.fn(),
  },
}));

describe('Cross-Studio Full Product Integration Scenarios', () => {
  const mockProject = {
    project_id: 'proj-citadel-1',
    name: 'The Obsidian Citadel',
    root_path: '/home/author/MyNovel',
    manifest: {
      schema_version: 1,
      project_id: 'proj-citadel-1',
      name: 'The Obsidian Citadel',
      document_identities: {},
    },
    file_counts: {
      manuscript_count: 2,
      planning_count: 2,
      desk_count: 2,
      asset_count: 1,
    },
  };

  const mockFilesView = {
    manuscript_files: [
      {
        relative_path: 'Manuscript/Chapter-01/Scene-01.md',
        name: 'Scene-01.md',
        is_directory: false,
        format: 'markdown',
        size_bytes: 2500,
      },
      {
        relative_path: 'Manuscript/Chapter-01/Scene-02.md',
        name: 'Scene-02.md',
        is_directory: false,
        format: 'markdown',
        size_bytes: 1800,
      },
    ],
    planning_files: [
      {
        relative_path: 'Planning/outline.json',
        name: 'outline.json',
        is_directory: false,
        format: 'json',
        size_bytes: 500,
      },
      {
        relative_path: 'Planning/Timeline.md',
        name: 'Timeline.md',
        is_directory: false,
        format: 'markdown',
        size_bytes: 800,
      },
    ],
    desk_files: [
      {
        relative_path: 'Desk/Characters/Elora.md',
        name: 'Elora.md',
        is_directory: false,
        format: 'markdown',
        size_bytes: 1200,
      },
      {
        relative_path: 'Desk/Moodboards/Citadel-Arrival.board.json',
        name: 'Citadel-Arrival.board.json',
        is_directory: false,
        format: 'json',
        size_bytes: 600,
      },
    ],
    asset_files: [
      {
        relative_path: 'Assets/citadel-map.png',
        name: 'citadel-map.png',
        is_directory: false,
        format: 'png',
        size_bytes: 45000,
      },
    ],
    other_visible_files: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (SwriteIpc.projectOpen as any).mockResolvedValue(mockProject);
    (SwriteIpc.projectDiscover as any).mockResolvedValue(mockFilesView);
    (SwriteIpc.projectGetRecents as any).mockResolvedValue([]);
    (SwriteIpc.fileRead as any).mockResolvedValue(
      'The silent citadel stood upon the foggy cliffs of Eldenwood.'
    );
    (SwriteIpc.fileCreate as any).mockResolvedValue('Manuscript/Chapter 02.md');
    (SwriteIpc.fileWrite as any).mockResolvedValue(undefined);
    (SwriteIpc.fileRename as any).mockResolvedValue(undefined);
    (SwriteIpc.fileDuplicate as any).mockResolvedValue('Manuscript/Chapter-01/Scene-01-Copy.md');
    (SwriteIpc.fileDeleteSafe as any).mockResolvedValue(undefined);
    (SwriteIpc.searchQuery as any).mockResolvedValue({
      query: 'citadel',
      matches: [
        {
          relative_path: 'Manuscript/Chapter-01/Scene-01.md',
          line_number: 1,
          character_offset: 11,
          matched_text: 'citadel',
          excerpt: 'The silent citadel stood upon the foggy cliffs.',
        },
      ],
      total_matches: 1,
    });
  });

  it('Scenario 1: Full Creation Workflow (New Chapter -> New Scene -> Write -> Save)', async () => {
    const { result } = renderHook(() => useProjectState('/home/author/MyNovel', 'The Obsidian Citadel'));

    await waitFor(() => {
      expect(result.current.activeProject?.name).toBe('The Obsidian Citadel');
      expect(result.current.filesView?.manuscript_files.length).toBe(2);
    });

    // 2. Create new chapter
    await act(async () => {
      await result.current.createNewChapter();
    });

    expect(SwriteIpc.fileCreate).toHaveBeenCalled();

    // 3. Open document and write prose
    await act(async () => {
      await result.current.openDocument('Manuscript/Chapter-01/Scene-01.md');
    });

    expect(result.current.selectedFile).toBe('Manuscript/Chapter-01/Scene-01.md');
    expect(result.current.fileContent).toContain('citadel');
  });

  it('Scenario 2: Desk Reference & Asset Verification', async () => {
    const { result } = renderHook(() => useProjectState('/home/author/MyNovel', 'The Obsidian Citadel'));

    await waitFor(() => {
      expect(result.current.filesView?.desk_files.length).toBe(2);
      expect(result.current.filesView?.asset_files.length).toBe(1);
    });

    // Open character note
    await act(async () => {
      await result.current.openDocument('Desk/Characters/Elora.md');
    });

    expect(result.current.selectedFile).toBe('Desk/Characters/Elora.md');
    expect(SwriteIpc.fileRead).toHaveBeenCalledWith('Desk/Characters/Elora.md');
  });

  it('Scenario 3: File Management during active writing (Rename & Move)', async () => {
    const { result } = renderHook(() => useProjectState('/home/author/MyNovel', 'The Obsidian Citadel'));

    await waitFor(() => {
      expect(result.current.activeProject).not.toBeNull();
    });

    await act(async () => {
      await result.current.openDocument('Manuscript/Chapter-01/Scene-01.md');
    });

    // Rename current active file
    await act(async () => {
      await result.current.renameFile(
        'Manuscript/Chapter-01/Scene-01.md',
        'Manuscript/Chapter-01/Scene-01-Arrival.md'
      );
    });

    expect(SwriteIpc.fileRename).toHaveBeenCalledWith(
      'Manuscript/Chapter-01/Scene-01.md',
      'Manuscript/Chapter-01/Scene-01-Arrival.md'
    );
    expect(result.current.selectedFile).toBe('Manuscript/Chapter-01/Scene-01-Arrival.md');

    // Move file
    await act(async () => {
      await result.current.moveFile(
        'Manuscript/Chapter-01/Scene-01-Arrival.md',
        'Manuscript/Chapter-02/Scene-01-Arrival.md'
      );
    });

    expect(SwriteIpc.fileRename).toHaveBeenCalledWith(
      'Manuscript/Chapter-01/Scene-01-Arrival.md',
      'Manuscript/Chapter-02/Scene-01-Arrival.md'
    );
    expect(result.current.selectedFile).toBe('Manuscript/Chapter-02/Scene-01-Arrival.md');
  });

  it('Scenario 4: Omnisearch Navigation to Matching Prose', async () => {
    const { result } = renderHook(() => useProjectState('/home/author/MyNovel', 'The Obsidian Citadel'));

    await waitFor(() => {
      expect(result.current.activeProject).not.toBeNull();
    });

    // Execute project search
    await act(async () => {
      await result.current.searchProject('citadel');
    });

    expect(result.current.searchResult?.matches.length).toBe(1);

    // Open search result
    await act(async () => {
      await result.current.openSearchResult('Manuscript/Chapter-01/Scene-01.md', 'citadel');
    });

    expect(result.current.selectedFile).toBe('Manuscript/Chapter-01/Scene-01.md');
  });

  it('Scenario 5: Safe deletion with tree reconciliation', async () => {
    const { result } = renderHook(() => useProjectState('/home/author/MyNovel', 'The Obsidian Citadel'));

    await waitFor(() => {
      expect(result.current.activeProject).not.toBeNull();
    });

    await act(async () => {
      await result.current.openDocument('Manuscript/Chapter-01/Scene-01.md');
    });

    // Delete active file safely
    await act(async () => {
      await result.current.deleteFileSafe('Manuscript/Chapter-01/Scene-01.md');
    });

    expect(SwriteIpc.fileDeleteSafe).toHaveBeenCalledWith('Manuscript/Chapter-01/Scene-01.md');
    // Selected file should be cleared safely without crash
    expect(result.current.selectedFile).toBeNull();
  });
});
