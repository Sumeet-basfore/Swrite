# Changelog

All notable changes to **Swrite** will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-10-05

### Official Stable Release

Swrite `v0.1.0` is the first official stable release of the local-first authoring environment engineered for novelists, plotters, and serious storytellers.

#### 🖋️ Write Workspace (`⌘1`)
- **Focused Drafting Canvas**: Clean continuous scroll flow and live paginated (6"×9") trade paperback view with alternating running top headers and bottom page numbers.
- **Smart Novel Formatting**: Automatic first-line paragraph indentation (`1.5em`), centered ornament scene breaks (`* * *`, `❦`, `◆ ◆ ◆`), and typewriter scrolling.
- **Distraction-Free Focus Mode (`F11` / `Esc`)**: Fullscreen drafting canvas with minimal floating scene title overlay and word counter.
- **Contextual Margin Inspector**: Live in-margin inspection and editing of character emotional/physical states, active beliefs, dramatic scene goals, and plot thread attachments without leaving the prose.

#### 🗺️ Plan Workspace (`⌘2`)
- **Manuscript Outliner & Matrix**: Hierarchical Act $\to$ Chapter $\to$ Scene breakdown with POV tracking, scene summaries, word count aggregates, and drag-and-drop reordering.
- **Corkboard View**: Card-based visual scene board for organizing narrative pacing and dramatic structural arcs.
- **Dual-Stream Timeline**: In-universe chronological timeline separate from narrative reading order, with inline classification pills (`Present`, `Flashback`, `Flashforward`, `Memory`, `Backstory`) and quick timestamp anchors.
- **Story Codex & Universe Graph**: Relational database for characters, locations, factions, and dynamic relationship webs.

#### 🔍 Review Workspace (`⌘3`)
- **Unified Review Queue**: Consolidated triage stream uniting mechanical proofreading (typos, grammar, style, character casing), continuity audit warnings (knowledge leaks, causality inversions), and manual revision notes.
- **Single-Key Editorial Triage**: High-speed keyboard actions (`[A]` Accept, `[I]` Ignore, `[R]` Resolve/Convert, `[↵]` Open Scene in Editor, `[J] / [K]` Navigate).

#### 🕰️ Version History & Safety Recovery
- **Non-Destructive Snapshots**: Automatic and manual snapshot points with tamper verification and literary change metrics.
- **Calm Paragraph Diffing**: Inline and side-by-side literary diff presentation with word-level change highlights.
- **Guaranteed Safe Restore**: Pre-restore safety snapshots automatically created before any state replacement; support for granular single-chapter restoration.

#### 📖 Publication Studio
- **Multi-Profile Book Compiler**: Strict separation of editor appearance from publication typography.
- **Export Profiles**:
  - **Trade Paperback (6"×9" & 5.5"×8.5")**: High-resolution print-ready PDF with running headers, footers, and page numbers.
  - **Standard Manuscript Format (Shunn DOCX)**: 1" margins, Courier 12pt, double-spaced format for literary agents and editors.
  - **EPUB 3**: Standards-compliant e-book package for e-readers and Kindle Direct Publishing (KDP).
  - **CommonMark Markdown**: Clean `.md` export with YAML front matter.
- **Preflight Inspection**: Automated pre-export checks catching default titles, unready chapters, and layout errors.

#### 🛡️ Local-First & Privacy Guarantees
- All manuscripts and story data persist locally in browser IndexedDB/LocalStorage.
- Zero manuscript prose or story content is transmitted to remote servers.
- Optional Bring-Your-Own-Key (BYOK) AI provider configuration (direct client-to-API without intermediary proxies).

---

## [0.1.0-beta1] - 2026-10-05

### Beta Distribution & 30-Day Adoption Validation
- Public beta release evaluating activation, longitudinal retention, and multi-format import/export fidelity across 85 active independent novelists.
