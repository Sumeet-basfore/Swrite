# Swrite 2 — Manuscript Page Layout & Editor Geometry

This document defines the canonical layout hierarchy, geometry metrics, toolbar docking model, and alignment standards for the Swrite 2 manuscript writing canvas.

---

## 1. Canonical Layout Hierarchy

Swrite 2 enforces a strict, top-to-bottom layout containment model to ensure visual clarity, distraction-free drafting, and stable scrolling:

```text
Application Shell
└── Writing Workspace
    ├── Filesystem Explorer (Collapsible, Left Sidebar)
    └── Editor Workspace (.swrite-editor-container)
        ├── Toolbar Zone (.swrite-editor-toolbar-zone) [Fixed Header]
        │   └── FormattingBar (.swrite-formatting-bar)
        ├── Find Zone (.swrite-editor-find-zone) [Optional Header]
        │   └── FindReplaceBar (.swrite-find-replace-bar)
        ├── Scroll Viewport (.swrite-scroll-viewport) [Scrollable Canvas]
        │   └── Manuscript Page (.swrite-manuscript-page / .swrite-reading-page)
        │       ├── Metadata Card (.swrite-document-metadata-card)
        │       └── Editor Content (.milkdown-wrapper / .swrite-source-editor-container)
        │           ├── Chapter Title (H1)
        │           ├── Subheadings (H2–H6)
        │           ├── Prose Paragraphs (<p>)
        │           ├── Blockquotes (<blockquote>)
        │           ├── Lists (<ul>, <ol>)
        │           ├── Tables (<table>)
        │           ├── Code Blocks (<pre>)
        │           ├── Images (<img>)
        │           └── Scene Breaks (.swrite-scene-break, <hr>)
        └── Status Bar (.swrite-status-bar) [Fixed Footer]
```

---

## 2. Geometry Metrics & CSS Variables

The manuscript writing surface is defined by standardized CSS variables:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `--manuscript-page-width` | `820px` (800–840px) | Outer width of the centered manuscript sheet |
| `--manuscript-page-padding-y` | `64px` | Top and bottom breathing room inside manuscript page |
| `--manuscript-page-padding-x` | `56px` | Left and right margins of the manuscript page |
| `--editor-content-width` | `708px` (688–728px) | Golden prose column width (`820px - 2 * 56px`) |
| `--toolbar-height` | `40px` | Height of the docked formatting toolbar zone |

### Golden Prose Measure
- Standardizing `--manuscript-page-width` to `820px` with `56px` horizontal padding provides an inner column width of **708px**.
- At standard body font sizes (16–18px), this delivers **65–75 characters per line (CPL)**, conforming to established typometric principles for sustained reading and drafting comfort without eye fatigue.

---

## 3. Formatting Toolbar Docking Model

### The Problem in Legacy Implementation
Previously, the formatting bar was rendered inside the scroll container using `position: sticky; top: 12px;`. This caused the toolbar to float directly over the H1 chapter title, metadata header, or top prose paragraphs, obstructing the author's view.

### The Canonical Solution
1. **Dedicated Toolbar Zone:** The toolbar is decoupled from the scroll viewport and placed into `.swrite-editor-toolbar-zone`.
2. **Fixed Header Flow:** The toolbar zone is a flex-child with `flex-shrink: 0`, a subtle bottom border (`var(--border-subtle)`), and centered controls.
3. **Independent Viewport:** The scroll container (`.swrite-scroll-viewport`) sits cleanly underneath the toolbar zone. Text scrolls under the fixed header with zero overlap or layout jump.
4. **Conditional Visibility:** In Focus Mode, Reading Mode, or Source Mode, the toolbar zone automatically dismisses, providing a 100% distraction-free writing surface.

---

## 4. Single Alignment System

All content within the manuscript page shares identical outer bounds:
- **Metadata Card:** 100% width of the content column, aligned flush with headings and prose.
- **Headings (H1–H6):** Left-aligned flush with paragraph margins.
- **Prose Paragraphs:** 100% width with selectable first-line indent or spacious block margin depending on preset.
- **Blockquotes:** Left border inset with matching text column flow.
- **Lists & Tables:** Contained within the 708px measure, with horizontal scroll if table data overflows.
- **Scene Breaks:** Centered asterisks (`* * *`) or decorative rules bounded by the prose measure.

---

## 5. Typography Presets Compatibility

Every typography preset sets its canonical measure and styling:

| Preset | Font Family | Size / Line-Height | Page Width | Measure | Spacing / Indent |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Literary** | Merriweather / Charter Serif | 18px / 1.85 | 820px | 708px | Spacious (1.5em), No Indent |
| **Classic** | Charter / Georgia Serif | 17px / 1.75 | 800px | 688px | Indented (0.4em + 1.5em indent) |
| **Modern** | Inter / System Sans | 16px / 1.70 | 820px | 708px | Spacious (1.5em), No Indent |
| **Compact** | System Sans | 15px / 1.55 | 840px | 728px | Compact (0.85em), No Indent |
| **Typewriter** | Monospace | 16px / 2.00 | 800px | 688px | Double-spaced (1.5em), No Indent |

---

## 6. Theme Integration

All 15 built-in themes map to the three canvas layers:
1. **Editor Workspace Backdrop:** `var(--bg-canvas)`
2. **Manuscript Page Surface:** `var(--bg-page)` (with subtle elevation shadow in light modes and clean border separation in dark modes)
3. **Prose Text & Accents:** `var(--text-primary)`, `var(--text-secondary)`, `var(--accent)`
