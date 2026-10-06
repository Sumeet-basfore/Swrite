# SWRITE 2 — Plugin API Specification (API v1)

## 1. Entry Point Structure
Plugins define an `activate(context)` function and an optional `deactivate()` function:

```javascript
function activate(context) {
  context.registerCommand({
    id: 'count-words',
    name: 'Count Words',
    description: 'Calculates word count of current selection',
    slashTrigger: 'wordcount',
    execute: async () => {
      const text = context.editor.getSelectionText();
      const count = text.trim() ? text.trim().split(/\s+/).length : 0;
      await context.storage.set({ lastCount: count });
    }
  });
}

function deactivate() {
  // Cleanup logic
}
```

---

## 2. Scoped Context Interface

- `context.manifest`: Read-only plugin manifest.
- `context.hasPermission(capability)`: Returns boolean permission state.
- `context.registerCommand(command)`: Namespaces and registers a command.
- `context.registerPanel(panel)`: Registers a lightweight panel component.
- `context.editor`:
  - `getSelectionText()`
  - `insertText(text)`
  - `replaceSelection(text)`
- `context.storage`:
  - `get()`: Reads isolated JSON data from `.swrite/plugins/<plugin-id>/data.json`.
  - `set(data)`: Persists isolated JSON data atomically.
- `context.logger`:
  - `log(...)`, `warn(...)`, `error(...)` prefixed with plugin namespace.
