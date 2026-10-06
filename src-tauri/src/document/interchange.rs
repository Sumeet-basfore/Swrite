use crate::document::model::Document;
use crate::document::parser::parse_document_bytes;
use crate::document::serializer::serialize_document_to_bytes;
use crate::document::sniff::DocumentFormat;
use crate::error::Result;
use crate::filesystem::operations::{read_file_bytes, write_file_atomic};
use std::path::Path;

/// Reads and parses a document from the project filesystem.
pub fn read_document(
    project_root: &Path,
    relative_path: &str,
    document_id: Option<String>,
) -> Result<Document> {
    let bytes = read_file_bytes(project_root, relative_path, false)?;
    let ext = Path::new(relative_path)
        .extension()
        .and_then(|e| e.to_str());
    parse_document_bytes(&bytes, ext, document_id)
}

/// Serializes and atomically writes a document to the project filesystem.
pub fn write_document(
    project_root: &Path,
    relative_path: &str,
    doc: &Document,
    format: DocumentFormat,
) -> Result<()> {
    let bytes = serialize_document_to_bytes(doc, format)?;
    write_file_atomic(project_root, relative_path, &bytes, false)
}

/// Imports document from in-memory bytes.
pub fn import_document_from_bytes(
    bytes: &[u8],
    extension: Option<&str>,
    document_id: Option<String>,
) -> Result<Document> {
    parse_document_bytes(bytes, extension, document_id)
}

/// Exports document to in-memory bytes.
pub fn export_document_to_bytes(doc: &Document, format: DocumentFormat) -> Result<Vec<u8>> {
    serialize_document_to_bytes(doc, format)
}
