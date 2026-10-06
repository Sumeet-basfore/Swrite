# SWRITE 2 — Plugin Architecture Testing & Verification

## 1. Test Coverage Strategy

1. **Rust Core Tests (`src-tauri/src/plugins/`):**
   - `test_valid_manifest_validation`: Confirms manifest schema verification.
   - `test_invalid_api_version`: Rejects incompatible API versions.
   - `test_invalid_id_characters`: Rejects illegal characters in plugin IDs.
   - `test_permission_guard_check`: Verifies capability checks.
   - `test_plugin_data_store_isolation`: Verifies data confinement in `.swrite/plugins/<id>/`.
   - `test_plugin_discovery_and_state_toggle`: Verifies scanning, loading, and enabling/disabling plugins.
2. **Frontend Vitest Unit Tests (`src/plugins/__tests__/pluginManager.test.ts`):**
   - Valid plugin activation and command dispatch.
   - Failure isolation on plugin crash.
   - Permission enforcement on unauthorized capability usage.
   - Clean unloading and command removal.
3. **Reference Plugin (`plugins/examples/word-count/`):**
   - Verifies end-to-end discovery and command execution in a live project.
