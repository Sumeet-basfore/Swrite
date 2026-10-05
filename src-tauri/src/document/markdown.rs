use crate::document::model::{
    BlockNode, Document, DocumentMetadata, InlineNode, ListItem, TableAlignment, TableCell,
};
use crate::error::Result;
use pulldown_cmark::{Alignment, Event, HeadingLevel, Options, Parser, Tag, TagEnd};

/// Parses Markdown text into a neutral `Document` AST.
pub fn parse_markdown(source: &str, document_id: Option<String>) -> Result<Document> {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);
    options.insert(Options::ENABLE_HEADING_ATTRIBUTES);

    let parser = Parser::new_ext(source, options);

    let mut blocks: Vec<BlockNode> = Vec::new();
    let mut block_stack: Vec<BlockContext> = Vec::new();
    let mut inline_stack: Vec<Vec<InlineNode>> = vec![Vec::new()];

    for event in parser {
        match event {
            Event::Start(tag) => match tag {
                Tag::Paragraph => {
                    inline_stack.push(Vec::new());
                }
                Tag::Heading { level, .. } => {
                    inline_stack.push(Vec::new());
                    block_stack.push(BlockContext::Heading(level_to_u8(level)));
                }
                Tag::BlockQuote(_) => {
                    block_stack.push(BlockContext::BlockQuote(Vec::new()));
                }
                Tag::List(first_num) => {
                    let ordered = first_num.is_some();
                    block_stack.push(BlockContext::List {
                        ordered,
                        start: first_num,
                        items: Vec::new(),
                    });
                }
                Tag::Item => {
                    inline_stack.push(Vec::new());
                    block_stack.push(BlockContext::ListItem {
                        checked: None,
                        blocks: Vec::new(),
                    });
                }
                Tag::Table(alignments) => {
                    let ast_alignments = alignments
                        .into_iter()
                        .map(|a| match a {
                            Alignment::None => TableAlignment::None,
                            Alignment::Left => TableAlignment::Left,
                            Alignment::Center => TableAlignment::Center,
                            Alignment::Right => TableAlignment::Right,
                        })
                        .collect();
                    block_stack.push(BlockContext::Table {
                        headers: Vec::new(),
                        rows: Vec::new(),
                        alignments: ast_alignments,
                        in_header: true,
                        current_row: Vec::new(),
                    });
                }
                Tag::TableHead => {
                    if let Some(BlockContext::Table { in_header, .. }) = block_stack.last_mut() {
                        *in_header = true;
                    }
                }
                Tag::TableRow => {
                    if let Some(BlockContext::Table {
                        in_header,
                        current_row,
                        ..
                    }) = block_stack.last_mut()
                    {
                        *in_header = false;
                        current_row.clear();
                    }
                }
                Tag::TableCell => {
                    inline_stack.push(Vec::new());
                }
                Tag::CodeBlock(kind) => {
                    let lang = match kind {
                        pulldown_cmark::CodeBlockKind::Fenced(l) => {
                            let s = l.trim().to_string();
                            if s.is_empty() {
                                None
                            } else {
                                Some(s)
                            }
                        }
                        pulldown_cmark::CodeBlockKind::Indented => None,
                    };
                    block_stack.push(BlockContext::CodeBlock {
                        language: lang,
                        code: String::new(),
                    });
                }
                Tag::Emphasis => {
                    inline_stack.push(Vec::new());
                }
                Tag::Strong => {
                    inline_stack.push(Vec::new());
                }
                Tag::Strikethrough => {
                    inline_stack.push(Vec::new());
                }
                Tag::Link {
                    dest_url, title, ..
                } => {
                    inline_stack.push(Vec::new());
                    block_stack.push(BlockContext::LinkInfo {
                        url: dest_url.to_string(),
                        title: if title.is_empty() {
                            None
                        } else {
                            Some(title.to_string())
                        },
                    });
                }
                Tag::Image {
                    dest_url, title, ..
                } => {
                    inline_stack.push(Vec::new());
                    block_stack.push(BlockContext::ImageInfo {
                        url: dest_url.to_string(),
                        title: if title.is_empty() {
                            None
                        } else {
                            Some(title.to_string())
                        },
                    });
                }
                Tag::HtmlBlock => {
                    block_stack.push(BlockContext::HtmlBlock(String::new()));
                }
                _ => {}
            },
            Event::End(tag_end) => match tag_end {
                TagEnd::Paragraph => {
                    let inlines = inline_stack.pop().unwrap_or_default();
                    if !inlines.is_empty() {
                        let block = BlockNode::Paragraph { inlines };
                        append_block(&mut blocks, &mut block_stack, block);
                    }
                }
                TagEnd::Heading(_) => {
                    let inlines = inline_stack.pop().unwrap_or_default();
                    if let Some(BlockContext::Heading(lvl)) = block_stack.pop() {
                        let block = BlockNode::Heading {
                            level: lvl,
                            inlines,
                        };
                        append_block(&mut blocks, &mut block_stack, block);
                    }
                }
                TagEnd::BlockQuote(_) => {
                    if let Some(BlockContext::BlockQuote(child_blocks)) = block_stack.pop() {
                        let block = BlockNode::BlockQuote {
                            blocks: child_blocks,
                        };
                        append_block(&mut blocks, &mut block_stack, block);
                    }
                }
                TagEnd::List(_) => {
                    if let Some(BlockContext::List {
                        ordered,
                        start,
                        items,
                    }) = block_stack.pop()
                    {
                        let block = BlockNode::List {
                            ordered,
                            start,
                            items,
                        };
                        append_block(&mut blocks, &mut block_stack, block);
                    }
                }
                TagEnd::Item => {
                    let inlines = inline_stack.pop().unwrap_or_default();
                    if let Some(BlockContext::ListItem {
                        checked,
                        mut blocks,
                    }) = block_stack.pop()
                    {
                        if blocks.is_empty() && !inlines.is_empty() {
                            blocks.push(BlockNode::Paragraph { inlines });
                        }
                        let item = ListItem { checked, blocks };
                        if let Some(BlockContext::List { items, .. }) = block_stack.last_mut() {
                            items.push(item);
                        }
                    }
                }
                TagEnd::TableCell => {
                    let inlines = inline_stack.pop().unwrap_or_default();
                    let cell = TableCell { inlines };
                    if let Some(BlockContext::Table {
                        in_header,
                        headers,
                        current_row,
                        ..
                    }) = block_stack.last_mut()
                    {
                        if *in_header {
                            headers.push(cell);
                        } else {
                            current_row.push(cell);
                        }
                    }
                }
                TagEnd::TableRow => {
                    if let Some(BlockContext::Table {
                        headers: _,
                        rows,
                        current_row,
                        in_header,
                        ..
                    }) = block_stack.last_mut()
                    {
                        if !*in_header && !current_row.is_empty() {
                            rows.push(std::mem::take(current_row));
                        }
                    }
                }
                TagEnd::Table => {
                    if let Some(BlockContext::Table {
                        headers,
                        rows,
                        alignments,
                        ..
                    }) = block_stack.pop()
                    {
                        let block = BlockNode::Table {
                            headers,
                            rows,
                            alignments,
                        };
                        append_block(&mut blocks, &mut block_stack, block);
                    }
                }
                TagEnd::CodeBlock => {
                    if let Some(BlockContext::CodeBlock { language, code }) = block_stack.pop() {
                        let block = BlockNode::CodeBlock { language, code };
                        append_block(&mut blocks, &mut block_stack, block);
                    }
                }
                TagEnd::Emphasis => {
                    let children = inline_stack.pop().unwrap_or_default();
                    append_inline(&mut inline_stack, InlineNode::Emphasis(children));
                }
                TagEnd::Strong => {
                    let children = inline_stack.pop().unwrap_or_default();
                    append_inline(&mut inline_stack, InlineNode::Strong(children));
                }
                TagEnd::Strikethrough => {
                    let children = inline_stack.pop().unwrap_or_default();
                    append_inline(&mut inline_stack, InlineNode::Strikethrough(children));
                }
                TagEnd::Link => {
                    let children = inline_stack.pop().unwrap_or_default();
                    if let Some(BlockContext::LinkInfo { url, title }) = block_stack.pop() {
                        append_inline(
                            &mut inline_stack,
                            InlineNode::Link {
                                url,
                                title,
                                inlines: children,
                            },
                        );
                    }
                }
                TagEnd::Image => {
                    let children = inline_stack.pop().unwrap_or_default();
                    let alt_text = inlines_to_plain_text(&children);
                    if let Some(BlockContext::ImageInfo { url, title }) = block_stack.pop() {
                        append_inline(
                            &mut inline_stack,
                            InlineNode::Image {
                                url,
                                alt_text,
                                title,
                            },
                        );
                    }
                }
                TagEnd::HtmlBlock => {
                    if let Some(BlockContext::HtmlBlock(raw_content)) = block_stack.pop() {
                        let trimmed = raw_content.trim();
                        if trimmed == "<!-- pagebreak -->" || trimmed == "\\pagebreak" {
                            append_block(&mut blocks, &mut block_stack, BlockNode::PageBreak);
                        } else if trimmed == "* * *" || trimmed == "---" || trimmed == "***" {
                            append_block(
                                &mut blocks,
                                &mut block_stack,
                                BlockNode::SceneBreak {
                                    symbol: Some(trimmed.to_string()),
                                },
                            );
                        } else {
                            append_block(
                                &mut blocks,
                                &mut block_stack,
                                BlockNode::RawBlock {
                                    format: "html".to_string(),
                                    raw_content,
                                },
                            );
                        }
                    }
                }
                _ => {}
            },
            Event::Text(text) => {
                if let Some(BlockContext::CodeBlock { code, .. }) = block_stack.last_mut() {
                    code.push_str(&text);
                } else if let Some(BlockContext::HtmlBlock(raw)) = block_stack.last_mut() {
                    raw.push_str(&text);
                } else {
                    let parsed_inlines = parse_wikilinks_in_text(&text);
                    for inline in parsed_inlines {
                        append_inline(&mut inline_stack, inline);
                    }
                }
            }
            Event::Code(code) => {
                append_inline(&mut inline_stack, InlineNode::CodeSpan(code.to_string()));
            }
            Event::Html(html) => {
                let s = html.to_string();
                if let Some(BlockContext::HtmlBlock(raw)) = block_stack.last_mut() {
                    raw.push_str(&s);
                } else {
                    let trimmed = s.trim();
                    if trimmed.starts_with("<!-- swrite:comment:") {
                        if let Some(comment_id) = trimmed
                            .strip_prefix("<!-- swrite:comment:")
                            .and_then(|t| t.strip_suffix("-->"))
                        {
                            append_inline(
                                &mut inline_stack,
                                InlineNode::InlineCommentAnchor {
                                    comment_id: comment_id.trim().to_string(),
                                    inlines: Vec::new(),
                                },
                            );
                            continue;
                        }
                    }
                    append_inline(
                        &mut inline_stack,
                        InlineNode::RawInline {
                            format: "html".to_string(),
                            raw_content: s,
                        },
                    );
                }
            }
            Event::Rule => {
                append_block(&mut blocks, &mut block_stack, BlockNode::Divider);
            }
            Event::TaskListMarker(checked) => {
                for ctx in block_stack.iter_mut().rev() {
                    if let BlockContext::ListItem { checked: c, .. } = ctx {
                        *c = Some(checked);
                        break;
                    }
                }
            }
            Event::SoftBreak => {
                append_inline(&mut inline_stack, InlineNode::Text("\n".to_string()));
            }
            Event::HardBreak => {
                append_inline(&mut inline_stack, InlineNode::Text("  \n".to_string()));
            }
            _ => {}
        }
    }

    Ok(Document {
        id: document_id.unwrap_or_else(|| uuid::Uuid::new_v4().to_string()),
        schema_version: 1,
        metadata: DocumentMetadata::default(),
        blocks,
    })
}

