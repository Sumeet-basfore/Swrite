use crate::document::model::{BlockNode, Document, DocumentMetadata, InlineNode};
use crate::error::Result;

/// Parses UTF-8 plain text into a `Document` AST.
/// Paragraphs are split on double newlines (`\n\n` or `\r\n\r\n`).
pub fn parse_txt(source: &str, document_id: Option<String>) -> Result<Document> {
    let normalized = source.replace("\r\n", "\n");
    let paragraphs: Vec<&str> = normalized.split("\n\n").collect();

    let mut blocks = Vec::new();
    for p in paragraphs {
        let trimmed = p.trim();
        if !trimmed.is_empty() {
            blocks.push(BlockNode::Paragraph {
                inlines: vec![InlineNode::Text(trimmed.to_string())],
            });
        }
    }

    Ok(Document {
        id: document_id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string()),
        schema_version: 1,
        metadata: DocumentMetadata::default(),
        blocks,
    })
}

/// Serializes a `Document` AST into pure plain text.
pub fn serialize_txt(doc: &Document) -> String {
    let mut out = String::new();
    for (i, block) in doc.blocks.iter().enumerate() {
        if i > 0 {
            out.push_str("\n\n");
        }
        serialize_block_plain(block, &mut out);
    }
    if !out.is_empty() {
        out.push('\n');
    }
    out
}

fn serialize_block_plain(block: &BlockNode, out: &mut String) {
    match block {
        BlockNode::Paragraph { inlines } | BlockNode::Heading { inlines, .. } => {
            for inline in inlines {
                serialize_inline_plain(inline, out);
            }
        }
        BlockNode::BlockQuote { blocks } => {
            for (i, b) in blocks.iter().enumerate() {
                if i > 0 {
                    out.push('\n');
                }
                serialize_block_plain(b, out);
            }
        }
        BlockNode::List { items, .. } => {
            for (i, item) in items.iter().enumerate() {
                if i > 0 {
                    out.push('\n');
                }
                for b in &item.blocks {
                    serialize_block_plain(b, out);
                }
            }
        }
        BlockNode::Table { headers, rows, .. } => {
            for h in headers {
                for inline in &h.inlines {
                    serialize_inline_plain(inline, out);
                }
                out.push('\t');
            }
            out.push('\n');
            for r in rows {
                for c in r {
                    for inline in &c.inlines {
                        serialize_inline_plain(inline, out);
                    }
                    out.push('\t');
                }
                out.push('\n');
            }
        }
        BlockNode::CodeBlock { code, .. } => {
            out.push_str(code);
        }
        BlockNode::Divider => {
            out.push_str("---");
        }
        BlockNode::SceneBreak { symbol } => {
            out.push_str(symbol.as_deref().unwrap_or("* * *"));
        }
        BlockNode::PageBreak => {
            out.push('\n');
        }
        BlockNode::RawBlock { raw_content, .. } => {
            out.push_str(raw_content);
        }
    }
}

fn serialize_inline_plain(inline: &InlineNode, out: &mut String) {
    match inline {
        InlineNode::Text(t)
        | InlineNode::CodeSpan(t)
        | InlineNode::RawInline { raw_content: t, .. } => {
            out.push_str(t);
        }
        InlineNode::Emphasis(c)
        | InlineNode::Strong(c)
        | InlineNode::Strikethrough(c)
        | InlineNode::Link { inlines: c, .. }
        | InlineNode::InlineCommentAnchor { inlines: c, .. } => {
            for child in c {
                serialize_inline_plain(child, out);
            }
        }
        InlineNode::Wikilink { target, alias } => {
            out.push_str(alias.as_ref().unwrap_or(target));
        }
        InlineNode::Image { alt_text, .. } => {
            out.push_str(alt_text);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_txt_roundtrip() {
        let text = "Paragraph one of the story.\n\nParagraph two with more details.\n";
        let doc = parse_txt(text, None).unwrap();
        assert_eq!(doc.blocks.len(), 2);
        let serialized = serialize_txt(&doc);
        assert_eq!(serialized, text);
    }
}
