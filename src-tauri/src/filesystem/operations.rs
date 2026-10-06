use crate::error::{FilesystemError, Result, SwriteError};
use crate::filesystem::atomic_write::{atomic_write_bytes, atomic_write_string};
use crate::filesystem::hashing::{fast_content_hash, sha256_digest};
use crate::filesystem::paths::resolve_secure_path;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileMetadataInfo {
    pub relative_path: String,
    pub is_directory: bool,
    pub size_bytes: u64,
    pub modified_timestamp_ms: u64,
    pub sha256_hash: String,
    pub fast_hash: u64,
    pub is_readonly: bool,
}

/// Reads file bytes with path security enforcement.
pub fn read_file_bytes(
    project_root: &Path,
    relative_path: &str,
    allow_internal: bool,
) -> Result<Vec<u8>> {
    let full_path = resolve_secure_path(project_root, relative_path, allow_internal)?;
    if !full_path.exists() {
        return Err(SwriteError::Filesystem(FilesystemError::NotFound(
            relative_path.to_string(),
        )));
    }
    fs::read(&full_path).map_err(|e| {
        SwriteError::Filesystem(FilesystemError::Io(format!(
            "Failed to read file {}: {}",
            relative_path, e
        )))
    })
}

/// Reads a UTF-8 string with path security enforcement.
pub fn read_file_string(
    project_root: &Path,
    relative_path: &str,
    allow_internal: bool,
) -> Result<String> {
    let bytes = read_file_bytes(project_root, relative_path, allow_internal)?;
    String::from_utf8(bytes).map_err(|e| {
        SwriteError::DocumentParse(crate::error::DocumentParseError::Utf8Error(format!(
            "File {} contains invalid UTF-8: {}",
            relative_path, e
        )))
    })
}

/// Writes file atomically with path security enforcement.
pub fn write_file_atomic(
    project_root: &Path,
    relative_path: &str,
    content: &[u8],
    allow_internal: bool,
) -> Result<()> {
    let full_path = resolve_secure_path(project_root, relative_path, allow_internal)?;
    atomic_write_bytes(&full_path, content)
}

/// Writes string file atomically with path security enforcement.
pub fn write_string_atomic(
    project_root: &Path,
    relative_path: &str,
    content: &str,
    allow_internal: bool,
) -> Result<()> {
    let full_path = resolve_secure_path(project_root, relative_path, allow_internal)?;
    atomic_write_string(&full_path, content)
}

/// Creates a new file if it does not already exist.
pub fn create_file(
    project_root: &Path,
    relative_path: &str,
    initial_content: &str,
    allow_internal: bool,
) -> Result<()> {
    let full_path = resolve_secure_path(project_root, relative_path, allow_internal)?;
    if full_path.exists() {
        return Err(SwriteError::Filesystem(FilesystemError::AlreadyExists(
            relative_path.to_string(),
        )));
    }
    atomic_write_string(&full_path, initial_content)
}

/// Creates a directory hierarchy with path security enforcement.
pub fn create_directory(
    project_root: &Path,
    relative_path: &str,
    allow_internal: bool,
) -> Result<()> {
    let full_path = resolve_secure_path(project_root, relative_path, allow_internal)?;
    fs::create_dir_all(&full_path).map_err(|e| {
        SwriteError::Filesystem(FilesystemError::Io(format!(
            "Failed to create directory {}: {}",
            relative_path, e
        )))
    })
}

/// Renames a file or directory within the project.
pub fn rename_path(
    project_root: &Path,
    old_relative: &str,
    new_relative: &str,
    allow_internal: bool,
) -> Result<()> {
    let old_full = resolve_secure_path(project_root, old_relative, allow_internal)?;
    let new_full = resolve_secure_path(project_root, new_relative, allow_internal)?;

    if !old_full.exists() {
        return Err(SwriteError::Filesystem(FilesystemError::NotFound(
            old_relative.to_string(),
        )));
    }
    if new_full.exists() {
        return Err(SwriteError::Filesystem(FilesystemError::AlreadyExists(
            new_relative.to_string(),
        )));
    }

    if let Some(parent) = new_full.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| {
                SwriteError::Filesystem(FilesystemError::Io(format!(
                    "Failed to create destination folder: {}",
                    e
                )))
            })?;
        }
    }

    fs::rename(&old_full, &new_full).map_err(|e| {
        SwriteError::Filesystem(FilesystemError::Io(format!(
            "Failed to rename {} to {}: {}",
            old_relative, new_relative, e
        )))
    })
}

