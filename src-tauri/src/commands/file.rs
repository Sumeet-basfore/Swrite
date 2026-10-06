use crate::error::{ProjectError, SwriteError};
use crate::filesystem::operations::{
    copy_file, create_directory, create_file, delete_path, get_metadata, path_exists,
    read_file_string, rename_path, write_string_atomic, FileMetadataInfo,
};
use crate::filesystem::paths::resolve_secure_path;
use crate::project::identity::IdentityManager;
use crate::project::manifest::ProjectManifest;
use crate::state::AppState;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::State;
use walkdir::WalkDir;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ImportSummary {
    pub total_found: usize,
    pub imported_count: usize,
    pub skipped_count: usize,
    pub conflict_count: usize,
    pub unsupported_count: usize,
    pub imported_files: Vec<String>,
    pub skipped_files: Vec<String>,
    pub errors: Vec<String>,
}

pub fn is_supported_document_extension(ext: &str) -> bool {
    let lower = ext.to_lowercase();
    matches!(lower.as_str(), "md" | "markdown" | "txt" | "docx")
}

pub fn is_supported_asset_extension(ext: &str) -> bool {
    let lower = ext.to_lowercase();
    matches!(lower.as_str(), "png" | "jpg" | "jpeg" | "gif" | "webp" | "svg")
}

pub fn is_ignored_file_or_dir(name: &str) -> bool {
    name.starts_with('.')
        || name.starts_with('~')
        || name.ends_with(".tmp")
        || name.ends_with(".bak")
        || name.ends_with(".swp")
        || name == "Thumbs.db"
        || name == "desktop.ini"
        || name == "node_modules"
        || name == "__pycache__"
        || name == ".swrite"
        || name == ".git"
        || name == ".vscode"
        || name == ".idea"
        || name == ".obsidian"
}

pub fn resolve_unique_target_rel(root: &Path, target_rel: &str) -> String {
    if !path_exists(root, target_rel, false) {
        return target_rel.to_string();
    }

    let p = Path::new(target_rel);
    let parent = p.parent().map(|p| p.to_string_lossy().to_string()).unwrap_or_default();
    let stem = p.file_stem().and_then(|s| s.to_str()).unwrap_or("file");
    let ext = p.extension().and_then(|e| e.to_str()).map(|e| format!(".{}", e)).unwrap_or_default();

    let mut candidate = if parent.is_empty() {
        format!("{} (Imported){}", stem, ext)
    } else {
        format!("{}/{} (Imported){}", parent, stem, ext)
    };

    let mut counter = 2;
    while path_exists(root, &candidate, false) {
        candidate = if parent.is_empty() {
            format!("{} (Imported {}){}", stem, counter, ext)
        } else {
            format!("{}/{} (Imported {}){}", parent, stem, counter, ext)
        };
        counter += 1;
    }
    candidate
}

#[tauri::command]
pub async fn file_read(
    state: State<'_, AppState>,
    relative_path: String,
) -> std::result::Result<String, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    read_file_string(&root, &relative_path, false)
}

#[tauri::command]
pub async fn file_write(
    state: State<'_, AppState>,
    relative_path: String,
    content: String,
) -> std::result::Result<(), SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    write_string_atomic(&root, &relative_path, &content, false)?;

    state
        .search_index
        .write()
        .update_document(&relative_path, &content);

    Ok(())
}

#[tauri::command]
pub async fn file_create(
    state: State<'_, AppState>,
    relative_path: String,
    initial_content: Option<String>,
) -> std::result::Result<String, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    let content = initial_content.unwrap_or_default();
    create_file(&root, &relative_path, &content, false)?;

    // Assign stable DocumentId in project manifest
    let manifest_path = root.join(".swrite").join("project.json");
    if manifest_path.exists() {
        if let Ok(manifest_str) = fs::read_to_string(&manifest_path) {
            if let Ok(mut manifest) = serde_json::from_str::<ProjectManifest>(&manifest_str) {
                let id = IdentityManager::get_or_create_id(&mut manifest, &relative_path);
                if let Ok(json) = serde_json::to_string_pretty(&manifest) {
                    let _ = fs::write(&manifest_path, json);
                }
                state
                    .search_index
                    .write()
                    .update_document(&relative_path, &content);
                return Ok(id);
            }
        }
    }

    state
        .search_index
        .write()
        .update_document(&relative_path, &content);

    Ok(relative_path)
}

#[tauri::command]
pub async fn file_mkdir(
    state: State<'_, AppState>,
    relative_path: String,
) -> std::result::Result<(), SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    create_directory(&root, &relative_path, false)
}

