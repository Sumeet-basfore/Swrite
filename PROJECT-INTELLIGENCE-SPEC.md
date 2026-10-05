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
  - `High (>= 0.85)`: Repeated multi-chapter occurrences, clear syntactic attribution, explicit codex entries.
  - `Medium (0.55 - 0.84)`: Single-occurrence dialogue attributions or ambiguous nicknames.
  - `Low (< 0.55)`: Speculative or rare mentions requiring author confirmation.
- **Duplicate Detection:** Calculates lexical similarity and checks for substring/prefix nickname patterns.
- **Canon Conflict Analysis:** Inspects character physical traits, roles, and status against existing entries.

---

## 4. Reversible Mutation & Snapshot Safety

1. **Pre-Apply Safety Snapshot:**
   Whenever the author applies approved proposals, `ProjectIntelligenceApplier` automatically calls `createSnapshot(project, { type: 'pre-restore', label: 'Pre-Organization Safety (...)' })` and unshifts the snapshot into `project.snapshots`.
2. **Deterministic Mutation:**
   Mutates ProjectData strictly according to the approved proposals without any non-deterministic AI side-effects.
3. **1-Click Rollback:**
   The UI renders an instant `Undo All (Rollback)` button that restores the pre-organization snapshot cleanly.
