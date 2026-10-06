use std::io::{Cursor, Write};
use swrite_core::document::docx::{export_docx, import_docx};
use swrite_core::document::model::{BlockNode, Document, DocumentMetadata, InlineNode};
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

#[test]
fn test_docx_export_and_reimport_fidelity() {
    let doc = Document {
        id: "doc-test".to_string(),
        schema_version: 1,
        metadata: DocumentMetadata::default(),
        blocks: vec![
            BlockNode::Heading {
                level: 1,
                inlines: vec![InlineNode::Text("The Crown of Winter".to_string())],
            },
            BlockNode::Paragraph {
                inlines: vec![
                    InlineNode::Text("Snow blanketed the silent valley. ".to_string()),
                    InlineNode::Strong(vec![InlineNode::Text("No sound".to_string())]),
                    InlineNode::Text(" echoed from the peaks.".to_string()),
                ],
            },
            BlockNode::SceneBreak {
                symbol: Some("* * *".to_string()),
            },
            BlockNode::Paragraph {
                inlines: vec![InlineNode::Text("The dawn finally broke.".to_string())],
            },
        ],
    };

    let docx_bytes = export_docx(&doc).unwrap();
    assert!(!docx_bytes.is_empty());

    let imported = import_docx(&docx_bytes, None).unwrap();
    assert_eq!(imported.warnings.len(), 0);
    assert_eq!(imported.document.blocks.len(), 4);

    if let BlockNode::Heading { level, inlines } = &imported.document.blocks[0] {
        assert_eq!(*level, 1);
        assert_eq!(
            inlines[0],
            InlineNode::Text("The Crown of Winter".to_string())
        );
    } else {
        panic!("Expected Heading block");
    }
}

#[test]
fn test_docx_vba_macro_stripping_and_warning() {
    // Construct a zip with a malicious vbaProject.bin payload
    let mut buffer = Vec::new();
    {
        let cursor = Cursor::new(&mut buffer);
        let mut zip = ZipWriter::new(cursor);
        let opts = SimpleFileOptions::default();

        zip.start_file("word/document.xml", opts).unwrap();
        zip.write_all(
            br#"<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body><w:p><w:r><w:t>Prose with macro attached.</w:t></w:r></w:p></w:body></w:document>"#,
        )
        .unwrap();

        zip.start_file("word/vbaProject.bin", opts).unwrap();
        zip.write_all(b"MOCK_BINARY_MACRO_PAYLOAD").unwrap();

        zip.finish().unwrap();
    }

    let res = import_docx(&buffer, None).unwrap();

    assert_eq!(res.warnings.len(), 1);
    assert_eq!(res.warnings[0].code, "VBA_MACROS_STRIPPED");
    assert_eq!(res.document.blocks.len(), 1);
}
