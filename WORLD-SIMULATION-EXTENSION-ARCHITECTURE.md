# SWRITE — WORLD SIMULATION EXTENSION ARCHITECTURE

**Branch:** `experiment/world-simulation`  
**Classification:** B — Continue Experimental (Opt-In Project Extension)  
**Status:** Architecture Specification & Boundary Document  
**Date:** October 5, 2026  

---

## 1. Core / Extension Architectural Boundary

Swrite maintains a strict modular boundary between the core writing engine and the experimental World Simulation extension.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                SWRITE CORE                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │  Manuscript  │  │ Story Engine │  │ Review Queue │  │ Version History │  │
│  │ (Acts/Scenes)│  │(Chars/Locs)  │  │(Proof/Revise)│  │   (Snapshots)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘  └────────┬────────┘  │
└─────────┼─────────────────┼─────────────────────────────────────┼───────────┘
          │ (Zero Core      │                                     │ (Pre-Apply
          │ Dependencies)   │ (Read Baseline Only)                │  Rollback)
┌─────────▼─────────────────▼─────────────────────────────────────▼───────────┐
│                     WORLD SIMULATION EXTENSION BOUNDARY                     │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ `src/engine/simulation/extension.ts` (Public Adapter)                  │  │
│  │  - isWorldSimulationEnabled()                                         │  │
│  │  - enableWorldSimulation() / disableWorldSimulation()                 │  │
│  │  - deriveSimulationBaseline()                                         │  │
│  │  - clearCrossProjectSimulationState()                                 │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │ EXTENSION INTERNALS (`src/engine/simulation/`)                        │  │
│  │  - `state.ts`: Deep cloning, sandbox state, turn histories            │  │
│  │  - `rules.ts`: Deterministic world rules, condition schemas           │  │
│  │  - `evaluator.ts`: AST condition checker, effect applier              │  │
│  │  - `simulator.ts`: Multi-turn deterministic execution engine          │  │
│  │  - `scenarios.ts`: Scheduled action queue & status tracking           │  │
│  │  - `explain.ts`: Cause/effect chains, delta diff generation           │  │
│  │  - `apply.ts`: Safety snapshot generator & ProjectData mutator        │  │
│  │  - `analytics.ts`: Local-only evaluation telemetry                    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Guiding Principles:
1. **Unidirectional Dependency:** The extension imports core type definitions (`ProjectData`, `Faction`, `Location`, `ManuscriptSnapshot`), but Core manuscript components **never** import simulation engine modules.
2. **Facade Access:** Core UI interacts with simulation exclusively through `isWorldSimulationEnabled` and top-level tab switching.

---

## 2. Data Ownership & Storage Boundaries

| Domain Object | Owner | Persistence Location | Transient vs. Canonical |
| :--- | :--- | :--- | :--- |
| **Manuscript Prose & Scenes** | Swrite Core | `project.acts[].chapters[].scenes[]` | **Canonical** |
| **Codex Entities (Factions, Locations)** | Swrite Core | `project.factions[]`, `project.locations[]` | **Canonical** |
| **Extension Enablement Flag** | Extension / Core | `project.metadata.enableWorldSimulation` | **Canonical (Config)** |
| **Applied Kingdom & World Relations** | Swrite Core | `project.kingdoms[]`, `project.worldRelations[]` | **Canonical (Explicitly Applied)** |
| **Pre-Apply Safety Snapshots** | Version History | `project.snapshots[]` | **Canonical (Immutable)** |
| **What-If Scenarios** | Simulation Ext | In-Memory / React Workspace State | **Transient (Sandbox Only)** |
| **Author Interventions (Actions)** | Simulation Ext | `SimulationScenario.scheduledActions[]` | **Transient (Sandbox Only)** |
| **Multi-Turn State History** | Simulation Ext | `SimulationState.history[]` | **Transient (Sandbox Only)** |
| **Simulated Downstream Events** | Simulation Ext | `SimulationState.activeEvents[]` | **Transient (Discardable)** |
| **Cause & Effect Nodes** | Simulation Ext | `TurnHistoryEntry.causeChains[]` | **Transient (Ephemeral)** |

---

## 3. Extension Lifecycle

The extension follows a deterministic, 6-stage finite state lifecycle:

```
[ Disabled ] 
     │
     ▼ (Author clicks "Enable for this Project")
[ Enabled / Canonical Baseline ]
     │
     ▼ (Author clicks "Create What-If Scenario")
[ Scenario Created / Sandbox Active ]
     │
     ▼ (Author adds interventions & clicks "Simulate")
[ Simulated Multi-Turn State ]
     │
     ▼ (Author scrubs turns, reviews cause tree & 2D map)
[ Inspected & Evaluated ]
     │
     ├───► [ Discarded ] ──► (Transient memory released; returns to Canonical Baseline)
     │
     └───► [ Applied ] ───► (Safety snapshot created → Canonical Project updated)
```

1. **Disabled:** Initial state for unconfigured projects. Rendered as a lightweight informational opt-in card.
2. **Enabled:** Active project capability. Canonical baseline is lazily derived without mutating project files.
3. **Scenario Created:** Sandboxed memory space initialized. Any subsequent state changes are isolated to `activeScenario`.
4. **Simulated:** Multi-turn simulation executes deterministically; deltas and cause trees populate.
5. **Inspected:** Author explores consequences across timeline turns and relationship edges.
6. **Resolved (Discarded or Applied):**
   * *Discard:* Frees scenario memory; canonical world remains 100% pristine.
   * *Apply:* Creates an automated timestamped snapshot in `project.snapshots`, then mutates canonical world records.

