use crate::error::{ProjectError, SwriteError};
use crate::planning::outline::{ItemPlanningMeta, OutlinePlanningData};
use crate::planning::timeline::TimelineData;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub async fn timeline_load(
    state: State<'_, AppState>,
) -> std::result::Result<TimelineData, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    Ok(TimelineData::load_from_project(&root))
}

#[tauri::command]
pub async fn timeline_save(
    state: State<'_, AppState>,
    timeline: TimelineData,
) -> std::result::Result<(), SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    timeline.save_to_project(&root)?;
    Ok(())
}

#[tauri::command]
pub async fn outline_meta_load(
    state: State<'_, AppState>,
) -> std::result::Result<OutlinePlanningData, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    Ok(OutlinePlanningData::load(&root))
}

#[tauri::command]
pub async fn outline_meta_save(
    state: State<'_, AppState>,
    outline: OutlinePlanningData,
) -> std::result::Result<(), SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    outline.save(&root)?;
    Ok(())
}

#[tauri::command]
pub async fn outline_meta_update_item(
    state: State<'_, AppState>,
    item: ItemPlanningMeta,
) -> std::result::Result<(), SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    let mut data = OutlinePlanningData::load(&root);
    data.update_item_meta(item);
    data.save(&root)?;
    Ok(())
}
