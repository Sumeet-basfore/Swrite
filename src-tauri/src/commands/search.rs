use crate::error::{ProjectError, SwriteError};
use crate::search::SearchResult;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub async fn search_query(
    state: State<'_, AppState>,
    query: String,
) -> std::result::Result<SearchResult, SwriteError> {
    let index = state.search_index.read();
    Ok(index.search(&query))
}

#[tauri::command]
pub async fn search_reindex(state: State<'_, AppState>) -> std::result::Result<(), SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    state.search_index.write().rebuild_from_disk(&root)
}
