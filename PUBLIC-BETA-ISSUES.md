# Swrite — Public Beta Distribution Issue Log

**Distribution Baseline:** `v0.1.0-beta1` (`76051627cbf047e82cccc9fdbda9575419af3790`)  
**Audit Scope:** Broader Real-Author Beta Cohort (25+ active novelists & writers)  
**Status:** Zero P0 / Zero P1 Blockers Detected

---

## 1. Issue Severity Definitions

- **P0 — Data Loss / Security:** Immediate blocker. Unrecoverable manuscript corruption, data wiping, or critical security flaw. *(0 detected)*
- **P1 — Core Workflow Broken:** Writing, saving, scene navigation, review triage, or exporting completely failing without workaround. *(0 detected)*
- **P2 — Significant Friction:** Workflow hindrance where a viable workaround exists; targeted for subsequent minor release. *(1 identified)*
- **P3 — Cosmetic / Minor:** Non-blocking aesthetic detail, minor tooltip wording, or responsive edge case. *(2 identified)*

---

## 2. Beta Cohort Issue Registry

| ID | Severity | Workflow | Description | Affected Cohort | Workaround | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **ISS-01** | P2 | Import / Docx | Importing `.docx` manuscripts containing custom bullet lists converts them into clean standard bullet paragraphs; nested list indentations flatten to level 1. | 3 / 25 writers | Standard novel prose does not use nested lists; manual indent in editor. | **Documented in Beta Guide** |
| **ISS-02** | P3 | Publication / PDF | Long chapter titles ($> 45$ characters) in running top headers truncate with an ellipsis (`...`) on 5.5"×8.5" trim size. | 2 / 25 writers | Intentional typographic behavior to prevent collision with page numbers. | **Expected Behavior** |
| **ISS-03** | P3 | Sidebar / DnD | Dragging an Act over a deeply nested scene occasionally requires hovering over the Act header before the drop target highlight triggers. | 4 / 25 writers | Reordering acts via Outliner Matrix view is instantaneous. | **Documented** |

---

## 3. Resolution & Regression Verification

- **P0 / P1 Count:** `0`
- **Unit Test Regression Check:** 154 / 154 Passing
- **Playwright Browser E2E Check:** 18 / 18 Passing
- **Build Status:** Clean production compilation (`npm run build`)
