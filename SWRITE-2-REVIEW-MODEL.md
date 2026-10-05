# SWRITE 2 — UNIFIED REVIEW QUEUE SPECIFICATION

## 1. Concept & Purpose

The **Review Queue** (`src/edit/review/`) aggregates all actionable editorial items across the manuscript into a single prioritised stream.

Instead of hunting through separate panels for typos, marginal comments, and plot notes, the author can process their manuscript through a unified keyboard-driven queue.

---

## 2. Review Item Model

Each item in the queue implements `ReviewQueueItem`:

```typescript
export interface ReviewQueueItem {
  id: string;
  type: 'proofreading' | 'comment' | 'revision';
  title: string;
  detail: string;
  documentPath: string;
  documentId?: string;
  anchor?: TextAnchor | null;
  severity: 'low' | 'medium' | 'high' | 'info' | 'warning' | 'error';
  category?: string;
  status: 'open' | 'resolved' | 'ignored';
  matchedText?: string;
  suggestedReplacement?: string | null;
  lineNumber?: number;
  columnNumber?: number;
}
```

---

## 3. Scoping & Filtering

The author can narrow the review queue using multiple dimensions:

1. **Scope Selection**:
   - `Current Document`: Only items relevant to the currently active manuscript file.
   - `Current Chapter`: Items across all scenes in the current chapter directory.
   - `Entire Manuscript`: All items across the entire project manuscript tree.

2. **Type Filters**:
   - `All`: Unfiltered stream.
   - `Proofreading`: Only deterministic typographic/grammar findings.
   - `Comments`: Only marginal author comments.
   - `Revisions`: Only structural revision cards.

3. **Severity Filters**:
   - `High` / `Error`, `Medium` / `Warning`, `Low` / `Info`.

---

## 4. Keyboard Navigation Workflow

The Review Queue supports lightning-fast triage without touching the mouse:

- `J` / `ArrowDown`: Select next item in queue.
- `K` / `ArrowUp`: Select previous item in queue.
- `Enter`: Jump directly to the anchored passage in the Write Studio.
- `R`: Mark item as resolved (persisting resolution state).
- `I`: Ignore item (adds finding ID to `.swrite/dictionary.json` or updates note status).
