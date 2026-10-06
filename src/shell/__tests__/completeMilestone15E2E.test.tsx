import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectState } from '../useProjectState';
import { buildProjectTree } from '../treeUtils';
import { DiscoveredFile } from '../../types/ipc';

vi.mock('../../lib/ipc', () => ({
  SwriteIpc: {
    projectCreate: vi.fn().mockResolvedValue({
      project_id: 'milestone-15-project',
      name: 'The Cartographer of Shadows',
      root_path: '/tmp/cartographer-novel',
      manifest: { schema_version: 1, project_id: 'milestone-15-project', name: 'The Cartographer of Shadows', created_at: '', updated_at: '', document_identities: {}, metadata: {} },
      file_counts: { manuscript_count: 3, planning_count: 2, desk_count: 2, asset_count: 1 },
    }),
    projectOpen: vi.fn(),
    projectClose: vi.fn(),
    watchStart: vi.fn().mockResolvedValue(undefined),
    projectDiscover: vi.fn().mockResolvedValue({
      manuscript_files: [
        { relative_path: 'Manuscript/Act 1/Chapter 01.md', name: 'Chapter 01.md', is_directory: false, format: 'markdown', size_bytes: 1500 },
        { relative_path: 'Manuscript/Act 1/Scene 01.md', name: 'Scene 01.md', is_directory: false, format: 'markdown', size_bytes: 800 },
        { relative_path: 'Manuscript/Act 2/Chapter 02.md', name: 'Chapter 02.md', is_directory: false, format: 'markdown', size_bytes: 1200 },
      ],
      planning_files: [
        { relative_path: 'Planning/Outline.md', name: 'Outline.md', is_directory: false, format: 'markdown', size_bytes: 600 },
        { relative_path: 'Planning/Timeline.md', name: 'Timeline.md', is_directory: false, format: 'markdown', size_bytes: 700 },
      ],
      desk_files: [
        { relative_path: 'Desk/Characters/Protagonists/Kael.md', name: 'Kael.md', is_directory: false, format: 'markdown', size_bytes: 500 },
        { relative_path: 'Desk/Locations/Oakhaven.md', name: 'Oakhaven.md', is_directory: false, format: 'markdown', size_bytes: 400 },
      ],
      asset_files: [
        { relative_path: 'Assets/Maps/WorldMap.png', name: 'WorldMap.png', is_directory: false, format: 'binary', size_bytes: 1048576 },
      ],
      other_visible_files: [],
    }),
    projectGetUiState: vi.fn().mockResolvedValue({
      expanded_folders: ['Manuscript', 'Manuscript/Act 1'],
      sidebar_collapsed: false,
      open_tabs: ['Manuscript/Act 1/Chapter 01.md'],
      active_tab_id: 'Manuscript/Act 1/Chapter 01.md',
    }),
    projectSetUiState: vi.fn().mockResolvedValue(undefined),
    projectGetRecents: vi.fn().mockResolvedValue([]),
    projectAddRecent: vi.fn().mockResolvedValue(undefined),
    fileRead: vi.fn().mockImplementation((path: string) => Promise.resolve(`# Draft content for ${path}\n\nProse flow...`)),
    fileCreate: vi.fn().mockImplementation((path: string) => Promise.resolve(path)),
    fileRename: vi.fn().mockResolvedValue(undefined),
    fileMove: vi.fn().mockResolvedValue(undefined),
    fileDeleteSafe: vi.fn().mockResolvedValue(undefined),
    fileDuplicate: vi.fn().mockImplementation((path: string) => Promise.resolve(`${path} (Copy)`)),
    fileImportBatch: vi.fn(),
    folderImportRecursive: vi.fn(),
    searchQuery: vi.fn().mockImplementation((q: string) =>
      Promise.resolve({
        query: q,
        total_matches: 1,
        items: [{ relative_path: 'Manuscript/Act 1/Chapter 01.md', line_number: 1, preview_snippet: 'Chapter 01 excerpt' }],
      })
    ),
  },
}));

describe('Milestone 15 — Complete Author Journey E2E Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('executes full author journey: filesystem tree, tabs, studio switching, renaming, search, and deletion', async () => {
    // 1. Initial project mount & tree construction
    const { result } = renderHook(() =>
      useProjectState('/tmp/cartographer-novel', 'The Cartographer of Shadows')
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current.activeProject?.name).toBe('The Cartographer of Shadows');

    // 2. Verify all files form a pure nested tree
    const allFiles: DiscoveredFile[] = [
      ...result.current.filesView!.manuscript_files,
      ...result.current.filesView!.planning_files,
      ...result.current.filesView!.desk_files,
      ...result.current.filesView!.asset_files,
    ];
    const tree = buildProjectTree(allFiles);
    expect(tree.some((n) => n.name === 'Manuscript')).toBe(true);
    expect(tree.some((n) => n.name === 'Planning')).toBe(true);
    expect(tree.some((n) => n.name === 'Desk')).toBe(true);

    // 3. Open multiple documents across different nested folders into tabs
    await act(async () => {
      await result.current.openDocument('Manuscript/Act 1/Chapter 01.md');
      await result.current.openDocument('Planning/Timeline.md');
      await result.current.openDocument('Desk/Characters/Protagonists/Kael.md');
    });

    expect(result.current.openTabs.length).toBe(3);
    expect(result.current.selectedFile).toBe('Desk/Characters/Protagonists/Kael.md');

    // 4. Mark active document dirty upon typing
    act(() => {
      result.current.markTabDirty('Desk/Characters/Protagonists/Kael.md', true);
    });

    const kaelTab = result.current.openTabs.find((t) => t.relativePath === 'Desk/Characters/Protagonists/Kael.md');
    expect(kaelTab?.isDirty).toBe(true);

    // 5. Search project (Ctrl+P) and navigate to matching document
    await act(async () => {
      await result.current.searchProject('Chapter 01');
      await result.current.openSearchResult('Manuscript/Act 1/Chapter 01.md', 'Chapter 01');
    });

    expect(result.current.selectedFile).toBe('Manuscript/Act 1/Chapter 01.md');
    expect(result.current.openTabs.length).toBe(3); // Tab was activated, not duplicated

    // 6. Rename a document and verify tab label updates
    await act(async () => {
      await result.current.renameFile(
        'Desk/Characters/Protagonists/Kael.md',
        'Desk/Characters/Protagonists/Kael-Vaelen.md'
      );
    });

    const renamedTab = result.current.openTabs.find(
      (t) => t.relativePath === 'Desk/Characters/Protagonists/Kael-Vaelen.md'
    );
    expect(renamedTab).toBeDefined();
    expect(renamedTab?.title).toBe('Kael-Vaelen.md');

    // 7. Close tab
    await act(async () => {
      await result.current.closeTab('Planning/Timeline.md');
    });

    expect(result.current.openTabs.length).toBe(2);
    expect(result.current.openTabs.some((t) => t.relativePath === 'Planning/Timeline.md')).toBe(false);

    // 8. Delete document safely
    await act(async () => {
      await result.current.deleteFileSafe('Manuscript/Act 1/Chapter 01.md');
    });

    expect(result.current.openTabs.some((t) => t.relativePath === 'Manuscript/Act 1/Chapter 01.md')).toBe(false);
  });
});
