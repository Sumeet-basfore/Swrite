use crate::document::model::{BlockNode, Document, DocumentMetadata, InlineNode};
use crate::error::{DocumentParseError, Result, SwriteError};
use quick_xml::events::Event as XmlEvent;
use quick_xml::reader::Reader as XmlReader;
use serde::{Deserialize, Serialize};
use std::io::{Cursor, Read, Write};
use zip::write::SimpleFileOptions;
use zip::{ZipArchive, ZipWriter};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ImportWarning {
    pub code: String,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DocxImportResult {
    pub document: Document,
    pub warnings: Vec<ImportWarning>,
}

/// Imports a DOCX byte buffer into a neutral `Document` AST.
/// Strips VBA macros and reports warnings.
pub fn import_docx(bytes: &[u8], document_id: Option<String>) -> Result<DocxImportResult> {
    let cursor = Cursor::new(bytes);
    let mut archive = ZipArchive::new(cursor).map_err(|e| {
        SwriteError::DocumentParse(DocumentParseError::CorruptDocx(format!(
            "Failed to open DOCX zip archive: {}",
            e
        )))
    })?;

    let mut warnings = Vec::new();

    // 1. Check for VBA macros
    for i in 0..archive.len() {
        if let Ok(file) = archive.by_index(i) {
            let name = file.name().to_lowercase();
            if name.contains("vbaproject.bin") || name.contains("vbadir") || name.contains("macro")
            {
                warnings.push(ImportWarning {
                    code: "VBA_MACROS_STRIPPED".to_string(),
                    message:
                        "VBA macros were detected in the DOCX file and were stripped for safety."
                            .to_string(),
                });
                break;
            }
        }
    }

    // 2. Read word/document.xml
    let mut doc_xml = String::new();
    {
        let mut doc_file = archive.by_name("word/document.xml").map_err(|e| {
            SwriteError::DocumentParse(DocumentParseError::CorruptDocx(format!(
                "Missing word/document.xml in DOCX: {}",
                e
            )))
        })?;
        doc_file.read_to_string(&mut doc_xml).map_err(|e| {
            SwriteError::DocumentParse(DocumentParseError::CorruptDocx(format!(
                "Failed to read word/document.xml: {}",
                e
            )))
        })?;
    }

    // 3. Parse XML events
    let blocks = parse_docx_xml(&doc_xml)?;

    let doc = Document {
        id: document_id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string()),
        schema_version: 1,
        metadata: DocumentMetadata::default(),
        blocks,
    };

    Ok(DocxImportResult {
        document: doc,
        warnings,
    })
}

