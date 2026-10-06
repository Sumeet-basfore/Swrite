# SWRITE 2 — Planning Persistence Specification
Document Version: 2.0.0-alpha.1
Status: Canonical
Date: 2026-10-06

---

## 1. Storage Locations & Policies

| Planning Domain | Location | Format | Durability & Atomic Writes |
|---|---|---|---|
| **Story Timeline** | `Planning/Timeline.md` | Human-Readable Markdown | Atomic Write (`.tmp` $\to$ `rename`), Watcher Safe |
| **Outline Metadata** | `.swrite/outline_meta.json` | JSON | Atomic Write (`.tmp` $\to$ `rename`), Safe Internal Jail |
| **Planning Notes** | `Planning/*.md` | Standard Markdown | Canonical File Engine |

---

## 2. IPC Boundary Commands

```rust
#[tauri::command]
pub async fn timeline_load(state: State<'_, AppState>) -> Result<TimelineData, String>;

#[tauri::command]
pub async fn timeline_save(state: State<'_, AppState>, timeline: TimelineData) -> Result<(), String>;

#[tauri::command]
pub async fn outline_meta_load(state: State<'_, AppState>) -> Result<OutlinePlanningData, String>;

#[tauri::command]
pub async fn outline_meta_save(state: State<'_, AppState>, outline: OutlinePlanningData) -> Result<(), String>;

#[tauri::command]
pub async fn outline_meta_update_item(state: State<'_, AppState>, item: ItemPlanningMeta) -> Result<(), String>;
```
