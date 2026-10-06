use crate::edit::comments::{Comment, CommentsData};
use crate::edit::dictionary::ProjectDictionary;
use crate::edit::diff::{compute_line_diff, DocumentDiffResult};
use crate::edit::proofreader::{analyze_document_text, ProofreadingFinding};
use crate::edit::restore::restore_snapshot_safe;
use crate::edit::revisions::{RevisionNote, RevisionsData};
use crate::error::{ProjectError, SwriteError};
use crate::filesystem::paths::resolve_secure_path;
use crate::recovery::snapshots::get_snapshot;
use crate::state::AppState;
use tauri::State;

// Comments IPC
#[tauri::command]
pub async fn comments_load(
    state: State<'_, AppState>,
) -> std::result::Result<CommentsData, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;
    Ok(CommentsData::load(&root))
}

#[tauri::command]
pub async fn comments_save(
    state: State<'_, AppState>,
    data: CommentsData,
) -> std::result::Result<(), SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;
    data.save(&root)
}

#[tauri::command]
pub async fn comment_add(
    state: State<'_, AppState>,
    comment: Comment,
) -> std::result::Result<(), SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;
    let mut data = CommentsData::load(&root);
    data.add_comment(comment);
    data.save(&root)
}

#[tauri::command]
pub async fn comment_resolve(
    state: State<'_, AppState>,
    id: String,
) -> std::result::Result<bool, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;
    let mut data = CommentsData::load(&root);
    let ok = data.resolve_comment(&id);
    if ok {
        data.save(&root)?;
    }
    Ok(ok)
}

#[tauri::command]
pub async fn comment_delete(
    state: State<'_, AppState>,
    id: String,
) -> std::result::Result<bool, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;
    let mut data = CommentsData::load(&root);
    let ok = data.delete_comment(&id);
    if ok {
        data.save(&root)?;
    }
    Ok(ok)
}

// Revisions IPC
#[tauri::command]
pub async fn revisions_load(
    state: State<'_, AppState>,
) -> std::result::Result<RevisionsData, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;
    Ok(RevisionsData::load(&root))
}

#[tauri::command]
pub async fn revisions_save(
    state: State<'_, AppState>,
    data: RevisionsData,
) -> std::result::Result<(), SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;
    data.save(&root)
}

#[tauri::command]
pub async fn revision_add(
    state: State<'_, AppState>,
    revision: RevisionNote,
) -> std::result::Result<(), SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;
    let mut data = RevisionsData::load(&root);
    data.add_revision(revision);
    data.save(&root)
}

#[tauri::command]
pub async fn revision_update(
    state: State<'_, AppState>,
    revision: RevisionNote,
) -> std::result::Result<bool, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;
    let mut data = RevisionsData::load(&root);
    let ok = data.update_revision(revision);
    if ok {
        data.save(&root)?;
    }
    Ok(ok)
}

#[tauri::command]
pub async fn revision_delete(
    state: State<'_, AppState>,
    id: String,
) -> std::result::Result<bool, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;
    let mut data = RevisionsData::load(&root);
    let ok = data.delete_revision(&id);
    if ok {
        data.save(&root)?;
    }
    Ok(ok)
}

// Dictionary IPC
#[tauri::command]
pub async fn dictionary_load(
    state: State<'_, AppState>,
) -> std::result::Result<ProjectDictionary, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;
    Ok(ProjectDictionary::load(&root))
}

#[tauri::command]
pub async fn dictionary_add_word(
    state: State<'_, AppState>,
    word: String,
) -> std::result::Result<bool, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;
    let mut dict = ProjectDictionary::load(&root);
    let ok = dict.add_word(&word);
    if ok {
        dict.save(&root)?;
    }
    Ok(ok)
}

#[tauri::command]
pub async fn dictionary_remove_word(
    state: State<'_, AppState>,
    word: String,
) -> std::result::Result<bool, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;
    let mut dict = ProjectDictionary::load(&root);
    let ok = dict.remove_word(&word);
    if ok {
        dict.save(&root)?;
    }
    Ok(ok)
}

#[tauri::command]
pub async fn dictionary_add_ignore(
    state: State<'_, AppState>,
    finding_id: String,
) -> std::result::Result<(), SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;
    let mut dict = ProjectDictionary::load(&root);
    dict.add_ignored_finding(&finding_id);
    dict.save(&root)
}

// History Diff & Safe Restore IPC
#[tauri::command]
pub async fn history_diff_snapshots(
    state: State<'_, AppState>,
    document_id: String,
    snapshot_id_a: String,
    snapshot_id_b: String,
) -> std::result::Result<DocumentDiffResult, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    let snap_a = get_snapshot(&root, &document_id, &snapshot_id_a)?
        .ok_or_else(|| SwriteError::Filesystem(crate::error::FilesystemError::NotFound(snapshot_id_a.clone())))?;
    let snap_b = get_snapshot(&root, &document_id, &snapshot_id_b)?
        .ok_or_else(|| SwriteError::Filesystem(crate::error::FilesystemError::NotFound(snapshot_id_b.clone())))?;

    let label_a = snap_a.metadata.label.unwrap_or(snapshot_id_a);
    let label_b = snap_b.metadata.label.unwrap_or(snapshot_id_b);

    Ok(compute_line_diff(&snap_a.content, &snap_b.content, &label_a, &label_b))
}

#[tauri::command]
pub async fn history_diff_current(
    state: State<'_, AppState>,
    relative_path: String,
    snapshot_id: String,
) -> std::result::Result<DocumentDiffResult, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    let full_path = resolve_secure_path(&root, &relative_path, false)?;
    let current_content = if full_path.exists() {
        std::fs::read_to_string(&full_path).unwrap_or_default()
    } else {
        String::new()
    };

    let snap = get_snapshot(&root, &relative_path, &snapshot_id)?
        .ok_or_else(|| SwriteError::Filesystem(crate::error::FilesystemError::NotFound(snapshot_id.clone())))?;

    let snap_label = snap.metadata.label.unwrap_or(snapshot_id);

    Ok(compute_line_diff(&snap.content, &current_content, &snap_label, "Current Working Document"))
}

#[tauri::command]
pub async fn history_safe_restore(
    state: State<'_, AppState>,
    document_id: String,
    snapshot_id: String,
) -> std::result::Result<String, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;
    restore_snapshot_safe(&root, &document_id, &snapshot_id)
}

// Proofreading IPC
#[tauri::command]
pub async fn proofread_text(
    state: State<'_, AppState>,
    document_id: String,
    text: String,
) -> std::result::Result<Vec<ProofreadingFinding>, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;
    let dict = ProjectDictionary::load(&root);
    Ok(analyze_document_text(&document_id, &text, &dict))
}
