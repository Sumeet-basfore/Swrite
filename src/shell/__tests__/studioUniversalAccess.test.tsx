import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectState } from '../useProjectState';

vi.mock('../../lib/ipc', () => ({
  SwriteIpc: {
    projectCreate: vi.fn().mockResolvedValue({
      project_id: 'test-project',
      name: 'Universal Project',
      root_path: '/tmp/univ-project',
      manifest: { schema_version: 1, project_id: 'test-project', name: 'Universal Project', created_at: '', updated_at: '', document_identities: {}, metadata: {} },
      file_counts: { manuscript_count: 2, planning_count: 2, desk_count: 1, asset_count: 0 },
    }),
    projectOpen: vi.fn(),
    projectClose: vi.fn(),
    watchStart: vi.fn().mockResolvedValue(undefined),
    projectDiscover: vi.fn().mockResolvedValue({
      manuscript_files: [
        { relative_path: 'Manuscript/Chapter 01.md', name: 'Chapter 01.md', is_directory: false, format: 'markdown', size_bytes: 100 },
        { relative_path: 'Manuscript/Chapter 02.md', name: 'Chapter 02.md', is_directory: false, format: 'markdown', size_bytes: 100 },
      ],
      planning_files: [
        { relative_path: 'Planning/Outline.md', name: 'Outline.md', is_directory: false, format: 'markdown', size_bytes: 80 },
        { relative_path: 'Planning/Timeline.md', name: 'Timeline.md', is_directory: false, format: 'markdown', size_bytes: 90 },
      ],
      desk_files: [
        { relative_path: 'Desk/Characters/Kael.md', name: 'Kael.md', is_directory: false, format: 'markdown', size_bytes: 70 },
      ],
      asset_files: [],
      other_visible_files: [],
    }),
    projectGetUiState: vi.fn().mockResolvedValue({
      expanded_folders: ['Manuscript', 'Planning', 'Desk'],
      sidebar_collapsed: false,
      open_tabs: ['Manuscript/Chapter 01.md'],
      active_tab_id: 'Manuscript/Chapter 01.md',
    }),
    projectSetUiState: vi.fn().mockResolvedValue(undefined),
    projectGetRecents: vi.fn().mockResolvedValue([]),
    projectAddRecent: vi.fn().mockResolvedValue(undefined),
    fileRead: vi.fn().mockImplementation((path: string) => Promise.resolve(`# Content of ${path}`)),
    fileCreate: vi.fn().mockResolvedValue('Manuscript/NewDoc.md'),
    fileRename: vi.fn().mockResolvedValue(undefined),
    fileMove: vi.fn().mockResolvedValue(undefined),
    fileDeleteSafe: vi.fn().mockResolvedValue(undefined),
    fileDuplicate: vi.fn().mockResolvedValue('Manuscript/Chapter 01 (Copy).md'),
    fileImportBatch: vi.fn(),
    folderImportRecursive: vi.fn(),
    searchQuery: vi.fn().mockResolvedValue({ query: 'test', total_matches: 0, items: [] }),
  },
}));

describe('Milestone 15 — Universal Document Access & Studio Independence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows opening documents from any folder (Planning, Desk, Manuscript) into tabs', async () => {
    const { result } = renderHook(() => useProjectState('/tmp/univ-project', 'Universal Project'));

    // Wait for init
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // 1. Open Planning/Timeline.md
    await act(async () => {
      await result.current.openDocument('Planning/Timeline.md');
    });

    expect(result.current.selectedFile).toBe('Planning/Timeline.md');
    expect(result.current.fileContent).toBe('# Content of Planning/Timeline.md');
    expect(result.current.openTabs.some((t) => t.relativePath === 'Planning/Timeline.md')).toBe(true);

    // 2. Open Desk/Characters/Kael.md
    await act(async () => {
      await result.current.openDocument('Desk/Characters/Kael.md');
    });

    expect(result.current.selectedFile).toBe('Desk/Characters/Kael.md');
    expect(result.current.openTabs.length).toBeGreaterThanOrEqual(2);
    expect(result.current.openTabs.some((t) => t.relativePath === 'Desk/Characters/Kael.md')).toBe(true);

    // 3. Re-open Manuscript/Chapter 01.md (should switch active tab without duplicating)
    const countBefore = result.current.openTabs.length;
    await act(async () => {
      await result.current.openDocument('Manuscript/Chapter 01.md');
    });

    expect(result.current.selectedFile).toBe('Manuscript/Chapter 01.md');
    expect(result.current.openTabs.length).toBe(countBefore);
  });

  it('renaming a document updates tab title and relative path in openTabs', async () => {
    const { result } = renderHook(() => useProjectState('/tmp/univ-project', 'Universal Project'));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    await act(async () => {
      await result.current.openDocument('Planning/Outline.md');
    });

    // Rename Planning/Outline.md -> Planning/Master-Outline.md
    await act(async () => {
      await result.current.renameFile('Planning/Outline.md', 'Planning/Master-Outline.md');
    });

    const updatedTab = result.current.openTabs.find((t) => t.relativePath === 'Planning/Master-Outline.md');
    expect(updatedTab).toBeDefined();
    expect(updatedTab?.title).toBe('Master-Outline.md');
    expect(result.current.selectedFile).toBe('Planning/Master-Outline.md');
  });

  it('closing a tab removes it from openTabs and activates adjacent tab', async () => {
    const { result } = renderHook(() => useProjectState('/tmp/univ-project', 'Universal Project'));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    await act(async () => {
      await result.current.openDocument('Planning/Timeline.md');
      await result.current.openDocument('Desk/Characters/Kael.md');
    });

    // Close Desk/Characters/Kael.md
    await act(async () => {
      await result.current.closeTab('Desk/Characters/Kael.md');
    });

    expect(result.current.openTabs.some((t) => t.relativePath === 'Desk/Characters/Kael.md')).toBe(false);
    expect(result.current.selectedFile).toBe('Planning/Timeline.md');
  });
});
