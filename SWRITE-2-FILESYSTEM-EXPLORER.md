# Swrite 2 — Filesystem Explorer & Unified Document Tabs

This document describes the architectural model, UI implementation, file identity guarantees, and tab management rules established in Milestone 15.

---

## 1. Product Model: Filesystem vs Studios

Swrite 2 decouples the physical structure of the writing project from the specialized environments (Studios) used to work on it.

```text
┌───────────────────────────────────────────────────────────────┐
│                      SWRITE 2 APPLICATION                     │
│                                                               │
│   STUDIO BAR: [ WRITE ] [ PLAN ] [ DESK ] [ EDIT ] [ PUBLISH ] │
├──────────────────────────┬────────────────────────────────────┤
│ FILESYSTEM EXPLORER      │ UNIFIED DOCUMENT TABS              │
│ ├── Manuscript/          │ [Chapter 01.md ✕] [Kael.md ● ✕] [+]│
│ │   ├── Act 1/           ├────────────────────────────────────┤
│ │   │   ├── Ch01.md      │ ACTIVE STUDIO WORKSPACE            │
│ │   │   └── Ch02.md      │                                    │
│ ├── Planning/            │ Milkdown Markdown Canvas /         │
│ │   └── Timeline.md      │ Character Sheet /                  │
│ └── Desk/                │ Editorial Review /                 │
│     └── Characters/      │ Timeline View                      │
│         └── Kael.md      │                                    │
└──────────────────────────┴────────────────────────────────────┘
```

### Key Principles

1. **Filesystem is Truth:** The project directory is an ordinary folder containing files and directories. Any folder can contain any nested folder or supported file type (`.md`, `.markdown`, `.txt`, `.docx`).
2. **Studios are Tools, Not Directories:** `WRITE`, `PLAN`, `DESK`, `EDIT`, and `PUBLISH` represent specialized lenses, toolbars, and visual modes applied to documents. They do not dictate where files must live on disk.
3. **Universal Document Access:** Any file located anywhere in the project tree can be opened, viewed, and edited in any studio.
4. **Stable Document Identity:** Files are tracked by their canonical project-relative path and internal Document ID. Renames and moves preserve open tabs, active selections, and state.
5. **Hidden Application Metadata:** `.swrite/` remains completely hidden from author browsing and explorer views.

---

## 2. Filesystem Explorer Specifications

### Tree Layout & Hierarchy
- Supports arbitrary folder nesting depths.
- Natural alphanumeric sorting for folders and files (`Chapter 1`, `Chapter 2`, `Chapter 10`).
- Folders and files display dedicated iconography (`lucide-react` icons: `Folder`, `FolderOpen`, `FileText`, `Image`, `FileCode`).

### Toolbar Actions
- **New File (`FilePlus`):** Creates a new markdown document at the selected folder location or project root.
- **New Folder (`FolderPlus`):** Creates a new directory at the selected folder location or project root.
- **Import (`UploadCloud`):** Opens the native multi-file/folder import dialog.
- **Collapse All (`FolderMinus`):** Closes all expanded directory nodes in a single click.
- **Refresh (`RefreshCw`):** Re-scans the project filesystem for external changes.

### Context Menu Operations
Right-clicking any tree node exposes contextual actions:
- **Folder Context:** New File, New Folder, Rename, Delete Folder.
- **File Context:** Open, Rename, Delete Document.
- **Root Context:** New File, New Folder, Collapse All.

---

## 3. Unified Document Tabs

### Tab Bar Behavior
- **Tab Identity:** Each tab represents an open document (`id`, `relativePath`, `title`, `format`, `isDirty`).
- **Tab Switching:** Clicking a tab selects that document as the active document across the current studio.
- **Tab Closing:** 
  - Clicking the `✕` close button closes the tab.
  - Middle-clicking (`button === 1`) closes the tab immediately.
  - Closing the active tab automatically activates the adjacent tab.
  - Closing all tabs sets the editor to a clean empty state.
- **New Tab Button (`+`):** Creates and immediately opens a new document.
- **Dirty State Tracking (`●`):** Reflects unsaved in-memory edits before atomic persistence flushes to disk.
- **Studio Switch Persistence:** Switching between `WRITE`, `PLAN`, `DESK`, `EDIT`, and `PUBLISH` preserves all open tabs, the tab order, dirty state, and the active tab selection.

---

## 4. State Persistence (`.swrite/ui_state.json`)

Project UI state persists the document session seamlessly across application restarts:

```json
{
  "expanded_folders": ["Manuscript", "Manuscript/Act 1", "Planning"],
  "selected_file": "Manuscript/Act 1/Chapter 01.md",
  "open_tabs": [
    "Manuscript/Act 1/Chapter 01.md",
    "Planning/Timeline.md",
    "Desk/Characters/Kael.md"
  ],
  "active_tab_id": "Manuscript/Act 1/Chapter 01.md",
  "active_studio": "write",
  "theme": "nord",
  "zoom_level": 1.0
}
```

---

## 5. Keyboard Navigation & Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl+N` / `Cmd+N` | Create New Document in Active Folder |
| `Ctrl+W` / `Cmd+W` | Close Active Document Tab |
| `Ctrl+S` / `Cmd+S` | Save Active Document (Atomic Flush) |
| `Ctrl+B` / `Cmd+B` | Toggle Sidebar / Filesystem Explorer |
| `Ctrl+1` .. `Ctrl+5` | Switch Studios (`WRITE`, `PLAN`, `DESK`, `EDIT`, `PUBLISH`) |
| `ArrowUp` / `ArrowDown` | Navigate Filesystem Tree Nodes |
| `ArrowRight` / `ArrowLeft` | Expand / Collapse Folder Nodes |
| `Enter` | Open Selected File into Document Tabs |
