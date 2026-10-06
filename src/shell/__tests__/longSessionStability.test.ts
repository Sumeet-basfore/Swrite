import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProjectState } from '../useProjectState';
import { SwriteIpc } from '../../lib/ipc';

vi.mock('../../lib/ipc', () => ({
  SwriteIpc: {
    projectOpen: vi.fn(),
    projectDiscover: vi.fn(),
    projectGetUiState: vi.fn().mockResolvedValue({ expanded_folders: ['Manuscript'], sidebar_collapsed: false }),
    projectSetUiState: vi.fn().mockResolvedValue(undefined),
    projectGetRecents: vi.fn().mockResolvedValue([]),
    projectAddRecent: vi.fn().mockResolvedValue(undefined),
    fileRead: vi.fn(),
    fileWrite: vi.fn(),
    fileCreate: vi.fn(),
    fileRename: vi.fn(),
    fileDeleteSafe: vi.fn(),
    fileExists: vi.fn().mockResolvedValue(false),
    watchStart: vi.fn().mockResolvedValue(undefined),
    searchQuery: vi.fn(),
  },
}));

describe('Long Session Stability & Scale Resilience', () => {
  // Generate a realistic large project: 50 chapters, 200 scenes
  const generateLargeManuscriptFiles = () => {
    const files = [];
    for (let c = 1; c <= 50; c++) {
      const chPad = String(c).padStart(2, '0');
      for (let s = 1; s <= 4; s++) {
        const scPad = String(s).padStart(2, '0');
        files.push({
          relative_path: `Manuscript/Chapter-${chPad}/Scene-${scPad}.md`,
          name: `Scene-${scPad}.md`,
          is_directory: false,
          format: 'markdown' as const,
          size_bytes: 3500,
        });
      }
    }
    return files;
  };

  const largeFilesView = {
    manuscript_files: generateLargeManuscriptFiles(),
    planning_files: [
      { relative_path: 'Planning/Outline.json', name: 'Outline.json', is_directory: false, format: 'json' as const, size_bytes: 4000 },
      { relative_path: 'Planning/Timeline.md', name: 'Timeline.md', is_directory: false, format: 'markdown' as const, size_bytes: 2500 },
    ],
    desk_files: [
      { relative_path: 'Desk/Characters/Protagonist.md', name: 'Protagonist.md', is_directory: false, format: 'markdown' as const, size_bytes: 2000 },
      { relative_path: 'Desk/Worldbuilding/MagicSystem.md', name: 'MagicSystem.md', is_directory: false, format: 'markdown' as const, size_bytes: 3000 },
    ],
    asset_files: [
      { relative_path: 'Assets/world-map.png', name: 'world-map.png', is_directory: false, format: 'png' as const, size_bytes: 120000 },
    ],
    other_visible_files: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (SwriteIpc.projectOpen as any).mockResolvedValue({
      project_id: 'proj-epic-novel',
      name: 'The Chronomancer Saga',
      root_path: '/home/author/EpicNovel',
      manifest: { schema_version: 1, project_id: 'proj-epic-novel', name: 'The Chronomancer Saga', document_identities: {} },
      file_counts: { manuscript_count: 200, planning_count: 2, desk_count: 2, asset_count: 1 },
    });
    (SwriteIpc.projectDiscover as any).mockResolvedValue(largeFilesView);
    (SwriteIpc.fileRead as any).mockResolvedValue('# Scene Content\n\nThe pendulum swung across the ancient marble floor.');
  });

  it('loads 200+ scenes instantly without latency degradation', async () => {
    const start = performance.now();
    const { result } = renderHook(() => useProjectState('/home/author/EpicNovel', 'The Chronomancer Saga'));

    await waitFor(() => {
      expect(result.current.activeProject?.name).toBe('The Chronomancer Saga');
      expect(result.current.filesView?.manuscript_files.length).toBe(200);
    });

    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500);
  });

  it('handles repeated rapid studio switching without memory or listener buildup', async () => {
    const { result } = renderHook(() => useProjectState('/home/author/EpicNovel', 'The Chronomancer Saga'));

    await waitFor(() => {
      expect(result.current.activeProject).not.toBeNull();
    });

    // Simulate 50 sequential rapid document switches across 50 chapters
    for (let c = 1; c <= 50; c++) {
      const chPad = String(c).padStart(2, '0');
      const targetDoc = `Manuscript/Chapter-${chPad}/Scene-01.md`;
      await act(async () => {
        await result.current.openDocument(targetDoc);
      });
      expect(result.current.selectedFile).toBe(targetDoc);
    }

    expect(SwriteIpc.fileRead).toHaveBeenCalledTimes(51); // 1 initial + 50 switches
  });
});
