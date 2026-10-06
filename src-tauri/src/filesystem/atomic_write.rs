use crate::error::{FilesystemError, Result, SwriteError};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::Path;
use uuid::Uuid;

/// Performs an atomic write by writing to a sibling temporary file,
/// flushing and syncing to disk, and renaming over the destination path.
pub fn atomic_write_bytes(destination: &Path, content: &[u8]) -> Result<()> {
    let parent = destination.parent().ok_or_else(|| {
        SwriteError::Filesystem(FilesystemError::Io(format!(
            "Destination has no parent directory: {}",
            destination.display()
        )))
    })?;

    // Ensure parent directory exists
    if !parent.exists() {
        fs::create_dir_all(parent).map_err(|e| {
            SwriteError::Filesystem(FilesystemError::Io(format!(
                "Failed to create parent directory {}: {}",
                parent.display(),
                e
            )))
        })?;
    }

    let file_stem = destination
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("document");

    let temp_name = format!(".{}.tmp.{}", file_stem, Uuid::new_v4());
    let temp_path = parent.join(&temp_name);

    // Write to temp file
    let write_res = (|| -> Result<()> {
        let mut file = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&temp_path)
            .map_err(|e| {
                SwriteError::Filesystem(FilesystemError::Io(format!(
                    "Failed to create temporary file {}: {}",
                    temp_path.display(),
                    e
                )))
            })?;

        file.write_all(content).map_err(|e| {
            SwriteError::Filesystem(FilesystemError::Io(format!(
                "Failed to write bytes to {}: {}",
                temp_path.display(),
                e
            )))
        })?;

        file.flush().map_err(|e| {
            SwriteError::Filesystem(FilesystemError::Io(format!(
                "Failed to flush temporary file {}: {}",
                temp_path.display(),
                e
            )))
        })?;

        file.sync_all().map_err(|e| {
            SwriteError::Filesystem(FilesystemError::Io(format!(
                "Failed to sync temporary file {}: {}",
                temp_path.display(),
                e
            )))
        })?;

        Ok(())
    })();

    if let Err(e) = write_res {
        let _ = fs::remove_file(&temp_path);
        return Err(e);
    }

    // Atomic rename
    if let Err(e) = fs::rename(&temp_path, destination) {
        let _ = fs::remove_file(&temp_path);
        return Err(SwriteError::Filesystem(FilesystemError::AtomicWriteFailed(
            format!(
                "Failed to rename temporary file {} to {}: {}",
                temp_path.display(),
                destination.display(),
                e
            ),
        )));
    }

    Ok(())
}

/// Atomically writes a UTF-8 string to the destination path.
pub fn atomic_write_string(destination: &Path, content: &str) -> Result<()> {
    atomic_write_bytes(destination, content.as_bytes())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_atomic_write_success() {
        let dir = tempdir().unwrap();
        let target = dir.path().join("Chapter 01.md");
        let content = "# Chapter 1\n\nIt was a dark and stormy night.";

        atomic_write_string(&target, content).unwrap();

        let read_back = fs::read_to_string(&target).unwrap();
        assert_eq!(read_back, content);
    }

    #[test]
    fn test_atomic_overwrite_existing() {
        let dir = tempdir().unwrap();
        let target = dir.path().join("Scene.md");

        atomic_write_string(&target, "Initial version").unwrap();
        atomic_write_string(&target, "Updated version").unwrap();

        let read_back = fs::read_to_string(&target).unwrap();
        assert_eq!(read_back, "Updated version");
    }
}
