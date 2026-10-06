# SWRITE 2 — EDIT STUDIO ARCHITECTURE SPECIFICATION

## 1. Overview & Purpose

The **Edit Studio** (`EDIT`) is the fourth primary studio environment in Swrite 2, accessible via the studio switcher or the `Mod+4` keyboard shortcut (joining `WRITE` `Mod+1`, `PLAN` `Mod+2`, and `DESK` `Mod+3`).

The Edit Studio provides a distraction-free, quiet, and author-controlled workspace for transforming draft prose into polished manuscript material. It unifies four essential editorial views:

1. **Review Queue**: Actionable, aggregated stream of proofreading findings, comments, and revision notes.
2. **Comments Studio**: In-depth contextual comment management, threading, and stale-anchor reconciliation.
3. **Revisions Studio**: High-level structural, plot, character, and pacing revision notes.
4. **History & Diffs**: Document snapshot timeline, LCS line-diff comparison, and safe snapshot restore.
5. **Scoped Find & Replace**: Global and document-scoped search/replace with match preview and word boundaries.

---

## 2. Core Architectural Principles

- **Author Sovereignty**: The editing engine never makes destructive or silent edits. Every change requires author confirmation.
- **Local Filesystem Canonical Truth**: Manuscripts remain standard UTF-8 Markdown/TXT files on disk. Metadata (comments, revisions, dictionaries) resides in `.swrite/*.json`.
- **Zero AI Requirement**: Proofreading and comparisons run 100% deterministically on device with zero cloud dependencies or generative unpredictability.
- **Safe State Transitions**: All version restorations take an automated pre-restore safety snapshot before modifying working files.

---

## 3. Edit Studio Component Structure

```text
src/edit/
├── EditStudio.tsx              # Master studio host container
├── types.ts                    # Typed interfaces for review, comments, revisions, diffs
├── edit.css                    # Distraction-free editorial styling
├── review/
│   ├── useReviewState.ts       # Unified queue state & hotkey coordinator
│   ├── ReviewQueueView.tsx     # Review queue list & filter controls
│   └── ReviewItemCard.tsx      # Editorial action card (resolve, ignore, jump, replace)
├── comments/
│   ├── useCommentsState.ts     # Comment threads & stale anchor detector
│   ├── CommentsView.tsx        # Comments list & search view
│   └── CommentThreadCard.tsx   # Thread card with reply composer
├── revisions/
│   ├── useRevisionsState.ts    # Revision notes state & categories
│   ├── RevisionsView.tsx       # Revision grid & status filters
│   └── RevisionModal.tsx       # Create/edit revision note modal
├── history/
│   ├── useHistoryDiffState.ts  # Snapshot loader & LCS diff engine
│   ├── HistoryView.tsx         # Version timeline & restore workflow
│   └── DiffViewer.tsx          # Side-by-side and unified line diff renderer
└── findreplace/
    └── FindReplaceModal.tsx    # Scoped find and replace modal
```
