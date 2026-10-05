# Swrite — Novelist & Author Studio

**Status:** Release Candidate (Feature Frozen)  
**Branch:** `chore/swrite-repository-baseline`  
**License:** Private / Proprietary  

Swrite is a local-first, distraction-free authoring environment engineered for novelists and serious storytellers. It connects uninterrupted prose drafting with deep structural story planning, automated editorial review, version history recovery, and professional publication formatting.

---

## 🔒 Feature Freeze Notice

This repository baseline is under a **strict Release Candidate Feature Freeze**:
- **Allowed:** Bug fixes, security/persistence hardening, performance improvements, accessibility, and documentation.
- **Not Allowed:** New major features, new workspaces, redesigns, speculative UI, or simulation mechanics.
- **Experimental Boundary:** The World Simulation engine remains isolated on `experiment/world-simulation` and is not part of the core stable release candidate.

---

## 🧭 The Core Authoring Journey

Swrite organizes the long-form writing process into five streamlined stages:

$$\textbf{Write} \longrightarrow \textbf{Plan} \longrightarrow \textbf{Review} \longrightarrow \textbf{Revise} \longrightarrow \textbf{Publish}$$

### 1. Write (`⌘1`)
- **Focused Drafting**: Distraction-free text engine with continuous scroll and live paginated (6"×9") book views.
- **Smart Novel Formatting**: Automatic paragraph indentation (`1.5em`), ornament scene breaks (`* * *`, `❦`, `◆ ◆ ◆`), and typewriter scrolling.
- **Focus Mode (`F11` / `Esc`)**: Fullscreen, zero-chrome writing with word counts and scene title overlays.
- **Contextual Margin Inspector**: Inspect scene dramatic goals, live character emotional/physical state, linked plot threads, and continuity alerts without switching views.

### 2. Plan (`⌘2`)
- **Manuscript Outliner & Matrix**: Hierarchical Act $\to$ Chapter $\to$ Scene breakdown with POV tracking, scene summaries, and word counts.
- **Corkboard & Beats**: Visual card board for organizing narrative pacing and structural story arcs.
- **Timeline & Chronology**: Dual-track timeline separating narrative reading order from in-universe chronology with inline timestamp editing.
- **Codex & Universe Graph**: Relational database of characters, locations, factions, and dynamic relationship webs.

### 3. Review (`⌘3`)
- **Unified Editorial Queue**: Consolidated triage stream combining automated proofreading, manual revision items, and continuity audit warnings.
- **High-Speed Keyboard Triage**: Single-key actions:
  - `[A]` Accept proofreading suggestion
  - `[I]` Ignore finding / dismiss warning
  - `[R]` Resolve revision item / convert continuity warning
  - `[↵]` Open scene in editor
  - `[J] / [K]` Navigate down / up queue

### 4. Revise
- **Non-Destructive Snapshots**: Automatic and manual snapshot points with tamper detection and literary change summaries.
- **Calm Editorial Diffing**: Paragraph-level comparisons (Inline and Side-by-Side) with granular word-level diffing.
- **Guaranteed Safety Recovery**: Granular chapter or full-manuscript restoration with automatic pre-restore safety snapshots.

### 5. Publish
- **Publication Studio**: Multi-profile book compiler with strict separation of editor appearance from publication typography.
- **Export Formats**:
  - **Trade Paperback (6"×9" & 5.5"×8.5")**: High-resolution print-ready PDF with running headers and page numbers.
  - **Standard Manuscript Format (Shunn)**: Industry-standard 1" margins, double-spaced typography for literary agents and editors.
  - **Classic Hardcover & Digest Paperback**: Custom trim geometry and margin structures.
  - **EPUB 3**: Standards-compliant, uncompressed-mimetype e-book package for e-readers and KDP.
  - **CommonMark**: Clean markdown manuscript export with YAML front matter.
- **Preflight Inspection**: Automated pre-export checks catching default titles, unready chapters, and layout errors.

---

## ⌨️ Global Keyboard Shortcuts

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| `⌘1` / `Ctrl+1` | Switch to **Write** Workspace | Global |
| `⌘2` / `Ctrl+2` | Switch to **Plan** Workspace | Global |
| `⌘3` / `Ctrl+3` | Switch to **Review** Queue | Global |
| `⌘K` / `Ctrl+K` | Open **Command Palette** & Quick Search | Global |
| `F11` | Toggle Distraction-Free **Focus Mode** | Write Workspace |
| `Esc` | Exit Focus Mode / Close Modals | Global |
| `J` / `K` | Next / Previous Item | Review Queue |
| `A` / `I` / `R` | Accept / Ignore / Resolve Action | Review Queue |
| `Enter` | Jump to Flagged Scene | Review Queue |

---

## 🛠️ Architecture & Local-First Principles

- **Local-First & Offline**: All manuscript data, character codices, snapshots, and revision rounds are persisted locally in browser IndexedDB/LocalStorage.
- **Zero Lock-In**: Complete project import and export in human-readable JSON, Markdown, DOCX, and EPUB.
- **Isolated Extension Boundary**: Optional experimental features (like World Simulation) reside on separate branches and communicate strictly via read-only project snapshot interfaces.

---

## 🚀 Development & Testing

### Installation & Run
```bash
# Install dependencies from lockfile
npm ci

# Start local development server
npm run dev

# Run unit and engine test suite (154+ tests)
npm test

# Run Playwright browser E2E test suite (18+ tests)
npm run test:e2e

# Compile production bundle
npm run build
```

---

## 📦 Release Candidate Validation

- **Unit Test Coverage:** 154 / 154 tests passing (100%)
- **Browser E2E Coverage:** 18 / 18 Playwright end-to-end scenarios passing (100%)
- **Production Bundle:** Clean build with TypeScript strict compilation passing.
- **Artifacts:** See [`RELEASE-CANDIDATE-REPORT.md`](./RELEASE-CANDIDATE-REPORT.md) for the full validation matrix and release recommendation.
