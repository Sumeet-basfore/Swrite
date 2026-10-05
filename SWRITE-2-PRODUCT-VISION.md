# Swrite 2 — Product Vision & Core Contract

**Document Version:** 1.0.0  
**Status:** Canonical & Locked  
**Milestone:** 0 — Product Contract  

---

## 1. Purpose & Identity

**Swrite 2** is a personal desktop writing studio built primarily for its owner. 

It is not a SaaS platform, a collaborative enterprise tool, an AI writing generator, a social network, a relational knowledge graph, a project tracker, or a simulated world game. 

Swrite exists to make the author's personal creative writing process:
- **Focused** — Zero ambient distraction or visual competition during drafting.
- **Comfortable** — Exceptional typography, ergonomics, and seamless input mechanisms.
- **Organized** — Natural, low-overhead structuring that supports creative flow without administrative bureaucracy.
- **Flexible** — Frictionless movement between planning, prose, visual moodboards, line editing, and publication styling.
- **Visually Pleasant** — Restrained, dignified digital stationery that honors the written word.
- **Fast** — Instant typing response, immediate file operations, and zero lag.
- **Reliable & Recoverable** — Rock-solid persistence where data loss is mathematically and architecturally prevented.
- **Local & Sovereign** — Files remain 100% on the author's local disk in human-readable formats.
- **Enjoyable** — A quiet digital writing desk that invites deep creative absorption.

---

## 2. The Core Product Promise

> **"Write without distraction. Organize without overhead. Edit without friction. Shape the manuscript exactly how you want it."**

Swrite supports the full arc of literary creation without constantly demanding managerial attention:

```text
    ┌────────┐
    │  IDEA  │  (Notes, Brainstorms, Desk References, Moodboards)
    └───┬────┘
        │
    ┌───▼────┐
    │  PLAN  │  (Acts, Chapters, Scenes, Synopsis, Outline, Timeline)
    └───┬────┘
        │
    ┌───▼────┐
    │ WRITE  │  (Prose Generation, Focus Mode, Slash Commands, Typewriter)
    └───┬────┘
        │
    ┌───▼────┐
    │  EDIT  │  (Proofreading, Comments, Revision Passes, Version Diffs)
    └───┬────┘
        │
    ┌───▼────┐
    │ FORMAT │  (Book Geometry, Typography, Headers, Footers, Matter)
    └───┬────┘
        │
    ┌───▼────────────────┐
    │ FINISHED BOOK      │  (Clean PDF, DOCX, EPUB, Markdown, TXT)
    └────────────────────┘
```

---

## 3. Primary User & Optimization Target

Swrite 2 is optimized for **one personal writer** crafting:
- Long-form fiction and novels
- Multi-chapter serialized narratives
- Short story collections
- Creative non-fiction and essays
- Literary world notes and reference lore
- Manuscript revisions and book submissions

### Explicit Non-Targets for Initial Version:
- Multi-tenant enterprise organizations
- Real-time collaborative multi-user editing
- Public social feeds or writer leaderboards
- Mandatory cloud account management
- Subscription gating mechanisms

---

## 4. Fundamental Product Philosophy

### 4.1 Writing Is the Center
The prose of the manuscript is the absolute center of gravity in Swrite. Every other tool, panel, outline, and note exists solely to serve the sentence on the page. The user must be able to open Swrite and immediately write within seconds.

### 4.2 Simple at Rest
When the author is actively composing sentences, the interface is quiet and minimal. Secondary capabilities, metadata inspectors, and advanced tooling remain dormant until summoned contextually, via keyboard shortcuts, or through slash commands.

### 4.3 No Feature Competition
Features must never compete with prose for the author’s cognitive bandwidth. Swrite explicitly rejects:
- Persistent dashboards and metric meters
- Gamified streak alerts and nagging notifications
- Flashing badges and complex card grids in drafting views
- Unnecessary decorative animations or chrome

### 4.4 Absolute Author Control
The author is the sovereign creator of story canon, character truth, thematic resonance, and manuscript prose. Swrite assists with storage, navigation, editing, and formatting, but **never generates story content autonomously**.

---

## 5. The Five Core Environments

Swrite 2 organizes creative work into five distinct environments reflecting author intent:

```text
╔═════════════════════════════════════════════════════════════════════════════╗
║                                SWRITE 2                                     ║
╠══════════╦═════════════╦══════════════╦═════════════════╦═══════════════════╣
║  WRITE   ║    PLAN     ║     DESK     ║      EDIT       ║      PUBLISH      ║
╠══════════╬═════════════╬══════════════╬═════════════════╬═══════════════════╣
║ • Prose  ║ • Acts      ║ • Moodboards ║ • Proofreading  ║ • Print PDF       ║
║ • Scenes ║ • Chapters  ║ • Images     ║ • Comments      ║ • Standard DOCX   ║
║ • Rich & ║ • Outline   ║ • Research   ║ • Revision Pass ║ • Validated EPUB  ║
║   Source ║ • Timeline  ║ • Lore Notes ║ • Version Diffs ║ • Clean Markdown  ║
║ • Focus  ║ • Synopses  ║ • References ║ • History       ║ • Plain TXT       ║
╚══════════╩═════════════╩══════════════╩═════════════════╩═══════════════════╝
```

1. **WRITE (The Default Canvas)**: Pure, undistracted manuscript drafting. Supports bidirectional Rich WYSIWYG and direct Markdown source editing, fast slash commands, and immersive focus mode.
2. **PLAN (The Story Architecture)**: Lightweight hierarchical outlining (Acts, Chapters, Scenes), scene synopses, and timeline tracking answering: *"What am I writing and where is the story going?"*
3. **DESK (The Creative Workspace)**: Visual and textual supporting materials including freeform moodboards, pinboards, reference images, character sketches, and world notes.
4. **EDIT (The Editorial Chamber)**: Deep editorial inspection, revision passes, non-destructive anchored comments, inline annotations, and side-by-side snapshot comparisons.
5. **PUBLISH (The Typesetting Press)**: Independent document output styling producing publication-grade PDF, DOCX, EPUB, Markdown, and TXT without contaminating editor themes.

---

## 6. File-First Sovereignty & Persistence

Swrite 2 is **filesystem-first**, not database-first.

- **Human-Readable Storage**: The canonical project lives on disk as a clean directory of Markdown (`.md`), plain text (`.txt`), and asset files.
- **Zero Application Lock-In**: An author can copy, read, edit, or archive their project folder with any text editor or operating system tool without needing Swrite installed.
- **Internal Metadata Isolation**: Internal application state (cache, UI preferences, view histories) lives in a hidden `.swrite/` directory, completely isolated from user prose.
- **Atomic & Crash-Safe Persistence**: All file writes are atomic (write-to-temp-then-rename) with automatic snapshotting to guarantee zero data loss.

---

## 7. Explicit Exclusions for Swrite 2

To protect the product's identity and speed, the following are strictly excluded:
- **No AI generation, rewriting, or chatbots.**
- **No mandatory cloud sync, accounts, or authentication.**
- **No world simulation engines or complex relational database schemas.**
- **No marketplace or complex plugin distribution runtime in MVP.**
- **No social features, feeds, or gamified metric trackers.**

---

## 8. Summary Contract

Swrite 2 is digital stationery for serious storytelling: quiet, robust, beautiful, fast, and entirely owned by the writer.
