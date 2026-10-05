use crate::error::{ProjectError, SwriteError};
use crate::filesystem::operations::{
    copy_file, create_directory, create_file, delete_path, get_metadata, path_exists,
    read_file_string, rename_path, write_string_atomic, FileMetadataInfo,
};
use crate::state::AppState;
use tauri::State;

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
) -> std::result::Result<(), SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    let content = initial_content.unwrap_or_default();
    create_file(&root, &relative_path, &content, false)?;

    state
        .search_index
        .write()
        .update_document(&relative_path, &content);

    Ok(())
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
