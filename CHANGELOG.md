# Changelog

All notable changes to **Swrite** will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0-beta1] - 2026-10-05

### Initial Public Beta Release

Swrite is a local-first authoring environment designed for novelists and storytellers, connecting prose drafting with structural planning, unified editorial review, non-destructive version history, and publication-ready formatting.

#### 🖋️ Write Workspace (`⌘1`)
- **Smart Novel Formatting**: Automatic first-line paragraph indentation (`1.5em`), centered ornament scene breaks (`* * *`, `❦`, `◆ ◆ ◆`), and typewriter scrolling.
- **Dual Flow Modes**: Distraction-free continuous scroll drafting and live paginated (6"×9") trade paperback preview with alternating running headers.
- **Distraction-Free Focus Mode (`F11` / `Esc`)**: Fullscreen drafting canvas with minimal floating scene title overlay and word counter.
- **Contextual Margin Inspector**: Inspect and edit live character emotional/physical state, active beliefs, dramatic scene goals, and plot thread attachments without leaving prose flow.

#### 🗺️ Plan Workspace (`⌘2`)
- **Manuscript Outliner & Matrix**: Hierarchical Act $\to$ Chapter $\to$ Scene outliner with point-of-view tracking, word count aggregates, and drag-and-drop reordering.
- **Corkboard View**: Card-based visual scene board for organizing narrative pacing and dramatic beats.
- **Dual-Stream Timeline**: In-universe chronological timeline separate from narrative reading order, with inline classification pills (`Present`, `Flashback`, `Flashforward`, `Memory`, `Backstory`) and quick timestamp anchors.
- **Story Codex & Universe Graph**: Relational database for characters, locations, factions, and dynamic relationship webs.

#### 🔍 Review Workspace (`⌘3`)
- **Unified Review Queue**: Consolidated triage stream uniting mechanical proofreading (typos, grammar, style, character casing), continuity audit warnings (knowledge leaks, causality inversions), and manual revision notes.
- **Single-Key Editorial Triage**: High-speed keyboard actions:
  - `[A]` Accept proofreading suggestion
  - `[I]` Ignore finding / dismiss warning
  - `[R]` Resolve revision item / convert continuity warning
  - `[↵]` Jump directly to flagged scene in editor
  - `[J] / [K]` Navigate down / up review queue

#### 🕰️ Version History & Safety Recovery
- **Non-Destructive Snapshots**: Automatic and manual snapshot points with tamper verification and literary change metrics.
- **Calm Paragraph Diffing**: Inline and side-by-side literary diff presentation with word-level change highlights.
- **Guaranteed Safe Restore**: Pre-restore safety snapshots automatically created before any state replacement; support for granular single-chapter restoration.

#### 📖 Publication Studio
- **Multi-Profile Book Compiler**: Strict separation of editor appearance from publication typography.
- **Export Profiles**:
  - **Trade Paperback (6"×9" & 5.5"×8.5")**: High-resolution print-ready PDF with mirrored gutters, running headers, and page numbers.
  - **Standard Manuscript Format (Shunn DOCX)**: 1" margins, Courier 12pt, double-spaced format for literary agents and editors.
  - **EPUB 3**: Standards-compliant e-book package for e-readers and Kindle Direct Publishing (KDP).
  - **CommonMark Markdown**: Clean `.md` export with YAML front matter.
- **Preflight Inspection**: Automated pre-export checks catching default titles, empty chapters, and layout errors.

#### 🛡️ Local-First & Privacy Guarantees
- All manuscripts and story data persist locally in browser IndexedDB/LocalStorage.
- Zero manuscript prose or story content is transmitted to remote servers.
- Optional Bring-Your-Own-Key (BYOK) AI provider configuration (direct client-to-API without intermediary proxies).

---

### 📬 Public Feedback & Support Channels
- **Bug Reports & Issues:** File reports categorized under `[Bug]`, `[Workflow]`, `[Feature Request]`, or `[Question]`.
- **Issue Registry:** Tracked in [`PUBLIC-BETA-ISSUES.md`](./PUBLIC-BETA-ISSUES.md).
- **Post-Beta Backlog:** Tracked in [`POST-BETA-BACKLOG.md`](./POST-BETA-BACKLOG.md).
