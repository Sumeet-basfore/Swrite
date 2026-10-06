# Changelog

All notable changes to **Swrite 2** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0-rc1] - 2026-10-06

### Initial Release Candidate (Feature Frozen)

#### Core & Architecture
- **Filesystem-First Engine:** All manuscripts stored as transparent, portable Markdown files on disk. Zero proprietary lock-in.
- **Rust Core & Atomic Writes:** Debounced, zero-corruption atomic writes with background checksum validation, three-way merge reconciliation, and instant recovery snapshots.
- **Five Specialized Studios:**
  - **WRITE:** Distraction-free prose drafting, 5 typography presets (Literary, Classic, Modern, Compact, Typewriter), in-document Find/Replace, outline & bookmarks drawer, contextual toolbar, and 25+ author slash commands.
  - **PLAN:** Hierarchical outline management, scene ordering, temporal timeline tagging, and character POV tracking.
  - **DESK:** Freeform creative scratchpads, character profile cards, world lore notes, and interactive visual moodboards.
  - **EDIT:** Line diff comparison, anchored inline editorial comments, proofreading checks, and snapshot checkpoint rollbacks.
  - **PUBLISH:** Preflight validation, publication profile styling (Standard Manuscript Shunn, Modern Paperback, Clean Markdown), and multi-format export to PDF, DOCX, EPUB, MD, and TXT.
- **Trusted Local Plugins (API v1):** Lightweight in-process JavaScript extensions with capability checks and isolated `.swrite/plugins/<id>/data.json` storage.