---

## 4. Enablement Behavior

* **Default Behavior:** Unconfigured or newly created projects default to `enableWorldSimulation: false` (or `undefined`).
* **Zero Overhead on Normal Writing:** When disabled:
  * No simulation state is constructed.
  * No simulation event listeners are mounted.
  * No background simulation cycles execute.
  * Primary navigation (`Write`, `Plan`, `Review`, `Story`, `Timeline`, `Graph`) contains zero simulation clutter.
* **Opt-In Mechanism:** When an author accesses `Story → World Simulation`, `Command Palette → World Simulation`, or `More → World Simulation`:
  * An opt-in enablement card appears with value highlights.
  * Clicking **"Enable for this Project"** sets `project.metadata.enableWorldSimulation = true`.
  * The author can toggle the feature off at any time using the header **"Disable"** action.

---

## 5. Persistence Model & Safety Invariants

### Invariant 1: Non-Destructive Exploration
Simulating 1, 5, or 20 turns in a sandbox scenario **must never write to `localStorage` or canonical project JSON**. All simulation history exists in React state and in-memory caches.

### Invariant 2: Mandatory Pre-Apply Rollback Snapshot
Before any simulated state changes are written to `ProjectData`, `applySimulationToProject()` automatically invokes `createSnapshot()` from the Snapshot Engine:
* Snapshot label: `Pre-Simulation Apply: <Scenario Name>`
* Snapshot source: `'manual'`
* Full project tree, acts, scenes, and characters are archived.
* Reversion is instantly possible via the **Version History** workspace.

### Invariant 3: Clean Discard
Calling `discardScenario()` instantly terminates all active simulation states without creating orphaned database records.

---

## 6. Navigation & Access Model

In accordance with the **SWRite Contextual Information Principle**, World Simulation is classified as a **Secondary Contextual Workspace**:

1. **Top-Level Header (`More` Menu):**  
   Accessible under `More → World Simulation` (`data-testid="nav-simulation"`). It does not occupy space on the main workspace tabs bar.
2. **Story Workspace Integration:**  
   Accessible via the `Simulation` sub-tab inside `Story → Simulation` (`data-testid="story-nav-simulation"`).
3. **Command Palette (`Cmd+K` / `Ctrl+K`):**  
   Searchable via keywords: `simulation`, `world`, `sandbox`, `what-if`, `factions`, `war`, `famine`, `diplomacy`.

---

## 7. Performance Strategy & Lazy Initialization

1. **On-Demand Baseline Construction:** `deriveSimulationBaseline(project)` executes only upon mounting `WorldSimulationWorkspace`.
2. **Transient In-Memory Caching:** Subsequent re-renders within the same project reuse `cachedBaseline` without re-running faction/location extractions.
3. **Cross-Project Isolation & Eviction:** Switching projects immediately triggers `clearCrossProjectSimulationState(newProjectId)`, evicting prior project simulation baselines and preventing state leakage.
4. **Zero Startup Cost:** App startup latency benchmarks remain unchanged (~13ms production chunk load, 0ms idle overhead).

---

## 8. Removal & Archival Strategy

If product leadership decides to retire the feature in the future, removal requires only:
1. Deleting `src/components/simulation/`
2. Deleting `src/engine/simulation/`
3. Removing `'simulation'` from `WorkspaceTab` union in `src/types/index.ts`
4. Removing the simulation route branch in `src/App.tsx` and dropdown link in `src/components/toolbar/TopHeader.tsx`

**Zero core manuscript, editor, compiler, or review queue code will require modification.**

---

## 9. Known Coupling Audit

A comprehensive code search for `simulation` across `src/` revealed:
* `src/components/editor/`: **0 simulation imports**
* `src/components/outliner/`: **0 simulation imports**
* `src/components/review/`: **0 simulation imports**
* `src/components/timeline/`: **0 simulation imports**
* `src/components/publication/`: **0 simulation imports**
* `src/store/`: **0 simulation imports**
* `src/types/`: Single optional boolean `ProjectMetadata.enableWorldSimulation?: boolean` and `'simulation'` in `WorkspaceTab`.

---

## 10. Future Merge Criteria (Stable Main Consideration)

World Simulation will be considered for inclusion into `main` **only** if all of the following conditions are met:

1. **Author Demand Validation:** 3+ consecutive publishing projects by real authors request persistent macro-world tracking.
2. **Zero Core Regression:** Core prose flow maintains 100% test passing and sub-16ms keystroke latency.
3. **Opt-In Default:** The feature remains disabled by default on new projects.
4. **Complete Snapshot Safety:** Automated rollback snapshots continue to maintain a 100% non-corruption record.
5. **No Visual Game Drift:** The UI remains an authorial cause-and-effect tool rather than gamified mechanics.

Until all criteria are fulfilled, **`experiment/world-simulation` remains an isolated experimental branch.**

---
*Certified by Swrite Architecture & Product Review Team.*
