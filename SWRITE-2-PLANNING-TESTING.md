# SWRITE 2 — Planning Testing & Benchmark Suite
Document Version: 2.0.0-alpha.1
Status: Canonical
Date: 2026-10-06

---

## 1. Test Coverage Overview

The planning studio test suite verifies:

1. **Rust Core Planning Codecs (`src-tauri/src/planning/`)**:
   - `test_timeline_roundtrip_markdown`: Verifies parse $\leftrightarrow$ serialize lossless round-tripping of `Planning/Timeline.md`.
   - `test_timeline_save_and_load_from_disk`: End-to-end filesystem persistence verification.
   - `test_outline_meta_persistence`: Atomic `.swrite/outline_meta.json` storage and item upserting.

2. **Frontend State & UI Tests (`src/planning/__tests__/`)**:
   - `outlineState.test.ts`: Act/Chapter/Scene tree hierarchy construction, title aliases, metadata status updates, fast scene/chapter generation.
   - `timelineState.test.ts`: Chronological vs narrative order sorting, narrative marker filtering, full text search, event addition/updates/deletion.
   - `outlineBenchmark.test.ts`: 500-scene large outline tree generation benchmark under 50ms (achieves ~20ms in jsdom, <5ms native).

---

## 2. Test Execution Commands

```bash
# Run all frontend tests
npm test

# Run all backend tests
cd src-tauri && cargo test
```
