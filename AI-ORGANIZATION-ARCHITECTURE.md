# Swrite — AI Project Intelligence & Universal Organization Architecture

## Executive Summary

Swrite's **AI Project Intelligence & Universal Organization Engine** transforms fragmented author notes, chapters, scenes, lore documents, and cut material into a richly connected, canonical narrative universe.

Crucially, **this is NOT an AI writing generation system**. The author's prose and canonical intentions remain sovereign. The AI functions exclusively as a tireless editorial assistant that analyzes whole-project context, classifies material into Swrite structures, identifies subtle discrepancies, and presents structured, non-destructive proposals for author approval.

---

## 1. Core Architectural Principles

```
                       ┌──────────────────────────────────────────────┐
                       │           Whole Project Context              │
                       │  Acts · Chapters · Scenes · Codex · Notes   │
                       └──────────────────────┬───────────────────────┘
                                              │
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │  PASS 1: Contextual Extraction & Provenance  │
                       │     - Direct Dialogue Attribution            │
                       │     - Honorific & Title Discovery            │
                       │     - Physical Traits & Status Signals       │
                       │     - Geographic Prepositions & Landmarks    │
                       │     - Object Nouns & Lore References         │
                       │     - Mandatory Document/Snippet Provenance  │
                       └──────────────────────┬───────────────────────┘
                                              │
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │  PASS 2: Holistic Classification & Reasoning │
                       │     - Multi-Domain Cross-Referencing         │
                       │     - Confidence Scoring (High/Med/Low)      │
                       │     - Levenshtein Duplicate & Alias Checks   │
                       │     - Existing Canon Conflict Detection      │
                       │     - Scene Segmentation Advisory            │
                       └──────────────────────┬───────────────────────┘
                                              │
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │       Deterministic Proposal Contract        │
                       │     - Status: Pending / Accepted / Rejected  │
                       │     - Actionable Operations (Create/Merge)   │
                       └──────────────────────┬───────────────────────┘
                                              │
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │          Author Decision Workspace           │
                       │     - Multi-Domain Filter Tabs & Counters    │
                       │     - Exact Literary Excerpt Provenance      │
                       │     - Duplicate Merge vs Separate Resolver   │
                       │     - Canon Conflict Resolution Modal        │
                       └──────────────────────┬───────────────────────┘
                                              │
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │       Safe Deterministic Applier             │
                       │  1. Pre-Organization Safety Snapshot         │
                       │  2. Deterministic ProjectData Mutation       │
                       │  3. Instant 1-Click Snapshot Rollback        │
                       └──────────────────────────────────────────────┘
```

### Principle 1: Never Organize by Surface Filename
A document named `John.md` containing *"The John is an eighty-gun heavy galleon built in Oakhaven"* must **never** be classified as a character. The engine extracts the semantic content and correctly classifies it as a **Vehicle / Item / Lore** entry.

### Principle 2: Strict Provenance Retention
Every candidate extracted in Pass 1 retains exact source metadata:
- `documentId`: ID of the Act/Chapter/Scene/Codex/Note.
- `documentTitle`: Human-readable document hierarchy (e.g. `Act I · Chapter 1: The High Inquisitor · Scene 1`).
- `paragraphIndex`: Index of the exact paragraph in the text.
- `snippet`: The precise excerpt showing the entity in narrative context.
- `reason`: The syntactic or semantic evidence triggering detection.

### Principle 3: AI Proposes $\to$ Author Decides $\to$ Engine Applies
The AI model NEVER directly alters the canonical project state. It produces an immutable array of `OrganizationProposal` objects. The author inspects, modifies, accepts, or rejects individual or batch proposals. Only approved proposals are applied by the deterministic engine.

### Principle 4: Automatic Pre-Apply Safety Snapshot & Instant Rollback
Before applying approved proposals, the applier captures a timestamped `pre-restore` safety snapshot in `project.snapshots`. If an author is unsatisfied with an applied organization batch, a single click immediately reverts the manuscript and Story Engine state to the exact pre-operation snapshot.

---

## 2. Multi-Domain Entity Coverage

The engine classifies raw material across 9 distinct Swrite narrative domains:

