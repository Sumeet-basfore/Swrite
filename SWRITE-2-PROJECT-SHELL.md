# Swrite 2 — Project Shell Specification

## 1. Overview & Visual Architecture

The Swrite 2 **Project Shell** provides a restrained, distraction-free desktop writing studio frame around the manuscript canvas:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ [≡] Swrite · The Cartographer of Shadows > Manuscript > Chapter 01  🔍 │
├──────────────────────────┬─────────────────────────────────────────────┤
│ MANUSCRIPT               │                                             │
│ ├── Act I                │             Manuscript Canvas               │
│ │   ├── Chapter 01.md    │                                             │
│ │   └── Chapter 02.md    │        "The lantern flickered in            │
│ └── Act II               │         the drafty archives..."             │
│ PLANNING                 │                                             │
│ DESK                     │                                             │
│ ASSETS                   │                                             │
├──────────────────────────┴─────────────────────────────────────────────┤
│ 1,240 words · 6,890 chars · 6 min read                         ● Saved │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Shell Header & Controls

1. **Sidebar Toggle (`[≡]`)**:
   - Collapses or expands the file navigation sidebar (`Mod + B`).
   - Persists state in `.swrite/ui_state.json`.

2. **Project Identity**:
   - Displays the project name (e.g. `The Cartographer of Shadows`).
   - Breadcrumb navigation showing current hierarchical location (`Manuscript > Act I > Chapter 01.md`).

3. **Global Omnisearch Trigger (`🔍`)**:
   - Quick launch with `Mod + P` or `Mod + Shift + O`.
   - Real-time search across text content and filenames.

4. **Recent Documents (`🕒`)**:
   - Quick dropdown displaying the last 20 opened files with timestamps.

5. **Distraction-Free Focus Mode (`⛶`)**:
   - `Mod + Shift + F`: Hides shell header, sidebar, and formatting bars.
   - Smoothly transitions the canvas into a full-screen, quiet writing desk.

---

## 3. Keyboard Accelerators

| Shortcut | Context | Action |
| :--- | :--- | :--- |
| `Mod + B` | Global Shell | Toggle Sidebar |
| `Mod + P` / `Mod + Shift + O` | Global Shell | Open Project Omnisearch |
| `Mod + Shift + F` | Global Shell | Toggle Focus Mode |
| `F2` / `Enter` | File Tree | Inline Rename |
| `Delete` / `Backspace` | File Tree | Move Selected File to Trash |
| `Esc` | Modals / Menus | Dismiss Popup / Context Menu |
| `↑` / `↓` | Tree / Search | Navigate File Tree or Search Matches |
