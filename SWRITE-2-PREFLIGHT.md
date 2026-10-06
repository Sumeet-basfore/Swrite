# SWRITE 2 — Preflight Verification Engine

## 1. Purpose
The **Preflight Engine** guarantees that manuscripts are structurally sound and error-free prior to publication export.

It runs deterministically via Rust native IPC (`publish_preflight_run`) and reports issues categorized by severity.

---

## 2. Issue Severity Tiers

| Severity | Definition | Behavior |
|---|---|---|
| **Blocking** | Fatal issue that corrupts or breaks document structure (e.g. invalid paper margins > page size, zero valid chapters). | Disables the "Export" button in UI. Must be resolved before exporting. |
| **Warning** | Notable quality issue (e.g. empty chapter files, broken relative images, unresolvable wikilinks, repeated empty scene breaks). | Displayed with amber badges in preflight drawer; export permitted with confirmation. |
| **Info** | Informational suggestion (e.g. missing subtitle, no copyright statement). | Displayed with blue/gray badges. |

---

## 3. Preflight Checks List

1. **Empty Document Check:** Warns if a manuscript document contains 0 words or whitespace only.
2. **Broken Image Check:** Identifies markdown image references (`![alt](path)`) whose target assets do not exist in the project or disk.
3. **Broken Wikilink Check:** Finds `[[target]]` links that do not map to any existing manuscript or desk note.
4. **Consecutive Scene Breaks:** Flags duplicate `* * *` or `---` scene breaks occurring without intervening prose.
5. **Geometry Validation:** Ensures margins do not exceed total page dimensions (blocking).
6. **Front Matter Completeness:** Flags missing title or author fields.