| Domain | Target Story Engine Entity | Extracted Attributes |
|---|---|---|
| **Character** | `Character` (`project.characters`) | Name, aliases, formal titles, physical appearance, bio, motivations, flaws, roles. |
| **Location** | `Location` (`project.locations`) | Geographic names, landmarks, fortress/city types, parent locations, sensory details. |
| **Faction** | `Faction` (`project.factions`) | Military orders, guilds, syndicates, doctrines, alliances, rivalries. |
| **Item** | `Item` (`project.items`) | Legendary weapons, relics, ciphers, artifacts, current owner, significance. |
| **Plot Thread** | `PlotThread` (`project.plotThreads`) | Narrative questions, mysteries, character arcs, active conflicts. |
| **Timeline / Event** | `Event` (`project.events`) | In-universe calendar dates, historical milestones, scene order, participants. |
| **Outline Architecture** | `Scene` (`chapter.scenes`) | Unsegmented chapter continuous prose $\to$ structured scene boundaries. |
| **Research Note** | `ResearchNote` (`project.researchNotes`) | Real-world historical, linguistic, anatomical, or scientific references. |
| **Codex Lore** | `CodexEntry` (`project.codex`) | Worldbuilding encyclopedia articles and background mythologies. |

---

## 3. Duplicate & Alias Resolution Subsystem

To eliminate duplicate clutter without losing character aliases:
1. **Fuzzy Lexical Distance:** Computes Levenshtein and token-overlap similarity between newly detected candidates and existing canonical entities.
2. **Title & Nickname Disambiguation:** Distinguishes between formal titles (e.g. `High Inquisitor Corvus` vs `Corvus`) and casual nicknames (e.g. `Lucarion` vs `Lucan`).
3. **Tri-State Resolution:**
   - `Merge as Alias`: Adds the candidate name to `character.aliases` without creating a duplicate record.
   - `Keep as Separate Entity`: Creates a new distinct character record.
   - `Review Later`: Leaves proposal pending for detailed scrutiny.

---

## 4. Canon Conflict Detection Subsystem

When the manuscript contradicts established Story Engine lore:
1. **Physical Traits:** e.g., Canon bio states `Brown eyes`, but manuscript text describes `Corvus has violet eyes that burned with arcane fire`.
2. **Role Contradictions:** e.g., Canon lists `Protagonist`, but text attributes antagonist villain actions.
3. **Status Contradictions:** e.g., Deceased character actively speaking or fighting in later timeline chapters.
4. **Resolution Matrix:**
   - `[Keep Existing]`: Retains canonical record as authoritative; flags text as revision note.
   - `[Update Canon]`: Updates Story Engine entity with the newly detected manuscript truth.
   - `[Create Revision Note]`: Creates an anchored editorial revision item in the Unified Review Queue.
   - `[Ignore]`: Dismisses the warning as intentional artistic license.

---

## 5. Model Provider Architecture

The intelligence engine supports 3 flexible provider tiers with zero lock-in:

```
                  ┌──────────────────────────────────────────────┐
                  │          OrganizationModelProvider           │
                  └───────┬──────────────┬──────────────┬────────┘
                          │              │              │
             ┌────────────┴───┐   ┌──────┴──────┐  ┌────┴─────────────┐
             │ Deterministic  │   │  Local LLM  │  │  BYOK Cloud LLM  │
             │  Local Engine  │   │   (Ollama)  │  │ (Gemini/Claude)  │
             └────────────────┘   └─────────────┘  └──────────────────┘
```

1. **Deterministic Local Provider (`local-deterministic`):**
   - 100% offline, zero network dependencies, runs in sub-millisecond time.
   - Powered by syntactic NLP tokenizers, regex phrase matchers, and Levenshtein metric trees.
   - Default out-of-the-box engine.
2. **Local Offline LLM Provider (`local-llm`):**
   - Connects to local Ollama / LMStudio endpoints (e.g. `http://localhost:11434`).
   - Private, offline, zero data leaves the author's machine.
   - Falls back gracefully to the deterministic engine if endpoint is unreachable.
3. **BYOK Cloud Provider (`cloud-llm`):**
   - Bring-Your-Own-Key for Gemini 1.5 Pro, Claude 3.5 Sonnet, or GPT-4o.
   - Client-side direct connection; API keys stored in encrypted browser storage.
