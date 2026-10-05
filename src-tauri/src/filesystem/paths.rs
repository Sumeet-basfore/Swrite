use crate::error::{PathSecurityError, Result, SwriteError};
use std::path::{Component, Path, PathBuf};

/// Validates and resolves a relative path strictly within the project root.
/// Prevents directory traversal (`..`), absolute paths, and symlink escapes.
pub fn resolve_secure_path(
    project_root: &Path,
    relative_path: &str,
    allow_internal: bool,
) -> Result<PathBuf> {
    let clean_rel = relative_path.trim().replace('\\', "/");
    let rel_path = Path::new(&clean_rel);

    // Reject absolute paths
    if rel_path.is_absolute() {
        return Err(SwriteError::PathSecurity(
            PathSecurityError::PathTraversalBlocked(format!(
                "Absolute paths are not allowed: {}",
                relative_path
            )),
        ));
    }

    // Inspect components for forbidden elements
    for comp in rel_path.components() {
        match comp {
            Component::ParentDir => {
                return Err(SwriteError::PathSecurity(
                    PathSecurityError::PathTraversalBlocked(format!(
                        "Parent directory traversal ('..') is blocked: {}",
                        relative_path
                    )),
                ));
            }
            Component::Prefix(_) | Component::RootDir => {
                return Err(SwriteError::PathSecurity(
                    PathSecurityError::PathTraversalBlocked(format!(
                        "Root directory or drive prefix is blocked: {}",
                        relative_path
                    )),
                ));
            }
            Component::Normal(os_str) => {
                let name = os_str.to_string_lossy();
                if !allow_internal && is_hidden_or_internal(&name) {
                    return Err(SwriteError::PathSecurity(
                        PathSecurityError::InternalFileBlocked(format!(
                            "Access to internal/hidden file blocked: {}",
                            name
                        )),
                    ));
                }
            }
            Component::CurDir => {}
        }
    }

    let target_path = project_root.join(rel_path);

    // If target exists, canonicalize both and verify that target_path starts with canonical project_root
    if target_path.exists() {
        let canonical_root = project_root.canonicalize().map_err(|e| {
            SwriteError::PathSecurity(PathSecurityError::PathTraversalBlocked(format!(
                "Cannot canonicalize project root: {}",
                e
            )))
        })?;

        let canonical_target = target_path.canonicalize().map_err(|e| {
            SwriteError::PathSecurity(PathSecurityError::PathTraversalBlocked(format!(
                "Cannot canonicalize target path: {}",
                e
            )))
        })?;

        if !canonical_target.starts_with(&canonical_root) {
            return Err(SwriteError::PathSecurity(
                PathSecurityError::SymlinkEscapeBlocked(format!(
                    "Resolved path escapes project root: {}",
                    canonical_target.display()
                )),
            ));
        }
    } else {
        // If target doesn't exist yet, check its existing parent ancestor
        let mut ancestor = target_path.parent();
        while let Some(parent) = ancestor {
            if parent.exists() {
                let canonical_root = project_root.canonicalize().map_err(|e| {
                    SwriteError::PathSecurity(PathSecurityError::PathTraversalBlocked(format!(
                        "Cannot canonicalize project root: {}",
                        e
                    )))
                })?;
                let canonical_parent = parent.canonicalize().map_err(|e| {
                    SwriteError::PathSecurity(PathSecurityError::PathTraversalBlocked(format!(
                        "Cannot canonicalize parent path: {}",
                        e
                    )))
                })?;
                if !canonical_parent.starts_with(&canonical_root) {
                    return Err(SwriteError::PathSecurity(
                        PathSecurityError::SymlinkEscapeBlocked(format!(
                            "Parent path escapes project root: {}",
                            canonical_parent.display()
                        )),
                    ));
                }
                break;
            }
            ancestor = parent.parent();
        }
    }

    Ok(target_path)
}

/// Checks if a file or directory name is considered hidden or internal.
pub fn is_hidden_or_internal(name: &str) -> bool {
    name.starts_with('.') || name == "node_modules" || name == "target"
}

/// Converts a path to a normalized, forward-slash relative path against project_root.
pub fn to_relative_path_string(project_root: &Path, full_path: &Path) -> Result<String> {
    let rel = full_path.strip_prefix(project_root).map_err(|_| {
        SwriteError::PathSecurity(PathSecurityError::PathTraversalBlocked(format!(
            "Path {} is not inside project root {}",
            full_path.display(),
            project_root.display()
        )))
    })?;

    let normalized = rel
        .components()
        .map(|c| c.as_os_str().to_string_lossy())
        .collect::<Vec<_>>()
        .join("/");

    Ok(normalized)
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_rejects_parent_traversal() {
        let dir = tempdir().unwrap();
        let res = resolve_secure_path(dir.path(), "../etc/passwd", false);
        assert!(res.is_err());
    }

    #[test]
    fn test_rejects_internal_file_when_not_allowed() {
        let dir = tempdir().unwrap();
        let res = resolve_secure_path(dir.path(), ".swrite/project.json", false);
        assert!(res.is_err());

        let res_allowed = resolve_secure_path(dir.path(), ".swrite/project.json", true);
        assert!(res_allowed.is_ok());
    }

    #[test]
    fn test_allows_valid_manuscript_path() {
        let dir = tempdir().unwrap();
        let res = resolve_secure_path(dir.path(), "Manuscript/Chapter 01/Scene 01.md", false);
        assert!(res.is_ok());
        assert_eq!(
            res.unwrap(),
            dir.path().join("Manuscript/Chapter 01/Scene 01.md")
        );
    }
}
