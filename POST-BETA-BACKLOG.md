# Swrite — Post-Beta Feature Backlog & Prioritization Registry

**Release Baseline:** `v0.1.0-beta1`  
**Policy:** Strict Feature Freeze Active on `chore/swrite-repository-baseline`. All non-blocking requests are logged here for post-beta consideration.

---

## 1. Prioritization Framework

Every proposed capability is evaluated against:  
$$\text{User Problem} \longrightarrow \text{Existing Workaround} \longrightarrow \text{Frequency} \longrightarrow \text{Severity} \longrightarrow \text{Affected Cohort} \longrightarrow \text{Strategic Relevance}$$

---

## 2. Prioritized Feature Backlog

| Rank | Capability | User Problem Stated | Existing Workaround | Priority | Target Milestone |
| :--- | :--- | :--- | :--- | :---: | :---: |
| **1** | **Encrypted Cloud Backup & Sync** | Authors want off-site synchronization between home desktop and laptop without manual file moves. | Manual JSON / Markdown backup export. | **High** | `v0.2.0` |
| **2** | **Mobile / Tablet Responsive Drafting** | Authors want to jot down scene ideas or draft quick paragraphs on tablet or phone. | Web browser access on mobile (compact layout). | **High** | `v0.2.0` |
| **3** | **Custom Scene Break Ornaments** | Authors publishing specific genres want custom symbols (e.g. feather, sword, star) between scenes. | Choose from bundled ornaments (`* * *`, `❦`, `◆ ◆ ◆`). | **Medium** | `v0.2.1` |
| **4** | **Custom Front Matter Page Types** | Complex multi-volume epics with custom maps or family tree image inserts. | Include in chapter prose or external PDF merger. | **Medium** | `v0.2.1` |
| **5** | **Footnotes & Endnotes (Non-Fiction)** | Narrative history / essay writers needing citation references. | Margin notes and chapter synopsis notes. | **Low** | `v0.3.0` |
| **6** | **World Simulation Extension** | Complex political, resource, and faction state progression for epic worldbuilding. | External notes / manual tracking; isolated on `experiment/world-simulation`. | **Opt-In** | `Extension Roadmap` |

---

## 3. Intentionally Rejected / Deprecated Requests

- **Real-Time Collaborative Multi-Author Google-Docs Editing:** *Rejected.* Swrite is explicitly engineered as an author-first, distraction-free solo writing environment.
- **Mandatory Cloud Login:** *Rejected.* Violates Swrite's core local-first and privacy principle.
- **Autonomous AI Co-Writing / Auto-Generation:** *Rejected.* Swrite preserves human authorial agency and craft; AI remains optional, private, on-demand infrastructure.
