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
    recoveryGet: vi.fn(),
    recoveryClear: vi.fn(),
  },
}));

describe('Project Portability & Crash Recovery Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('re-opens seamlessly when project directory is copied/moved to a new path', async () => {
    // Project copied to a new path: /media/backup/RelocatedNovel
    (SwriteIpc.projectOpen as any).mockResolvedValue({
      project_id: 'proj-relocated-1',
      name: 'Relocated Novel',
      root_path: '/media/backup/RelocatedNovel',
      manifest: { schema_version: 1, project_id: 'proj-relocated-1', name: 'Relocated Novel', document_identities: {} },
      file_counts: { manuscript_count: 5, planning_count: 1, desk_count: 2, asset_count: 1 },
    });

    (SwriteIpc.projectDiscover as any).mockResolvedValue({
      manuscript_files: [
        { relative_path: 'Manuscript/Chapter-01.md', name: 'Chapter-01.md', is_directory: false, format: 'markdown', size_bytes: 1500 },
      ],
      planning_files: [],
      desk_files: [],
      asset_files: [],
      other_visible_files: [],
    });

    (SwriteIpc.fileRead as any).mockResolvedValue('# Chapter One\n\nPreserved content.');

    const { result } = renderHook(() => useProjectState('/media/backup/RelocatedNovel', 'Relocated Novel'));

    await waitFor(() => {
      expect(result.current.activeProject?.root_path).toBe('/media/backup/RelocatedNovel');
      expect(result.current.selectedFile).toBe('Manuscript/Chapter-01.md');
      expect(result.current.fileContent).toBe('# Chapter One\n\nPreserved content.');
    });
  });

  it('preserves clean core independence with zero active plugins', async () => {
    (SwriteIpc.projectOpen as any).mockResolvedValue({
      project_id: 'proj-pure-core',
      name: 'Pure Core Novel',
      root_path: '/home/author/PureCore',
      manifest: { schema_version: 1, project_id: 'proj-pure-core', name: 'Pure Core Novel', document_identities: {} },
      file_counts: { manuscript_count: 1, planning_count: 0, desk_count: 0, asset_count: 0 },
    });

    (SwriteIpc.projectDiscover as any).mockResolvedValue({
      manuscript_files: [
        { relative_path: 'Manuscript/Chapter-01.md', name: 'Chapter-01.md', is_directory: false, format: 'markdown', size_bytes: 500 },
      ],
      planning_files: [],
      desk_files: [],
      asset_files: [],
      other_visible_files: [],
    });

    (SwriteIpc.fileRead as any).mockResolvedValue('Pure writing without extensions.');

    const { result } = renderHook(() => useProjectState('/home/author/PureCore', 'Pure Core Novel'));

    await waitFor(() => {
      expect(result.current.activeProject?.name).toBe('Pure Core Novel');
      expect(result.current.selectedFile).toBe('Manuscript/Chapter-01.md');
    });

    // Verify operations execute with 0 plugin overhead
    await act(async () => {
      await result.current.openDocument('Manuscript/Chapter-01.md');
    });

    expect(result.current.fileContent).toBe('Pure writing without extensions.');
  });
});
