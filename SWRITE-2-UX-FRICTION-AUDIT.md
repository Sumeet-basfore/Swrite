# SWRITE 2 — UX Friction Audit & Simplification Report

## 1. Audit Scope & Objectives

During Milestone 11 dogfooding and testing, every UI element, keyboard interaction, dialog modal, and status indicator was evaluated against the **Anti-Bloat Rulebook**:
1. *Prefer `Remove` before `Add setting`.*
2. *Prefer `Simplify` before `Add workflow`.*
3. *Prefer `Hide` before `Add another panel`.*

---

## 2. Friction Points Identified & Resolved

### A. Sidebar & Panel Cognitive Load
- **Issue:** Persistent sidebars and dense file tree controls caused visual noise while drafting prose.
- **Resolution:**
  - Implemented seamless `Mod + B` sidebar toggle that smoothly expands the writing canvas to a distraction-free column.
  - Collapsed secondary folder stats into a minimalist status bar.
  - Maintained crisp typography margins (65–75 characters per line optimal reading width).

### B. Keyboard Shortcut Conflicts
- **Issue:** `Mod + B` served as both "Toggle Sidebar" and "Bold Selection".
- **Resolution:**
  - Standardized context awareness: when an active text selection exists inside the editor, `Mod + B` toggles **bold**. When no text selection exists or focus is outside the editor canvas, `Mod + B` toggles the **sidebar**.
  - All studio switchers (`Mod + 1..5`) and global palette (`Mod + K`) retain top priority without colliding with OS-level window management shortcuts.

### C. Autosave and Notification Noise
- **Issue:** Frequent visual toast notifications on automatic saves disrupted author immersion.
- **Resolution:**
  - Replaced disruptive popup toasts with a subtle, non-intrusive status bar dot and text indicator (`Saved` / `Saving...`).
  - Retained toast notifications strictly for critical errors (e.g. disk write failure, external modification conflict).

### D. Slash Command Ergonomics
- **Issue:** Slash commands triggering unexpectedly mid-sentence when writing path notations or fractions.
- **Resolution:**
  - Restricted `/` trigger to the beginning of a blank line or after whitespace at line start.
  - Added instant `Escape` dismissal without deleting surrounding prose.

### E. Cross-Studio State Preservation
- **Issue:** Switching between WRITE and EDIT previously lost scroll positions and selection ranges.
- **Resolution:**
  - Studio view models now maintain cursor offsets and scroll viewports in memory during cross-studio transitions (`Mod + 1` through `Mod + 5`).

---

## 3. Verification & Friction Assessment

| Area | Before Audit | After Milestone 11 Polish | Status |
| :--- | :--- | :--- | :--- |
| **Writing Canvas** | Cluttered with fixed panels | Distraction-free, responsive column | **Passed** |
| **Status Bar** | Verbose logs & popups | Minimalist word count & save indicator | **Passed** |
| **File Navigation** | Multi-click modal trees | Instant `Mod+P` fuzzy search & tree | **Passed** |
| **Shortcuts** | Ambiguous overlap on `Mod+B` | Context-aware selection handling | **Passed** |
| **Studio Switching** | Interrupted editor cursor | Cursor & scroll state preserved | **Passed** |
