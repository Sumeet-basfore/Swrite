use crate::document::interchange::{read_document, write_document};
use crate::document::model::Document;
use crate::document::parser::parse_document_string;
use crate::document::serializer::serialize_document_to_string;
use crate::document::sniff::DocumentFormat;
use crate::error::{ProjectError, SwriteError};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub async fn document_read(
    state: State<'_, AppState>,
    relative_path: String,
    document_id: Option<String>,
) -> std::result::Result<Document, SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    read_document(&root, &relative_path, document_id)
}

#[tauri::command]
pub async fn document_write(
    state: State<'_, AppState>,
    relative_path: String,
    document: Document,
    format: String,
) -> std::result::Result<(), SwriteError> {
    let root = state
        .get_active_project_root()
        .ok_or(SwriteError::Project(ProjectError::NoActiveProject))?;

    let fmt = match format.to_lowercase().as_str() {
        "txt" => DocumentFormat::PlainText,
        "docx" => DocumentFormat::Docx,
        _ => DocumentFormat::Markdown,
    };

    write_document(&root, &relative_path, &document, fmt)
}

#[tauri::command]
pub async fn document_parse(
    source: String,
    format: String,
    document_id: Option<String>,
) -> std::result::Result<Document, SwriteError> {
    let fmt = match format.to_lowercase().as_str() {
        "txt" => DocumentFormat::PlainText,
        _ => DocumentFormat::Markdown,
    };

    parse_document_string(&source, fmt, document_id)
}

#[tauri::command]
pub async fn document_serialize(
    document: Document,
    format: String,
) -> std::result::Result<String, SwriteError> {
    let fmt = match format.to_lowercase().as_str() {
        "txt" => DocumentFormat::PlainText,
        _ => DocumentFormat::Markdown,
    };

    serialize_document_to_string(&document, fmt)
}
