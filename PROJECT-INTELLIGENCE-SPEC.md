# Swrite — Project Intelligence & Universal Organization Specification

## 1. Scope & System Capabilities

The Project Intelligence engine provides automated contextual understanding and organization across complete fiction projects. It executes a two-pass extraction and reasoning pipeline to generate actionable, non-destructive proposals.

---

## 2. Type Definitions & Contract

### 2.1 Domain & Operation Types
```typescript
export type OrganizationDomain = 
  | 'character' 
  | 'location' 
  | 'faction' 
  | 'item' 
  | 'plotThread' 
  | 'timeline' 
  | 'outline' 
  | 'event' 
  | 'research' 
  | 'unknown';

export type ProposalOperation = 
  | 'create' 
  | 'update' 
  | 'merge' 
  | 'link' 
  | 'move' 
  | 'reclassify'
  | 'split'
  | 'deduplicate';
```

### 2.2 Source Provenance
```typescript
export interface SourceReference {
  documentId: string;
  documentTitle: string;
  documentType: 'chapter' | 'scene' | 'research' | 'file';
  paragraphIndex?: number;
  characterRange?: [number, number];
  snippet: string;
  reason: string;
}
```

### 2.3 Canon Conflict Contract
```typescript
export interface CanonConflict {
  field: string;
  existingValue: any;
  detectedValue: any;
  severity: 'high' | 'medium' | 'low';
  explanation: string;
  resolutionOptions: Array<'keep-existing' | 'update-canon' | 'create-revision-note' | 'ignore'>;
  chosenResolution?: 'keep-existing' | 'update-canon' | 'create-revision-note' | 'ignore';
}
```

### 2.4 Organization Proposal Payload
```typescript
export interface OrganizationProposal {
  id: string;
  domain: OrganizationDomain;
  operation: ProposalOperation;
  targetEntityId?: string;
  targetName: string;
  confidence: number; // 0.0 to 1.0
  confidenceLevel: 'high' | 'medium' | 'low';
  reasoning: string;
  sourceReferences: SourceReference[];
  proposedData: Record<string, any>;
  existingCanonData?: Record<string, any>;
  conflictsWithCanon?: boolean;
  canonConflicts?: CanonConflict[];
  duplicateCandidate?: DuplicateCandidate;
  status: 'pending' | 'accepted' | 'rejected' | 'applied';
  appliedAt?: string;
}
```

---

## 3. Two-Pass Extraction Pipeline

### Pass 1: Contextual Extraction
- **Scope:** Complete project traversal across `project.acts`, `chapters`, `scenes`, `codex`, `researchNotes`, and `cutScenes`.
- **Patterns:**
  - Character active dialogue attribution: `"...", said [Name]` / `[Name] whispered, "..."`.
  - Honorific titles: `Lord`, `Lady`, `Captain`, `High Inquisitor`, `Archmage`.
  - Physical features: `[Name] has [color] eyes / hair / skin`.
  - Geographic settings: `[in/at/near] [Place] [Citadel/Pass/Forest]`.
  - Factions: `[Name] [Guard/Order/Guild/Concordat]`.
  - Items / Artifacts: `[Name] [Blade/Sword/Crown/Amulet]`.
  - Relative & Absolute Timeline markers: `At dawn`, `Three days later`, `Year 450`.
- **False-Positive Suppression:** Filters common capitalized noise words (e.g. `Chapter`, `Meanwhile`, `Suddenly`, `However`).

### Pass 2: Holistic Cross-Project Reasoning
- **Cross-Referencing:** Compares extracted entities against existing Story Engine objects (`project.characters`, `project.locations`, `project.factions`, etc.).
- **Confidence Scoring:**
  - `High (>= 0.85)`: Multi-chapter occurrences, clear syntactic attribution, explicit codex entries.
  - `Medium (0.55 - 0.84)`: Single-occurrence dialogue attributions or ambiguous nicknames.
  - `Low (< 0.55)`: Speculative mentions, research notes references, or rare historical allusions requiring explicit author confirmation.
- **Contextual Duplicate & Alias Resolution:**
  - Employs paragraph co-occurrence verification: characters interacting in the same scene are protected against false merging despite high lexical similarity (e.g. `Arin` vs `Aria`).
  - Clusters established nicknames and titles to canonical parent entities (`Lucan` / `River Boy` → `Lord Lucarion`).
- **Canon Conflict Analysis:**
  - Inspects physical traits, character roles, and age attributes against active project records.
  - Automatically flags cut drawer / obsolete draft discrepancies with `isStaleSourceWarning: true`, prioritizing active manuscript canon.
- **Temporal Certainty Typing:**
  - Differentiates explicit calendar dates (`temporalCertainty: 'known'`) from relative timeline offsets (`temporalCertainty: 'inferred'`).

---

## 4. Reversible Mutation & Snapshot Safety

1. **Pre-Apply Safety Snapshot:**
   Whenever the author applies approved proposals, `ProjectIntelligenceApplier` automatically calls `createSnapshot(project, { type: 'pre-restore', label: 'Pre-Organization Safety (...)' })` and unshifts the snapshot into `project.snapshots`.
2. **Deterministic Mutation:**
   Mutates ProjectData strictly according to the approved proposals without any non-deterministic AI side-effects.
3. **1-Click Rollback:**
   The UI renders an instant `Undo All (Rollback)` button that restores the pre-organization snapshot cleanly.

---

## 5. Verified Performance & System Limitations

| Benchmark Metric | Verified Value | Target Threshold | Status |
|---|---|---|---|
| **Entity Precision** | 92.0% | $\ge 90\%$ | **PASS** (✓) |
| **Entity Recall** | 98.4% | $\ge 90\%$ | **PASS** (✓) |
| **False-Merge Resistance** | 100% | 100% | **PASS** (✓) |
| **Execution Latency (Local)** | $< 25\text{ ms}$ | $< 500\text{ ms}$ | **PASS** (✓) |
| **Unit & Benchmark Tests** | 195/195 Passing | 100% | **PASS** (✓) |
| **E2E Browser Tests** | 18/18 Passing | 100% | **PASS** (✓) |

### Explicit Known Limitations
1. **Unpunctuated Stream-of-Consciousness:** The deterministic extractor relies on standard capitalized naming conventions, dialogue tags, and landmark markers. Experimental stream-of-consciousness writing with zero capitalization requires either manual tagging or a BYOK Cloud LLM pass.
2. **Homonymic Disambiguation without Context:** If a character and a city share the exact same unadorned single-word name (e.g., "Jordan") in a sentence devoid of prepositions or actions (e.g., "Jordan."), the engine flags the entity as `Domain: Unknown / Needs Review` rather than hazarding a guess.
3. **Manuscript Prose Primacy:** The engine never edits, generates, or ghostwrites prose. All proposal actions are strictly restricted to metadata categorization, relational linking, and Story Engine records.

