# SWRITE 2 — Writing Modes & Presentation Architecture

## 1. Overview of Modes

Swrite 2 provides three distinct modes within the WRITE environment, each tailored to a different cognitive phase of manuscript creation:

```text
Normal Writing Mode (Standard Studio)
  │
  ├── Focus Mode (Distraction-Free Drafting)
  │
  └── Reading Mode (Pre-Revision Proofing)
```

---

## 2. Normal Mode vs Focus Mode vs Reading Mode

### Normal Writing Mode
- **Purpose:** Everyday drafting with balanced tools.
- **Surface:** Clean centered page, subtle status bar, quick access to formatting and outline.
- **Sidebar:** Expandable with `Mod + B` or icon.

### Focus Mode (`Mod + Shift + F`)
- **Purpose:** Deep drafting flow without UI interruption.
- **Surface:** All application headers, toolbars, and chrome are hidden.
- **Typing Mechanics:** Centered manuscript column, active paragraph focus, dimmed peripheral text to maintain concentration on the current sentence.

### Reading Mode (`Mod + Shift + R`)
- **Purpose:** Continuous proofreading and prose evaluation before editing.
- **Surface:** Read-only presentation layout with elegant book-like typography.
- **Behavior:** Editing controls and selection formatting chrome are disabled, allowing the author to read through a chapter like a published book. Pressing `Esc` or clicking exit immediately returns to active writing.

---

## 3. Dual Engine: Rich ↔ Source Mode

Authors can toggle between Rich and Source Markdown with `Mod + /`:

- **State Retention:** Cursors, scroll positions, and document modifications are preserved seamlessly across mode switches.
- **Fidelity:** Markdown syntax, inline HTML callouts, table structures, and footnotes roundtrip without metadata loss.
