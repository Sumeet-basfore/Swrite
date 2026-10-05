# SWRITE 2 — REVISION NOTES & STRUCTURAL EDITING SPECIFICATION

## 1. Overview & File Format

Revision notes represent high-level author-driven editorial instructions that span beyond line-level typos.

They are stored in `.swrite/revisions.json`.

```json
{
  "revisions": [
    {
      "id": "rev_1791234567000_12345",
      "title": "Restructure Chapter 3 Climax",
      "description": "Increase tension during the courtyard encounter; foreshadow the betrayal earlier.",
      "category": "Pacing",
      "severity": "high",
      "status": "open",
      "target_path": "Manuscript/Chapter-03.md",
      "anchor": null,
      "created_at": "2026-10-06T00:00:00Z",
      "updated_at": "2026-10-06T00:00:00Z"
    }
  ]
}
```

---

## 2. Editorial Categories

Authors categorize revision notes by narrative domain:

- `Structure`: Macro chapter and scene architecture
- `Plot`: Story logic, twists, arcs, and stakes
- `Character`: Motivations, psychology, and arcs
- `Pacing`: Scene momentum and narrative tension
- `Dialogue`: Subtext, voice, and rhythm
- `Worldbuilding`: Setting rules and lore fidelity
- `Continuity`: Timeline and factual consistency
- `Prose`: Line editing and descriptive rhythm
- `Proofreading`: General cleanup notes
- `General`: Uncategorized author reminders

---

## 3. Lifecycle & State Machine

1. `open`: Active revision goal needing work.
2. `resolved`: Completed revision verified by the author.
3. `ignored`: Dismissed or obsolete revision goal.

Each state change updates `updated_at` and persists atomically via `revisions_update(rev)` IPC.
