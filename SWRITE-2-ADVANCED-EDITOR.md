# SWRITE 2 — Advanced Writing Editor Specification

## 1. Vision & Architecture

Swrite 2's WRITE Studio is engineered specifically for sustained long-form literary and manuscript drafting. It combines the ergonomic calm of classic distraction-free writing environments with the structural power of Markdown and desktop typography.

```text
Filesystem Markdown
    ↓
Rust Core Validation
    ↓
Typed IPC Bridge
    ↓
Editor Adapter & State Store
    ↓
Milkdown / ProseMirror Runtime
    ↓
Typography & Canvas Surface
```

---

## 2. Core Editor Capabilities

### 1. Typography Engine & Presets
The editor surface supports five author-tuned presets:
- **Literary:** Warm serif (`Merriweather` / `Charter`), 18px font size, 1.85 line height, 720px width, generous paragraph spacing.
- **Classic Manuscript:** Traditional serif (`Charter` / `Times`), 17px font size, 1.75 line height, 700px width, 1.5em first-line indent.
- **Modern Sans:** Clean contemporary typography (`Inter` / system sans), 16px font size, 1.7 line height, 740px width.
- **Compact:** High density layout, 15px font size, 1.55 line height, 800px width.
- **Typewriter:** Monospace font, 16px font size, 2.0 double-spacing, 680px width.

### 2. Dual Mode Operation
- **Rich Mode:** High-fidelity visual editing powered by ProseMirror / Milkdown with semantic Markdown persistence.
- **Source Mode:** Clean, raw Markdown text editing with line wrapping, zero hidden styling, and instant bidirectional synchronization.

### 3. Integrated Power Tools
- **Find & Replace:** Seamless in-editor search with case matching, whole word filtering, match navigation (`Enter`/`Shift+Enter`), and single/batch replacement.
- **Document Outline & Bookmarks:** Instant navigation across H1/H2/H3 headings, ornamental scene breaks (`✦ ✦ ✦`), and author bookmarks (`<!-- bookmark: ... -->`).
- **Contextual Formatting & Modals:** Floating formatting toolbar and compact modal popovers for Links, Images, and Tables.
- **Author Slash Commands:** 25+ commands covering formatting, block creation, breaks, annotations, and studio workflow triggers.
