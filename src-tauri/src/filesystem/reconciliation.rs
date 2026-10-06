use crate::filesystem::hashing::sha256_digest;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum ReconciliationStatus {
    Identical,
    UserOnlyChanged,
    ExternalOnlyChanged,
    BothChangedConflict,
    DeletedOnDisk,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReconciliationResult {
    pub status: ReconciliationStatus,
    pub relative_path: String,
    pub base_hash: Option<String>,
    pub user_hash: String,
    pub disk_hash: Option<String>,
    pub conflict_details: Option<ConflictDetails>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConflictDetails {
    pub user_length: usize,
    pub disk_length: usize,
    pub message: String,
}

/// Computes a three-way reconciliation between Base, User (in-memory buffer), and Disk.
pub fn reconcile_content(
    relative_path: &str,
    base_content: Option<&str>,
    user_content: &str,
    disk_content: Option<&str>,
) -> ReconciliationResult {
    let user_hash = sha256_digest(user_content.as_bytes());
    let base_hash = base_content.map(|b| sha256_digest(b.as_bytes()));
    let disk_hash = disk_content.map(|d| sha256_digest(d.as_bytes()));

    // Case 1: Disk file was deleted externally
    if disk_content.is_none() {
        return ReconciliationResult {
            status: ReconciliationStatus::DeletedOnDisk,
            relative_path: relative_path.to_string(),
            base_hash,
            user_hash,
            disk_hash: None,
            conflict_details: Some(ConflictDetails {
                user_length: user_content.len(),
                disk_length: 0,
                message: "File was deleted externally on disk while open in editor".to_string(),
            }),
        };
    }

    // Guarded by the DeletedOnDisk early-return above; expect (not unwrap)
    // so any future reorder fails loudly at this line instead of deep in logic.
    let disk_str = disk_content.expect("reconcile_content: disk_content present after DeletedOnDisk check");
    let disk_h = disk_hash
        .clone()
        .expect("reconcile_content: disk_hash derived from present disk_content");

    // Case 2: Identical
    if user_hash == disk_h {
        return ReconciliationResult {
            status: ReconciliationStatus::Identical,
            relative_path: relative_path.to_string(),
            base_hash,
            user_hash,
            disk_hash: Some(disk_h),
            conflict_details: None,
        };
    }

    // If no base is provided, compare user directly with disk
    let base_h = match base_hash.as_ref() {
        Some(h) => h,
        None => {
            // Without base, if they differ, it is a conflict
            return ReconciliationResult {
                status: ReconciliationStatus::BothChangedConflict,
                relative_path: relative_path.to_string(),
                base_hash: None,
                user_hash,
                disk_hash: Some(disk_h),
                conflict_details: Some(ConflictDetails {
                    user_length: user_content.len(),
                    disk_length: disk_str.len(),
                    message: "Content differs from disk and no base snapshot is available"
                        .to_string(),
                }),
            };
        }
    };

    let user_changed = &user_hash != base_h;
    let disk_changed = &disk_h != base_h;

    let status = match (user_changed, disk_changed) {
        (false, false) => ReconciliationStatus::Identical,
        (true, false) => ReconciliationStatus::UserOnlyChanged,
        (false, true) => ReconciliationStatus::ExternalOnlyChanged,
        (true, true) => ReconciliationStatus::BothChangedConflict,
    };

    let conflict_details = if status == ReconciliationStatus::BothChangedConflict {
        Some(ConflictDetails {
            user_length: user_content.len(),
            disk_length: disk_str.len(),
            message: "File was modified concurrently in Swrite and externally on disk".to_string(),
        })
    } else {
        None
    };

    ReconciliationResult {
        status,
        relative_path: relative_path.to_string(),
        base_hash: base_hash.clone(),
        user_hash,
        disk_hash: Some(disk_h),
        conflict_details,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_reconcile_user_only_changed() {
        let base = "Original line";
        let user = "Original line with user addition";
        let disk = "Original line";

        let res = reconcile_content("Scene.md", Some(base), user, Some(disk));
        assert_eq!(res.status, ReconciliationStatus::UserOnlyChanged);
    }

    #[test]
    fn test_reconcile_external_only_changed() {
        let base = "Original line";
        let user = "Original line";
        let disk = "Original line with external addition";

        let res = reconcile_content("Scene.md", Some(base), user, Some(disk));
        assert_eq!(res.status, ReconciliationStatus::ExternalOnlyChanged);
    }

    #[test]
    fn test_reconcile_both_changed_conflict() {
        let base = "Original line";
        let user = "User edit";
        let disk = "External edit";

        let res = reconcile_content("Scene.md", Some(base), user, Some(disk));
        assert_eq!(res.status, ReconciliationStatus::BothChangedConflict);
        assert!(res.conflict_details.is_some());
    }
}
