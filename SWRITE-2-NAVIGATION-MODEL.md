# Swrite 2 — Navigation Model & Section Hierarchy

## 1. Project Sections

The project navigation sidebar organizes files into four primary environments:

```text
Project Root
├── MANUSCRIPT/    # Author-facing narrative chapters, acts, and scenes
├── PLANNING/      # Outlines, character sheets, timelines, and world notes
├── DESK/          # Ephemeral scratchpads, ideas, and revision drafts
└── ASSETS/        # Image attachments, maps, covers, and references
```

---

## 2. Natural Alphanumeric Sorting

Swrite enforces **natural alphanumeric sorting** so numeric components in filenames sort intuitively:

```text
Chapter 1.md
Chapter 2.md
Chapter 10.md
```

rather than standard lexicographical order (`Chapter 1.md`, `Chapter 10.md`, `Chapter 2.md`).

Folders are always ordered ahead of individual documents within the same directory.

---

## 3. UI State Persistence

User navigation states are persisted in `.swrite/ui_state.json`:
- `last_opened_document`: Restored automatically on project launch.
- `expanded_folders`: Array of folder paths currently expanded in the tree.
- `sidebar_collapsed`: Boolean indicating whether sidebar is hidden.
- `last_search_scope`: Last selected search filter.
