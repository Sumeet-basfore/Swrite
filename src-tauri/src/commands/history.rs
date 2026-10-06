use crate::error::{ProjectError, SwriteError};
use crate::history::HistoryStore;
use crate::recovery::snapshots::{DocumentSnapshot, SnapshotMetadata};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub async fn history_record(
    state: State<'_, AppState>,
    document_id: String,
    relative_path: String,
    content: String,
    label: Option<String>,
) -> std::result::Result<SnapshotMetadata, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    HistoryStore::record_save(
        &root,
        &document_id,
        &relative_path,
        &content,
        label.as_deref(),
    )
}

#[tauri::command]
pub async fn history_list(
    state: State<'_, AppState>,
    document_id: String,
) -> std::result::Result<Vec<SnapshotMetadata>, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    HistoryStore::list(&root, &document_id)
}

#[tauri::command]
pub async fn history_get(
    state: State<'_, AppState>,
    document_id: String,
    snapshot_id: String,
) -> std::result::Result<Option<DocumentSnapshot>, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    HistoryStore::get(&root, &document_id, &snapshot_id)
}
