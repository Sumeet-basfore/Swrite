# SWRITE 2 — VERSION COMPARISON & DIFF SPECIFICATION

## 1. Overview & LCS Line Diff Algorithm

Swrite 2 contains a native Rust diffing engine (`src-tauri/src/edit/diff.rs`) utilizing the Longest Common Subsequence (LCS) dynamic programming algorithm.

Diff results are returned as structured `DocumentDiffResult`:

```typescript
export interface DiffChunk {
  origin: 'same' | 'added' | 'removed' | 'modified';
  old_line_num?: number | null;
  new_line_num?: number | null;
  content: string;
}

export interface DocumentDiffResult {
  old_snapshot_id?: string | null;
  new_snapshot_id?: string | null;
  chunks: DiffChunk[];
  additions_count: number;
  deletions_count: number;
  modifications_count: number;
}
```

---

## 2. Comparison Modes

1. **Compare with Current Prose**:
   Computes differences between any historical snapshot and the current live manuscript text.
2. **Compare with Previous Snapshot**:
   Computes differences between sequential snapshot revisions in the local history timeline.
3. **View Layouts**:
   - **Unified View**: Single column interleaved diff with `+` additions and `-` deletions.
   - **Side-by-Side View**: Dual-column comparison for clear paragraph-level side-by-side inspection.

---

## 3. Safe Snapshot Restore Protocol

Restoring a previous version must never result in accidental data loss. Swrite implements an atomic **Safe Restore** flow:

1. Prior to writing target snapshot content over the active file, `restore_snapshot_safe` records a pre-restore safety snapshot (`"Pre-restore safety snapshot before restoring <snapshot_id>"`).
2. The target content is written via atomic file write (`atomic_write_bytes`).
3. The history index is updated and the editor canvas safely refreshes.
4. The author can undo any restore operation at any time by selecting the safety snapshot.
