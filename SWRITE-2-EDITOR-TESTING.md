# Swrite 2 — Editor Engine Verification & Benchmarks

## 1. Test Coverage Overview

The Swrite 2 Editor engine is covered across both frontend and native Rust test suites:

- **Frontend Unit & Integration Tests (`vitest`)**: 17 tests across 5 suites (100% passing).
- **Native Rust Engine Tests (`cargo test`)**: 37 tests across 6 suites (100% passing).

---

## 2. Benchmark Results

### Editor Typing & Metrics Calculation Performance

| Benchmark Scenario | Word Count | Measured Latency | Frame Budget Target | Result |
| :--- | :--- | :--- | :--- | :--- |
| **Short Scene / Beat** | 1,000 words | $0.06\text{ ms}$ | $< 5.0\text{ ms}$ | **PASS** ($\approx 83\times$ faster) |
| **Novella Chapter** | 10,000 words | $0.58\text{ ms}$ | $< 15.0\text{ ms}$ | **PASS** ($\approx 25\times$ faster) |
| **Full Manuscript** | 120,000 words | $7.24\text{ ms}$ | $< 80.0\text{ ms}$ | **PASS** ($\approx 11\times$ faster) |

### Rust Core Native Parse & Serialize Throughput

| Document Size | Parse Time (AST) | Serialize Time | Memory Overhead |
| :--- | :--- | :--- | :--- |
| **1,000 words** | $0.03\text{ ms}$ | $0.02\text{ ms}$ | Minimal |
| **10,000 words** | $0.34\text{ ms}$ | $0.21\text{ ms}$ | Minimal |
| **120,000 words** | $4.75\text{ ms}$ | $2.91\text{ ms}$ | $< 4\text{ MB}$ |

---

## 3. Test Suites

### 1. Stats & Metrics Calculation (`stats.test.ts`)
- Empty text handling.
- Multi-paragraph prose tokenization.
- Hyphenated words and unicode apostrophe parsing.
- Adult reading time calculation ($225\text{ wpm}$).

### 2. Comment Anchor Locator (`anchors.test.ts`)
- Exact offset matching for unchanged documents.
- Context-based recovery when preceding text is edited or prepended.
- Safe null returns on full deletion.

### 3. Slash Commands (`slashCommands.test.ts`)
- Full action registry enumeration.
- Fuzzy query filtering across titles and keywords.

### 4. Save Coordinator (`saveCoordinator.test.ts`)
- Clean state initialization.
- 1500ms debounced atomic persistence.
- Recovery draft clearing on successful write.
- Immediate save on `saveNow()`.
- External modification conflict detection.
