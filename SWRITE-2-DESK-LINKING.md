# SWRITE 2 — Desk Linking & Backlinks Model
Document Version: 2.0.0-alpha.1
Status: Canonical
Date: 2026-10-06

---

## 1. Internal Link Syntax

Authors can create internal references in any Markdown document using:

1. **Wikilinks**: `[[Lucan]]` or `[[Black River]]`
2. **Project-Relative Paths**: `Desk/Characters/Lucan.md` or `Manuscript/Chapter 01.md`

---

## 2. Dynamic Backlink Discovery

Swrite 2 scans the project's Markdown files dynamically on demand. When an author inspects backlinks for `Desk/Characters/Lucan.md`, the engine returns all files in `Manuscript/`, `Planning/`, or `Desk/` containing mentions.

No rigid graph database or permanent index file is required on disk, preserving filesystem portability.
