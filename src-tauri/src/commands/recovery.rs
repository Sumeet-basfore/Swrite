use crate::error::{ProjectError, SwriteError};
use crate::recovery::drafts::{
    clear_recovery_draft, get_recovery_draft, list_recovery_drafts, save_recovery_draft,
    RecoveryDraft,
};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub async fn recovery_save(
    state: State<'_, AppState>,
    document_id: String,
    relative_path: String,
    content: String,
) -> std::result::Result<(), SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    save_recovery_draft(&root, &document_id, &relative_path, &content)
}

#[tauri::command]
pub async fn recovery_clear(
    state: State<'_, AppState>,
    document_id: String,
) -> std::result::Result<(), SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    clear_recovery_draft(&root, &document_id)
}

#[tauri::command]
pub async fn recovery_list(
    state: State<'_, AppState>,
) -> std::result::Result<Vec<RecoveryDraft>, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    list_recovery_drafts(&root)
}

#[tauri::command]
pub async fn recovery_get(
    state: State<'_, AppState>,
    document_id: String,
) -> std::result::Result<Option<RecoveryDraft>, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    get_recovery_draft(&root, &document_id)
}
