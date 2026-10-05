# Swrite — Project Intelligence UX & Real-World Organization Workflow

## 1. Overview & Core Principle

Swrite's AI Project Intelligence workflow adheres strictly to the core product principle:

> **AI should be aggressive in understanding, conservative in changing, and extremely selective in interrupting.**

- **Aggressive in Understanding:** Whole-project deep indexing captures full contextual provenance across acts, chapters, scenes, characters, locations, factions, items, research notes, and cut scenes.
- **Conservative in Changing:** AI proposals NEVER auto-apply silent changes to `ProjectData`. All canon updates require explicit author review or explicit batch approval.
- **Selective in Interrupting:** Low-importance observations (incidental mentions, trivial name occurrences) are suppressed during continuous writing.

---

## 2. Two Operational Modes

### Deep Organization (`Analyze Project`)
- **Trigger:** Explicit author action in the Organization Inbox header (`Analyze Project`).
- **Use Cases:** Initial project import, major restructuring, manuscript migration, cleanup of messy projects.
- **Behavior:** Executes comprehensive whole-project contextual analysis across all domains, establishes or updates the `ProjectIntelligenceBaseline`, and populates the inbox with all categorized proposals.

### Continuous Maintenance (`Maintain Project Intelligence`)
- **Trigger:** Automatic background delta detection after author edits.
- **Behavior:** Scans content dirty state via 32-bit FNV-1a content hashing, calculates focused retrieval scopes (dirty document + related entities), and runs incremental delta analysis.
- **Anti-Noise Policy:** Low-importance findings are automatically suppressed from the inbox and status indicators during continuous writing.

---

## 3. Factual Editorial Status Terminology

| Status Code | Factual Label | UI Visual Indicator |
|---|---|---|
| `up-to-date` | **Up to date** | Emerald check badge |
| `analyzing` | **Analyzing** | Sky spinner badge |
| `review-available` | **Review available (N)** | Indigo inbox badge |
| `conflict-detected` | **Canon conflict detected (N)** | Amber warning badge |
| `analysis-unavailable` | **Analysis unavailable** | Slate muted badge |

*Note: Wording such as "AI is thinking" or "AI found things" is strictly forbidden.*

---

## 4. Author Attention Budget & Importance vs Confidence

The system explicitly separates **Confidence** (certainty of extraction accuracy, 0–100%) from **Importance** (`high` | `medium` | `low`):

- **High Importance:** Canon conflicts, duplicate/alias candidates, active manuscript entity discoveries, timeline contradictions, major character state changes (goal, belief, faction).
- **Medium Importance:** Structural scene split proposals from explicit ornaments (`* * *`), new manuscript locations/factions.
- **Low Importance:** Trivial mentions without state change, incidental/historical allusions, research-only references, cut drawer notes. *Suppressed during continuous maintenance.*

### Empirical Quality Metrics
- **Useful Organization Rate:** `(High + Medium Importance Proposals) / Total Proposals`
- **Noise Rate:** `(Low Importance Proposals) / Total Proposals`

---

## 5. Organization Inbox Action Queue

The Organization Inbox provides an immediate 5-point answer for every proposal:
1. **What changed?** Target entity and domain.
2. **Why does it matter?** Detailed contextual reasoning.
3. **Where was it found?** Provenance document title, category, and text snippet.
4. **What would Swrite change?** Explicit side-by-side comparison of `CANON` vs `NEW EVIDENCE`.
5. **What should I do?** Context-aware action buttons.

### Context-Aware Actions
- **Duplicates:** `Merge Alias` | `Keep Separate` | `Later`
- **New Entities:** `Create Record` | `Ignore` | `Later`
- **Canon Conflicts:** `Keep Canon` | `Accept New Evidence` | `Revision Note`
- **Timeline Events:** `Set Timeline Date` | `Keep Canon` | `Later`
- **Relationships:** `Update Relationship` | `Keep Canon` | `Ignore`

### Ignore & Remember Later Semantics
- **`Remember Later`**: Defers finding from active review without ignoring permanently or repeatedly surfacing during the active session. Retained under deferred item IDs.
- **`Ignore`**: Records the proposal's `evidenceHash` in `index.ignoredEvidenceHashes`. The finding will NOT reappear on subsequent incremental passes unless the underlying source evidence materially changes.

---

## 6. Strict Writing Interruption Rules

Continuous intelligence **NEVER**:
- opens a modal automatically
- moves keyboard focus away from the editor
- replaces text in the manuscript automatically
- scrolls the manuscript view
- blocks user typing
- pauses the editor waiting for AI responses
- displays repeated popup notifications

Writing remains 100% uninterrupted.

---

## 7. Reversible Safety & 1-Click Rollback

Before applying any approved proposal batch, `ProjectIntelligenceApplier` automatically captures a `ManuscriptSnapshot` labeled `Pre-Organization Safety`. The author can click `Rollback` in the inbox at any time to restore the exact pre-organization project state.
