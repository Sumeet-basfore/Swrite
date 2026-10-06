# SWRITE 2 — Plugin Permissions & Scoping

## 1. Capability Granularity

| Capability | Scope | Enforcement Point |
|---|---|---|
| `selection.read` | Reads highlighted text in editor | `context.editor.getSelectionText()` |
| `document.read` | Reads active file contents | `context.editor.getDocumentText()` |
| `document.write` | Inserts or replaces text in editor | `context.editor.insertText()`, `replaceSelection()` |
| `commands.register` | Registers global or slash commands | `context.registerCommand()` |
| `panels.register` | Contributes UI panels | `context.registerPanel()` |
| `exporters.register` | Registers document exporter hooks | `context.registerExporter()` |
| `project.read` | Inspects project file tree | Native IPC permission guard |
| `project.write` | Creates documents via official API | Native IPC permission guard |

---

## 2. Enforcement Architecture

1. **Frontend Context Shield:**
   The `PluginContext` checks the plugin's granted permissions before invoking any editor, document, or command registration method. If a permission is missing, an explicit error is raised and isolated.
2. **Backend Native Guard:**
   The Rust `PermissionGuard` checks operations at the IPC boundary to ensure no plugin can bypass frontend checks.
