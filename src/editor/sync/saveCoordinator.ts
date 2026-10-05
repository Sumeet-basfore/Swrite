import { SwriteIpc } from '../../lib/ipc';
import { SaveStatus } from '../core/types';

export interface SaveCoordinatorOptions {
  documentId: string;
  relativePath: string;
  debounceMs?: number; // default 1500ms
  recoveryIntervalMs?: number; // default 3000ms
  onStatusChange?: (status: SaveStatus, error?: string) => void;
  onExternalChangeDetected?: (hasConflict: boolean) => void;
}

export class SaveCoordinator {
  private documentId: string;
  private relativePath: string;
  private debounceMs: number;
  private recoveryIntervalMs: number;
  private onStatusChange?: (status: SaveStatus, error?: string) => void;
  private onExternalChangeDetected?: (hasConflict: boolean) => void;

  private currentContent: string = '';
  private lastSavedContent: string = '';
  private isDirty: boolean = false;
  private status: SaveStatus = 'clean';

  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private recoveryTimer: ReturnType<typeof setInterval> | null = null;
  private isSaving: boolean = false;

  constructor(options: SaveCoordinatorOptions) {
    this.documentId = options.documentId;
    this.relativePath = options.relativePath;
    this.debounceMs = options.debounceMs ?? 1500;
    this.recoveryIntervalMs = options.recoveryIntervalMs ?? 3000;
    this.onStatusChange = options.onStatusChange;
    this.onExternalChangeDetected = options.onExternalChangeDetected;

    this.startRecoveryTimer();
  }

  public setInitialContent(content: string) {
    this.currentContent = content;
    this.lastSavedContent = content;
    this.isDirty = false;
    this.setStatus('clean');
  }

  public updateContent(newContent: string) {
    this.currentContent = newContent;

    if (newContent !== this.lastSavedContent) {
      this.isDirty = true;
      this.setStatus('dirty');
      this.scheduleDebouncedSave();
    } else {
      this.isDirty = false;
      this.setStatus('clean');
      if (this.saveTimer) {
        clearTimeout(this.saveTimer);
        this.saveTimer = null;
      }
    }
  }

  public async saveNow(): Promise<boolean> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }

    if (!this.isDirty) {
      return true;
    }

    return this.executeSave();
  }

  private scheduleDebouncedSave() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    this.saveTimer = setTimeout(() => {
      this.executeSave();
    }, this.debounceMs);
  }

  private async executeSave(): Promise<boolean> {
    if (this.isSaving) return false;
    this.isSaving = true;
    this.setStatus('saving');

    const contentToSave = this.currentContent;

    try {
      // 1. Persist to filesystem via Rust native atomic write
      await SwriteIpc.fileWrite(this.relativePath, contentToSave);

      // 2. Clear recovery draft on successful disk write
      await SwriteIpc.recoveryClear(this.documentId);

      this.lastSavedContent = contentToSave;
      if (this.currentContent === contentToSave) {
        this.isDirty = false;
        this.setStatus('saved');

        // Transition to 'clean' after 1.5s
        setTimeout(() => {
          if (this.status === 'saved') {
            this.setStatus('clean');
          }
        }, 1500);
      } else {
        this.setStatus('dirty');
      }

      this.isSaving = false;
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.setStatus('error', msg);
      this.isSaving = false;
      return false;
    }
  }

  private startRecoveryTimer() {
    this.recoveryTimer = setInterval(async () => {
      if (this.isDirty && this.currentContent && this.currentContent !== this.lastSavedContent) {
        try {
          await SwriteIpc.recoverySave(this.documentId, this.relativePath, this.currentContent);
        } catch {
          // Non-blocking write-ahead draft
        }
      }
    }, this.recoveryIntervalMs);
  }

  public handleExternalFileEvent(changedPath: string) {
    if (changedPath === this.relativePath) {
      const hasConflict = this.isDirty;
      if (hasConflict) {
        this.setStatus('conflict');
      }
      this.onExternalChangeDetected?.(hasConflict);
    }
  }

  public getStatus(): SaveStatus {
    return this.status;
  }

  public getIsDirty(): boolean {
    return this.isDirty;
  }

  public getCurrentContent(): string {
    return this.currentContent;
  }

  public getLastSavedContent(): string {
    return this.lastSavedContent;
  }

  private setStatus(status: SaveStatus, error?: string) {
    this.status = status;
    this.onStatusChange?.(status, error);
  }

  public dispose() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    if (this.recoveryTimer) {
      clearInterval(this.recoveryTimer);
      this.recoveryTimer = null;
    }
  }
}