/// Serializes a `Document` AST into clean, deterministic Markdown.
pub fn serialize_markdown(doc: &Document) -> String {
    let mut out = String::new();

    for (i, block) in doc.blocks.iter().enumerate() {
        if i > 0 {
            out.push('\n');
        }
        serialize_block(block, &mut out, 0);
    }

    out
}

fn serialize_block(block: &BlockNode, out: &mut String, depth: usize) {
    let indent = "    ".repeat(depth);
    match block {
        BlockNode::Paragraph { inlines } => {
            out.push_str(&indent);
            serialize_inlines(inlines, out);
            out.push('\n');
        }
        BlockNode::Heading { level, inlines } => {
            out.push_str(&indent);
            for _ in 0..*level {
                out.push('#');
            }
            out.push(' ');
            serialize_inlines(inlines, out);
            out.push('\n');
        }
        BlockNode::BlockQuote { blocks } => {
            for b in blocks {
                let mut inner = String::new();
                serialize_block(b, &mut inner, 0);
                for line in inner.lines() {
                    out.push_str(&indent);
                    out.push_str("> ");
                    out.push_str(line);
                    out.push('\n');
                }
            }
        }
        BlockNode::List {
            ordered,
            start,
            items,
        } => {
            let mut num = start.unwrap_or(1);
            for item in items {
                out.push_str(&indent);
                if *ordered {
                    out.push_str(&format!("{}. ", num));
                    num += 1;
                } else {
                    out.push_str("- ");
                }

                if let Some(checked) = item.checked {
                    if checked {
                        out.push_str("[x] ");
                    } else {
                        out.push_str("[ ] ");
                    }
                }

                for (idx, b) in item.blocks.iter().enumerate() {
                    if idx == 0 {
                        let mut inner = String::new();
                        serialize_block(b, &mut inner, 0);
                        out.push_str(inner.trim_start());
                    } else {
                        serialize_block(b, out, depth + 1);
                    }
                }
            }
        }
        BlockNode::Table {
            headers,
            rows,
            alignments,
        } => {
            out.push_str(&indent);
            out.push('|');
            for h in headers {
                out.push(' ');
                serialize_inlines(&h.inlines, out);
                out.push_str(" |");
            }
            out.push('\n');

            out.push_str(&indent);
            out.push('|');
            for (idx, _) in headers.iter().enumerate() {
                let align = alignments.get(idx).unwrap_or(&TableAlignment::None);
                let sep = match align {
                    TableAlignment::Left => ":---",
                    TableAlignment::Center => ":---:",
                    TableAlignment::Right => "---:",
                    TableAlignment::None => "---",
                };
                out.push_str(&format!(" {} |", sep));
            }
            out.push('\n');

            for row in rows {
                out.push_str(&indent);
                out.push('|');
                for cell in row {
                    out.push(' ');
                    serialize_inlines(&cell.inlines, out);
                    out.push_str(" |");
                }
                out.push('\n');
            }
        }
        BlockNode::CodeBlock { language, code } => {
            out.push_str(&indent);
            out.push_str("```");
            if let Some(lang) = language {
                out.push_str(lang);
            }
            out.push('\n');
            out.push_str(code);
            if !code.ends_with('\n') {
                out.push('\n');
            }
            out.push_str(&indent);
            out.push_str("```\n");
        }
        BlockNode::Divider => {
            out.push_str(&indent);
            out.push_str("---\n");
        }
        BlockNode::SceneBreak { symbol } => {
            out.push_str(&indent);
            out.push_str(symbol.as_deref().unwrap_or("* * *"));
            out.push('\n');
        }
        BlockNode::PageBreak => {
            out.push_str(&indent);
            out.push_str("<!-- pagebreak -->\n");
        }
        BlockNode::RawBlock { raw_content, .. } => {
            out.push_str(raw_content);
            if !raw_content.ends_with('\n') {
                out.push('\n');
            }
        }
    }
}

