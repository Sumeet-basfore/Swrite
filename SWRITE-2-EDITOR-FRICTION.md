# SWRITE 2 — Editor Usability Audit & Friction Resolutions

## 1. Usability Audit Methodology

Every interaction in the WRITE environment was tested against continuous long-form writing runs (10k to 120k+ word projects).

---

## 2. Friction Points Log & Resolutions

| Context | Intent | Expected | Actual (Pre-M12) | Resolution |
| :--- | :--- | :--- | :--- | :--- |
| **Typing Slash Commands** | Insert scene break with `/scene` | Smooth insertion near cursor | Lost cursor pos or had to delete slash manually | SlashDropdown computes coordinates and removes typed `/` cleanly |
| **Shortcut Collisions** | Bold selection with `Mod+B` | Bold text when text selected, toggle sidebar when not | Toggled sidebar unexpectedly mid-sentence | Context-aware `dispatchEditorKeydown` checks selection state |
| **Search in Document** | Find character name with `Mod+F` | In-place highlight and replace | Required switching studios | Embedded `FindReplaceBar` with case/word filters |
| **Table Insertion** | Insert tabular timeline | Clean rows/cols without broken tables | Hardcoded raw markdown text | `TableCommands` creates interactive rows/cols with Tab navigation |
| **Proofreading Flow** | Read finished chapter | Clean reading page | Had to export or ignore editor cursor | Built-in `Reading Mode` (`Mod+Shift+R`) |
| **Bookmarks / TODOs** | Tag passages to rewrite | Lightweight marker | Required opening external notes | Inline bookmarks (`<!-- bookmark: ... -->`) & Outline drawer |

---

## 3. Verification Summary

All identified friction items were resolved and verified with automated test suites in `src/editor/__tests__/`.
