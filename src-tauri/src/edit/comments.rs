use crate::error::{FilesystemError, Result, SwriteError};
use crate::filesystem::atomic_write::atomic_write_bytes;
use crate::filesystem::paths::resolve_secure_path;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct TextAnchor {
    pub from: usize,
    pub to: usize,
    pub text: String,
    pub context_before: Option<String>,
    pub context_after: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct Comment {
    pub id: String,
    pub document_id: String,
    pub anchor: TextAnchor,
    pub body: String,
    pub parent_id: Option<String>,
    pub status: String, // "open" | "resolved"
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default, PartialEq)]
pub struct CommentsData {
    pub comments: Vec<Comment>,
}

impl CommentsData {
    pub fn load(project_root: &Path) -> Self {
        let path = match resolve_secure_path(project_root, ".swrite/comments.json", true) {
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
        let path = resolve_secure_path(project_root, ".swrite/comments.json", true)?;
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| SwriteError::Filesystem(FilesystemError::Io(e.to_string())))?;
        }

        let json = serde_json::to_vec_pretty(self)
            .map_err(|e| SwriteError::Filesystem(FilesystemError::Io(e.to_string())))?;
        atomic_write_bytes(&path, &json)?;
        Ok(())
    }

    pub fn add_comment(&mut self, comment: Comment) {
        self.comments.push(comment);
    }

    pub fn resolve_comment(&mut self, id: &str) -> bool {
        if let Some(c) = self.comments.iter_mut().find(|c| c.id == id) {
            c.status = "resolved".to_string();
            c.updated_at = Utc::now();
            true
        } else {
            false
        }
    }

    pub fn reopen_comment(&mut self, id: &str) -> bool {
        if let Some(c) = self.comments.iter_mut().find(|c| c.id == id) {
            c.status = "open".to_string();
            c.updated_at = Utc::now();
            true
        } else {
            false
        }
    }

    pub fn delete_comment(&mut self, id: &str) -> bool {
        let initial_len = self.comments.len();
        self.comments.retain(|c| c.id != id && c.parent_id.as_deref() != Some(id));
        self.comments.len() < initial_len
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_comments_lifecycle() {
        let temp = tempdir().unwrap();
        let root = temp.path();

        let mut data = CommentsData::load(root);
        assert_eq!(data.comments.len(), 0);

        let now = Utc::now();
        let comment = Comment {
            id: "cmt-1".to_string(),
            document_id: "Manuscript/Chapter 01.md".to_string(),
            anchor: TextAnchor {
                from: 10,
                to: 25,
                text: "ancient citadel".to_string(),
                context_before: Some("stood the ".to_string()),
                context_after: Some(" in ruins".to_string()),
            },
            body: "Is the citadel named earlier in chapter 0? Check continuity.".to_string(),
            parent_id: None,
            status: "open".to_string(),
            created_at: now,
            updated_at: now,
        };

        data.add_comment(comment.clone());
        data.save(root).unwrap();

        let mut loaded = CommentsData::load(root);
        assert_eq!(loaded.comments.len(), 1);
        assert_eq!(loaded.comments[0].body, comment.body);

        // Resolve
        assert!(loaded.resolve_comment("cmt-1"));
        assert_eq!(loaded.comments[0].status, "resolved");

        // Reopen
        assert!(loaded.reopen_comment("cmt-1"));
        assert_eq!(loaded.comments[0].status, "open");

        // Delete
        assert!(loaded.delete_comment("cmt-1"));
        assert_eq!(loaded.comments.len(), 0);
    }
}