fn serialize_inlines(inlines: &[InlineNode], out: &mut String) {
    for inline in inlines {
        match inline {
            InlineNode::Text(t) => out.push_str(t),
            InlineNode::Emphasis(children) => {
                out.push('*');
                serialize_inlines(children, out);
                out.push('*');
            }
            InlineNode::Strong(children) => {
                out.push_str("**");
                serialize_inlines(children, out);
                out.push_str("**");
            }
            InlineNode::Strikethrough(children) => {
                out.push_str("~~");
                serialize_inlines(children, out);
                out.push_str("~~");
            }
            InlineNode::CodeSpan(c) => {
                out.push('`');
                out.push_str(c);
                out.push('`');
            }
            InlineNode::Link {
                url,
                title,
                inlines: children,
            } => {
                out.push('[');
                serialize_inlines(children, out);
                out.push_str("](");
                out.push_str(url);
                if let Some(t) = title {
                    out.push_str(&format!(" \"{}\"", t));
                }
                out.push(')');
            }
            InlineNode::Wikilink { target, alias } => {
                out.push_str("[[");
                out.push_str(target);
                if let Some(a) = alias {
                    out.push('|');
                    out.push_str(a);
                }
                out.push_str("]]");
            }
            InlineNode::Image {
                url,
                alt_text,
                title,
            } => {
                out.push_str("![");
                out.push_str(alt_text);
                out.push_str("](");
                out.push_str(url);
                if let Some(t) = title {
                    out.push_str(&format!(" \"{}\"", t));
                }
                out.push(')');
            }
            InlineNode::InlineCommentAnchor {
                comment_id,
                inlines: children,
            } => {
                out.push_str(&format!("<!-- swrite:comment:{} -->", comment_id));
                serialize_inlines(children, out);
            }
            InlineNode::RawInline { raw_content, .. } => {
                out.push_str(raw_content);
            }
        }
    }
}

