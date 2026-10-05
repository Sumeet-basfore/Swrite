use crate::error::{ProjectError, SwriteError};
use crate::filesystem::watcher::ProjectWatcher;
use crate::state::AppState;
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
pub async fn watch_start(
    app: AppHandle,
    state: State<'_, AppState>,
) -> std::result::Result<(), SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    let app_handle = app.clone();
    let watcher = ProjectWatcher::start(root, move |event| {
        let _ = app_handle.emit("swrite:fs-event", &event);
    })?;

    *state.watcher.write() = Some(watcher);
    Ok(())
}

#[tauri::command]
pub async fn watch_stop(state: State<'_, AppState>) -> std::result::Result<(), SwriteError> {
    if let Some(w) = state.watcher.write().take() {
        w.stop();
    }
    Ok(())
}
