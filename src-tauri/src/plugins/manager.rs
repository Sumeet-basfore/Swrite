use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::error::Result;
use crate::filesystem::atomic_write::atomic_write_bytes;
use super::manifest::PluginManifest;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginStateConfig {
    pub enabled_plugins: HashMap<String, bool>,
}

impl Default for PluginStateConfig {
    fn default() -> Self {
        Self {
            enabled_plugins: HashMap::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveredPlugin {
    pub manifest: PluginManifest,
    pub is_enabled: bool,
    pub directory_path: String,
    pub entry_code: Option<String>,
}

pub struct PluginManager;

impl PluginManager {
    fn get_state_file(project_root: &Path) -> PathBuf {
        project_root.join(".swrite").join("plugins_state.json")
    }

    pub fn load_state(project_root: &Path) -> PluginStateConfig {
        let state_file = Self::get_state_file(project_root);
        if !state_file.exists() {
            return PluginStateConfig::default();
        }

        match std::fs::read_to_string(&state_file) {
            Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
            Err(_) => PluginStateConfig::default(),
        }
    }

    pub fn save_state(project_root: &Path, config: &PluginStateConfig) -> Result<()> {
        let dir = project_root.join(".swrite");
        std::fs::create_dir_all(&dir)?;

        let state_file = Self::get_state_file(project_root);
        let json = serde_json::to_string_pretty(config)?;
        atomic_write_bytes(&state_file, json.as_bytes())?;
        Ok(())
    }

    pub fn discover_plugins(project_root: &Path) -> Result<Vec<DiscoveredPlugin>> {
        let state = Self::load_state(project_root);
        let mut results = Vec::new();

        // Check <project_root>/plugins/ directory
        let search_dirs = vec![
            project_root.join("plugins"),
            project_root.join(".swrite").join("installed_plugins"),
        ];

        for base_dir in search_dirs {
            if !base_dir.exists() || !base_dir.is_dir() {
                continue;
            }

            let entries = match std::fs::read_dir(&base_dir) {
                Ok(e) => e,
                Err(_) => continue,
            };

            for entry in entries.flatten() {
                let plugin_dir = entry.path();
                if !plugin_dir.is_dir() {
                    continue;
                }

                let manifest_path = plugin_dir.join("manifest.json");
                if !manifest_path.exists() {
                    continue;
                }

                match PluginManifest::load_from_file(&manifest_path) {
                    Ok(manifest) => {
                        let is_enabled = state.enabled_plugins.get(&manifest.id).copied().unwrap_or(true);
                        
                        // Load entry code if enabled
                        let entry_path = plugin_dir.join(&manifest.entry);
                        let entry_code = if is_enabled && entry_path.exists() {
                            std::fs::read_to_string(&entry_path).ok()
                        } else {
                            None
                        };

                        results.push(DiscoveredPlugin {
                            manifest,
                            is_enabled,
                            directory_path: plugin_dir.to_string_lossy().to_string(),
                            entry_code,
                        });
                    }
                    Err(e) => {
                        eprintln!("Skipping invalid plugin at {:?}: {}", manifest_path, e);
                    }
                }
            }
        }

        Ok(results)
    }

    pub fn set_plugin_enabled(project_root: &Path, plugin_id: &str, enabled: bool) -> Result<PluginStateConfig> {
        let mut state = Self::load_state(project_root);
        state.enabled_plugins.insert(plugin_id.to_string(), enabled);
        Self::save_state(project_root, &state)?;
        Ok(state)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_plugin_discovery_and_state_toggle() {
        let tmp = TempDir::new().unwrap();
        let root = tmp.path();

        let plugin_dir = root.join("plugins").join("word-count");
        std::fs::create_dir_all(&plugin_dir).unwrap();

        let manifest_content = r#"{
            "id": "swrite.word-count",
            "name": "Word Count",
            "version": "1.0.0",
            "api_version": 1,
            "entry": "index.js",
            "permissions": ["selection.read", "commands.register"]
        }"#;

        std::fs::write(plugin_dir.join("manifest.json"), manifest_content).unwrap();
        std::fs::write(plugin_dir.join("index.js"), "console.log('loaded');").unwrap();

        let discovered = PluginManager::discover_plugins(root).unwrap();
        assert_eq!(discovered.len(), 1);
        assert_eq!(discovered[0].manifest.id, "swrite.word-count");
        assert!(discovered[0].is_enabled);
        assert_eq!(discovered[0].entry_code, Some("console.log('loaded');".into()));

        // Toggle disabled
        PluginManager::set_plugin_enabled(root, "swrite.word-count", false).unwrap();
        let discovered_disabled = PluginManager::discover_plugins(root).unwrap();
        assert!(!discovered_disabled[0].is_enabled);
        assert_eq!(discovered_disabled[0].entry_code, None);
    }
}
