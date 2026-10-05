use crate::error::Result;
use crate::filesystem::atomic_write::atomic_write_string;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone, Default, PartialEq)]
pub struct ProjectUiState {
    pub last_opened_document: Option<String>,
    pub expanded_folders: Vec<String>,
    pub sidebar_collapsed: bool,
    pub last_search_scope: Option<String>,
}

impl ProjectUiState {
    pub fn load(project_root: &Path) -> Self {
        let state_path = project_root.join(".swrite").join("ui_state.json");
        if !state_path.exists() {
            return Self::default();
        }

        match fs::read_to_string(&state_path) {
            Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
            Err(_) => Self::default(),
        }
    }

    pub fn save(&self, project_root: &Path) -> Result<()> {
        let swrite_dir = project_root.join(".swrite");
        if !swrite_dir.exists() {
            fs::create_dir_all(&swrite_dir)?;
        }

        let state_path = swrite_dir.join("ui_state.json");
        let json = serde_json::to_string_pretty(self)?;
        atomic_write_string(&state_path, &json)?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_ui_state_save_and_load() {
        let dir = tempdir().unwrap();
        let root = dir.path();

        let state = ProjectUiState {
            last_opened_document: Some("Manuscript/Chapter 01.md".to_string()),
            expanded_folders: vec!["Manuscript".to_string(), "Manuscript/Act 1".to_string()],
            sidebar_collapsed: false,
            last_search_scope: Some("Manuscript".to_string()),
        };

        state.save(root).unwrap();

        let loaded = ProjectUiState::load(root);
        assert_eq!(loaded, state);
    }
}
