# Swrite — Continuous Project Intelligence & Assisted Organization Architecture

## 1. Overview & Core Philosophy

Swrite's Continuous Project Intelligence system extends the two-pass project extraction engine from a one-time import tool into a **continuous, incremental project-understanding layer**.

### Key Rules & Guarantees
1. **Author Authoritative Rule:** AI NEVER auto-applies structural or canon mutations silently to `ProjectData`. All canon updates require explicit author review or explicit batch approval.
2. **Manuscript Primacy:** Manuscript prose is primary and authoritative. AI proposals are strictly advisory and organizational.
3. **Incremental Delta Analysis:** Content hashing (`FNV-1a`) tracks dirty document boundaries. Only modified documents and their immediate retrieval scopes are analyzed.
4. **Low-Noise Secondary UX:** Organization Inbox and Contextual Suggestion Banners are secondary and non-intrusive. Writing remains uninterrupted.
5. **Reversible Safety:** Every proposal application captures an automatic pre-apply safety snapshot (`ManuscriptSnapshot`), enabling 1-click full rollback.
6. **Cross-Project Isolation & Async Safety:** Mid-execution project switching immediately invalidates background analysis tokens to prevent cross-project pollution or state bleeding.

---

## 2. Architectural Components

```
Author Edits Manuscript / Codex / Notes
                  │
                  ▼
   ProjectIntelligenceIndexer
   (Hashes content & computes IncrementalChangeDelta)
                  │
                  ▼
   IncrementalIntelligenceEngine
   (Runs scoped delta analysis & manages non-blocking queue)
                  │
                  ▼
   Organization Inbox & Contextual Suggestion Banners
   (Non-intrusive review queue & subtle inline advisories)
                  │
                  ▼
   Author Approves / Batch Accepts Proposals
                  │
                  ▼
   ProjectIntelligenceApplier
   (Captures automatic Safety Snapshot -> Mutates ProjectData safely)
```

### 2.1 Content Hashing & Indexing (`src/engine/intelligence/indexer.ts`)
- **Fast Hashing:** Uses 32-bit FNV-1a hashing (`computeContentHash`) for fast, non-blocking string verification.
- **Tracked Entities:** Chapters, Scenes, Characters, Locations, Factions, Items, Research Notes, Cut Scenes.
- **Index State (`ProjectIntelligenceIndex`):** Non-canonical metadata storing content hash records, dirty document IDs, known entity IDs, and active inbox items.

### 2.2 Scoped Retrieval (`calculateRetrievalScope`)
When a document is marked dirty, the retrieval engine calculates a focused scope:
- Dirty document (scene/chapter)
- Containing parent chapter
- Referenced character IDs and location IDs in active scene
- Timeline events linked to the scene

### 2.3 Incremental Engine (`src/engine/intelligence/incrementalEngine.ts`)
- Manages non-blocking analysis queue.
- Integrates with local deterministic or cloud model providers (`OrganizationModelProvider`).
- Implements async token guards (`currentAnalysisToken`) to discard stale results when switching projects.

### 2.4 Organization Inbox (`src/components/intelligence/OrganizationInbox.tsx`)
- Secondary panel for reviewing extracted proposals.
- Filterable by: `All`, `Characters`, `Timeline`, `Outline`, `Relationships`, `Research`, `Conflicts`, `Duplicates`.
- Review Actions:
  - **Accept:** Marks proposal for application.
  - **Reject:** Discards proposal.
  - **Ignore:** Suppresses proposal from active review queue.
  - **Remember Later:** Postpones proposal review.
  - **Batch Apply Safe:** Applies all $\ge 80\%$ confidence proposals with zero canon conflicts in 1 click.
  - **Rollback:** Restores project state from pre-apply safety snapshot.

### 2.5 Contextual Suggestions (`src/components/intelligence/ContextualSuggestionBanner.tsx`)
- Non-intrusive inline banners for Scene Editor, Outliner, Timeline, and Inspector.
- Surfaces key findings (new character, alias link, canon conflict warning) without forcing workspace transitions.

---

## 3. Data Contract Summary

```typescript
export interface ProjectIntelligenceIndex {
  projectId: string;
  lastFullAnalysis?: string;
  lastIncrementalAnalysis?: string;
  contentHashes: Record<string, ContentHashRecord>;
  extractedEntityIds: string[];
  knownAliases: Record<string, string[]>;
  dirtyDocumentIds: string[];
  inboxItemIds: string[];
}

export interface OrganizationInboxItem {
  id: string;
  proposal: OrganizationProposal;
  category: InboxFilterCategory;
  status: InboxItemStatus;
  createdTimestamp: string;
  userFacingReason: string;
  contextSnippet?: string;
}

export interface ContextualSuggestion {
  id: string;
  domain: OrganizationDomain;
  targetName: string;
  suggestionType: 'new-character' | 'alias-link' | 'location-mention' | 'timeline-event' | 'canon-conflict' | 'duplicate-warning';
  title: string;
  text: string;
  priority: 'low' | 'medium' | 'high';
}
```

---

## 4. Empirical Verification & Test Coverage

- **205 Engine Unit & Benchmark Tests Passing:** Covers hashing, dirty detection, deduplication, inbox filtering, zero silent mutation, safety snapshot rollback, async cancellation, and provider failure safety.
- **18 Playwright E2E Browser Tests Passing:** Verified across scene creation, split, reorder, keyboard safety, focus mode, and publication profiles.
- **Clean TypeScript Build:** Verified with zero build warnings.
