pub mod commands;
pub mod document;
pub mod error;
pub mod filesystem;
pub mod history;
pub mod project;
pub mod recovery;
pub mod search;
pub mod state;

use state::AppState;
use tauri::Manager;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            commands::project_create,
            commands::project_open,
            commands::project_validate,
            commands::project_close,
            commands::project_discover,
            commands::project_get_ui_state,
            commands::project_set_ui_state,
            commands::project_get_recents,
            commands::project_add_recent,
            commands::file_read,
            commands::file_write,
            commands::file_create,
            commands::file_mkdir,
            commands::file_rename,
            commands::file_copy,
            commands::file_duplicate,
            commands::file_delete,
            commands::file_delete_safe,
            commands::file_import,
            commands::file_exists,
            commands::file_metadata,
            commands::document_read,
            commands::document_write,
            commands::document_parse,
            commands::document_serialize,
            commands::recovery_save,
            commands::recovery_clear,
            commands::recovery_list,
            commands::recovery_get,
            commands::history_record,
            commands::history_list,
            commands::history_get,
            commands::search_query,
            commands::search_reindex,
            commands::watch_start,
            commands::watch_stop,
            commands::reconciliation_inspect,
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Swrite 2 core application");
}
