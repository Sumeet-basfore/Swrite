# SWRITE 2 — Planning Studio Specification
Document Version: 2.0.0-alpha.1
Status: Canonical
Date: 2026-10-06

---

## 1. Vision & Architecture

The **Planning Studio** (`PLAN` mode) provides a calm, unified companion workspace alongside the **Writing Studio** (`WRITE` mode). It is designed to assist narrative authors with high-level structural organization without imposing administrative burdens or complex database schemas.

### 1.1 Core Principles

1. **Filesystem Grounding**: The outline is dynamically derived from the real `Manuscript/` folder structure on disk.
2. **Lossless Separation**: Prose belongs in Markdown files; planning metadata belongs in clean companion files (`Planning/Timeline.md` and `.swrite/outline_meta.json`).
3. **Calm Ergonomics**: Instant switching between `PLAN` and `WRITE` (`Mod+1` and `Mod+2`) preserves working editor buffers and view positions without reloading the application.
4. **No Relational Bloat**: Zero relational story databases, zero entity graph overhead, zero AI hallucination engines.

---

## 2. Studio Structure & Tabs

The Planning Studio hosts three dedicated environments accessible via tabbed navigation:

```text
┌─────────────────────────────────────────────────────────────┐
│  [Story Outline]       [Chronology & Timeline]   [Planning Documents] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                      Active Planning View                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

1. **Story Outline**:
   - Act, Chapter, and Scene hierarchy.
   - Dual Layout Modes: **Tree View** (compact hierarchical explorer) and **Scene Card Grid** (visual storyboard / corkboard).
   - Workflow Statuses: `Idea`, `Planned`, `Drafted`, `Revising`, `Complete`.
   - Contextual Inspector: Real-time editing of title aliases, scene summaries, and author planning notes.
   - Fast Action: Direct jump to the editor (`Open in Editor`) and instant Chapter/Scene creation.

2. **Chronology & Timeline**:
   - Event cards with temporal anchors (e.g. `Year 420`, `3 Years Before`, `Day 1, Nightfall`).
   - Narrative Marker classification (`Flashback`, `Flashforward`, `Memory`, `Backstory`, `Chronological`).
   - Bidirectional scene linking: Click any linked scene to immediately jump to the manuscript in the editor.
   - Dual Ordering: **Chronological Order** (story world time) vs **Narrative Order** (manuscript appearance).

3. **Planning Documents**:
   - Freeform Markdown files stored in `Planning/` (e.g. `Story Notes.md`, `Character Sketches.md`, `World Rules.md`).
   - Card-based file grid with quick creation and opening.

---

## 3. Keyboard Shortcuts & Workflow

| Shortcut | Scope | Description |
|---|---|---|
| `Mod + 1` | Global | Switch to Writing Studio (`WRITE`) |
| `Mod + 2` | Global | Switch to Planning Studio (`PLAN`) |
| `Mod + P` / `Mod + Shift + O` | Global | Open Omnisearch Modal |
| `Mod + B` | Global | Toggle Project Sidebar |
| `Mod + Shift + F` | Global | Toggle Distraction-Free Focus Mode |
