# SWRITE 2 — Creative Desk & Moodboard Testing Suite
Document Version: 2.0.0-alpha.1
Status: Canonical
Date: 2026-10-06

---

## 1. Test Coverage Overview

The Creative Desk testing suite verifies:

1. **Rust Core Desk Codecs (`src-tauri/src/desk/`)**:
   - `test_moodboard_lifecycle`: Atomic save, load, serialization and deserialization of `Desk/Moodboards/*/board.json`.
   - `test_asset_import_and_unique_resolution`: Extension validation, safe unique renaming, and base64 preview rendering.
   - `test_backlinks_scanning`: Dynamic project-wide backlink discovery across `Manuscript/`, `Planning/`, and `Desk/`.

2. **Frontend State & UI Tests (`src/desk/__tests__/`)**:
   - `moodboardState.test.ts`: Canvas pan/zoom clamping, item addition, transformation, resize, duplication, deletion, and debounced save.
   - `deskFiltering.test.ts`: Categorization rules and Markdown template generation for characters, locations, world, and research.
   - `moodboardBenchmark.test.ts`: Performance verification of 100-item canvas transformations (<20ms).

---

## 2. Test Execution Commands

```bash
# Run all frontend tests
npm test

# Run all backend tests
cd src-tauri && cargo test
```
