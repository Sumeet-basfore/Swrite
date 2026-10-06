# SWRITE 2 — Plugin Manifest Specification

## 1. Schema Overview
Every Swrite plugin must provide a valid `manifest.json` located at the root of its plugin folder:

```json
{
  "id": "swrite.word-count",
  "name": "Word Count Utility",
  "version": "1.0.0",
  "api_version": 1,
  "description": "Calculates statistics for selected text or entire document.",
  "author": "Swrite Core Team",
  "entry": "index.js",
  "permissions": [
    "selection.read",
    "commands.register"
  ]
}
```

---

## 2. Field Specifications

| Field | Type | Required | Rules & Constraints |
|---|---|---|---|
| `id` | `string` | **Yes** | 1–64 characters. Allowed chars: alphanumeric, `.`, `-`, `_`. |
| `name` | `string` | **Yes** | 1–100 characters human-readable display name. |
| `version` | `string` | **Yes** | Semver string (e.g. `1.0.0`). |
| `api_version` | `number` | **Yes** | Current supported integer: `1`. |
| `description` | `string` | No | Short explanatory text for the extensions drawer. |
| `author` | `string` | No | Author or organization name. |
| `entry` | `string` | **Yes** | Relative path to JS entry point (no `..` path traversal). |
| `permissions` | `string[]` | **Yes** | Array of explicit `PluginCapability` strings. |

---

## 3. Validation Guarantees
Manifests are validated on disk by the native Rust core (`src-tauri/src/plugins/manifest.rs`). Malformed manifests or invalid API versions are skipped and logged with descriptive warnings.
