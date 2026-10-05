use crate::document::docx::export_docx;
use crate::document::markdown::serialize_markdown;
use crate::document::model::Document;
use crate::document::sniff::DocumentFormat;
use crate::document::txt::serialize_txt;
use crate::error::Result;

/// Serializes a `Document` AST to text string.
pub fn serialize_document_to_string(doc: &Document, format: DocumentFormat) -> Result<String> {
    match format {
        DocumentFormat::Markdown => Ok(serialize_markdown(doc)),
        DocumentFormat::PlainText => Ok(serialize_txt(doc)),
        _ => Ok(serialize_markdown(doc)),
    }
}

/// Serializes a `Document` AST to binary bytes (supports Markdown, TXT, DOCX).
pub fn serialize_document_to_bytes(doc: &Document, format: DocumentFormat) -> Result<Vec<u8>> {
    match format {
        DocumentFormat::Docx => export_docx(doc),
        DocumentFormat::Markdown => Ok(serialize_markdown(doc).into_bytes()),
        DocumentFormat::PlainText => Ok(serialize_txt(doc).into_bytes()),
        DocumentFormat::BinaryUnknown => Ok(serialize_markdown(doc).into_bytes()),
    }
}
