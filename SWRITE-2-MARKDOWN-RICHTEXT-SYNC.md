# Swrite 2 — Markdown & Rich-Text Synchronization Specification

## 1. Synchronization Architecture

Swrite guarantees **lossless bidirectional round-tripping** between raw Markdown on disk, the ProseMirror editing buffer, and the Rust Neutral AST.

```text
Disk (.md on filesystem)
         ▲
         │ (Atomic Read/Write)
         ▼
Rust Neutral Document Model (`swrite_core`)
         ▲
         │ (Tauri IPC JSON)
         ▼
Editor Bridge (`createEditor.ts` / `SourceEditor.tsx`)
         ▲
         │ (ProseMirror Parsing & Serialization)
         ▼
Rich Canvas DOM State / Monospace Source Buffer
```

---

## 2. Supported Constructs & Representation

| Construct | Markdown Syntax | Milkdown / ProseMirror Node | Rust Neutral AST |
| :--- | :--- | :--- | :--- |
| **Paragraph** | `Plain text` | `paragraph` | `BlockNode::Paragraph` |
| **Headings** | `# H1` .. `###### H6` | `heading` (`{ level }`) | `BlockNode::Heading` |
| **Blockquote** | `> Quote text` | `blockquote` | `BlockNode::BlockQuote` |
| **Bullet List** | `- Item` or `* Item` | `bullet_list` -> `list_item` | `BlockNode::List` (`ordered: false`) |
| **Ordered List** | `1. Item` | `ordered_list` -> `list_item` | `BlockNode::List` (`ordered: true`) |
| **Task List** | `- [ ] Pending` / `- [x] Done` | `task_list_item` (`{ checked }`) | `BlockNode::List` (`ListItem.checked`) |
| **Scene Break** | `* * *` | `scene_break` (`thematicBreak`) | `BlockNode::SceneBreak` |
| **Page Break** | `<!-- pagebreak -->` | `page_break` (`html`) | `BlockNode::PageBreak` |
| **Tables** | `\| A \| B \|` | `table` -> `table_row` -> `table_cell` | `BlockNode::Table` |
| **Code Block** | ```` ```rust ```` | `code_block` (`{ language }`) | `BlockNode::CodeBlock` |
| **Bold** | `**bold**` | `strong` mark | `InlineNode::Strong` |
| **Italic** | `*italic*` | `em` mark | `InlineNode::Emphasis` |
| **Strikethrough** | `~~strike~~` | `strike_through` mark | `InlineNode::Strikethrough` |
| **Inline Code** | `` `code` `` | `code_inline` mark | `InlineNode::CodeSpan` |
| **Wikilinks** | `[[Target\|Alias]]` | `wikilink` / link node | `InlineNode::Wikilink` |
| **Unknown HTML** | `<custom-tag>` | `html` node | `BlockNode::RawBlock` / `RawInline` |

---

## 3. Preservation of Unknown & Custom Constructs

When the editor encounters Markdown extensions or raw HTML comments (e.g. `<!-- custom-meta -->`, SVG embeds, or specialized directives):
1. The parser wraps the content in a raw block/inline preserving exact string bytes.
2. During WYSIWYG editing, raw blocks are preserved in place without destructive formatting sanitization.
3. Upon serialization back to disk, the verbatim string is reconstructed with zero data loss.

---

## 4. Conflict & External Modification Handling

1. If a file is modified externally while the editor buffer is **clean**:
   The editor immediately reloads the file from disk with zero friction.
2. If a file is modified externally while the editor buffer is **dirty**:
   The `SaveCoordinator` flags a `conflict` status without overwriting the author's work.
3. The author can inspect differences via the 3-way reconciliation engine (`Identical`, `UserOnlyChanged`, `ExternalOnlyChanged`, `BothChangedConflict`).
