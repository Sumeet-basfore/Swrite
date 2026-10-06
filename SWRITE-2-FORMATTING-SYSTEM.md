# SWRITE 2 — Semantic Formatting System

## 1. Core Semantic Principle

Formatting in Swrite is strictly **semantic**, not decorative.

When an author marks text as `Heading 1` or `Blockquote`, Swrite does not record arbitrary font sizes or ad-hoc pixel values. It records semantic intent.

### Multi-Format Serialization Matrix

| Element | Rich Editor | Markdown Source | DOCX Output | PDF Output | EPUB Output |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Heading 1** | `<h1>` element | `# Title` | `Heading 1` Style | Chapter Title | `<h1>` Chapter |
| **Heading 2** | `<h2>` element | `## Title` | `Heading 2` Style | Section Header | `<h2>` Section |
| **Heading 3** | `<h3>` element | `### Title` | `Heading 3` Style | Minor Header | `<h3>` Minor |
| **Scene Break** | `<div data-type="scene-break">` | `* * *` | Centered Asterisks | `✦ ✦ ✦` Ornament | `<hr class="scene-break" />` |
| **Page Break** | `<div data-type="page-break">` | `<!-- pagebreak -->` | Page Break Node | Page Break | Page Break |
| **Table** | `<table>` node | Standard GFM Pipe | Word Table Grid | PDF Table Grid | HTML5 Table |
| **Author Note** | `<blockquote>` callout | `> [!NOTE]` | Comment / Callout | Excluded/Margin | Excluded/Callout |
| **Bookmark** | In-memory anchor | `<!-- bookmark: ... -->` | Excluded | Excluded | Excluded |

---

## 2. Table Editing Semantics

Tables in Swrite provide clean structure for timelines, cast rosters, and world-building notes without attempting to become a spreadsheet:

- **Configurable Dimensions:** Support 1 to 10 columns and 2 to 20 rows.
- **Row & Column Manipulation:** Dynamic addition and deletion via `TableCommands`.
- **Tab Navigation:** Pressing `Tab` moves focus to the next cell; `Shift+Tab` moves to the previous cell.
- **Pure Markdown Storage:** Serialized transparently as standard GitHub Flavored Markdown (GFM) pipe tables.