/// Copies a file within the project.
pub fn copy_file(
    project_root: &Path,
    source_relative: &str,
    target_relative: &str,
    allow_internal: bool,
) -> Result<()> {
    let src_full = resolve_secure_path(project_root, source_relative, allow_internal)?;
    let tgt_full = resolve_secure_path(project_root, target_relative, allow_internal)?;

    if !src_full.exists() {
        return Err(SwriteError::Filesystem(FilesystemError::NotFound(
            source_relative.to_string(),
        )));
    }

    if let Some(parent) = tgt_full.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| {
                SwriteError::Filesystem(FilesystemError::Io(format!(
                    "Failed to create destination folder: {}",
                    e
                )))
            })?;
        }
    }

    let bytes = fs::read(&src_full).map_err(|e| {
        SwriteError::Filesystem(FilesystemError::Io(format!(
            "Failed to read source {}: {}",
            source_relative, e
        )))
    })?;

    atomic_write_bytes(&tgt_full, &bytes)
}

/// Deletes a file or directory with path security enforcement.
pub fn delete_path(project_root: &Path, relative_path: &str, allow_internal: bool) -> Result<()> {
    let full_path = resolve_secure_path(project_root, relative_path, allow_internal)?;
    if !full_path.exists() {
        return Err(SwriteError::Filesystem(FilesystemError::NotFound(
            relative_path.to_string(),
        )));
    }

    if full_path.is_dir() {
        fs::remove_dir_all(&full_path).map_err(|e| {
            SwriteError::Filesystem(FilesystemError::Io(format!(
                "Failed to delete directory {}: {}",
                relative_path, e
            )))
        })
    } else {
        fs::remove_file(&full_path).map_err(|e| {
            SwriteError::Filesystem(FilesystemError::Io(format!(
                "Failed to delete file {}: {}",
                relative_path, e
            )))
        })
    }
}

/// Checks whether a relative path exists inside the project.
pub fn path_exists(project_root: &Path, relative_path: &str, allow_internal: bool) -> bool {
    if let Ok(full) = resolve_secure_path(project_root, relative_path, allow_internal) {
        full.exists()
    } else {
        false
    }
}

/// Returns metadata for a relative path inside the project.
pub fn get_metadata(
    project_root: &Path,
    relative_path: &str,
    allow_internal: bool,
) -> Result<FileMetadataInfo> {
    let full_path = resolve_secure_path(project_root, relative_path, allow_internal)?;
    if !full_path.exists() {
        return Err(SwriteError::Filesystem(FilesystemError::NotFound(
            relative_path.to_string(),
        )));
    }

    let meta = fs::metadata(&full_path).map_err(|e| {
        SwriteError::Filesystem(FilesystemError::Io(format!(
            "Failed to get metadata for {}: {}",
            relative_path, e
        )))
    })?;

    let is_dir = meta.is_dir();
    let size = if is_dir { 0 } else { meta.len() };
    let modified = meta
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);

    let (sha256, fast_h) = if is_dir {
        ("".to_string(), 0)
    } else {
        let bytes = fs::read(&full_path).unwrap_or_default();
        (sha256_digest(&bytes), fast_content_hash(&bytes))
    };

    Ok(FileMetadataInfo {
        relative_path: relative_path.to_string(),
        is_directory: is_dir,
        size_bytes: size,
        modified_timestamp_ms: modified,
        sha256_hash: sha256,
        fast_hash: fast_h,
        is_readonly: meta.permissions().readonly(),
    })
}
