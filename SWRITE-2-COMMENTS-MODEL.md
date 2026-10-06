# SWRITE 2 — COMMENTS & ANCHORING SPECIFICATION

## 1. Overview & File Format

Comments in Swrite 2 are stored in `.swrite/comments.json`.

```json
{
  "comments": [
    {
      "id": "cmt_1791234567890_abcde",
      "anchor": {
        "document_id": "doc_ch01_intro",
        "relative_path": "Manuscript/Chapter-01.md",
        "start_offset": 120,
        "end_offset": 154,
        "exact_text": "the black gates of the citadel",
        "prefix_context": "Standing before ",
        "suffix_context": ", Kael hesitated."
      },
      "created_at": "2026-10-06T00:00:00Z",
      "updated_at": "2026-10-06T00:05:00Z",
      "content": "Check consistency with Chapter 12 description",
      "replies": [
        {
          "id": "reply_1791234567999_xyz",
          "created_at": "2026-10-06T00:10:00Z",
          "content": "Updated Ch 12 to match obsidian finish."
        }
      ],
      "status": "open"
    }
  ]
}
```

---

## 2. Text Anchoring & Stale Detection

1. **Contextual Anchors**: Each anchor records `exact_text`, `start_offset`, `end_offset`, `prefix_context`, and `suffix_context`.
2. **Deterministic Staleness Detection**:
   - When a document is read, Swrite verifies whether `exact_text` exists at `start_offset..end_offset`.
   - If the text has moved, Swrite searches for `exact_text` in the document to detect `offset_shifted`.
   - If `exact_text` is missing or modified, the anchor is flagged as `stale` (`text_mismatch`).
3. **Interactive Re-attachment**:
   - Stale comments display an author action button: "Reattach to Cursor" or "Keep Unanchored".

---

## 3. Atomic Mutation & Rust IPC Handlers

All comment updates go through Rust core atomic writes:
- `comments_load()`
- `comments_save(data)`
- `comment_add(comment)`
- `comment_resolve(comment_id, resolved)`
- `comment_delete(comment_id)`
