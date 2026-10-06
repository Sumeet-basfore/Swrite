# SWRITE 2 — Publish Studio Testing & Verification

## 1. Testing Strategy
The Publish Studio is verified through comprehensive multi-tier tests:

1. **Rust Backend Unit Tests (`src-tauri/src/publish/`):**
   - Profile loading, defaults, and JSON serialization.
   - Preflight verification of blocking, warning, and info rules.
   - Pagination calculation across multi-chapter manuscripts.
   - Multi-format exporters (PDF, DOCX, EPUB 3, Markdown, TXT) smoke and roundtrip testing.
2. **Frontend Vitest Unit Tests (`src/publish/__tests__/`):**
   - `publishState.test.ts`: Profile loading, custom profile duplication, update, and export IPC invocation.
   - `paginationBenchmark.test.ts`: High-throughput stress test of pagination algorithm with 100,000+ words.
3. **End-to-End Integration:**
   - Full Studio switching (`Mod+1` through `Mod+5`).
   - Modal export confirmation and file generation in `Export/` directory.

---

## 2. Test Execution Commands

```bash
# Run Rust core test suite
cargo test --manifest-path src-tauri/Cargo.toml

# Run Frontend test suite
npm test

# Run TypeScript typecheck
npx tsc --noEmit

# Run Frontend Production Build
npm run build
```
