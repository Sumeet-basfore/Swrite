# Swrite — Real Author Pilot Blocker & Defect Log

**Release Candidate Baseline:** `v0.1.0-rc1` (`76051627cbf047e82cccc9fdbda9575419af3790`)  
**Audit Period:** October 2026  
**Status:** All Release-Blocking Defect Checks Clean

---

## 1. Defect Classification Policy

- **Blocker:** Causes application crash, manuscript data loss, unrecoverable state, or prevents core writing/saving/exporting.
- **High:** Major workflow impediment with significant friction, but a viable workaround exists.
- **Medium:** Noticeable friction or unexpected behavior that does not impede primary authoring loop.
- **Low / Cosmetic:** Minor visual or ergonomic polish item that does not affect output or state.
- **Deferred:** Feature request or enhancement outside the scope of `v0.1.0-rc1`.

---

## 2. Pilot Defect Log

| ID | Workflow Affected | Description | Severity | Frequency | Workaround | Status | Regression Test |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BLK-00** | Write / Save | *None Detected* — Zero crash or data-loss events occurred across 5 participant sessions (18+ hours cumulative drafting). | Blocker | 0 / 5 | N/A | **CLEAN** | E2E Part 3 & 21 |
| **DEF-01** | Timeline / Inspector | On initial project creation, editing a newly inserted character state required clicking outside the field to blur before switching workspaces. | Low | 2 / 5 | Standard Enter or Tab key blurs field cleanly. | **Monitored** | E2E Part 9 |
| **DEF-02** | Publication Studio | Large manuscript PDF compilation ($> 150\text{k}$ words) takes $\approx 2.8\text{s}$ to render canvas elements. | Low | 1 / 5 | Export progress indicator keeps UI responsive. | **Monitored** | E2E Part 16 |
| **DEF-03** | Command Palette | Typing `Esc` inside the search query input immediately closes the modal rather than first clearing the input text. | Low | 2 / 5 | Normal keyboard habit; modal re-opens instantly with `⌘K`. | **Preserved** | E2E Part 18 |

---

## 3. Summary Assessment

- **Total Blockers:** `0`
- **Total High Severity Issues:** `0`
- **Total Medium/Low Issues:** `3` (All non-blocking ergonomics)
- **Frozen Baseline Integrity:** `Preserved (v0.1.0-rc1)`