/// Parses word/document.xml into AST BlockNodes.
fn parse_docx_xml(xml: &str) -> Result<Vec<BlockNode>> {
    let mut reader = XmlReader::from_str(xml);
    reader.config_mut().trim_text(false);

    let mut blocks: Vec<BlockNode> = Vec::new();
    let mut current_inlines: Vec<InlineNode> = Vec::new();
    let mut in_r = false;
    let mut in_t = false;
    let mut is_bold = false;
    let mut is_italic = false;
    let mut is_strike = false;
    let mut heading_level: Option<u8> = None;
    let mut current_text = String::new();

    let mut buf = Vec::new();

    loop {
        match reader.read_event_into(&mut buf) {
            Ok(XmlEvent::Start(ref e)) => {
                let name = String::from_utf8_lossy(e.local_name().as_ref()).to_string();
                match name.as_str() {
                    "p" => {
                        current_inlines.clear();
                        heading_level = None;
                    }
                    "r" => {
                        in_r = true;
                        is_bold = false;
                        is_italic = false;
                        is_strike = false;
                    }
                    "t" => {
                        in_t = true;
                        current_text.clear();
                    }
                    "b" => {
                        if in_r {
                            is_bold = true;
                        }
                    }
                    "i" => {
                        if in_r {
                            is_italic = true;
                        }
                    }
                    "strike" => {
                        if in_r {
                            is_strike = true;
                        }
                    }
                    "pStyle" => {
                        for attr in e.attributes().flatten() {
                            let loc = attr.key.local_name();
                            let key = String::from_utf8_lossy(loc.as_ref()).to_string();
                            if key == "val" {
                                let val = String::from_utf8_lossy(&attr.value).to_string();
                                if val.starts_with("Heading1") || val == "1" {
                                    heading_level = Some(1);
                                } else if val.starts_with("Heading2") || val == "2" {
                                    heading_level = Some(2);
                                } else if val.starts_with("Heading3") || val == "3" {
                                    heading_level = Some(3);
                                } else if val.starts_with("Heading4") || val == "4" {
                                    heading_level = Some(4);
                                } else if val.starts_with("Heading5") || val == "5" {
                                    heading_level = Some(5);
                                } else if val.starts_with("Heading6") || val == "6" {
                                    heading_level = Some(6);
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
            Ok(XmlEvent::Empty(ref e)) => {
                let name = String::from_utf8_lossy(e.local_name().as_ref()).to_string();
                match name.as_str() {
                    "b" => {
                        if in_r {
                            is_bold = true;
                        }
                    }
                    "i" => {
                        if in_r {
                            is_italic = true;
                        }
                    }
                    "strike" => {
                        if in_r {
                            is_strike = true;
                        }
                    }
                    "br" => {
                        for attr in e.attributes().flatten() {
                            let loc = attr.key.local_name();
                            let key = String::from_utf8_lossy(loc.as_ref()).to_string();
                            if key == "type" && attr.value.as_ref() == b"page" {
                                blocks.push(BlockNode::PageBreak);
                            }
                        }
                    }
                    "pStyle" => {
                        for attr in e.attributes().flatten() {
                            let loc = attr.key.local_name();
                            let key = String::from_utf8_lossy(loc.as_ref()).to_string();
                            if key == "val" {
                                let val = String::from_utf8_lossy(&attr.value).to_string();
                                if val.starts_with("Heading1") || val == "1" {
                                    heading_level = Some(1);
                                } else if val.starts_with("Heading2") || val == "2" {
                                    heading_level = Some(2);
                                } else if val.starts_with("Heading3") || val == "3" {
                                    heading_level = Some(3);
                                } else if val.starts_with("Heading4") || val == "4" {
                                    heading_level = Some(4);
                                } else if val.starts_with("Heading5") || val == "5" {
                                    heading_level = Some(5);
                                } else if val.starts_with("Heading6") || val == "6" {
                                    heading_level = Some(6);
                                }
                            }
                        }
                    }
                    _ => {}
                }
            }
            Ok(XmlEvent::Text(ref e)) => {
                if in_t {
                    if let Ok(text) = e.unescape() {
                        current_text.push_str(&text);
                    }
                }
            }
            Ok(XmlEvent::End(ref e)) => {
                let name = String::from_utf8_lossy(e.local_name().as_ref()).to_string();
                match name.as_str() {
                    "t" => {
                        in_t = false;
                        if !current_text.is_empty() {
                            let mut node = InlineNode::Text(current_text.clone());
                            if is_bold {
                                node = InlineNode::Strong(vec![node]);
                            }
                            if is_italic {
                                node = InlineNode::Emphasis(vec![node]);
                            }
                            if is_strike {
                                node = InlineNode::Strikethrough(vec![node]);
                            }
                            current_inlines.push(node);
                        }
                    }
                    "r" => {
                        in_r = false;
                    }
                    "p" if !current_inlines.is_empty() => {
                        let plain = current_inlines
                            .iter()
                            .map(|i| match i {
                                InlineNode::Text(t) => t.as_str(),
                                _ => "",
                            })
                            .collect::<String>();
                        let trimmed = plain.trim();

                        if trimmed == "* * *"
                            || trimmed == "---"
                            || trimmed == "***"
                            || trimmed == "#"
                        {
                            blocks.push(BlockNode::SceneBreak {
                                symbol: Some(trimmed.to_string()),
                            });
                        } else if let Some(lvl) = heading_level {
                            blocks.push(BlockNode::Heading {
                                level: lvl,
                                inlines: std::mem::take(&mut current_inlines),
                            });
                        } else {
                            blocks.push(BlockNode::Paragraph {
                                inlines: std::mem::take(&mut current_inlines),
                            });
                        }
                    }
                    _ => {}
                }
            }
            Ok(XmlEvent::Eof) => break,
            Err(e) => {
                return Err(SwriteError::DocumentParse(DocumentParseError::CorruptDocx(
                    format!("XML parsing error: {}", e),
                )));
            }
            _ => {}
        }
        buf.clear();
    }

    Ok(blocks)
}

/// Exports a `Document` AST to a DOCX byte buffer conforming to literary formatting.
pub fn export_docx(doc: &Document) -> Result<Vec<u8>> {
    let mut buffer = Vec::new();
    {
        let cursor = Cursor::new(&mut buffer);
        let mut zip = ZipWriter::new(cursor);
        let options =
            SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

        // 1. [Content_Types].xml
        zip.start_file("[Content_Types].xml", options)
            .map_err(zip_err)?;
        zip.write_all(CONTENT_TYPES_XML.as_bytes())
            .map_err(io_err)?;

        // 2. _rels/.rels
        zip.start_file("_rels/.rels", options).map_err(zip_err)?;
        zip.write_all(ROOT_RELS_XML.as_bytes()).map_err(io_err)?;

        // 3. word/_rels/document.xml.rels
        zip.start_file("word/_rels/document.xml.rels", options)
            .map_err(zip_err)?;
        zip.write_all(DOCUMENT_RELS_XML.as_bytes())
            .map_err(io_err)?;

        // 4. word/styles.xml
        zip.start_file("word/styles.xml", options)
            .map_err(zip_err)?;
        zip.write_all(STYLES_XML.as_bytes()).map_err(io_err)?;

        // 5. word/document.xml
        zip.start_file("word/document.xml", options)
            .map_err(zip_err)?;
        let doc_xml = generate_document_xml(doc);
        zip.write_all(doc_xml.as_bytes()).map_err(io_err)?;

        zip.finish().map_err(zip_err)?;
    }

    Ok(buffer)
}

fn generate_document_xml(doc: &Document) -> String {
    let mut xml = String::from(
        r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>"#,
    );

    for block in &doc.blocks {
        match block {
            BlockNode::Paragraph { inlines } => {
                xml.push_str("<w:p><w:pPr><w:pStyle w:val=\"Normal\"/></w:pPr>");
                for inline in inlines {
                    xml.push_str(&inline_to_w_r(inline));
                }
                xml.push_str("</w:p>");
            }
            BlockNode::Heading { level, inlines } => {
                xml.push_str(&format!(
                    "<w:p><w:pPr><w:pStyle w:val=\"Heading{}\"/></w:pPr>",
                    level
                ));
                for inline in inlines {
                    xml.push_str(&inline_to_w_r(inline));
                }
                xml.push_str("</w:p>");
            }
            BlockNode::SceneBreak { symbol } => {
                xml.push_str("<w:p><w:pPr><w:jc w:val=\"center\"/></w:pPr><w:r><w:t>");
                xml.push_str(symbol.as_deref().unwrap_or("* * *"));
                xml.push_str("</w:t></w:r></w:p>");
            }
            BlockNode::PageBreak => {
                xml.push_str("<w:p><w:r><w:br w:type=\"page\"/></w:r></w:p>");
            }
            BlockNode::Divider => {
                xml.push_str("<w:p><w:pPr><w:pBdr><w:bottom w:val=\"single\" w:sz=\"6\" w:space=\"1\" w:color=\"auto\"/></w:pBdr></w:pPr></w:p>");
            }
            BlockNode::CodeBlock { code, .. } => {
                for line in code.lines() {
                    xml.push_str("<w:p><w:r><w:rPr><w:rFonts w:ascii=\"Courier New\" w:hAnsi=\"Courier New\"/></w:rPr><w:t xml:space=\"preserve\">");
                    xml.push_str(&quick_xml::escape::escape(line));
                    xml.push_str("</w:t></w:r></w:p>");
                }
            }
            BlockNode::BlockQuote { blocks } => {
                for b in blocks {
                    if let BlockNode::Paragraph { inlines } = b {
                        xml.push_str("<w:p><w:pPr><w:ind w:left=\"720\"/></w:pPr>");
                        for inline in inlines {
                            xml.push_str(&inline_to_w_r(inline));
                        }
                        xml.push_str("</w:p>");
                    }
                }
            }
            BlockNode::List { items, ordered, .. } => {
                for (idx, item) in items.iter().enumerate() {
                    for b in &item.blocks {
                        if let BlockNode::Paragraph { inlines } = b {
                            xml.push_str("<w:p><w:pPr><w:ind w:left=\"720\"/></w:pPr><w:r><w:t>");
                            if *ordered {
                                xml.push_str(&format!("{}. ", idx + 1));
                            } else {
                                xml.push_str("• ");
                            }
                            xml.push_str("</w:t></w:r>");
                            for inline in inlines {
                                xml.push_str(&inline_to_w_r(inline));
                            }
                            xml.push_str("</w:p>");
                        }
                    }
                }
            }
            BlockNode::Table { headers, rows, .. } => {
                xml.push_str("<w:tbl>");
                xml.push_str("<w:tr>");
                for h in headers {
                    xml.push_str("<w:tc><w:p>");
                    for inline in &h.inlines {
                        xml.push_str(&inline_to_w_r(inline));
                    }
                    xml.push_str("</w:p></w:tc>");
                }
                xml.push_str("</w:tr>");
                for row in rows {
                    xml.push_str("<w:tr>");
                    for cell in row {
                        xml.push_str("<w:tc><w:p>");
                        for inline in &cell.inlines {
                            xml.push_str(&inline_to_w_r(inline));
                        }
                        xml.push_str("</w:p></w:tc>");
                    }
                    xml.push_str("</w:tr>");
                }
                xml.push_str("</w:tbl>");
            }
            BlockNode::RawBlock { raw_content, .. } => {
                xml.push_str("<w:p><w:r><w:t>");
                xml.push_str(&quick_xml::escape::escape(raw_content));
                xml.push_str("</w:t></w:r></w:p>");
            }
        }
    }

    xml.push_str("</w:body></w:document>");
    xml
}

fn inline_to_w_r(inline: &InlineNode) -> String {
    match inline {
        InlineNode::Text(t) => {
            format!(
                "<w:r><w:t xml:space=\"preserve\">{}</w:t></w:r>",
                quick_xml::escape::escape(t)
            )
        }
        InlineNode::Strong(c) => {
            let mut inner = String::new();
            for child in c {
                if let InlineNode::Text(t) = child {
                    inner.push_str(&quick_xml::escape::escape(t));
                }
            }
            format!(
                "<w:r><w:rPr><w:b/></w:rPr><w:t xml:space=\"preserve\">{}</w:t></w:r>",
                inner
            )
        }
        InlineNode::Emphasis(c) => {
            let mut inner = String::new();
            for child in c {
                if let InlineNode::Text(t) = child {
                    inner.push_str(&quick_xml::escape::escape(t));
                }
            }
            format!(
                "<w:r><w:rPr><w:i/></w:rPr><w:t xml:space=\"preserve\">{}</w:t></w:r>",
                inner
            )
        }
        InlineNode::Strikethrough(c) => {
            let mut inner = String::new();
            for child in c {
                if let InlineNode::Text(t) = child {
                    inner.push_str(&quick_xml::escape::escape(t));
                }
            }
            format!(
                "<w:r><w:rPr><w:strike/></w:rPr><w:t xml:space=\"preserve\">{}</w:t></w:r>",
                inner
            )
        }
        InlineNode::CodeSpan(c) => {
            format!(
                "<w:r><w:rPr><w:rFonts w:ascii=\"Courier New\" w:hAnsi=\"Courier New\"/></w:rPr><w:t xml:space=\"preserve\">{}</w:t></w:r>",
                quick_xml::escape::escape(c)
            )
        }
        InlineNode::Wikilink { target, alias } => {
            let label = alias.as_ref().unwrap_or(target);
            format!(
                "<w:r><w:rPr><w:u w:val=\"single\"/></w:rPr><w:t xml:space=\"preserve\">{}</w:t></w:r>",
                quick_xml::escape::escape(label)
            )
        }
        InlineNode::Link { inlines, .. } | InlineNode::InlineCommentAnchor { inlines, .. } => {
            let mut out = String::new();
            for child in inlines {
                out.push_str(&inline_to_w_r(child));
            }
            out
        }
        InlineNode::Image { alt_text, .. } => {
            format!(
                "<w:r><w:t xml:space=\"preserve\">[Image: {}]</w:t></w:r>",
                quick_xml::escape::escape(alt_text)
            )
        }
        InlineNode::RawInline { raw_content, .. } => {
            format!(
                "<w:r><w:t xml:space=\"preserve\">{}</w:t></w:r>",
                quick_xml::escape::escape(raw_content)
            )
        }
    }
}

const CONTENT_TYPES_XML: &str = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>"#;

const ROOT_RELS_XML: &str = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"#;

const DOCUMENT_RELS_XML: &str = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"#;

const STYLES_XML: &str = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:rPr>
      <w:b/>
      <w:sz w:val="36"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:rPr>
      <w:b/>
      <w:sz w:val="28"/>
    </w:rPr>
  </w:style>
</w:styles>"#;

fn zip_err(e: zip::result::ZipError) -> SwriteError {
    SwriteError::DocumentParse(DocumentParseError::CorruptDocx(e.to_string()))
}

fn io_err(e: std::io::Error) -> SwriteError {
    SwriteError::Filesystem(crate::error::FilesystemError::Io(e.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_docx_export_and_import() {
        let doc = Document {
            id: "test-doc".to_string(),
            schema_version: 1,
            metadata: DocumentMetadata::default(),
            blocks: vec![
                BlockNode::Heading {
                    level: 1,
                    inlines: vec![InlineNode::Text("Chapter One".to_string())],
                },
                BlockNode::Paragraph {
                    inlines: vec![
                        InlineNode::Text("A story begins ".to_string()),
                        InlineNode::Strong(vec![InlineNode::Text("boldly".to_string())]),
                        InlineNode::Text(" here.".to_string()),
                    ],
                },
                BlockNode::SceneBreak {
                    symbol: Some("* * *".to_string()),
                },
            ],
        };

        let bytes = export_docx(&doc).unwrap();
        assert!(!bytes.is_empty());

        let res = import_docx(&bytes, Some("imported-doc".to_string())).unwrap();
        assert_eq!(res.document.blocks.len(), 3);
        assert_eq!(res.warnings.len(), 0);
    }
}
