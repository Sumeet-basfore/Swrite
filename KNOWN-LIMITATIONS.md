# SWRITE 2 — Known Limitations (v0.1.0-rc1)

This document provides transparent disclosure of known edge cases and design boundaries in Swrite 2:

---

## 1. Document Format & Interoperability

- **Complex Word (DOCX) Macros & Nested SmartArt:** Swrite strips VBA macros and converts complex SmartArt into static paragraph blocks upon import to preserve manuscript safety and plain prose integrity.
- **Deeply Nested Markdown HTML:** HTML tables and raw SVG tags inside Markdown are preserved as literal blocks but do not render as interactive widgets in the Rich canvas.

---

## 2. Filesystem & Cloud Sync

- **Rapid Multi-Device Simultaneous Edits:** If two external file-syncing programs modify the exact same sentence simultaneously without saving, Swrite triggers a safe `conflict` warning rather than attempting an automatic speculative 3-way text merge.

---

## 3. Plugin Architecture

- **Trusted Local Plugins:** Plugins run in-process in the client runtime with permission and namespace boundaries. They do not run in an isolated WebAssembly sandbox. Authors should only install plugins from trusted local sources.

---

## 4. Large Project Boundaries

- Tested and verified up to 200 scenes and 150,000+ words per manuscript. For projects exceeding 500,000 words in a single file, authors should split acts across separate chapter files.
