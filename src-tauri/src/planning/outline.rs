use crate::error::Result;
use crate::filesystem::atomic_write::atomic_write_string;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone, Default, PartialEq)]
pub struct ItemPlanningMeta {
    pub relative_path: String,
    pub title: Option<String>,
    pub summary: Option<String>,
    pub notes: Option<String>,
    pub status: Option<String>, // "Idea", "Planned", "Drafted", "Revising", "Complete"
    pub custom_order: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default, PartialEq)]
pub struct OutlinePlanningData {
    pub items: Vec<ItemPlanningMeta>,
}

impl OutlinePlanningData {
    pub fn load(project_root: &Path) -> Self {
        let meta_file = project_root.join(".swrite").join("outline_meta.json");
        if !meta_file.exists() {
            return Self::default();
        }

        match fs::read_to_string(&meta_file) {
            Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
            Err(_) => Self::default(),
        }
    }

    pub fn save(&self, project_root: &Path) -> Result<()> {
        let swrite_dir = project_root.join(".swrite");
        if !swrite_dir.exists() {
            fs::create_dir_all(&swrite_dir)?;
        }

        let meta_file = swrite_dir.join("outline_meta.json");
        let json = serde_json::to_string_pretty(self)?;
        atomic_write_string(&meta_file, &json)?;
        Ok(())
    }

    pub fn update_item_meta(&mut self, meta: ItemPlanningMeta) {
        if let Some(existing) = self
            .items
            .iter_mut()
            .find(|i| i.relative_path == meta.relative_path)
        {
            *existing = meta;
        } else {
            self.items.push(meta);
        }
    }

    pub fn get_item_meta(&self, relative_path: &str) -> Option<ItemPlanningMeta> {
        self.items
            .iter()
            .find(|i| i.relative_path == relative_path)
            .cloned()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_outline_meta_persistence() {
        let dir = tempdir().unwrap();
        let root = dir.path();

        let mut outline = OutlinePlanningData::default();
        outline.update_item_meta(ItemPlanningMeta {
            relative_path: "Manuscript/Chapter 01.md".to_string(),
            title: Some("The Silver Key".to_string()),
            summary: Some("Julian visits observatory".to_string()),
            notes: Some("Check pacing".to_string()),
            status: Some("Drafted".to_string()),
            custom_order: Some(1),
        });

        outline.save(root).unwrap();

        let loaded = OutlinePlanningData::load(root);
        let meta = loaded.get_item_meta("Manuscript/Chapter 01.md").unwrap();
        assert_eq!(meta.title, Some("The Silver Key".to_string()));
        assert_eq!(meta.status, Some("Drafted".to_string()));
    }
}
