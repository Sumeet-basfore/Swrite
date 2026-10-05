use crate::error::Result;
use crate::filesystem::atomic_write::atomic_write_string;
use crate::filesystem::hashing::sha256_digest;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SnapshotMetadata {
    pub snapshot_id: String,
    pub document_id: String,
    pub relative_path: String,
    pub timestamp: DateTime<Utc>,
    pub content_hash: String,
    pub label: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DocumentSnapshot {
    pub metadata: SnapshotMetadata,
    pub content: String,
}

/// Creates a local history snapshot in `.swrite/history/<document_id>/<snapshot_id>.snapshot`.
pub fn create_snapshot(
    project_root: &Path,
    document_id: &str,
    relative_path: &str,
    content: &str,
    label: Option<&str>,
) -> Result<SnapshotMetadata> {
    let doc_history_dir = project_root.join(".swrite/history").join(document_id);
    if !doc_history_dir.exists() {
        fs::create_dir_all(&doc_history_dir)?;
    }

    let now = Utc::now();
    let hash = sha256_digest(content.as_bytes());
    let snapshot_id = format!("{}_{}", now.timestamp_millis(), &hash[..8]);

    let meta = SnapshotMetadata {
        snapshot_id: snapshot_id.clone(),
        document_id: document_id.to_string(),
        relative_path: relative_path.to_string(),
        timestamp: now,
        content_hash: hash,
        label: label.map(|l| l.to_string()),
    };

    let snapshot = DocumentSnapshot {
        metadata: meta.clone(),
        content: content.to_string(),
    };

    let json = serde_json::to_string(&snapshot).unwrap_or_default();
    let snapshot_file = doc_history_dir.join(format!("{}.snapshot", snapshot_id));
    atomic_write_string(&snapshot_file, &json)?;

    Ok(meta)
}

/// Lists all snapshots for a given document.
pub fn list_snapshots(project_root: &Path, document_id: &str) -> Result<Vec<SnapshotMetadata>> {
    let doc_history_dir = project_root.join(".swrite/history").join(document_id);
    if !doc_history_dir.exists() {
        return Ok(Vec::new());
    }

    let mut list = Vec::new();
    if let Ok(entries) = fs::read_dir(doc_history_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.extension().and_then(|e| e.to_str()) == Some("snapshot") {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Ok(snap) = serde_json::from_str::<DocumentSnapshot>(&content) {
                        list.push(snap.metadata);
                    }
                }
            }
        }
    }

    list.sort_by_key(|a| std::cmp::Reverse(a.timestamp));
    Ok(list)
}

/// Retrieves a specific snapshot by document ID and snapshot ID.
pub fn get_snapshot(
    project_root: &Path,
    document_id: &str,
    snapshot_id: &str,
) -> Result<Option<DocumentSnapshot>> {
    let snapshot_file = project_root
        .join(".swrite/history")
        .join(document_id)
        .join(format!("{}.snapshot", snapshot_id));

    if !snapshot_file.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&snapshot_file)?;
    let snapshot = serde_json::from_str::<DocumentSnapshot>(&content).ok();
    Ok(snapshot)
}
