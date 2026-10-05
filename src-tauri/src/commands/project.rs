use crate::error::{ProjectError, SwriteError};
use crate::project::discovery::{discover_project_files, ProjectFilesystemView};
use crate::project::validation::{validate_and_heal_project, ProjectValidationReport};
use crate::project::{create_project, open_project, ProjectSummary};
use crate::state::AppState;
use std::path::Path;
use tauri::State;

#[tauri::command]
pub async fn project_create(
    state: State<'_, AppState>,
    path: String,
    name: String,
) -> std::result::Result<ProjectSummary, SwriteError> {
    let project_dir = Path::new(&path);
    let summary = create_project(project_dir, &name)?;

    *state.active_project.write() = Some(summary.clone());
    let _ = state.search_index.write().rebuild_from_disk(project_dir);

    Ok(summary)
}

#[tauri::command]
pub async fn project_open(
    state: State<'_, AppState>,
    path: String,
) -> std::result::Result<ProjectSummary, SwriteError> {
    let project_dir = Path::new(&path);
    let summary = open_project(project_dir)?;

    *state.active_project.write() = Some(summary.clone());
    let _ = state.search_index.write().rebuild_from_disk(project_dir);

    Ok(summary)
}

#[tauri::command]
pub async fn project_validate(
    path: String,
) -> std::result::Result<ProjectValidationReport, SwriteError> {
    let project_dir = Path::new(&path);
    validate_and_heal_project(project_dir)
}

#[tauri::command]
pub async fn project_close(state: State<'_, AppState>) -> std::result::Result<(), SwriteError> {
    *state.active_project.write() = None;
    if let Some(w) = state.watcher.write().take() {
        w.stop();
    }
    Ok(())
}

#[tauri::command]
pub async fn project_discover(
    state: State<'_, AppState>,
) -> std::result::Result<ProjectFilesystemView, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    discover_project_files(&root)
}
