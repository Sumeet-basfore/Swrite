use crate::error::{ProjectError, SwriteError};
use crate::filesystem::operations::read_file_string;
use crate::filesystem::reconciliation::{reconcile_content, ReconciliationResult};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub async fn reconciliation_inspect(
    state: State<'_, AppState>,
    relative_path: String,
    base_content: Option<String>,
    user_content: String,
) -> std::result::Result<ReconciliationResult, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    let disk_content = read_file_string(&root, &relative_path, false).ok();

    Ok(reconcile_content(
        &relative_path,
        base_content.as_deref(),
        &user_content,
        disk_content.as_deref(),
    ))
}
