# SWRITE 2 — Plugin Architecture Specification (API v1)

## 1. Philosophy & Core Principles

Plugins are extensions to Swrite 2's stable desktop core.

The plugin system must never become:
- a second application framework
- a second storage system
- a second navigation system
- a replacement for the 5-studio architecture (`WRITE`, `PLAN`, `DESK`, `EDIT`, `PUBLISH`)

Plugins add focused capabilities while strictly respecting Swrite's filesystem contracts and author privacy.

```text
               ┌───────────────────────────────┐
               │    Swrite 2 Core Desktop      │
               │ (WRITE, PLAN, DESK, EDIT, PUB)│
               └───────────────┬───────────────┘
                               │ Scoped API v1 Container
               ┌───────────────▼───────────────┐
               │         Plugin Host           │
               │   (Permissions & Sandboxing)  │
               └───────┬───────────────┬───────┘
                       │               │
       ┌───────────────▼─────┐   ┌─────▼───────────────┐
       │   Reference Plugin  │   │   Community Plugins │
       │    (word-count)     │   │   (Local .swrite/)  │
       └─────────────────────┘   └─────────────────────┘
```

---

## 2. Capability-Based Access

Plugins must explicitly declare required capabilities in their manifest. Capabilities include:

| Permission | Description |
|---|---|
| `selection.read` | Read currently selected text in the active editor canvas |
| `document.read` | Read active manuscript/desk markdown file contents |
| `document.write` | Insert or replace text in the active editor |
| `commands.register` | Register editor commands and slash commands (`/command`) |
| `panels.register` | Contribute custom reference panels in Creative Desk or Sidebar |
| `exporters.register` | Register custom publication document transformations |
| `project.read` | Inspect project file list and metadata |

---

## 3. Data Isolation

Plugin-owned data is strictly confined to `.swrite/plugins/<plugin-id>/data.json`.

Plugins never pollute:
- `Manuscript/`
- `Planning/`
- `Desk/`
- `Assets/`

---

## 4. Failure Isolation

A crash, exception, or infinite loop inside a plugin must never take down Swrite core.
- All plugin entry points run inside protected `try/catch` execution containers.
- Errors are logged to the plugin instance and displayed in the Extensions Drawer without disrupting editing, autosaving, or studio navigation.
