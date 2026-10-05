# Swrite — Novelist & Author Studio

**Version:** `v0.1.0` (Official Stable Release)  
**Branch:** `chore/swrite-repository-baseline`  
**License:** Private / Proprietary  

Swrite is a local-first, distraction-free authoring environment engineered specifically for novelists, plotters, and serious storytellers. It connects uninterrupted prose drafting directly with structural planning, unified editorial review, non-destructive version history, and professional publication formatting.

---

## 🧭 The Core Authoring Loop

Swrite unifies the entire novel-writing lifecycle into five streamlined, keyboard-accessible stages:

$$\textbf{Write} \longrightarrow \textbf{Plan} \longrightarrow \textbf{Review} \longrightarrow \textbf{Revise} \longrightarrow \textbf{Publish}$$

### 1. Write (`⌘1` / `Ctrl+1`)
- **Focused Drafting**: Clean text engine supporting continuous scroll and live paginated (6"×9") trade paperback views with alternating running headers.
- **Smart Novel Formatting**: Automatic first-line paragraph indentation (`1.5em`), centered ornament scene breaks (`* * *`, `❦`, `◆ ◆ ◆`), and typewriter scrolling.
- **Distraction-Free Focus Mode (`F11` / `Esc`)**: Fullscreen, zero-chrome writing with minimal floating title overlay and word counter.
- **Contextual Margin Inspector**: Inspect and edit live character emotional/physical state, active beliefs, dramatic scene goals, and linked plot threads right beside the prose without switching views.

### 2. Plan (`⌘2` / `Ctrl+2`)
- **Manuscript Outliner & Matrix**: Hierarchical Act $\to$ Chapter $\to$ Scene breakdown with POV tracking, scene summaries, and word count aggregation.
- **Corkboard & Beats**: Visual card board for organizing narrative pacing and dramatic structural arcs.
- **Dual-Stream Timeline**: In-universe historical chronology separate from narrative reading order, featuring inline classification pills (`Present`, `Flashback`, `Flashforward`, `Memory`, `Backstory`) and quick timestamp anchors.
- **Story Codex & Universe Graph**: Relational database of characters, locations, factions, and dynamic relationship webs.

### 3. Review (`⌘3` / `Ctrl+3`)
- **Unified Editorial Queue**: Consolidated triage stream combining automated proofreading (spelling, grammar, dialogue styling, entity casing), story continuity warnings (knowledge leaks, deceased character appearances, timeline inversions), and manual revision notes.
- **Single-Key Editorial Triage**:
  - `[A]` Accept proofreading suggestion
  - `[I]` Ignore finding / dismiss warning
  - `[R]` Resolve revision item / convert continuity warning
  - `[↵]` Jump directly to flagged scene in editor
  - `[J] / [K]` Navigate down / up review queue

### 4. Revise
- **Non-Destructive Snapshots**: Automatic and manual snapshot points with tamper verification and literary change metrics.
- **Calm Editorial Diffing**: Paragraph-level comparisons (Inline and Side-by-Side) with granular word-level change highlights.
- **Guaranteed Safe Recovery**: Granular single-chapter or full-manuscript restoration with automatic pre-restore safety snapshots.

### 5. Publish
- **Publication Studio**: Multi-profile book compiler with strict separation of editor appearance from publication typography.
- **Export Profiles**:
  - **Trade Paperback (6"×9" & 5.5"×8.5")**: High-resolution print-ready PDF with running headers, footers, and page numbers.
  - **Standard Manuscript Format (Shunn DOCX)**: 1" margins, Courier 12pt, double-spaced format for literary agents and editors.
  - **EPUB 3**: Standards-compliant, uncompressed-mimetype e-book package for e-readers and Kindle Direct Publishing (KDP).
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

## 🛡️ Architecture & Local-First Privacy

- **Local-First & Offline**: All manuscript text, character profiles, snapshots, and revision rounds are stored purely locally in browser IndexedDB/LocalStorage.
- **Zero Telemetry on Manuscript Prose**: No manuscript content or private story notes are ever transmitted to remote servers.
- **Optional AI Infrastructure**: Bring-Your-Own-Key (BYOK) direct client-to-endpoint integration without intermediary proxies.
- **Modular Boundaries**: Experimental extensions (e.g. World Simulation) remain strictly isolated on `experiment/world-simulation` and are excluded from stable releases.

See [`PRIVACY-ARCHITECTURE.md`](./PRIVACY-ARCHITECTURE.md) for full architectural documentation.

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

## 📚 Documentation & Roadmap

- **Release Report:** [`RELEASE-REPORT.md`](./RELEASE-REPORT.md)
- **Privacy Architecture:** [`PRIVACY-ARCHITECTURE.md`](./PRIVACY-ARCHITECTURE.md)
- **Changelog:** [`CHANGELOG.md`](./CHANGELOG.md)
- **Contributing Guide:** [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- **v0.2 Roadmap:** [`V0.2-ROADMAP.md`](./V0.2-ROADMAP.md)
- **Cloud Sync Architecture (v0.2 Spike):** [`CLOUD-SYNC-ARCHITECTURE.md`](./CLOUD-SYNC-ARCHITECTURE.md)
- **Mobile Drafting Architecture (v0.2 Spike):** [`MOBILE-ARCHITECTURE.md`](./MOBILE-ARCHITECTURE.md)
