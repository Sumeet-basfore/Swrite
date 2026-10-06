# Swrite 2 — Editor Interaction & Shortcut Specification

## 1. Interaction Design Philosophy

The Swrite writing surface is designed as a **quiet digital writing desk**.

1. **Invisible when writing**: Toolbars, badges, popups, and decorations disappear into the background while writing.
2. **Contextual when needed**: Commands appear on-demand via slash commands (`/`), selection toolbars, or keyboard shortcuts.
3. **Calm, unobtrusive feedback**: Status bar indicators communicate save state and statistics subtly without high-contrast flashes.

---

## 2. Standard Keyboard Shortcuts

| Shortcut | Context | Action |
| :--- | :--- | :--- |
| `Mod + S` | Global | Save document immediately to filesystem |
| `Mod + Shift + F` | Global | Toggle Focus Mode (hide chrome, center prose) |
| `Mod + /` or `Mod + Shift + M` | Global | Toggle between Rich Canvas and Markdown Source Mode |
| `Mod + B` | Editor | Toggle **Bold** (`**text**`) |
| `Mod + I` | Editor | Toggle *Italic* (`*text*`) |
| `Mod + Shift + S` / `Mod + Shift + X` | Editor | Toggle ~~Strikethrough~~ (`~~text~~`) |
| `Mod + ` ` ` | Editor | Toggle inline `code` |
| `Mod + Alt + 1` | Editor | Apply Heading 1 (`# `) |
| `Mod + Alt + 2` | Editor | Apply Heading 2 (`## `) |
| `Mod + Alt + 3` | Editor | Apply Heading 3 (`### `) |
| `Mod + Alt + 0` | Editor | Apply standard body text paragraph |
| `Mod + Shift + D` | Editor | Insert ornamental scene break (`* * *` / `✦ ✦ ✦`) |
| `Mod + Shift + Enter` | Editor | Insert page break (`<!-- pagebreak -->`) |
| `Mod + Shift + 8` | Editor | Create or wrap in bullet list (`- `) |
| `Mod + Shift + 7` | Editor | Create or wrap in numbered list (`1. `) |
| `Mod + Shift + Q` | Editor | Wrap in blockquote (`> `) |
| `Mod + Z` / `Mod + Y` | Editor | Undo / Redo |

> *Note: `Mod` represents `Ctrl` on Linux/Windows and `Cmd` on macOS.*

---

## 3. Slash Commands (`/`)

Typing `/` on a new line or after a space opens the contextual block insertion menu.

| Command ID | Display Label | Markdown Equivalent | Description |
| :--- | :--- | :--- | :--- |
| `/h1` | Heading 1 | `# ` | Major section / chapter title |
| `/h2` | Heading 2 | `## ` | Sub-section / scene title |
| `/h3` | Heading 3 | `### ` | Minor sub-heading or narrative beat |
| `/p` | Text Paragraph | Plain text | Plain literary body text |
| `/scene` | Scene Break | `* * *` | Ornamental scene separator (`✦ ✦ ✦`) |
| `/page` | Page Break | `<!-- pagebreak -->` | Manuscript page boundary |
| `/quote` | Blockquote | `> ` | Epigraph, excerpt, or letter |
| `/bullet` | Bullet List | `- ` | Unordered point list |
| `/number` | Numbered List | `1. ` | Sequential step list |

---

## 4. Focus Mode & Literary Typography

When Focus Mode is active (`Mod + Shift + F`):
- Navigation sidebars, dev inspectors, and formatting toolbars are dismissed.
- The manuscript page expands into a centered, borderless column with generous whitespace.
- Non-active paragraphs smoothly dim to $28\%$ opacity, keeping the author centered on the active thought without losing overall context.
- Ambient status bar provides quiet statistics at the bottom edge.
