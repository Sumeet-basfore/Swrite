import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SaveCoordinator } from '../sync/saveCoordinator';
import { SwriteIpc } from '../../lib/ipc';

vi.mock('../../lib/ipc', () => ({
  SwriteIpc: {
    fileWrite: vi.fn().mockResolvedValue(undefined),
    recoverySave: vi.fn().mockResolvedValue(undefined),
    recoveryClear: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('SaveCoordinator', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes clean with initial content', () => {
    const coordinator = new SaveCoordinator({
      documentId: 'doc-1',
      relativePath: 'Manuscript/Chapter 01.md',
    });

    coordinator.setInitialContent('# Chapter 1');
    expect(coordinator.getStatus()).toBe('clean');
    expect(coordinator.getIsDirty()).toBe(false);

    coordinator.dispose();
  });

  it('marks state dirty on edit and triggers debounced save', async () => {
    let statusLog: string[] = [];
    const coordinator = new SaveCoordinator({
      documentId: 'doc-1',
      relativePath: 'Manuscript/Chapter 01.md',
      debounceMs: 1000,
      onStatusChange: (status) => statusLog.push(status),
    });

    coordinator.setInitialContent('Initial text');
    statusLog = [];

    coordinator.updateContent('Updated text here');
    expect(coordinator.getIsDirty()).toBe(true);
    expect(statusLog).toContain('dirty');

    // Fast-forward time past debounce
    await vi.advanceTimersByTimeAsync(1100);

    expect(SwriteIpc.fileWrite).toHaveBeenCalledWith('Manuscript/Chapter 01.md', 'Updated text here');
    expect(SwriteIpc.recoveryClear).toHaveBeenCalledWith('doc-1');
    expect(coordinator.getStatus()).toBe('saved');

    coordinator.dispose();
  });

  it('triggers immediate save when saveNow() is invoked', async () => {
    const coordinator = new SaveCoordinator({
      documentId: 'doc-1',
      relativePath: 'Manuscript/Chapter 01.md',
    });

    coordinator.setInitialContent('Initial');
    coordinator.updateContent('Immediate edit');

    const success = await coordinator.saveNow();
    expect(success).toBe(true);
    expect(SwriteIpc.fileWrite).toHaveBeenCalledWith('Manuscript/Chapter 01.md', 'Immediate edit');

    coordinator.dispose();
  });

  it('detects external file modification conflict if buffer is dirty', () => {
    let conflictFlag = false;
    const coordinator = new SaveCoordinator({
      documentId: 'doc-1',
      relativePath: 'Manuscript/Chapter 01.md',
      onExternalChangeDetected: (conflict) => {
        conflictFlag = conflict;
      },
    });

    coordinator.setInitialContent('Initial');
    coordinator.updateContent('Dirty edit');

    coordinator.handleExternalFileEvent('Manuscript/Chapter 01.md');
    expect(conflictFlag).toBe(true);
    expect(coordinator.getStatus()).toBe('conflict');

    coordinator.dispose();
  });
});
