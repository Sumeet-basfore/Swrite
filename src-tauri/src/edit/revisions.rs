use crate::edit::comments::TextAnchor;
use crate::error::{FilesystemError, Result, SwriteError};
use crate::filesystem::atomic_write::atomic_write_bytes;
use crate::filesystem::paths::resolve_secure_path;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct RevisionNote {
    pub id: String,
    pub document_id: String,
    pub anchor: Option<TextAnchor>,
    pub title: String,
    pub description: String,
    pub category: String, // "Structure", "Plot", "Character", "Pacing", "Dialogue", "Worldbuilding", "Continuity", "Prose", "Proofreading", "General"
    pub severity: String, // "info", "minor", "important"
    pub status: String,   // "open", "resolved", "ignored"
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default, PartialEq)]
pub struct RevisionsData {
    pub revisions: Vec<RevisionNote>,
}

impl RevisionsData {
    pub fn load(project_root: &Path) -> Self {
        let path = match resolve_secure_path(project_root, ".swrite/revisions.json", true) {
            Ok(p) => p,
            Err(_) => return Self::default(),
        };

        if !path.exists() {
            return Self::default();
        }

        match std::fs::read(&path) {
            Ok(bytes) => serde_json::from_slice(&bytes).unwrap_or_default(),
            Err(_) => Self::default(),
        }
    }

    pub fn save(&self, project_root: &Path) -> Result<()> {
        let path = resolve_secure_path(project_root, ".swrite/revisions.json", true)?;
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| SwriteError::Filesystem(FilesystemError::Io(e.to_string())))?;
        }

        let json = serde_json::to_vec_pretty(self)
            .map_err(|e| SwriteError::Filesystem(FilesystemError::Io(e.to_string())))?;
        atomic_write_bytes(&path, &json)?;
        Ok(())
    }

    pub fn add_revision(&mut self, revision: RevisionNote) {
        self.revisions.push(revision);
    }

    pub fn update_revision(&mut self, updated: RevisionNote) -> bool {
        if let Some(idx) = self.revisions.iter().position(|r| r.id == updated.id) {
            self.revisions[idx] = updated;
            true
        } else {
            false
        }
    }

    pub fn set_status(&mut self, id: &str, status: &str) -> bool {
        if let Some(r) = self.revisions.iter_mut().find(|r| r.id == id) {
            r.status = status.to_string();
            r.updated_at = Utc::now();
            true
        } else {
            false
        }
    }

    pub fn delete_revision(&mut self, id: &str) -> bool {
        let initial_len = self.revisions.len();
        self.revisions.retain(|r| r.id != id);
        self.revisions.len() < initial_len
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_revisions_lifecycle() {
        let temp = tempdir().unwrap();
        let root = temp.path();

        let mut data = RevisionsData::load(root);
        assert_eq!(data.revisions.len(), 0);

        let now = Utc::now();
        let rev = RevisionNote {
            id: "rev-1".to_string(),
            document_id: "Manuscript/Chapter 02.md".to_string(),
            anchor: None,
            title: "Pacing drags in middle dialogue".to_string(),
            description: "Trim the second argument between Lucan and the envoy.".to_string(),
            category: "Pacing".to_string(),
            severity: "important".to_string(),
            status: "open".to_string(),
            created_at: now,
            updated_at: now,
        };

        data.add_revision(rev);
        data.save(root).unwrap();

        let mut loaded = RevisionsData::load(root);
        assert_eq!(loaded.revisions.len(), 1);
        assert_eq!(loaded.revisions[0].title, "Pacing drags in middle dialogue");

        assert!(loaded.set_status("rev-1", "resolved"));
        assert_eq!(loaded.revisions[0].status, "resolved");

        assert!(loaded.delete_revision("rev-1"));
        assert_eq!(loaded.revisions.len(), 0);
    }
}
