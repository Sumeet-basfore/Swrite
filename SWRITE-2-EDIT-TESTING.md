# SWRITE 2 — EDIT STUDIO VERIFICATION & TEST SPECIFICATION

## 1. Test Coverage Overview

Milestone 7 features end-to-end testing across both native Rust core and React frontend layers:

- **Backend Unit Tests**: 35 core tests passing (100%).
- **Frontend Vitest Suites**: 18 test files with 59 individual unit and benchmark tests passing (100%).
- **Build Status**: TypeScript zero-error typecheck (`tsc --noEmit`) and clean production build (`npm run build`).

---

## 2. Test Suites Summary

### Backend Tests (`src-tauri/src/edit/`)
- `comments::tests::test_comments_lifecycle`: Adding, resolving, deleting, and atomic file serialization.
- `revisions::tests::test_revisions_lifecycle`: Categorization, severity, and update persistence.
- `dictionary::tests::test_dictionary_lifecycle`: Word additions and ignore rules.
- `diff::tests::test_line_diff_calculation`: LCS line diff additions, deletions, modifications.
- `proofreader::tests::test_proofreading_detections`: Rule-based repeated words, punctuation spacing, custom dictionary.
- `restore::tests::test_safe_restore_flow`: Pre-restore safety snapshot generation and content restoration.

### Frontend Tests (`src/edit/__tests__/`)
- `reviewState.test.ts`: Queue aggregation, filtering by scope/type/severity, resolve/ignore transitions, replacement application.
- `commentsState.test.ts`: Threading, replies, status changes, intact and shifted anchor detection.
- `historyDiff.test.ts`: Snapshot diff calculations, line addition/deletion categorization, safe restore flow.
- `proofreadBenchmark.test.ts`: Performance validation over 100k+ word manuscripts (scans under 50ms).
