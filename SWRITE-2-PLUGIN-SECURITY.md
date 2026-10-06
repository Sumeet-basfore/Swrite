# SWRITE 2 — Plugin Security Specification: Trusted Local Plugins Model

## 1. Executive Summary & Security Boundary

Swrite 2 employs a **Trusted Local Plugins** architecture. Plugins are locally installed scripts loaded exclusively from the project's local `.swrite/plugins/` directory.

Because plugins run in-process within the client's desktop JavaScript context, Swrite enforces strict defensive constraints while maintaining the performance and simplicity required for a lean, author-centric tool.

---

## 2. Threat Model: Trusted Local vs Sandboxed

### Definition of Trusted Local Plugin
- **Local Trust Level:** Plugins installed by the author are considered trusted local extensions executing in the user's local security context.
- **In-Process Runtime:** Plugins execute inside the Swrite web/desktop runtime environment through scoped `PluginContext` wrappers rather than an isolated, resource-heavy WebAssembly or OS container sandbox.
- **Zero Remote Loading:** Plugins cannot be loaded dynamically from remote URLs, CDNs, or unverified remote endpoints.

---

## 3. Defense-in-Depth Protections

Even within the trusted local model, Swrite enforces defensive boundaries to protect manuscript integrity and application stability:

1. **Path Traversal & Manifest Sanitization:**
   - Manifest IDs and entry points are strictly validated. Paths containing `..`, absolute disk paths outside `.swrite/plugins/`, or illegal filename characters are immediately rejected during discovery.
2. **Project Namespace & Storage Isolation:**
   - Plugins interact with local state through `context.storage.get()` and `context.storage.set()`, which persist solely to `.swrite/plugins/<plugin-id>/data.json`. Direct arbitrary path traversal across other project directories is prevented by the capability wrapper.
3. **Manuscript Immutability Safeguards:**
   - Plugins cannot silently or arbitrarily rewrite manuscript files on disk. Document interactions occur via explicit editor hooks and commands that integrate with Swrite's undo history and atomic save coordinator.
4. **Execution Fault Containment:**
   - Plugin lifecycle events (`activate`, `deactivate`, commands, studio switch hooks) are wrapped in defensive `try/catch` boundaries. If a plugin throws a runtime error, Swrite captures the error, logs it in the diagnostic channel, and prevents the writing studio from crashing.
5. **No Telemetry or Remote Phoning Home:**
   - Core Swrite and its standard plugin interface contain zero telemetry, remote tracking, or analytics callers.

---

## 4. Capability Model

Plugins must declare capabilities in their `manifest.json`. The host runtime validates capabilities before granting access to specific APIs:

| Capability | Permitted Action | Host Protection |
| :--- | :--- | :--- |
| `commands` | Register custom actions in the Command Palette | Clean unregistration on deactivate |
| `statusBar` | Register read-only indicators in status bar | Bounded render updates |
| `storage` | Read/write persistent JSON state | Scoped to `.swrite/plugins/<id>/data.json` |
| `editorHooks` | Listen to document switch and selection events | Read-only event payloads |

---

## 5. Security Recommendations for Authors

1. Only install plugins from known, trusted sources.
2. Inspect the plugin's source code in `.swrite/plugins/<plugin-id>/` if running third-party scripts.
3. Keep project backups enabled; Swrite's automatic snapshots and atomic writes ensure that manuscript versions remain protected.
