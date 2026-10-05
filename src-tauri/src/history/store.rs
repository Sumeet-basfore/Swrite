use crate::error::Result;
use crate::recovery::snapshots::{
    create_snapshot, get_snapshot, list_snapshots, DocumentSnapshot, SnapshotMetadata,
};
use std::path::Path;

pub struct HistoryStore;

impl HistoryStore {
    pub fn record_save(
        project_root: &Path,
        document_id: &str,
        relative_path: &str,
        content: &str,
        label: Option<&str>,
    ) -> Result<SnapshotMetadata> {
        create_snapshot(project_root, document_id, relative_path, content, label)
    }

    pub fn list(project_root: &Path, document_id: &str) -> Result<Vec<SnapshotMetadata>> {
        list_snapshots(project_root, document_id)
    }

    pub fn get(
        project_root: &Path,
        document_id: &str,
        snapshot_id: &str,
    ) -> Result<Option<DocumentSnapshot>> {
        get_snapshot(project_root, document_id, snapshot_id)
    }
}
