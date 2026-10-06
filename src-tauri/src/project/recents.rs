use crate::error::Result;
use crate::filesystem::atomic_write::atomic_write_string;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct RecentDocumentEntry {
    pub document_id: String,
    pub relative_path: String,
    pub last_opened_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct RecentDocumentsList {
    pub entries: Vec<RecentDocumentEntry>,
}

impl RecentDocumentsList {
    pub fn load(project_root: &Path) -> Self {
        let path = project_root.join(".swrite").join("recent_documents.json");
        if !path.exists() {
            return Self::default();
        }

        match fs::read_to_string(&path) {
            Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
            Err(_) => Self::default(),
        }
    }

    pub fn save(&self, project_root: &Path) -> Result<()> {
        let swrite_dir = project_root.join(".swrite");
        if !swrite_dir.exists() {
            fs::create_dir_all(&swrite_dir)?;
        }

        let path = swrite_dir.join("recent_documents.json");
        let json = serde_json::to_string_pretty(self)?;
        atomic_write_string(&path, &json)?;
        Ok(())
    }

    pub fn record_open(
        &mut self,
        project_root: &Path,
        document_id: &str,
        relative_path: &str,
    ) -> Result<()> {
        // Remove previous entry for this document if present
        self.entries
            .retain(|e| e.document_id != document_id && e.relative_path != relative_path);

        // Add new entry at top
        self.entries.insert(
            0,
            RecentDocumentEntry {
                document_id: document_id.to_string(),
                relative_path: relative_path.to_string(),
                last_opened_at: Utc::now().to_rfc3339(),
            },
        );

        // Keep at most 20 recent documents
        if self.entries.len() > 20 {
            self.entries.truncate(20);
        }

        self.save(project_root)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_recent_documents_recording() {
        let dir = tempdir().unwrap();
        let root = dir.path();

        let mut recents = RecentDocumentsList::load(root);
        assert_eq!(recents.entries.len(), 0);

        recents
            .record_open(root, "doc-1", "Manuscript/Chapter 01.md")
            .unwrap();
        recents
            .record_open(root, "doc-2", "Manuscript/Chapter 02.md")
            .unwrap();

        let loaded = RecentDocumentsList::load(root);
        assert_eq!(loaded.entries.len(), 2);
        assert_eq!(loaded.entries[0].document_id, "doc-2");
        assert_eq!(loaded.entries[1].document_id, "doc-1");
    }
}
