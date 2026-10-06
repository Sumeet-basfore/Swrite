# SWRITE 2 — Personal Writing Friction Analysis & Resolutions

## 1. Friction Points Discovered in Daily Dogfooding

During long writing runs, specific micro-annoyances common in complex writing software were systematically identified and eliminated:

### 1. The "Toolbar Distraction" Problem
- **Friction:** Floating formatting bubbles and fixed toolbars distract the author during flow state.
- **Resolution:**
  - Removed persistent floating formatting bars while actively typing.
  - Markdown syntax shortcuts and slash commands (`/`) handle structural elements without visual clutter.

### 2. The "Where Was I?" Document Switching Friction
- **Friction:** Switching between scenes or checking a character note in DESK reset the cursor to the top of the file.
- **Resolution:**
  - Added persistent cursor and scroll memory per document. When returning to any scene or note, focus resumes at the exact line and column where typing left off.

### 3. The "Save Anxiety" Problem
- **Friction:** Authors constantly pressing `Ctrl+S` fearing lost work if an indicator isn't visible, or feeling annoyed by save notifications.
- **Resolution:**
  - Sub-second debounced autosave with atomic disk writes.
  - Minimal, calm status bar indicator (`Saved`) that transitions smoothly to `Saving...` without toasts or audible alerts.

### 4. The "Accidental Reordering" Risk
- **Friction:** Drag-and-drop in outline views triggering inadvertent scene moves.
- **Resolution:**
  - Clear drop indicator lines and explicit keyboard-driven scene reordering shortcuts with undo support.

---

## 2. Friction Scorecard

| Area | Initial Level | Post-Milestone 11 Level | Result |
| :--- | :--- | :--- | :--- |
| **Typing Flow & Canvas Focus** | Minor friction (UI clutter) | Zero friction | **Resolved** |
| **Cross-Studio Switching** | Moderate friction (lost cursor) | Zero friction | **Resolved** |
| **File / Scene Navigation** | Minor friction (click heavy) | Zero friction (`Mod+P`, `Mod+[` / `]`) | **Resolved** |
| **Revision & Compare Flow** | Moderate friction (complex UI) | Clean, unified EDIT Studio | **Resolved** |