#[tauri::command]
pub async fn file_rename(
    state: State<'_, AppState>,
    old_relative: String,
    new_relative: String,
) -> std::result::Result<(), SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    rename_path(&root, &old_relative, &new_relative, false)?;

    // Preserve DocumentId in manifest
    let manifest_path = root.join(".swrite").join("project.json");
    if manifest_path.exists() {
        if let Ok(manifest_str) = fs::read_to_string(&manifest_path) {
            if let Ok(mut manifest) = serde_json::from_str::<ProjectManifest>(&manifest_str) {
                let existing_id = manifest
                    .document_identities
                    .iter()
                    .find(|(_, p)| *p == &old_relative)
                    .map(|(id, _)| id.clone());

                if let Some(id) = existing_id {
                    IdentityManager::update_path_for_id(&mut manifest, &id, &new_relative);
                    if let Ok(json) = serde_json::to_string_pretty(&manifest) {
                        let _ = fs::write(&manifest_path, json);
                    }
                }
            }
        }
    }

    let mut search = state.search_index.write();
    search.remove_document(&old_relative);
    let _ = search.rebuild_from_disk(&root);

    Ok(())
}

#[tauri::command]
pub async fn file_copy(
    state: State<'_, AppState>,
    source_relative: String,
    target_relative: String,
) -> std::result::Result<(), SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    copy_file(&root, &source_relative, &target_relative, false)
}

#[tauri::command]
pub async fn file_duplicate(
    state: State<'_, AppState>,
    relative_path: String,
) -> std::result::Result<String, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    let src_path = Path::new(&relative_path);
    let parent = src_path.parent().map(|p| p.to_string_lossy().to_string()).unwrap_or_default();
    let stem = src_path.file_stem().and_then(|s| s.to_str()).unwrap_or("file");
    let ext = src_path.extension().and_then(|e| e.to_str()).map(|e| format!(".{}", e)).unwrap_or_default();

    let mut candidate_rel = if parent.is_empty() {
        format!("{} copy{}", stem, ext)
    } else {
        format!("{}/{} copy{}", parent, stem, ext)
    };

    let mut counter = 2;
    while path_exists(&root, &candidate_rel, false) {
        candidate_rel = if parent.is_empty() {
            format!("{} copy {}{}", stem, counter, ext)
        } else {
            format!("{}/{} copy {}{}", parent, stem, counter, ext)
        };
        counter += 1;
    }

    copy_file(&root, &relative_path, &candidate_rel, false)?;

    // Assign fresh new DocumentId in manifest
    let manifest_path = root.join(".swrite").join("project.json");
    if manifest_path.exists() {
        if let Ok(manifest_str) = fs::read_to_string(&manifest_path) {
            if let Ok(mut manifest) = serde_json::from_str::<ProjectManifest>(&manifest_str) {
                let new_id = uuid::Uuid::new_v4().to_string();
                manifest.document_identities.insert(new_id, candidate_rel.clone());
                if let Ok(json) = serde_json::to_string_pretty(&manifest) {
                    let _ = fs::write(&manifest_path, json);
                }
            }
        }
    }

    if let Ok(content) = read_file_string(&root, &candidate_rel, false) {
        state.search_index.write().update_document(&candidate_rel, &content);
    }

    Ok(candidate_rel)
}

#[tauri::command]
pub async fn file_delete(
    state: State<'_, AppState>,
    relative_path: String,
) -> std::result::Result<(), SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    delete_path(&root, &relative_path, false)?;

    state.search_index.write().remove_document(&relative_path);

    Ok(())
}

#[tauri::command]
pub async fn file_delete_safe(
    state: State<'_, AppState>,
    relative_path: String,
) -> std::result::Result<(), SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    let src_abs = resolve_secure_path(&root, &relative_path, false)?;
    if !src_abs.exists() {
        return Ok(());
    }

    // Move to .swrite/trash/
    let trash_dir = root.join(".swrite").join("trash");
    fs::create_dir_all(&trash_dir)?;

    let timestamp = Utc::now().format("%Y%m%d_%H%M%S").to_string();
    let file_name = src_abs.file_name().and_then(|n| n.to_str()).unwrap_or("deleted");
    let trash_target = trash_dir.join(format!("{}_{}", timestamp, file_name));

    fs::rename(&src_abs, &trash_target)?;

    // Remove from manifest
    let manifest_path = root.join(".swrite").join("project.json");
    if manifest_path.exists() {
        if let Ok(manifest_str) = fs::read_to_string(&manifest_path) {
            if let Ok(mut manifest) = serde_json::from_str::<ProjectManifest>(&manifest_str) {
                manifest.document_identities.retain(|_, p| p != &relative_path);
                if let Ok(json) = serde_json::to_string_pretty(&manifest) {
                    let _ = fs::write(&manifest_path, json);
                }
            }
        }
    }

    state.search_index.write().remove_document(&relative_path);

    Ok(())
}

