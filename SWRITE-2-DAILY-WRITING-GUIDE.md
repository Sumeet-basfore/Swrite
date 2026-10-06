# SWRITE 2 — Daily Writing Guide

A practical reference for authors using Swrite 2 for day-to-day manuscript production.

---

## 1. The Core Philosophy

Swrite 2 is designed around a simple principle: **prose first, distraction second to none**.

- **Filesystem Transparency:** Your manuscript is stored as standard Markdown files on disk in your project folder.
- **Zero Lock-in:** There are no proprietary databases, binary blobs, or cloud requirements.
- **Five Specialized Studios:** Each studio serves a specific phase of the writing lifecycle.

---

## 2. The Five Studios & Navigation

Switch seamlessly between studios using keyboard shortcuts:

| Studio | Shortcut | Primary Purpose | Key Workflows |
| :--- | :--- | :--- | :--- |
| **WRITE** | `Mod + 1` | Focused prose drafting | Distraction-free canvas, slash commands, word count, autosave |
| **PLAN** | `Mod + 2` | Structural story architecture | Outline hierarchy, chapter/scene ordering, timeline events |
| **DESK** | `Mod + 3` | Creative research & scratchpad | Character cards, world lore notes, moodboard images, freeform ideas |
| **EDIT** | `Mod + 4` | Revision & editorial refinement | Diff comparison, inline review comments, change tracking, snapshot rollbacks |
| **PUBLISH** | `Mod + 5` | Professional export & output | Typography presets, frontmatter formatting, export to PDF/DOCX/EPUB/MD/TXT |

*(Note: `Mod` corresponds to `Cmd` on macOS and `Ctrl` on Windows/Linux.)*

---

## 3. Daily Writing Routine (WRITE Studio)

### Opening & Creating Documents
- Use `Mod + P` or `Mod + O` to open the quick document finder.
- Use `Mod + N` to create a new scene or chapter document.
- Toggle the file navigation sidebar with `Mod + B` to maximize writing canvas real estate.

### Distraction-Free Canvas
- The editor automatically centers text in an ergonomically tuned writing column.
- Dynamic word count and target indicators appear unobtrusively in the footer.
- The status bar provides instantaneous save status feedback (`Saved`, `Saving...`, `Unsaved changes`).

### Slash Commands
Type `/` on a blank line to insert structural elements without breaking your typing flow:
- `/h1`, `/h2`, `/h3` — Section headings
- `/scene-break` — Standard manuscript horizontal rule / scene separator (`* * *`)
- `/quote` — Blockquote or dialogue excerpt
- `/note` — Editorial scratch note
- `/table` — Markdown table structure

### Essential Writing Shortcuts
- `Mod + S` — Manual save (autosave runs automatically every 1000ms after edits)
- `Mod + F` — In-document Find and Replace
- `Mod + K` — Command palette for instant action execution
- `Mod + Shift + F` — Project-wide full-text search

---

## 4. Organizing the Narrative (PLAN & DESK)

### Planning Your Arcs (PLAN)
- Switch to `Mod + 2` to view your hierarchical outline.
- Reorder scenes and chapters by dragging cards or adjusting sequence numbers.
- Track plot threads, temporal anchors, and character POV tags per scene.

### Reference & Scratchpad (DESK)
- Switch to `Mod + 3` when you need to look up world rules, character traits, or historical timelines.
- Store visual moodboards (`.png`, `.jpg`), raw research quotes, and brainstorming scratchpads.
- Everything in DESK is saved directly to your `.swrite/desk/` and project folders as standard assets.

---

## 5. Refining and Polishing (EDIT)

- Switch to `Mod + 4` for proofreading and line edits.
- Compare the current draft against previous automatic snapshots or explicit milestones.
- Leave revision comments with `Mod + Shift + C` to mark areas needing rewrites without cluttering manuscript text.
- Resolve comments as revisions are completed.

---

## 6. Exporting Your Book (PUBLISH)

- Switch to `Mod + 5` to prepare your work for agents, beta readers, or direct publication.
- Select from industry-standard publication presets (Standard Manuscript Format, Modern Paperback, E-reader, Clean Markdown).
- Configure running headers, page numbers, chapter breaks, and title page metadata.
- Export clean, high-fidelity files directly to your target directory.
