# SWRITE 2 — Publish Studio Specification

## 1. Purpose & Vision
The **Publish Studio** (`PUBLISH`, hotkey `Mod+5`) is the fifth dedicated workspace environment in Swrite 2, complementing `WRITE`, `PLAN`, `DESK`, and `EDIT`.

It transforms the author's drafted manuscript into professional, industry-standard physical and digital publications without ever modifying the underlying source files on disk.

```text
Manuscript Files (Disk)
    ↓
Publication Profile
    ↓
Typography & Layout Engine
    ↓
Live Paginated Preview
    ↓
Preflight Verification
    ↓
Safety Snapshot & Multi-Format Exporters
```

---

## 2. Core Architectural Separation

| Domain | Scope | Mutability | Persistence |
|---|---|---|---|
| **Manuscript Content** | What the author wrote (`Manuscript/*.md`) | Read-Only in Publish Studio | User-visible markdown files on disk |
| **Editor Appearance** | Screen canvas styles, editor themes, dark mode | Client UI only | Local app settings |
| **Publication Appearance** | Physical paper trim, margins, typography, drop caps, headers/footers | Independent profile config | `.swrite/publish_profiles.json` |

Changing the editor theme or working in dark mode has **zero effect** on publication geometry or exported PDF/EPUB/DOCX typography.

---

## 3. Workflow & Studio Architecture

1. **Profile Selection & Customization:** Choose from 7 built-in presets or create custom tailored trim sizes and layouts.
2. **Interactive Live Preview:**
   - Real paginated paper sheets with true-to-scale margins, gutters, drop caps, and running headers/footers.
   - Single-page and two-page book spread modes.
   - Smooth zoom controls (50% to 200%).
3. **Deterministic Preflight Drawer:**
   - Scans for empty documents, broken relative image links, unresolvable wikilinks, missing front matter, and consecutive empty scene breaks.
   - Categorized by `info`, `warning`, and `blocking`.
   - Direct jump navigation into the Write Studio to fix issues.
4. **Pre-Export Safety Guarantee:**
   - Automatically takes a timestamped safety snapshot in `.swrite/history/` for every manuscript document before writing output.
   - Never leaks internal comments, desk notes, moodboards, or planning outlines into the output document.
