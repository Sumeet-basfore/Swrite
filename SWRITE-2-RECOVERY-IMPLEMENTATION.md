# Swrite 2 — Recovery & Local History Implementation

**Document Version:** 1.0.0  
**Status:** Canonical & Implemented  
**Milestone:** 2 — Rust Document Core & Filesystem Engine  

---

## 1. Write-Ahead Recovery Drafts

During active authoring, unsaved keystrokes are debounced and saved to `.swrite/recovery/<document_id>.draft` using [`save_recovery_draft`](file:///home/sumeet/Documents/writers-tool/Swrite/src-tauri/src/recovery/drafts.rs#L18-L43):

```json
{
  "document_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "relative_path": "Manuscript/Chapter 01.md",
  "timestamp": "2026-10-06T00:10:00.000Z",
  "content_hash": "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592",
  "content": "Unsaved in-progress typing..."
}
```

### Recovery Lifecycle
1. **Typing in progress**: Draft is periodically written to `.swrite/recovery/<document_id>.draft`.
2. **Explicit / Auto Canonical Save**: When the canonical file is atomically saved to disk, [`clear_recovery_draft`](file:///home/sumeet/Documents/writers-tool/Swrite/src-tauri/src/recovery/drafts.rs#L46-L53) removes the draft file.
3. **Unexpected Process Termination**: Upon reopening, [`list_recovery_drafts`](file:///home/sumeet/Documents/writers-tool/Swrite/src-tauri/src/recovery/drafts.rs#L56-L80) discovers any abandoned drafts and presents them for one-click recovery.

---

## 2. Local History & Rolling Snapshots

Every major milestone or explicit save can record a snapshot in `.swrite/history/<document_id>/<timestamp>_<hash>.snapshot` using [`create_snapshot`](file:///home/sumeet/Documents/writers-tool/Swrite/src-tauri/src/recovery/snapshots.rs#L24-L60):

- Encapsulates document content alongside metadata (snapshot ID, document ID, timestamp, content hash, and optional user label).
- Snapshots are isolated in `.swrite/history/` and are never exposed as visible project files.
- Verified via [`list_snapshots`](file:///home/sumeet/Documents/writers-tool/Swrite/src-tauri/src/recovery/snapshots.rs#L63-L87) and [`get_snapshot`](file:///home/sumeet/Documents/writers-tool/Swrite/src-tauri/src/recovery/snapshots.rs#L90-L106).
