# SWRITE 2 — Plugin Lifecycle Specification

## 1. Lifecycle States

```text
  [Discovered]
       ↓
  [Validated] ──(Invalid)──► [Skipped]
       ↓
  [Permission Check]
       ↓
  [Loaded] ──(Error)──► [Error State]
       ↓
  [Active]
       │
  (Toggle Off / Unload)
       ↓
  [Disabled / Unloaded]
```

---

## 2. Dynamic Enable/Disable & Unload

- **Dynamic State Toggle:**
  When a user toggles a plugin off in the Extensions Drawer, the plugin's registered commands and panels are removed from the active editor runtime immediately without requiring an application restart.
- **Project Persistence:**
  Enabled/disabled state is recorded in `.swrite/plugins_state.json`.
- **Zero Pollution:**
  Disabling or uninstalling a plugin leaves manuscript documents, notes, and moodboards 100% intact.
