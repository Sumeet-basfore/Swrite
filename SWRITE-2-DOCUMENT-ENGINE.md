# Swrite 2 — Document Engine & AST Implementation

**Document Version:** 1.0.0  
**Status:** Canonical & Implemented  
**Milestone:** 2 — Rust Document Core & Filesystem Engine  

---

## 1. Neutral Abstract Syntax Tree (AST)

The neutral AST ([`src-tauri/src/document/model.rs`](file:///home/sumeet/Documents/writers-tool/Swrite/src-tauri/src/document/model.rs)) is completely decoupled from visual UI views, HTML, or raw strings.

### Block Nodes (`BlockNode`)
- `Paragraph { inlines: Vec<InlineNode> }`
- `Heading { level: u8, inlines: Vec<InlineNode> }`
- `BlockQuote { blocks: Vec<BlockNode> }`
- `List { ordered: bool, start: Option<u64>, items: Vec<ListItem> }` (supports tight & loose lists, task list checkboxes `[ ]` / `[x]`)
- `Table { headers: Vec<TableCell>, rows: Vec<Vec<TableCell>>, alignments: Vec<TableAlignment> }`
- `CodeBlock { language: Option<String>, code: String }`
- `Divider` (`---`)
- `SceneBreak { symbol: Option<String> }` (`* * *`, `---`, `###`)
- `PageBreak` (`<!-- pagebreak -->`)
- `RawBlock { format: String, raw_content: String }` (preserves unsupported or custom blocks)

### Inline Nodes (`InlineNode`)
- `Text(String)`
- `Emphasis(Vec<InlineNode>)` (`*italic*`)
- `Strong(Vec<InlineNode>)` (`**bold**`)
- `Strikethrough(Vec<InlineNode>)` (`~~strike~~`)
- `CodeSpan(String)` (`` `code` ``)
- `Link { url: String, title: Option<String>, inlines: Vec<InlineNode> }`
- `Wikilink { target: String, alias: Option<String> }` (`[[Target|Alias]]`)
- `Image { url: String, alt_text: String, title: Option<String> }`
- `InlineCommentAnchor { comment_id: String, inlines: Vec<InlineNode> }`
- `RawInline { format: String, raw_content: String }` (e.g., custom HTML tags)

---

## 2. Supported Document Formats

### 2.1 CommonMark + GFM + Wikilinks Markdown
- Handled by [`parse_markdown`](file:///home/sumeet/Documents/writers-tool/Swrite/src-tauri/src/document/markdown.rs#L8-L290) and [`serialize_markdown`](file:///home/sumeet/Documents/writers-tool/Swrite/src-tauri/src/document/markdown.rs#L292-L520).
- Deterministic output: preserves structure without syntax churn.
- Preserves raw HTML blocks and custom extension tags verbatim.

### 2.2 UTF-8 Plain Text (`.txt`)
- Handled by [`parse_txt`](file:///home/sumeet/Documents/writers-tool/Swrite/src-tauri/src/document/txt.rs#L6-L23) and [`serialize_txt`](file:///home/sumeet/Documents/writers-tool/Swrite/src-tauri/src/document/txt.rs#L26-L95).
- Deterministic LF line endings with double newline paragraph separation.

### 2.3 OpenXML Microsoft Word (`.docx`) Ingestion & Export
- Handled by [`import_docx`](file:///home/sumeet/Documents/writers-tool/Swrite/src-tauri/src/document/docx.rs#L22-L68) and [`export_docx`](file:///home/sumeet/Documents/writers-tool/Swrite/src-tauri/src/document/docx.rs#L273-L306).
- Ingestion extracts `word/document.xml`, parsing paragraphs, headings, bold, italics, strikethrough, tables, page breaks, and scene breaks.
- **VBA Macro Stripping**: Inspects the zip archive for `vbaProject.bin` or macro payload files. Strips them completely and emits an `ImportWarning` report.
- **Shunn Literary Export**: Generates compliant OpenXML packages with standard margins, headings, and scene breaks.

---

## 3. Format Sniffing & Magic Bytes

[`sniff_format`](file:///home/sumeet/Documents/writers-tool/Swrite/src-tauri/src/document/sniff.rs#L20-L58) examines:
1. Magic bytes `PK\x03\x04` + `[Content_Types].xml` / `word/` for DOCX.
2. Null byte binary detection.
3. UTF-8 Markdown syntax heuristics (`# `, `[[`, `- [ ]`, `* * *`).
