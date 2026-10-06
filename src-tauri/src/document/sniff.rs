use crate::error::{FormatError, Result, SwriteError};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, Copy, PartialEq, Eq)]
pub enum DocumentFormat {
    Markdown,
    PlainText,
    Docx,
    BinaryUnknown,
}

impl DocumentFormat {
    pub fn as_str(&self) -> &'static str {
        match self {
            DocumentFormat::Markdown => "markdown",
            DocumentFormat::PlainText => "txt",
            DocumentFormat::Docx => "docx",
            DocumentFormat::BinaryUnknown => "binary",
        }
    }
}

/// Sniffs the format from bytes and filename extension.
pub fn sniff_format(bytes: &[u8], extension: Option<&str>) -> DocumentFormat {
    // 1. Check DOCX (ZIP magic bytes PK\x03\x04 or PK\x05\x06)
    if bytes.len() >= 4
        && bytes[0] == 0x50
        && bytes[1] == 0x4B
        && bytes[2] == 0x03
        && bytes[3] == 0x04
    {
        // Confirm it's DOCX by checking if it contains "word/"
        if let Ok(cursor) = std::panic::catch_unwind(|| {
            let cur = std::io::Cursor::new(bytes);
            if let Ok(mut zip) = zip::ZipArchive::new(cur) {
                return zip.by_name("word/document.xml").is_ok()
                    || zip.by_name("[Content_Types].xml").is_ok();
            }
            false
        }) {
            if cursor {
                return DocumentFormat::Docx;
            }
        }
    }

    // 2. Check for null bytes or binary data
    if bytes.iter().take(4096).any(|&b| b == 0) {
        return DocumentFormat::BinaryUnknown;
    }

    // 3. UTF-8 Validation
    if let Ok(text) = std::str::from_utf8(bytes) {
        if let Some(ext) = extension {
            let ext_lower = ext.to_lowercase();
            if ext_lower == "md" || ext_lower == "markdown" {
                return DocumentFormat::Markdown;
            } else if ext_lower == "txt" {
                return DocumentFormat::PlainText;
            }
        }

        // Heuristic detection on text
        if is_likely_markdown(text) {
            DocumentFormat::Markdown
        } else {
            DocumentFormat::PlainText
        }
    } else {
        DocumentFormat::BinaryUnknown
    }
}

/// Validates that the detected format matches the expected format, returning `FormatError::SniffMismatch` if contradictory.
pub fn validate_format_match(
    bytes: &[u8],
    expected: DocumentFormat,
    ext: Option<&str>,
) -> Result<DocumentFormat> {
    let detected = sniff_format(bytes, ext);
    if expected == DocumentFormat::Docx && detected != DocumentFormat::Docx {
        return Err(SwriteError::Format(FormatError::SniffMismatch {
            expected: "docx".to_string(),
            detected: detected.as_str().to_string(),
        }));
    }
    if expected == DocumentFormat::Markdown && detected == DocumentFormat::BinaryUnknown {
        return Err(SwriteError::Format(FormatError::SniffMismatch {
            expected: "markdown".to_string(),
            detected: "binary".to_string(),
        }));
    }
    Ok(detected)
}

fn is_likely_markdown(text: &str) -> bool {
    text.lines().any(|line| {
        let t = line.trim_start();
        t.starts_with("# ")
            || t.starts_with("## ")
            || t.starts_with("### ")
            || t.starts_with("- ")
            || t.starts_with("* ")
            || t.starts_with("> ")
            || t.starts_with("```")
            || t.starts_with("---")
            || t.starts_with("* * *")
            || t.contains("[[")
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sniff_markdown() {
        let md = b"# Chapter One\n\nIt was a dark night.\n";
        assert_eq!(sniff_format(md, Some("md")), DocumentFormat::Markdown);
    }

    #[test]
    fn test_sniff_txt() {
        let txt = b"Just some plain text without markdown syntax.";
        assert_eq!(sniff_format(txt, Some("txt")), DocumentFormat::PlainText);
    }
}
