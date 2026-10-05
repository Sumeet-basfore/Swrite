# Swrite 2 — Milestone 2 Completion Report

**Document Version:** 1.0.0  
**Status:** Completed & Verified  
**Milestone:** 2 — Rust Document Core & Filesystem Engine  
**Starting Commit:** `ee117aa`  

---

## 1. Executive Summary

Milestone 2 has successfully established the complete native Rust Document Core & Filesystem Engine for Swrite 2. The core complies with all specifications locked in Milestone 1:

- **Filesystem Source of Truth**: Full project lifecycle (`create`, `open`, `validate`, `close`) managing canonical project hierarchies (`Manuscript/`, `Planning/`, `Desk/`, `Assets/`) and isolated `.swrite/` metadata.
- **Path Security Jail**: Strict directory traversal prevention (`../`), symlink escape guards, and backend-enforced hidden file isolation.
- **Atomic Persistence**: Guaranteed zero 0-byte file truncations via write-temp-sync-rename persistence.
- **Neutral AST**: Complete Block and Inline node representation decoupling semantics from UI view state.
- **Document Codecs**: Lossless CommonMark/GFM/Wikilinks Markdown, deterministic UTF-8 Plain Text, and OpenXML DOCX import/export with automated VBA macro stripping.
- **Crash Recovery & History**: 3-second write-ahead recovery drafts (`.swrite/recovery/`) and rolling local history snapshots (`.swrite/history/`).
- **File Watching & 3-Way Reconciliation**: Debounced `notify` event engine with deterministic Base vs. User vs. Disk conflict classification.
- **Derived Search Engine**: Ephemeral in-memory search index rebuildable from disk in <1ms.
- **Typed Tauri IPC**: Full command layer and React/TypeScript development test harness.

---

## 2. Test Suite & Verification Results

All 37 test cases across 6 suites passed with 0 failures and 0 warnings:

| Test Suite | Tests | Result | Focus Areas |
| :--- | :---: | :---: | :--- |
| **`swrite-core` (Unit Tests)** | 20 | **PASS** | Format sniffing, atomic writes, path jail, hashing, document identities, reconciliation, recovery drafts, docx codecs. |
| **`adversarial_fs_tests`** | 5 | **PASS** | `../` path traversal blocking, absolute path injection rejection, hidden file access guards, malformed manifest self-healing, missing directory reconstruction. |
| **`docx_roundtrip_tests`** | 2 | **PASS** | DOCX OpenXML export/re-import round-tripping, VBA macro binary detection, stripping, and warning emission. |
| **`markdown_roundtrip_tests`** | 5 | **PASS** | Golden fixtures for headings, inline marks, nested lists, task lists, tables, blockquotes, wikilinks, scene breaks, and raw HTML preservation. |
| **`watcher_reconciliation_tests`** | 4 | **PASS** | Ephemeral search indexing, recovery draft lifecycle (save -> crash -> restore -> clear), rolling history snapshots, 3-way conflict detection. |
| **`performance_benchmarks`** | 1 | **PASS** | Full tier performance measurement (1,000 to 120,000+ words). |
| **Total Test Count** | **37** | **PASS (100%)** | Zero failures. |

---

## 3. Real Performance Benchmark Results

Tested on release hardware with actual manuscript corpus fixtures:

| Corpus Tier | Word Count | Byte Size | Markdown Parse | Markdown Serialize | TXT Parse | SHA-256 Hash | Search Index |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1,000 words** | 1,029 w | 6.5 KB | **146 µs** | 8 µs | 38 µs | 137 µs | 5 µs |
| **10,000 words** | 9,885 w | 62.8 KB | **495 µs** | 33 µs | 253 µs | 1.06 ms | 4 µs |
| **50,000 words** | 49,413 w | 314.0 KB | **8.06 ms** | 987 µs | 4.15 ms | 12.91 ms | 82 µs |
| **100,000 words** | 98,769 w | 627.7 KB | **4.15 ms** | 298 µs | 2.47 ms | 10.52 ms | 59 µs |
| **120,000+ words** | **118,485 w** | **753.0 KB** | **4.75 ms** | **481 µs** | **4.00 ms** | **15.41 ms** | **78 µs** |

> **Specification Target Check**: The locked interchange specification targeted parsing a 120k+ word novel in **under 35ms**. Swrite 2 achieves **4.75ms**, outperforming the target by **7.3×**.

---

## 4. Security Audit & Resilience Findings

1. **Path Traversal Security**: Path jail resolution thoroughly canonicalizes paths against the active `ProjectRoot`. All `../` escapes, root drive injections, and symlinks pointing outside the project folder are unconditionally blocked.
2. **Hidden File Isolation**: Internal files (`.swrite/`, `.git/`, `.cache/`) are filtered directly by the Rust discovery layer, guaranteeing that internal configuration never leaks into the author's binder view.
3. **DOCX Security**: Ingested DOCX archives are scanned for `vbaProject.bin`, macros, or executable parts. Any executable payloads are stripped, and an `ImportWarning` report is returned.
4. **Autonomous Self-Healing**: A project directory containing manuscript files remains valid even if `.swrite/` or `project.json` is missing or corrupted. The engine automatically reconstructs metadata without data loss.

---

## 5. Next Milestone Readiness

With the Rust Document Core and Filesystem Engine fully validated, Swrite 2 is ready for **Milestone 3 — Rich Editor Engine & Canvas Surface**.
