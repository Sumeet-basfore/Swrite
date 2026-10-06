# SWRITE 2 — Creative Desk Specification
Document Version: 2.0.0-alpha.1
Status: Canonical
Date: 2026-10-06

---

## 1. Vision & Architecture

The **Creative Desk** (`DESK` mode, shortcut `Mod+3`) is the narrative author's quiet, flexible digital desk for all supporting story material that surrounds the manuscript:

- Freeform thoughts, ideas, and scratch material (`Desk/Notes/`)
- Character profiles & sketches (`Desk/Characters/`)
- Location, atmosphere & setting documents (`Desk/Locations/`)
- Worldbuilding, magic, kingdoms & lore (`Desk/World/`)
- Research & historical background (`Desk/Research/`)
- Visual inspiration & freeform moodboards (`Desk/Moodboards/`)
- Visual project assets (`Assets/Images/`)

### 1.1 Core Principles

1. **Filesystem Grounding**: All user-visible notes remain human-readable Markdown files directly under `Desk/` on disk.
2. **Zero Rigidity**: No mandatory entity-attribute databases, no complex schema requirements. An author can write `World idea.md` and move on.
3. **Manuscript Integration & Split View**: Desk documents can be opened side-by-side with the manuscript in a distraction-free resizable split view.
4. **Distraction-Free Ergonomics**: Studio mode switcher (`Mod+1` Write, `Mod+2` Plan, `Mod+3` Desk) preserves in-memory editor state and scroll positions.

---

## 2. Studio Layout & Navigation

```text
┌──────────────────────────────────────────────────────────────┐
│ SWRITE  Project     [ Write | Plan | Desk ]   Search   Split │
├──────────────────────┬───────────────────────────────────────┤
│ CREATIVE DESK        │  [ Search desk items... ]   [ + New ] │
│                      ├───────────────────────────────────────┤
│ All Supporting (12)  │                                       │
│ Freeform Notes (3)   │   [Character Card]  [Location Card]   │
│ Characters (4)       │                                       │
│ Locations (2)        │   [World Note Card] [Moodboard Card]  │
│ Worldbuilding (1)    │                                       │
│ Research (1)         │   [Image Card]      [Note Card]       │
│ Moodboards (1)       │                                       │
│ Image Assets (2)     │                                       │
└──────────────────────┴───────────────────────────────────────┘
```

1. **Category Navigation**: Filter instantly by `All`, `Notes`, `Characters`, `Locations`, `World`, `Research`, `Moodboards`, or `Assets`.
2. **Dual View Modes**:
   - **Grid Card View**: Visual cards with category badges, paths, file sizes, and quick actions (Open, Split View, Inspect Backlinks, Delete).
   - **List Table View**: Structured row-based list for dense file management.
3. **Backlinks Drawer**: Sliding side drawer displaying all manuscript and planning files that reference the active document (e.g. `[[Lucan]]` or `Desk/Characters/Lucan.md`).
