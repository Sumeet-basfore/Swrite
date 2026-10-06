# Swrite 2 — File Management Specification

## 1. Principles

1. **Filesystem as Author's Space**: Files on disk are the ultimate source of truth.
2. **Strict Hidden File Enclosure**: Internal directories (`.swrite/`, `.git/`, `.tmp/`, `.cache/`) are filtered at the Rust backend layer and never exposed in the author's file manager.
3. **Identity Stability**: Every document receives a persistent UUID `DocumentId` in `.swrite/project.json` that survives renames and moves.

---

## 2. File Operations Contract

### 1. Instant Document Creation
- Fast zero-friction document creation: `New Document` immediately creates `Untitled.md` in the target folder with cursor ready.
- `New Chapter`: Automatically detects sequential chapter numbering (`Manuscript/Chapter 01.md`, `Manuscript/Chapter 02.md`).
- `New Scene`: Creates sequential scenes under a chapter directory (`Manuscript/Chapter 01/Scene 01.md`).

### 2. Rename & Move
- Renaming or moving a file updates the manifest entry mapping `DocumentId -> new_relative_path`.
- The active editor canvas buffer remains attached to the document without losing history or re-rendering unnecessarily.

### 3. Duplicate
- Clones document content as `[Name] copy.md` (or `[Name] copy 2.md`).
- Assigns a **brand new unique `DocumentId`**, ensuring independent revision and comment history.

### 4. Safe Delete & Recovery
- Deleting a file moves it to `.swrite/trash/{YYYYMMDD_HHMMSS}_{filename}`.
- Prevents catastrophic data loss from accidental clicks.

### 5. Conflict Resolution
- If an operation would overwrite an existing file, prompt:
  - `Replace`: Backs up destination to trash, then overwrites.
  - `Keep Both`: Generates an auto-incremented non-colliding name.
  - `Cancel`: Aborts operation without changes.