#[tauri::command]
pub async fn file_import(
    state: State<'_, AppState>,
    source_absolute_path: String,
    target_relative_path: String,
) -> std::result::Result<String, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    let src = Path::new(&source_absolute_path);
    if !src.exists() || !src.is_file() {
        return Err(SwriteError::Filesystem(crate::error::FilesystemError::NotFound(
            source_absolute_path,
        )));
    }

    let target_abs = resolve_secure_path(&root, &target_relative_path, false)?;
    if let Some(parent) = target_abs.parent() {
        fs::create_dir_all(parent)?;
    }

    fs::copy(src, &target_abs)?;

    // Register DocumentId
    let manifest_path = root.join(".swrite").join("project.json");
    if manifest_path.exists() {
        if let Ok(manifest_str) = fs::read_to_string(&manifest_path) {
            if let Ok(mut manifest) = serde_json::from_str::<ProjectManifest>(&manifest_str) {
                let id = uuid::Uuid::new_v4().to_string();
                manifest.document_identities.insert(id, target_relative_path.clone());
                if let Ok(json) = serde_json::to_string_pretty(&manifest) {
                    let _ = fs::write(&manifest_path, json);
                }
            }
        }
    }

    if let Ok(content) = read_file_string(&root, &target_relative_path, false) {
        state.search_index.write().update_document(&target_relative_path, &content);
    }

    Ok(target_relative_path)
}

#[tauri::command]
pub async fn file_import_batch(
    state: State<'_, AppState>,
    source_absolute_paths: Vec<String>,
    target_section: String,
    conflict_strategy: String,
) -> std::result::Result<ImportSummary, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    let mut summary = ImportSummary {
        total_found: source_absolute_paths.len(),
        imported_count: 0,
        skipped_count: 0,
        conflict_count: 0,
        unsupported_count: 0,
        imported_files: Vec::new(),
        skipped_files: Vec::new(),
        errors: Vec::new(),
    };

    let mut new_identities = Vec::new();

    for src_path_str in &source_absolute_paths {
        let src_path = Path::new(src_path_str);
        if !src_path.exists() || !src_path.is_file() {
            summary.errors.push(format!("File not found: {}", src_path_str));
            continue;
        }

        let file_name = match src_path.file_name().and_then(|n| n.to_str()) {
            Some(n) => n,
            None => {
                summary.unsupported_count += 1;
                continue;
            }
        };

        if is_ignored_file_or_dir(file_name) {
            summary.skipped_count += 1;
            summary.skipped_files.push(file_name.to_string());
            continue;
        }

        let ext = src_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();

        let is_doc = is_supported_document_extension(&ext);
        let is_asset = is_supported_asset_extension(&ext);

        if !is_doc && !is_asset {
            summary.unsupported_count += 1;
            continue;
        }

        let default_section = if target_section.is_empty() {
            if is_asset {
                "Assets"
            } else {
                "Manuscript"
            }
        } else {
            &target_section
        };

        let target_relative_raw = format!("{}/{}", default_section, file_name);

        let final_target_rel = if path_exists(&root, &target_relative_raw, false) {
            summary.conflict_count += 1;
            match conflict_strategy.as_str() {
                "skip" => {
                    summary.skipped_count += 1;
                    summary.skipped_files.push(target_relative_raw);
                    continue;
                }
                "overwrite" => target_relative_raw,
                _ => resolve_unique_target_rel(&root, &target_relative_raw),
            }
        } else {
            target_relative_raw
        };

        match resolve_secure_path(&root, &final_target_rel, false) {
            Ok(target_abs) => {
                if let Some(parent) = target_abs.parent() {
                    let _ = fs::create_dir_all(parent);
                }
                if let Err(e) = fs::copy(src_path, &target_abs) {
                    summary.errors.push(format!("Failed to copy {}: {}", file_name, e));
                    continue;
                }

                new_identities.push(final_target_rel.clone());

                if is_doc {
                    if let Ok(content) = read_file_string(&root, &final_target_rel, false) {
                        state.search_index.write().update_document(&final_target_rel, &content);
                    }
                }

                summary.imported_count += 1;
                summary.imported_files.push(final_target_rel);
            }
            Err(e) => {
                summary.errors.push(format!("Security error for {}: {}", file_name, e));
            }
        }
    }

    // Register all new identities in manifest
    let manifest_path = root.join(".swrite").join("project.json");
    if manifest_path.exists() && !new_identities.is_empty() {
        if let Ok(manifest_str) = fs::read_to_string(&manifest_path) {
            if let Ok(mut manifest) = serde_json::from_str::<ProjectManifest>(&manifest_str) {
                for rel in new_identities {
                    let id = uuid::Uuid::new_v4().to_string();
                    manifest.document_identities.insert(id, rel);
                }
                if let Ok(json) = serde_json::to_string_pretty(&manifest) {
                    let _ = fs::write(&manifest_path, json);
                }
            }
        }
    }

    Ok(summary)
}

