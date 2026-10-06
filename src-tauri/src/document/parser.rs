use crate::document::docx::import_docx;
use crate::document::markdown::parse_markdown;
use crate::document::model::Document;
use crate::document::sniff::{sniff_format, DocumentFormat};
use crate::document::txt::parse_txt;
use crate::error::{DocumentParseError, Result, SwriteError};

/// Unified parser dispatching to appropriate format parser based on format sniffing.
pub fn parse_document_bytes(
    bytes: &[u8],
    extension: Option<&str>,
    document_id: Option<String>,
) -> Result<Document> {
    let format = sniff_format(bytes, extension);
    match format {
        DocumentFormat::Markdown => {
            let text = std::str::from_utf8(bytes).map_err(|e| {
                SwriteError::DocumentParse(DocumentParseError::Utf8Error(e.to_string()))
            })?;
            parse_markdown(text, document_id)
        }
        DocumentFormat::PlainText => {
            let text = std::str::from_utf8(bytes).map_err(|e| {
                SwriteError::DocumentParse(DocumentParseError::Utf8Error(e.to_string()))
            })?;
            parse_txt(text, document_id)
        }
        DocumentFormat::Docx => {
            let res = import_docx(bytes, document_id)?;
            Ok(res.document)
        }
        DocumentFormat::BinaryUnknown => Err(SwriteError::DocumentParse(
            DocumentParseError::InvalidFormat("Binary or unrecognized format".to_string()),
        )),
    }
}

/// Unified parser for string sources.
pub fn parse_document_string(
    source: &str,
    format: DocumentFormat,
    document_id: Option<String>,
) -> Result<Document> {
    match format {
        DocumentFormat::Markdown => parse_markdown(source, document_id),
        DocumentFormat::PlainText => parse_txt(source, document_id),
        _ => Err(SwriteError::DocumentParse(
            DocumentParseError::InvalidFormat("String parsing requires text format".to_string()),
        )),
    }
}
