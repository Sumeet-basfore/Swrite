# Swrite 2 — Canvas Design & Typography Specification

## 1. Visual Hierarchy & Digital Desk Metaphor

The Swrite 2 workspace is styled after a physical writing desk:
- **The Desk (`--bg-desk`)**: Neutral, soothing surface framing the document.
- **The Manuscript Page (`--bg-page`)**: A crisp, warm page with subtle elevation (`0 4px 20px rgba(0, 0, 0, 0.03)`).
- **The Ink (`--text-ink`)**: High legibility, dark graphite color avoiding eye-straining stark pure black.

---

## 2. Typography Ratios & Comfort Margins

| Property | Value | Rationale |
| :--- | :--- | :--- |
| **Body Font Family** | `Merriweather`, `Charter`, `Georgia`, serif | Warm, highly legible literary prose rendering |
| **Body Font Size** | `1.125rem` ($18\text{px}$) | Comfortable reading and writing size for long sessions |
| **Line Height** | `1.8` ($32.4\text{px}$) | Optimal leading for prose editing and scanning |
| **Measure (Max Width)** | `740px` ($\approx 70\text{--}75\text{ characters}$) | Proven golden ratio for reading comprehension |
| **Paragraph Spacing** | `1.5em` bottom margin | Clean visual breathing room between thoughts |
| **Heading Scale** | H1: $2.1\text{rem}$, H2: $1.5\text{rem}$, H3: $1.25\text{rem}$ | Clear proportional hierarchy |

---

## 3. Theme Tokens

| Token | Light Theme | Dark Theme | Purpose |
| :--- | :--- | :--- | :--- |
| `--bg-desk` | `#f9f8f6` | `#16171a` | Outer studio background |
| `--bg-page` | `#ffffff` | `#1c1d22` | Manuscript sheet background |
| `--text-ink` | `#2b2b2b` | `#e5e5e7` | Primary literary text color |
| `--text-muted` | `#787570` | `#95949e` | Secondary notes & blockquotes |
| `--text-faint` | `#b3b0a6` | `#5b5a64` | Subtle borders & shortcuts |
| `--border-quiet` | `#eae7e1` | `#2c2d36` | Divider and card boundaries |
| `--accent-soft` | `#4a5568` | `#818cf8` | Active toggles & badges |
| `--selection-bg` | `#dbeafe` | `#374151` | Calm text selection color |

---

## 4. Status Bar Ergonomics

Positioned at the viewport bottom:
- **Left**: Live word count, character count, and estimated reading time.
- **Right**:
  - Save status indicator (`Saved` / `Unsaved` / `Saving...` / `External Change`).
  - Mode switch toggle (`Rich` vs `Markdown`).
  - Focus mode toggle (`Focus`).
