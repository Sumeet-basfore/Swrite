# Swrite 2 — File Import Behavior

## 1. Supported Import Formats

| Format | Extension | Processing Pipeline |
| :--- | :--- | :--- |
| **Markdown** | `.md`, `.markdown` | Direct ingestion; parses AST & verifies syntax integrity |
| **Plain Text** | `.txt` | Normalized into neutral paragraphs; saved as `.txt` or `.md` |
| **Word Document** | `.docx` | Strips VBA macros & unsupported binary blobs; converts standard styles |
| **Images / Media** | `.png`, `.jpg`, `.webp` | Copied securely into `Assets/` with relative reference |

---

## 2. Import Security & Validation

1. **Jail Enforcement**: Absolute source paths are checked to prevent symlink traversal or unauthorized internal file access.
2. **Stable ID Generation**: An imported document is assigned a fresh UUID `DocumentId` in `.swrite/project.json`.
3. **Search Indexing**: Text content is immediately indexed into the in-memory search index.
