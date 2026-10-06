use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct Document {
    pub id: String,
    pub schema_version: u32,
    pub metadata: DocumentMetadata,
    pub blocks: Vec<BlockNode>,
}

impl Default for Document {
    fn default() -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            schema_version: 1,
            metadata: DocumentMetadata::default(),
            blocks: Vec::new(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Default)]
pub struct DocumentMetadata {
    pub title: Option<String>,
    pub author: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
    #[serde(default)]
    pub raw_frontmatter: Option<String>,
    #[serde(default)]
    pub custom: HashMap<String, String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(tag = "type", content = "data")]
pub enum BlockNode {
    Paragraph {
        inlines: Vec<InlineNode>,
    },
    Heading {
        level: u8,
        inlines: Vec<InlineNode>,
    },
    BlockQuote {
        blocks: Vec<BlockNode>,
    },
    List {
        ordered: bool,
        start: Option<u64>,
        items: Vec<ListItem>,
    },
    Table {
        headers: Vec<TableCell>,
        rows: Vec<Vec<TableCell>>,
        alignments: Vec<TableAlignment>,
    },
    CodeBlock {
        language: Option<String>,
        code: String,
    },
    Divider,
    SceneBreak {
        symbol: Option<String>,
    },
    PageBreak,
    RawBlock {
        format: String,
        raw_content: String,
    },
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct ListItem {
    pub checked: Option<bool>,
    pub blocks: Vec<BlockNode>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct TableCell {
    pub inlines: Vec<InlineNode>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum TableAlignment {
    None,
    Left,
    Center,
    Right,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(tag = "type", content = "data")]
pub enum InlineNode {
    Text(String),
    Emphasis(Vec<InlineNode>),
    Strong(Vec<InlineNode>),
    Strikethrough(Vec<InlineNode>),
    CodeSpan(String),
    Link {
        url: String,
        title: Option<String>,
        inlines: Vec<InlineNode>,
    },
    Wikilink {
        target: String,
        alias: Option<String>,
    },
    Image {
        url: String,
        alt_text: String,
        title: Option<String>,
    },
    InlineCommentAnchor {
        comment_id: String,
        inlines: Vec<InlineNode>,
    },
    RawInline {
        format: String,
        raw_content: String,
    },
}

impl Document {
    /// Computes the word count of the document across all text inlines.
    pub fn word_count(&self) -> usize {
        let mut count = 0;
        for block in &self.blocks {
            count += block_word_count(block);
        }
        count
    }

    /// Computes the character count of the document.
    pub fn character_count(&self) -> usize {
        let mut count = 0;
        for block in &self.blocks {
            count += block_char_count(block);
        }
        count
    }
}

fn block_word_count(block: &BlockNode) -> usize {
    match block {
        BlockNode::Paragraph { inlines } | BlockNode::Heading { inlines, .. } => {
            inlines.iter().map(inline_word_count).sum()
        }
        BlockNode::BlockQuote { blocks } => blocks.iter().map(block_word_count).sum(),
        BlockNode::List { items, .. } => items
            .iter()
            .flat_map(|item| &item.blocks)
            .map(block_word_count)
            .sum(),
        BlockNode::Table { headers, rows, .. } => {
            let header_words: usize = headers
                .iter()
                .flat_map(|c| &c.inlines)
                .map(inline_word_count)
                .sum();
            let row_words: usize = rows
                .iter()
                .flat_map(|r| r.iter())
                .flat_map(|c| &c.inlines)
                .map(inline_word_count)
                .sum();
            header_words + row_words
        }
        BlockNode::CodeBlock { code, .. } => code.split_whitespace().count(),
        BlockNode::RawBlock { raw_content, .. } => raw_content.split_whitespace().count(),
        BlockNode::Divider | BlockNode::SceneBreak { .. } | BlockNode::PageBreak => 0,
    }
}

fn inline_word_count(inline: &InlineNode) -> usize {
    match inline {
        InlineNode::Text(t) => t.split_whitespace().count(),
        InlineNode::Emphasis(children)
        | InlineNode::Strong(children)
        | InlineNode::Strikethrough(children)
        | InlineNode::Link {
            inlines: children, ..
        }
        | InlineNode::InlineCommentAnchor {
            inlines: children, ..
        } => children.iter().map(inline_word_count).sum(),
        InlineNode::Wikilink { target, alias } => {
            alias.as_ref().unwrap_or(target).split_whitespace().count()
        }
        InlineNode::CodeSpan(c) => c.split_whitespace().count(),
        InlineNode::Image { alt_text, .. } => alt_text.split_whitespace().count(),
        InlineNode::RawInline { raw_content, .. } => raw_content.split_whitespace().count(),
    }
}

fn block_char_count(block: &BlockNode) -> usize {
    match block {
        BlockNode::Paragraph { inlines } | BlockNode::Heading { inlines, .. } => {
            inlines.iter().map(inline_char_count).sum()
        }
        BlockNode::BlockQuote { blocks } => blocks.iter().map(block_char_count).sum(),
        BlockNode::List { items, .. } => items
            .iter()
            .flat_map(|item| &item.blocks)
            .map(block_char_count)
            .sum(),
        BlockNode::Table { headers, rows, .. } => {
            let header_chars: usize = headers
                .iter()
                .flat_map(|c| &c.inlines)
                .map(inline_char_count)
                .sum();
            let row_chars: usize = rows
                .iter()
                .flat_map(|r| r.iter())
                .flat_map(|c| &c.inlines)
                .map(inline_char_count)
                .sum();
            header_chars + row_chars
        }
        BlockNode::CodeBlock { code, .. } => code.chars().count(),
        BlockNode::RawBlock { raw_content, .. } => raw_content.chars().count(),
        BlockNode::Divider | BlockNode::SceneBreak { .. } | BlockNode::PageBreak => 0,
    }
}

fn inline_char_count(inline: &InlineNode) -> usize {
    match inline {
        InlineNode::Text(t) => t.chars().count(),
        InlineNode::Emphasis(children)
        | InlineNode::Strong(children)
        | InlineNode::Strikethrough(children)
        | InlineNode::Link {
            inlines: children, ..
        }
        | InlineNode::InlineCommentAnchor {
            inlines: children, ..
        } => children.iter().map(inline_char_count).sum(),
        InlineNode::Wikilink { target, alias } => alias.as_ref().unwrap_or(target).chars().count(),
        InlineNode::CodeSpan(c) => c.chars().count(),
        InlineNode::Image { alt_text, .. } => alt_text.chars().count(),
        InlineNode::RawInline { raw_content, .. } => raw_content.chars().count(),
    }
}