fn parse_wikilinks_in_text(text: &str) -> Vec<InlineNode> {
    let mut inlines = Vec::new();
    let mut rest = text;

    while let Some(start_idx) = rest.find("[[") {
        if start_idx > 0 {
            inlines.push(InlineNode::Text(rest[..start_idx].to_string()));
        }

        let after_start = &rest[start_idx + 2..];
        if let Some(end_idx) = after_start.find("]]") {
            let inner = &after_start[..end_idx];
            if let Some((target, alias)) = inner.split_once('|') {
                inlines.push(InlineNode::Wikilink {
                    target: target.trim().to_string(),
                    alias: Some(alias.trim().to_string()),
                });
            } else {
                inlines.push(InlineNode::Wikilink {
                    target: inner.trim().to_string(),
                    alias: None,
                });
            }
            rest = &after_start[end_idx + 2..];
        } else {
            inlines.push(InlineNode::Text(rest[start_idx..].to_string()));
            rest = "";
            break;
        }
    }

    if !rest.is_empty() {
        inlines.push(InlineNode::Text(rest.to_string()));
    }

    inlines
}

fn inlines_to_plain_text(inlines: &[InlineNode]) -> String {
    let mut text = String::new();
    for inline in inlines {
        match inline {
            InlineNode::Text(t)
            | InlineNode::CodeSpan(t)
            | InlineNode::RawInline { raw_content: t, .. } => {
                text.push_str(t);
            }
            InlineNode::Emphasis(c)
            | InlineNode::Strong(c)
            | InlineNode::Strikethrough(c)
            | InlineNode::Link { inlines: c, .. }
            | InlineNode::InlineCommentAnchor { inlines: c, .. } => {
                text.push_str(&inlines_to_plain_text(c));
            }
            InlineNode::Wikilink { target, alias } => {
                text.push_str(alias.as_ref().unwrap_or(target));
            }
            InlineNode::Image { alt_text, .. } => {
                text.push_str(alt_text);
            }
        }
    }
    text
}

