use crate::error::{FilesystemError, Result, SwriteError, ValidationError};
use crate::filesystem::paths::resolve_secure_path;
use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use std::path::Path;

/// Allowed image extensions for Swrite Assets
pub const ALLOWED_IMAGE_EXTENSIONS: &[&str] = &["jpg", "jpeg", "png", "webp", "svg", "gif"];

pub fn validate_image_extension(ext: &str) -> bool {
    ALLOWED_IMAGE_EXTENSIONS.contains(&ext.to_lowercase().as_str())
}

/// Import an external image into Assets/Images/ safely with conflict resolution
pub fn import_image_asset(
    project_root: &Path,
    source_absolute_path: &Path,
    custom_filename: Option<&str>,
) -> Result<String> {
    if !source_absolute_path.exists() {
        return Err(SwriteError::Filesystem(FilesystemError::NotFound(
            source_absolute_path.display().to_string(),
        )));
    }

    let ext = source_absolute_path
        .extension()
        .and_then(|e| e.to_str())
        .ok_or_else(|| {
            SwriteError::Validation(ValidationError::Failed(vec![
                "Asset has no file extension".to_string(),
            ]))
        })?
        .to_lowercase();

    if !validate_image_extension(&ext) {
        return Err(SwriteError::Validation(ValidationError::Failed(vec![
            format!(
                "Unsupported image format '.{}'. Allowed: {:?}",
                ext, ALLOWED_IMAGE_EXTENSIONS
            ),
        ])));
    }

    let base_name = if let Some(custom) = custom_filename {
        custom.trim().to_string()
    } else {
        source_absolute_path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("image")
            .to_string()
    };

    let target_dir = project_root.join("Assets").join("Images");
    std::fs::create_dir_all(&target_dir)
        .map_err(|e| SwriteError::Filesystem(FilesystemError::Io(e.to_string())))?;

    // Determine unique filename
    let mut candidate_name = format!("{}.{}", base_name, ext);
    let mut counter = 1;
    while target_dir.join(&candidate_name).exists() {
        candidate_name = format!("{}_{}.{}", base_name, counter, ext);
        counter += 1;
    }

    let target_path = target_dir.join(&candidate_name);
    std::fs::copy(source_absolute_path, &target_path)
        .map_err(|e| SwriteError::Filesystem(FilesystemError::Io(e.to_string())))?;

    let relative_path = format!("Assets/Images/{}", candidate_name);
    Ok(relative_path)
}

/// Read an image asset as a Base64 data URL for webview rendering
pub fn read_asset_data_url(project_root: &Path, relative_path: &str) -> Result<String> {
    let full_path = resolve_secure_path(project_root, relative_path, false)?;
    if !full_path.exists() {
        return Err(SwriteError::Filesystem(FilesystemError::NotFound(
            relative_path.to_string(),
        )));
    }

    let ext = full_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png")
        .to_lowercase();

    let mime_type = match ext.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "webp" => "image/webp",
        "svg" => "image/svg+xml",
        "gif" => "image/gif",
        _ => "application/octet-stream",
    };

    let bytes = std::fs::read(&full_path)
        .map_err(|e| SwriteError::Filesystem(FilesystemError::Io(e.to_string())))?;
    let encoded = BASE64.encode(&bytes);

    Ok(format!("data:{};base64,{}", mime_type, encoded))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_asset_import_and_unique_resolution() {
        let temp = tempdir().unwrap();
        let root = temp.path();

        let source_dir = tempdir().unwrap();
        let src_file = source_dir.path().join("castle.png");
        fs::write(&src_file, b"fake-png-bytes").unwrap();

        let rel1 = import_image_asset(root, &src_file, None).unwrap();
        assert_eq!(rel1, "Assets/Images/castle.png");
        assert!(root.join(&rel1).exists());

        // Import again - should get castle_1.png
        let rel2 = import_image_asset(root, &src_file, None).unwrap();
        assert_eq!(rel2, "Assets/Images/castle_1.png");
        assert!(root.join(&rel2).exists());

        // Read base64 data URL
        let data_url = read_asset_data_url(root, &rel1).unwrap();
        assert!(data_url.starts_with("data:image/png;base64,"));
    }
}
