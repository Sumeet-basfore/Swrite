use std::path::{Path, PathBuf};
use serde_json::Value;
use crate::error::{Result, SwriteError, ValidationError};
use crate::filesystem::atomic_write::atomic_write_bytes;

pub struct PluginDataStore;

impl PluginDataStore {
    fn get_plugin_dir(project_root: &Path, plugin_id: &str) -> PathBuf {
        project_root.join(".swrite").join("plugins").join(plugin_id)
    }

    pub fn get_data(project_root: &Path, plugin_id: &str) -> Result<Value> {
        let file_path = Self::get_plugin_dir(project_root, plugin_id).join("data.json");
        if !file_path.exists() {
            return Ok(Value::Object(serde_json::Map::new()));
        }

        let content = std::fs::read_to_string(&file_path)?;
        let val: Value = serde_json::from_str(&content)
            .map_err(|e| SwriteError::Validation(ValidationError::Failed(vec![format!("Corrupt plugin data JSON: {}", e)])))?;
        Ok(val)
    }

    pub fn set_data(project_root: &Path, plugin_id: &str, data: &Value) -> Result<()> {
        let dir = Self::get_plugin_dir(project_root, plugin_id);
        std::fs::create_dir_all(&dir)?;

        let file_path = dir.join("data.json");
        let content = serde_json::to_string_pretty(data)?;

        atomic_write_bytes(&file_path, content.as_bytes())?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use serde_json::json;

    #[test]
    fn test_plugin_data_store_isolation() {
        let tmp = TempDir::new().unwrap();
        let root = tmp.path();

        let data = json!({ "count": 42, "lastRun": "2026-10-06" });
        PluginDataStore::set_data(root, "swrite.word-count", &data).unwrap();

        let loaded = PluginDataStore::get_data(root, "swrite.word-count").unwrap();
        assert_eq!(loaded["count"], 42);

        // Different plugin gets empty object
        let other = PluginDataStore::get_data(root, "other.plugin").unwrap();
        assert_eq!(other, json!({}));
    }
}