enum BlockContext {
    Heading(u8),
    BlockQuote(Vec<BlockNode>),
    List {
        ordered: bool,
        start: Option<u64>,
        items: Vec<ListItem>,
    },
    ListItem {
        checked: Option<bool>,
        blocks: Vec<BlockNode>,
    },
    Table {
        headers: Vec<TableCell>,
        rows: Vec<Vec<TableCell>>,
        alignments: Vec<TableAlignment>,
        in_header: bool,
        current_row: Vec<TableCell>,
    },
    CodeBlock {
        language: Option<String>,
        code: String,
    },
    HtmlBlock(String),
    LinkInfo {
        url: String,
        title: Option<String>,
    },
    ImageInfo {
        url: String,
        title: Option<String>,
    },
}

fn append_block(root_blocks: &mut Vec<BlockNode>, stack: &mut [BlockContext], block: BlockNode) {
    if let Some(last) = stack.last_mut() {
        match last {
            BlockContext::BlockQuote(blocks) => blocks.push(block),
            BlockContext::ListItem { blocks, .. } => blocks.push(block),
            _ => root_blocks.push(block),
        }
    } else {
        root_blocks.push(block);
    }
}

fn append_inline(stack: &mut [Vec<InlineNode>], inline: InlineNode) {
    if let Some(current) = stack.last_mut() {
        current.push(inline);
    }
}

fn level_to_u8(level: HeadingLevel) -> u8 {
    match level {
        HeadingLevel::H1 => 1,
        HeadingLevel::H2 => 2,
        HeadingLevel::H3 => 3,
        HeadingLevel::H4 => 4,
        HeadingLevel::H5 => 5,
        HeadingLevel::H6 => 6,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_markdown_roundtrip_basic() {
        let md = "# Chapter One\n\nIt was a dark and *stormy* night. The **wind** howled.\n";
        let doc = parse_markdown(md, None).unwrap();
        assert_eq!(doc.blocks.len(), 2);
        let serialized = serialize_markdown(&doc);
        let doc2 = parse_markdown(&serialized, None).unwrap();
        assert_eq!(doc.blocks, doc2.blocks);
    }

    #[test]
    fn test_wikilinks_roundtrip() {
        let md = "See [[Lucan]] or [[Aethelgard|The Ancient City]].\n";
        let doc = parse_markdown(md, None).unwrap();
        let serialized = serialize_markdown(&doc);
        assert!(serialized.contains("[[Lucan]]"));
        assert!(serialized.contains("[[Aethelgard|The Ancient City]]"));
    }

    #[test]
    fn test_task_list_roundtrip() {
        let md = "- [ ] Unfinished task\n- [x] Completed task\n";
        let doc = parse_markdown(md, None).unwrap();
        let serialized = serialize_markdown(&doc);
        assert!(serialized.contains("- [ ] Unfinished task"));
        assert!(serialized.contains("- [x] Completed task"));
    }
}
