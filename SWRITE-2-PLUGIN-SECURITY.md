# SWRITE 2 — Plugin Security Specification

## 1. Threat Model & Sandboxing

Swrite 2 treats plugin code as untrusted by default.

### Key Protections:
1. **Path Traversal Shield:** Entry paths and manifest IDs are strictly sanitized. Any path containing `..` or illegal characters is rejected immediately.
2. **Data Isolation:** Plugins can only read/write their own isolated namespace at `.swrite/plugins/<plugin-id>/data.json`.
3. **No Raw DOM / Shell Execution:** Plugins are not granted raw arbitrary node execution or unsupervised DOM replacement.
4. **Execution Containment:** Runtime exceptions are captured in local execution boundaries so a buggy plugin cannot crash the writing studio.
5. **No Network Phoning Home:** No telemetry, analytics, or background remote network connections are permitted in local plugins.
