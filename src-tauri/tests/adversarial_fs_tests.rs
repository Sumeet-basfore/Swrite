use std::fs;
use swrite_core::error::{PathSecurityError, SwriteError};
use swrite_core::filesystem::atomic_write::atomic_write_string;
use swrite_core::filesystem::paths::resolve_secure_path;
use swrite_core::project::validation::validate_and_heal_project;
use swrite_core::project::{create_project, open_project};
use tempfile::tempdir;

#[test]
fn test_path_traversal_blocked() {
    let dir = tempdir().unwrap();
    let root = dir.path();
    create_project(root, "Security Test").unwrap();

    let malicious_paths = vec![
        "../etc/passwd",
        "../../outside.txt",
        "Manuscript/../../../secret.txt",
        "/etc/shadow",
        "Manuscript/..",
    ];

    for path in malicious_paths {
        let res = resolve_secure_path(root, path, false);
        assert!(
            res.is_err(),
            "Path '{}' should have been blocked by security jail",
            path
        );
        match res.unwrap_err() {
            SwriteError::PathSecurity(PathSecurityError::PathTraversalBlocked(_)) => {}
            other => panic!(
                "Expected PathTraversalBlocked for '{}', got {:?}",
                path, other
            ),
        }
    }
}

#[test]
fn test_internal_file_blocked_for_author_ops() {
    let dir = tempdir().unwrap();
    let root = dir.path();
    create_project(root, "Internal Security Test").unwrap();

    let forbidden_internal = vec![
        ".swrite/project.json",
        ".swrite/history/something.snapshot",
        ".git/config",
    ];

    for path in forbidden_internal {
        let res = resolve_secure_path(root, path, false);
        assert!(res.is_err());
        match res.unwrap_err() {
            SwriteError::PathSecurity(PathSecurityError::InternalFileBlocked(_)) => {}
            other => panic!(
                "Expected InternalFileBlocked for '{}', got {:?}",
                path, other
            ),
        }
    }
}

#[test]
fn test_malformed_manifest_self_heals() {
    let dir = tempdir().unwrap();
    let root = dir.path();
    create_project(root, "Healing Test").unwrap();

    let manifest_path = root.join(".swrite/project.json");
    fs::write(&manifest_path, "{ broken json...").unwrap();

    let res = open_project(root);
    assert!(
        res.is_ok(),
        "Project open should succeed despite corrupted manifest"
    );
    let summary = res.unwrap();
    assert!(!summary.project_id.is_empty());
    assert_eq!(summary.name, root.file_name().unwrap().to_str().unwrap());
}

#[test]
fn test_missing_directories_self_heal() {
    let dir = tempdir().unwrap();
    let root = dir.path();
    create_project(root, "Heal Dirs Test").unwrap();

    fs::remove_dir_all(root.join("Manuscript")).unwrap();
    fs::remove_dir_all(root.join("Assets")).unwrap();

    let report = validate_and_heal_project(root).unwrap();
    assert!(report.is_valid);
    assert!(root.join("Manuscript").exists());
    assert!(root.join("Assets").exists());
}

#[test]
fn test_atomic_write_prevents_partial_corruption() {
    let dir = tempdir().unwrap();
    let target = dir.path().join("Manuscript/Scene 01.md");

    atomic_write_string(&target, "Original safe content").unwrap();
    atomic_write_string(&target, "Updated safe content").unwrap();

    let read_back = fs::read_to_string(&target).unwrap();
    assert_eq!(read_back, "Updated safe content");
}
