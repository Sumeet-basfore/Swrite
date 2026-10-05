use crate::error::{FilesystemError, Result, SwriteError};
use crate::filesystem::atomic_write::atomic_write_string;
use crate::filesystem::paths::resolve_secure_path;
use crate::recovery::snapshots::{create_snapshot, get_snapshot};
use std::path::Path;

/// Safely restores a document from a historical snapshot after taking a pre-restore safety snapshot
pub fn restore_snapshot_safe(
    project_root: &Path,
    document_id: &str,
    snapshot_id: &str,
) -> Result<String> {
    // 1. Fetch target snapshot
    let target_snap = get_snapshot(project_root, document_id, snapshot_id)?
        .ok_or_else(|| {
            SwriteError::Filesystem(FilesystemError::NotFound(format!(
                "Snapshot {} not found for document {}",
                snapshot_id, document_id
            )))
        })?;

    let doc_rel_path = &target_snap.metadata.relative_path;
    let full_doc_path = resolve_secure_path(project_root, doc_rel_path, false)?;

    // 2. Read current document content for safety snapshot
    let current_content = if full_doc_path.exists() {
        std::fs::read_to_string(&full_doc_path)
            .map_err(|e| SwriteError::Filesystem(FilesystemError::Io(e.to_string())))?
    } else {
        String::new()
    };

    // 3. Create pre-restore safety snapshot
    let safety_label = format!("Pre-restore safety snapshot before restoring {}", snapshot_id);
    create_snapshot(
        project_root,
        document_id,
        doc_rel_path,
        &current_content,
        Some(&safety_label),
    )?;

    // 4. Atomically overwrite target file on disk
    atomic_write_string(&full_doc_path, &target_snap.content)?;

    // 5. Create post-restore snapshot marking restoration
    let restore_label = format!("Restored from snapshot {}", snapshot_id);
    create_snapshot(
        project_root,
        document_id,
        doc_rel_path,
        &target_snap.content,
        Some(&restore_label),
    )?;

    Ok(target_snap.content)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::recovery::snapshots::list_snapshots;
    use tempfile::tempdir;

    #[test]
    fn test_safe_restore_flow() {
        let temp = tempdir().unwrap();
        let root = temp.path();

        let doc_rel = "Manuscript/Chapter 01.md";
        let doc_path = root.join(doc_rel);
        std::fs::create_dir_all(doc_path.parent().unwrap()).unwrap();
        std::fs::write(&doc_path, "Version 1: The starting text.").unwrap();

        // Create snapshot 1
        let snap1 = create_snapshot(root, doc_rel, doc_rel, "Version 1: The starting text.", Some("Initial")).unwrap();

        // Update document to Version 2
        std::fs::write(&doc_path, "Version 2: Substantial edits made here.").unwrap();

        // Restore snapshot 1 safely
        let restored_content = restore_snapshot_safe(root, doc_rel, &snap1.snapshot_id).unwrap();
        assert_eq!(restored_content, "Version 1: The starting text.");
        assert_eq!(std::fs::read_to_string(&doc_path).unwrap(), "Version 1: The starting text.");

        // Verify safety snapshot was created
        let snapshots = list_snapshots(root, doc_rel).unwrap();
        assert!(snapshots.iter().any(|s| s.label.as_deref().unwrap_or("").contains("Pre-restore safety snapshot")));
    }
}
