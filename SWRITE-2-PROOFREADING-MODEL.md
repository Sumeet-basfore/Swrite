# SWRITE 2 — DETERMINISTIC PROOFREADING SPECIFICATION

## 1. Overview & Non-AI Philosophy

Swrite 2 proofreading is **100% deterministic, local, and rule-based**.

It does NOT use large language models, cloud APIs, or generative rewriting engines. It executes fast native Rust checks without network connections or background latency.

---

## 2. Core Rule Sets

Implemented in `src-tauri/src/edit/proofreader.rs`:

1. **Repeated Consecutive Words (`repeated_consecutive_word`)**:
   - Catches duplicated words across line and sentence boundaries (e.g. `"The the"`, `"in in"`, `"had had had"`).
   - Generates suggested single-word replacements.
2. **Double / Malformed Punctuation (`double_punctuation`)**:
   - Catches accidental duplicate punctuation (e.g. `",,"`, `";;"`, `"::"`).
3. **Space Before Punctuation (`space_before_punctuation`)**:
   - Catches erroneous leading whitespace before `,`, `.`, `;`, `:`, `!`, or `?`.
4. **Project Dictionary (`custom_words`)**:
   - Custom character and location names stored in `.swrite/dictionary.json` are excluded from false positive alerts.
5. **Ignore Findings (`ignored_findings`)**:
   - Dismissed items are recorded in `.swrite/dictionary.json` to prevent re-flagging.

---

## 3. Performance Guarantee

The native Rust proofreading engine scans 100,000+ word manuscripts in under **10 milliseconds**, allowing real-time scanning during studio transitions without UI stutter or background lag.
