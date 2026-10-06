# SWRITE 2 — Writing Interactions & Ergonomics

## 1. Interaction Hierarchy

In Swrite 2, every interaction is prioritized according to author cognitive flow:

```text
Writing (Typing & Prose Flow)
  ↓
Navigation (Moving between scenes & chapters)
  ↓
Formatting (Markdown shortcuts & inline styling)
  ↓
Selection (Word, line, and paragraph operations)
  ↓
Reference (Quick Desk/Plan context lookups)
  ↓
Advanced Operations (Find/Replace, Bookmarks, Tables)
```

---

## 2. In-Flow Markdown Transformations

Authors do not need to pause their writing flow to invoke menus. Standard Markdown syntax automatically transforms into semantic rich blocks:

| Input Pattern | Trigger Action | Resulting Structure |
| :--- | :--- | :--- |
| `# ` + Space | Beginning of line | Heading 1 |
| `## ` + Space | Beginning of line | Heading 2 |
| `### ` + Space | Beginning of line | Heading 3 |
| `> ` + Space | Beginning of line | Blockquote / Epigraph |
| `- ` or `* ` + Space | Beginning of line | Bullet List |
| `1. ` + Space | Beginning of line | Numbered List |
| `- [ ] ` + Space | Beginning of line | Checklist Item |
| `***` or `* * *` | Beginning of line | Ornamental Scene Break (`✦ ✦ ✦`) |
| `**word**` | Closing double asterisk | **Bold Text** |
| `*word*` or `_word_` | Closing single asterisk/underscore | *Italic Text* |
| `~~word~~` | Closing double tilde | ~~Strikethrough~~ |
| `` `code` `` | Closing backtick | `Inline Code` |

---

## 3. The Slash Command Workflow

Typing `/` on a blank line or following a space opens the lightweight slash command popover:

- **Instant Filtering:** Sub-millisecond fuzzy search against titles, descriptions, and alias keywords.
- **Keyboard Navigation:** `ArrowDown` / `ArrowUp` selects items; `Enter` commits the command; `Escape` cleanly dismisses without modifying surrounding prose.
- **Context Awareness:** Commands like `/link`, `/image`, and `/table` open focused modal inputs without disrupting the author's cursor location.

---

## 4. Clipboard & Safety Handling

- **Copying:** Formatted text copied from Swrite exports clean standard Markdown and sanitized HTML into the system clipboard.
- **Pasting from External Editors:** Text pasted from MS Word, Google Docs, or web pages is sanitized. Arbitrary `<script>` tags, inline styling blobs, and nested styling hacks are stripped while preserving semantic headings, bold/italic, lists, and links.
