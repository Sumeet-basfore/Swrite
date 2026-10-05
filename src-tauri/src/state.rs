use crate::filesystem::watcher::ProjectWatcher;
use crate::project::ProjectSummary;
use crate::search::EphemeralSearchIndex;
use parking_lot::RwLock;
use std::path::PathBuf;
use std::sync::Arc;

pub struct AppState {
    pub active_project: Arc<RwLock<Option<ProjectSummary>>>,
    pub watcher: Arc<RwLock<Option<ProjectWatcher>>>,
    pub search_index: Arc<RwLock<EphemeralSearchIndex>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            active_project: Arc::new(RwLock::new(None)),
            watcher: Arc::new(RwLock::new(None)),
            search_index: Arc::new(RwLock::new(EphemeralSearchIndex::new())),
        }
    }

    pub fn get_active_project_root(&self) -> Option<PathBuf> {
        self.active_project
            .read()
            .as_ref()
            .map(|p| PathBuf::from(&p.root_path))
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
