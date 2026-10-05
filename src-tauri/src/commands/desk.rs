use crate::desk::assets::{import_image_asset, read_asset_data_url};
use crate::desk::backlinks::scan_backlinks;
use crate::desk::moodboard::{load_moodboard, save_moodboard, MoodboardData};
use crate::error::{ProjectError, SwriteError};
use crate::state::AppState;
use std::path::Path;
use tauri::State;

#[tauri::command]
pub async fn moodboard_load(
    state: State<'_, AppState>,
    relative_path: String,
) -> std::result::Result<MoodboardData, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;
    load_moodboard(&root, &relative_path)
}

#[tauri::command]
pub async fn moodboard_save(
    state: State<'_, AppState>,
    relative_path: String,
    data: MoodboardData,
) -> std::result::Result<(), SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;
    save_moodboard(&root, &relative_path, &data)
}

#[tauri::command]
pub async fn moodboard_create(
    state: State<'_, AppState>,
    name: String,
) -> std::result::Result<String, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    let clean_name = name.trim();
    if clean_name.is_empty() {
        return Err(SwriteError::Validation(crate::error::ValidationError::Failed(
            vec!["Moodboard name cannot be empty".to_string()],
        )));
    }

    let id = format!("mb-{}", uuid::Uuid::new_v4());
    let data = MoodboardData::new(id, clean_name.to_string());
    let relative_path = format!("Desk/Moodboards/{}/board.json", clean_name);

    save_moodboard(&root, &relative_path, &data)?;
    Ok(relative_path)
}

#[tauri::command]
pub async fn asset_import(
    state: State<'_, AppState>,
    source_absolute_path: String,
    custom_name: Option<String>,
) -> std::result::Result<String, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;
    import_image_asset(
        &root,
        Path::new(&source_absolute_path),
        custom_name.as_deref(),
    )
}

#[tauri::command]
pub async fn asset_read_base64(
    state: State<'_, AppState>,
    relative_path: String,
) -> std::result::Result<String, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;
    read_asset_data_url(&root, &relative_path)
}

#[tauri::command]
pub async fn desk_scan_backlinks(
    state: State<'_, AppState>,
    target_relative_path: String,
) -> std::result::Result<Vec<String>, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;
    scan_backlinks(&root, &target_relative_path)
}
