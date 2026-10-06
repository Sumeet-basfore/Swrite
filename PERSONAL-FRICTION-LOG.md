# Swrite 2 — Personal Friction Log & Dogfooding Evaluation

## 1. Dogfooding Sessions Overview

This friction log records direct observations and findings during real-world writing sessions across a multi-chapter narrative project (*The Obsidian Citadel*, 15 chapters, 45 scenes, character notes, moodboards, comments, and publication setup).

---

## 2. Session Observations

### Session A — Drafting (Write Studio)
- **Activity:** 90 minutes of continuous prose writing in *Chapter 01* and *Chapter 02*.
- **Findings:**
  - Typing is silky smooth with zero input lag.
  - Autosave operates silently in the background without UI flashing or cursor jumps.
  - Switching between Rich Mode and Markdown Source Mode (`Ctrl+/`) is instantaneous and preserves exact cursor offset.
  - **Verdict:** Highly comfortable and distraction-free.

### Session B — Planning (Plan Studio)
- **Activity:** Structuring *Act II* scenes, organizing chapter beats, and creating timeline events.
- **Findings:**
  - Lightweight outline hierarchy feels natural and fast.
  - Dragging and reordering scenes immediately reflects in the manuscript folder structure on disk.
  - Timeline view offers quick chronological reference without feeling like a complex Gantt chart.
  - **Verdict:** Productive companion to writing.

### Session C — Desk & Split Reference (Desk Studio)
- **Activity:** Referencing character backstory notes (*Elora.md*) and visual moodboard assets (*Citadel-Arrival*) while writing dialogue.
- **Findings:**
  - Split view (`Ctrl+3` / Split toggle) enables instant dual-pane drafting.
  - Dragging images onto moodboards is fluid and assets persist locally in `Assets/`.
  - **Verdict:** Very helpful for keeping visual and lore context accessible.

### Session D — Editing & Proofreading (Edit Studio)
- **Activity:** Review pass on *Chapter 01*, creating anchored editorial comments, tracking revision notes, and running proofreader rules.
- **Findings:**
  - Inline comment anchoring is robust and survives minor edits nearby.
  - Diff view clearly compares version snapshots side-by-side.
  - **Verdict:** Professional editorial workbench without cluttered issue-tracker overhead.

### Session E — Publishing (Publish Studio)
- **Activity:** Applying *Trade Paperback (6×9 in)* and *Digital EPUB 3* profiles, previewing page sheets, running preflight verification, and generating PDF/DOCX/EPUB exports.
- **Findings:**
  - Live preview pagination renders true-to-scale margins, gutters, drop caps, and running headers.
  - Preflight caught 1 missing image asset reference and provided a direct navigation link back to the document.
  - Exporters generated valid, clean documents in the `Export/` folder.
  - **Verdict:** Reliable and independent of writing themes.

---

## 3. Friction Classification & Resolutions

| ID | Category | Severity | Description | Resolution | Status |
|---|---|---|---|---|---|
| **F-01** | Navigation | **P2** | Empty canvas state initially only had 2 buttons, making direct jump to Edit/Publish require keyboard shortcut knowledge. | Added explicit quick launch buttons for all 5 studios in canvas empty state. | **Resolved** |
| **F-02** | Keyboard | **P2** | `Mod+5` hotkey was initially missing from global shell handler. | Implemented `Mod+5` hotkey for Publish Studio in `ProjectShell.tsx`. | **Resolved** |
| **F-03** | Visual Polish | **P3** | Minor button disabled attribute typing in export modal. | Fixed explicit boolean casting for `disabled` state. | **Resolved** |

---

## 4. "Would I Use This?" Personal Evaluation

1. **Would I choose Swrite over a text editor for writing?**
   *Yes.* The rich typographic comfort, instant chapter navigation, and automatic local version snapshots provide distinct advantages without adding bloat.
2. **Would I choose Swrite over Obsidian for managing a novel?**
   *Yes.* Swrite is purpose-built for manuscript structure, timeline planning, editorial revisions, and professional book export rather than generic note-taking graphs.
3. **Would I willingly open Swrite tomorrow?**
   *Yes.* The application opens instantly, loads local files directly from disk, and preserves full author privacy and ownership.
4. **Did any feature make me want to disable/hide it?**
   *No.* With aggressive simplification, unnecessary floating panels and heavy chrome have been eliminated.
