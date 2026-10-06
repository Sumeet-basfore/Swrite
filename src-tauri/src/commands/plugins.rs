use std::path::PathBuf;
use serde_json::Value;
use tauri::command;
use crate::error::Result;
use crate::plugins::{DiscoveredPlugin, PluginDataStore, PluginManager, PluginStateConfig};

#[command]
pub async fn plugins_discover(project_root: String) -> Result<Vec<DiscoveredPlugin>> {
    let root = PathBuf::from(project_root);
    PluginManager::discover_plugins(&root)
}

#[command]
pub async fn plugins_set_enabled(
    project_root: String,
    plugin_id: String,
    enabled: bool,
) -> Result<PluginStateConfig> {
    let root = PathBuf::from(project_root);
    PluginManager::set_plugin_enabled(&root, &plugin_id, enabled)
}

#[command]
pub async fn plugins_get_data(project_root: String, plugin_id: String) -> Result<Value> {
    let root = PathBuf::from(project_root);
    PluginDataStore::get_data(&root, &plugin_id)
}

#[command]
pub async fn plugins_set_data(
    project_root: String,
    plugin_id: String,
    data: Value,
) -> Result<bool> {
    let root = PathBuf::from(project_root);
    PluginDataStore::set_data(&root, &plugin_id, &data)?;
    Ok(true)
}
