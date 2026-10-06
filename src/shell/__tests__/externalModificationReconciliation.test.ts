import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SaveCoordinator } from '../../editor/sync/saveCoordinator';
import { SwriteIpc } from '../../lib/ipc';

vi.mock('../../lib/ipc', () => ({
  SwriteIpc: {
    fileRead: vi.fn(),
    fileWrite: vi.fn(),
    recoverySave: vi.fn(),
    recoveryClear: vi.fn(),
  },
}));

describe('External Modification & Reconciliation Resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (SwriteIpc.fileWrite as any).mockResolvedValue(undefined);
    (SwriteIpc.recoverySave as any).mockResolvedValue(undefined);
    (SwriteIpc.recoveryClear as any).mockResolvedValue(undefined);
  });

  it('detects external modifications and prevents silent overwrite when buffer is dirty', async () => {
    let conflictTriggered = false;

    const coordinator = new SaveCoordinator({
      documentId: 'Manuscript/Chapter-01/Scene-01.md',
      relativePath: 'Manuscript/Chapter-01/Scene-01.md',
      debounceMs: 100,
      recoveryIntervalMs: 500,
      onStatusChange: () => {},
      onExternalChangeDetected: (conflict) => {
        conflictTriggered = conflict;
      },
    });

    coordinator.setInitialContent('Initial author prose.');
    coordinator.updateContent('Unsaved author modifications in Swrite.');

    // External change occurs on disk while editor is dirty
    coordinator.handleExternalFileEvent('Manuscript/Chapter-01/Scene-01.md');

    expect(conflictTriggered).toBe(true);
    expect(coordinator.getStatus()).toBe('conflict');
    coordinator.dispose();
  });

  it('cleanly accepts external modifications when local buffer is clean', async () => {
    let conflictTriggered = false;

    const coordinator = new SaveCoordinator({
      documentId: 'Manuscript/Chapter-01/Scene-01.md',
      relativePath: 'Manuscript/Chapter-01/Scene-01.md',
      debounceMs: 100,
      recoveryIntervalMs: 500,
      onStatusChange: () => {},
      onExternalChangeDetected: (conflict) => {
        conflictTriggered = conflict;
      },
    });

    coordinator.setInitialContent('Initial author prose.');
    // Local buffer is clean (no updateContent called)

    coordinator.handleExternalFileEvent('Manuscript/Chapter-01/Scene-01.md');

    expect(conflictTriggered).toBe(false);
    expect(coordinator.getStatus()).toBe('clean');
    coordinator.dispose();
  });
});