#[tauri::command]
pub async fn folder_import_recursive(
    state: State<'_, AppState>,
    source_folder_absolute_path: String,
    target_section: String,
    conflict_strategy: String,
) -> std::result::Result<ImportSummary, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    let src_folder = Path::new(&source_folder_absolute_path);
    if !src_folder.exists() || !src_folder.is_dir() {
        return Err(SwriteError::Filesystem(crate::error::FilesystemError::NotFound(
            source_folder_absolute_path,
        )));
    }

    let mut summary = ImportSummary {
        total_found: 0,
        imported_count: 0,
        skipped_count: 0,
        conflict_count: 0,
        unsupported_count: 0,
        imported_files: Vec::new(),
        skipped_files: Vec::new(),
        errors: Vec::new(),
    };

    let mut new_identities = Vec::new();
    let default_section = if target_section.is_empty() {
        "Manuscript"
    } else {
        &target_section
    };

    let walker = WalkDir::new(src_folder).into_iter();

    for entry_res in walker.filter_entry(|e| {
        let name = e.file_name().to_string_lossy();
        !is_ignored_file_or_dir(&name)
    }) {
        let entry = match entry_res {
            Ok(e) => e,
            Err(err) => {
                summary.errors.push(format!("Walk error: {}", err));
                continue;
            }
        };

        let file_type = entry.file_type();
        if file_type.is_dir() {
            continue;
        }

        summary.total_found += 1;

        let src_path = entry.path();
        let file_name = entry.file_name().to_string_lossy();

        if is_ignored_file_or_dir(&file_name) {
            summary.skipped_count += 1;
            summary.skipped_files.push(file_name.to_string());
            continue;
        }

        let ext = src_path
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();

        let is_doc = is_supported_document_extension(&ext);
        let is_asset = is_supported_asset_extension(&ext);

        if !is_doc && !is_asset {
            summary.unsupported_count += 1;
            continue;
        }

        // Relative path inside source folder
        let rel_in_src = match src_path.strip_prefix(src_folder) {
            Ok(p) => p.to_string_lossy().replace('\\', "/"),
            Err(_) => file_name.to_string(),
        };

        let target_relative_raw = format!("{}/{}", default_section, rel_in_src);

        let final_target_rel = if path_exists(&root, &target_relative_raw, false) {
            summary.conflict_count += 1;
            match conflict_strategy.as_str() {
                "skip" => {
                    summary.skipped_count += 1;
                    summary.skipped_files.push(target_relative_raw);
                    continue;
                }
                "overwrite" => target_relative_raw,
                _ => resolve_unique_target_rel(&root, &target_relative_raw),
            }
        } else {
            target_relative_raw
        };

        match resolve_secure_path(&root, &final_target_rel, false) {
            Ok(target_abs) => {
                if let Some(parent) = target_abs.parent() {
                    let _ = fs::create_dir_all(parent);
                }
                if let Err(e) = fs::copy(src_path, &target_abs) {
                    summary.errors.push(format!("Failed to copy {}: {}", file_name, e));
                    continue;
                }

                new_identities.push(final_target_rel.clone());

                if is_doc {
                    if let Ok(content) = read_file_string(&root, &final_target_rel, false) {
                        state.search_index.write().update_document(&final_target_rel, &content);
                    }
                }

                summary.imported_count += 1;
                summary.imported_files.push(final_target_rel);
            }
            Err(e) => {
                summary.errors.push(format!("Security error for {}: {}", file_name, e));
            }
        }
    }

    // Register all new identities in manifest
    let manifest_path = root.join(".swrite").join("project.json");
    if manifest_path.exists() && !new_identities.is_empty() {
        if let Ok(manifest_str) = fs::read_to_string(&manifest_path) {
            if let Ok(mut manifest) = serde_json::from_str::<ProjectManifest>(&manifest_str) {
                for rel in new_identities {
                    let id = uuid::Uuid::new_v4().to_string();
                    manifest.document_identities.insert(id, rel);
                }
                if let Ok(json) = serde_json::to_string_pretty(&manifest) {
                    let _ = fs::write(&manifest_path, json);
                }
            }
        }
    }

    Ok(summary)
}

#[tauri::command]
pub async fn file_exists(
    state: State<'_, AppState>,
    relative_path: String,
) -> std::result::Result<bool, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    Ok(path_exists(&root, &relative_path, false))
}

#[tauri::command]
pub async fn file_metadata(
    state: State<'_, AppState>,
    relative_path: String,
) -> std::result::Result<FileMetadataInfo, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    get_metadata(&root, &relative_path, false)
}
