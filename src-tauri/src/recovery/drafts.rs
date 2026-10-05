use crate::error::{RecoveryError, Result, SwriteError};
use crate::filesystem::atomic_write::atomic_write_string;
use crate::filesystem::hashing::sha256_digest;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RecoveryDraft {
    pub document_id: String,
    pub relative_path: String,
    pub timestamp: DateTime<Utc>,
    pub content_hash: String,
    pub content: String,
}

/// Saves an in-progress recovery draft to `.swrite/recovery/<document_id>.draft`.
pub fn save_recovery_draft(
    project_root: &Path,
    document_id: &str,
    relative_path: &str,
    content: &str,
) -> Result<()> {
    let recovery_dir = project_root.join(".swrite/recovery");
    if !recovery_dir.exists() {
        fs::create_dir_all(&recovery_dir)?;
    }

    let draft = RecoveryDraft {
        document_id: document_id.to_string(),
        relative_path: relative_path.to_string(),
        timestamp: Utc::now(),
        content_hash: sha256_digest(content.as_bytes()),
        content: content.to_string(),
    };

    let draft_json = serde_json::to_string(&draft)
        .map_err(|e| SwriteError::Recovery(RecoveryError::WriteFailed(e.to_string())))?;

    let draft_path = recovery_dir.join(format!("{}.draft", document_id));
    atomic_write_string(&draft_path, &draft_json)?;

    Ok(())
}

/// Clears a recovery draft after a successful canonical file save.
pub fn clear_recovery_draft(project_root: &Path, document_id: &str) -> Result<()> {
    let draft_path = project_root
        .join(".swrite/recovery")
        .join(format!("{}.draft", document_id));
    if draft_path.exists() {
        let _ = fs::remove_file(&draft_path);
    }
    Ok(())
}

/// Lists all available recovery drafts in the project.
pub fn list_recovery_drafts(project_root: &Path) -> Result<Vec<RecoveryDraft>> {
    let recovery_dir = project_root.join(".swrite/recovery");
    if !recovery_dir.exists() {
        return Ok(Vec::new());
    }

    let mut drafts = Vec::new();
    if let Ok(entries) = fs::read_dir(recovery_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("draft") {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Ok(draft) = serde_json::from_str::<RecoveryDraft>(&content) {
                        drafts.push(draft);
                    }
                }
            }
        }
    }

    drafts.sort_by_key(|a| std::cmp::Reverse(a.timestamp));

    Ok(drafts)
}

/// Reads a specific recovery draft by document ID.
pub fn get_recovery_draft(project_root: &Path, document_id: &str) -> Result<Option<RecoveryDraft>> {
    let draft_path = project_root
        .join(".swrite/recovery")
        .join(format!("{}.draft", document_id));
    if !draft_path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&draft_path)
        .map_err(|e| SwriteError::Recovery(RecoveryError::DraftNotFound(e.to_string())))?;

    let draft = serde_json::from_str::<RecoveryDraft>(&content)
        .map_err(|e| SwriteError::Recovery(RecoveryError::DraftCorrupted(e.to_string())))?;

    Ok(Some(draft))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_draft_save_and_clear() {
        let dir = tempdir().unwrap();
        let root = dir.path();

        save_recovery_draft(root, "doc-123", "Manuscript/Scene 01.md", "Draft text").unwrap();

        let drafts = list_recovery_drafts(root).unwrap();
        assert_eq!(drafts.len(), 1);
        assert_eq!(drafts[0].content, "Draft text");

        clear_recovery_draft(root, "doc-123").unwrap();
        let drafts_after = list_recovery_drafts(root).unwrap();
        assert_eq!(drafts_after.len(), 0);
    }
}
