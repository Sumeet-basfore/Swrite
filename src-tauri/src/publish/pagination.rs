use crate::publish::preflight::ManuscriptDocument;
use crate::publish::profile::PublicationProfile;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum RenderedBlock {
    TitlePage {
        title: String,
        subtitle: Option<String>,
        author: String,
        edition: Option<String>,
        publisher: Option<String>,
    },
    CopyrightPage {
        text: String,
    },
    DedicationPage {
        text: String,
    },
    EpigraphPage {
        text: String,
    },
    ChapterTitle {
        number_label: Option<String>,
        title: String,
        ornament: Option<String>,
    },
    Paragraph {
        text: String,
        is_first_in_chapter: bool,
    },
    SceneBreak {
        symbol: String,
    },
    Image {
        src: String,
        alt: String,
        caption: Option<String>,
    },
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct RenderedPage {
    pub page_number: usize,
    pub display_number: String,
    pub is_front_matter: bool,
    pub header_left: String,
    pub header_center: String,
    pub header_right: String,
    pub footer_left: String,
    pub footer_center: String,
    pub footer_right: String,
    pub blocks: Vec<RenderedBlock>,
    pub width_pt: f64,
    pub height_pt: f64,
    pub margin_top_pt: f64,
    pub margin_bottom_pt: f64,
    pub margin_left_pt: f64,
    pub margin_right_pt: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct PaginationResult {
    pub total_pages: usize,
    pub front_matter_pages: usize,
    pub body_pages: usize,
    pub pages: Vec<RenderedPage>,
    pub word_count: usize,
}

pub fn paginate_manuscript(
    profile: &PublicationProfile,
    documents: &[ManuscriptDocument],
) -> PaginationResult {
    let width_pt = profile.page_size.width_in * 72.0;
    let height_pt = profile.page_size.height_in * 72.0;
    let margin_top_pt = profile.margins.top_in * 72.0;
    let margin_bottom_pt = profile.margins.bottom_in * 72.0;
    let margin_inside_pt = profile.margins.inside_in * 72.0;
    let margin_outside_pt = profile.margins.outside_in * 72.0;

    let usable_height_pt = (height_pt - margin_top_pt - margin_bottom_pt).max(100.0);
    let mut pages: Vec<RenderedPage> = Vec::new();
    let mut page_num = 1;
    let mut total_words = 0;

    // 1. Front Matter Generation
    if profile.front_matter.include_title_page {
        // Page 1: Title Page
        pages.push(RenderedPage {
            page_number: page_num,
            display_number: String::new(),
            is_front_matter: true,
            header_left: String::new(),
            header_center: String::new(),
            header_right: String::new(),
            footer_left: String::new(),
            footer_center: String::new(),
            footer_right: String::new(),
            blocks: vec![RenderedBlock::TitlePage {
                title: profile.front_matter.title.clone(),
                subtitle: profile.front_matter.subtitle.clone(),
                author: profile.front_matter.author.clone(),
                edition: profile.front_matter.edition.clone(),
                publisher: profile.front_matter.publisher.clone(),
            }],
            width_pt,
            height_pt,
            margin_top_pt,
            margin_bottom_pt,
            margin_left_pt: margin_inside_pt,
            margin_right_pt: margin_outside_pt,
        });
        page_num += 1;

        // Page 2: Copyright Page
        if let Some(ref copyright) = profile.front_matter.copyright {
            pages.push(RenderedPage {
                page_number: page_num,
                display_number: String::new(),
                is_front_matter: true,
                header_left: String::new(),
                header_center: String::new(),
                header_right: String::new(),
                footer_left: String::new(),
                footer_center: String::new(),
                footer_right: String::new(),
                blocks: vec![RenderedBlock::CopyrightPage {
                    text: copyright.clone(),
                }],
                width_pt,
                height_pt,
                margin_top_pt,
                margin_bottom_pt,
                margin_left_pt: margin_outside_pt, // Even page left margin is outside
                margin_right_pt: margin_inside_pt,
            });
            page_num += 1;
        }

        // Optional Dedication Page
        if let Some(ref dedication) = profile.front_matter.dedication {
            pages.push(RenderedPage {
                page_number: page_num,
                display_number: String::new(),
                is_front_matter: true,
                header_left: String::new(),
                header_center: String::new(),
                header_right: String::new(),
                footer_left: String::new(),
                footer_center: String::new(),
                footer_right: String::new(),
                blocks: vec![RenderedBlock::DedicationPage {
                    text: dedication.clone(),
                }],
                width_pt,
                height_pt,
                margin_top_pt,
                margin_bottom_pt,
                margin_left_pt: margin_inside_pt,
                margin_right_pt: margin_outside_pt,
            });
            page_num += 1;
        }

        // Optional Epigraph Page
        if let Some(ref epigraph) = profile.front_matter.epigraph {
            pages.push(RenderedPage {
                page_number: page_num,
                display_number: String::new(),
                is_front_matter: true,
                header_left: String::new(),
                header_center: String::new(),
                header_right: String::new(),
                footer_left: String::new(),
                footer_center: String::new(),
                footer_right: String::new(),
                blocks: vec![RenderedBlock::EpigraphPage {
                    text: epigraph.clone(),
                }],
                width_pt,
                height_pt,
                margin_top_pt,
                margin_bottom_pt,
                margin_left_pt: margin_inside_pt,
                margin_right_pt: margin_outside_pt,
            });
            page_num += 1;
        }
    }

    let front_matter_count = pages.len();
    let mut body_page_counter = 1;

    // 2. Body Chapters Pagination
    for (chapter_idx, doc) in documents.iter().enumerate() {
        let mut chapter_title = doc.title.clone();
        let mut lines = doc.content.lines().peekable();

        // Extract H1 if present
        if let Some(first_line) = lines.peek() {
            if first_line.starts_with("# ") {
                chapter_title = first_line.trim_start_matches("# ").trim().to_string();
                lines.next();
            }
        }

        let chapter_num_label = match profile.chapter_style.numbering_style.as_str() {
            "words" => Some(format!("CHAPTER {}", number_to_words(chapter_idx + 1))),
            "arabic" => Some(format!("Chapter {}", chapter_idx + 1)),
            "roman" => Some(format!("Chapter {}", number_to_roman(chapter_idx + 1))),
            _ => None,
        };

        // Start new page for chapter
        let is_odd = body_page_counter % 2 != 0;
        let (margin_l, margin_r) = if is_odd {
            (margin_inside_pt, margin_outside_pt)
        } else {
            (margin_outside_pt, margin_inside_pt)
        };

        let mut current_page_blocks: Vec<RenderedBlock> = vec![RenderedBlock::ChapterTitle {
            number_label: chapter_num_label,
            title: chapter_title.clone(),
            ornament: profile.chapter_style.ornament.clone(),
        }];

        let mut current_height_used = profile.chapter_style.spacing_top_pt + 60.0;
        let line_height_pt = profile.typography.font_size_pt * profile.typography.line_height;
        let mut is_first_p_in_chapter = true;

        let content_text = lines.collect::<Vec<&str>>().join("\n");
        let paragraphs = content_text.split("\n\n");

        for raw_p in paragraphs {
            let p = raw_p.trim();
            if p.is_empty() {
                continue;
            }

            // Word count
            let words = p.split_whitespace().count();
            total_words += words;

            // Check scene break
            if p == "* * *" || p == "✦ ✦ ✦" || p == "---" || p == "***" || p == "#" {
                let symbol = profile.scene_break_style.custom_text.clone()
                    .unwrap_or_else(|| "* * *".to_string());
                let break_height = 36.0;

                if current_height_used + break_height > usable_height_pt {
                    // Flush page
                    pages.push(create_body_page(
                        profile,
                        page_num,
                        body_page_counter,
                        &chapter_title,
                        current_page_blocks,
                        width_pt,
                        height_pt,
                        margin_top_pt,
                        margin_bottom_pt,
                        margin_l,
                        margin_r,
                    ));
                    page_num += 1;
                    body_page_counter += 1;
                    current_page_blocks = vec![RenderedBlock::SceneBreak { symbol }];
                    current_height_used = break_height;
                } else {
                    current_page_blocks.push(RenderedBlock::SceneBreak { symbol });
                    current_height_used += break_height;
                }
                is_first_p_in_chapter = true;
                continue;
            }

            // Estimate paragraph height
            // Roughly ~65 chars per line in a standard line
            let estimated_lines = ((p.len() as f64 / 65.0).ceil() as f64).max(1.0);
            let p_height = (estimated_lines * line_height_pt) + profile.typography.paragraph_spacing_pt;

            if current_height_used + p_height > usable_height_pt && !current_page_blocks.is_empty() {
                // Push current page
                let is_odd_now = body_page_counter % 2 != 0;
                let (ml, mr) = if is_odd_now {
                    (margin_inside_pt, margin_outside_pt)
                } else {
                    (margin_outside_pt, margin_inside_pt)
                };

                pages.push(create_body_page(
                    profile,
                    page_num,
                    body_page_counter,
                    &chapter_title,
                    current_page_blocks,
                    width_pt,
                    height_pt,
                    margin_top_pt,
                    margin_bottom_pt,
                    ml,
                    mr,
                ));
                page_num += 1;
                body_page_counter += 1;
                current_page_blocks = Vec::new();
                current_height_used = 0.0;
            }

            current_page_blocks.push(RenderedBlock::Paragraph {
                text: p.to_string(),
                is_first_in_chapter: is_first_p_in_chapter,
            });
            current_height_used += p_height;
            is_first_p_in_chapter = false;
        }

        // Flush remaining chapter blocks
        if !current_page_blocks.is_empty() {
            let is_odd_now = body_page_counter % 2 != 0;
            let (ml, mr) = if is_odd_now {
                (margin_inside_pt, margin_outside_pt)
            } else {
                (margin_outside_pt, margin_inside_pt)
            };

            pages.push(create_body_page(
                profile,
                page_num,
                body_page_counter,
                &chapter_title,
                current_page_blocks,
                width_pt,
                height_pt,
                margin_top_pt,
                margin_bottom_pt,
                ml,
                mr,
            ));
            page_num += 1;
            body_page_counter += 1;
        }
    }

    let total = pages.len();
    PaginationResult {
        total_pages: total,
        front_matter_pages: front_matter_count,
        body_pages: total - front_matter_count,
        pages,
        word_count: total_words,
    }
}

fn create_body_page(
    profile: &PublicationProfile,
    page_num: usize,
    body_page_counter: usize,
    chapter_title: &str,
    blocks: Vec<RenderedBlock>,
    width_pt: f64,
    height_pt: f64,
    margin_top_pt: f64,
    margin_bottom_pt: f64,
    margin_left_pt: f64,
    margin_right_pt: f64,
) -> RenderedPage {
    let is_odd = body_page_counter % 2 != 0;
    let page_str = body_page_counter.to_string();

    let header_left = if is_odd || !profile.headers_footers.odd_even_different {
        profile.headers_footers.left_header.replace("{chapter_title}", chapter_title).replace("{page_num}", &page_str)
    } else {
        profile.headers_footers.right_header.replace("{chapter_title}", chapter_title).replace("{page_num}", &page_str)
    };

    let header_right = if is_odd || !profile.headers_footers.odd_even_different {
        profile.headers_footers.right_header.replace("{chapter_title}", chapter_title).replace("{page_num}", &page_str)
    } else {
        profile.headers_footers.left_header.replace("{chapter_title}", chapter_title).replace("{page_num}", &page_str)
    };

    let footer_center = profile.headers_footers.center_footer.replace("{page_num}", &page_str);

    RenderedPage {
        page_number: page_num,
        display_number: page_str,
        is_front_matter: false,
        header_left,
        header_center: profile.headers_footers.center_header.clone(),
        header_right,
        footer_left: profile.headers_footers.left_footer.clone(),
        footer_center,
        footer_right: profile.headers_footers.right_footer.clone(),
        blocks,
        width_pt,
        height_pt,
        margin_top_pt,
        margin_bottom_pt,
        margin_left_pt,
        margin_right_pt,
    }
}

fn number_to_words(n: usize) -> String {
    match n {
        1 => "ONE",
        2 => "TWO",
        3 => "THREE",
        4 => "FOUR",
        5 => "FIVE",
        6 => "SIX",
        7 => "SEVEN",
        8 => "EIGHT",
        9 => "NINE",
        10 => "TEN",
        11 => "ELEVEN",
        12 => "TWELVE",
        13 => "THIRTEEN",
        14 => "FOURTEEN",
        15 => "FIFTEEN",
        16 => "SIXTEEN",
        17 => "SEVENTEEN",
        18 => "EIGHTEEN",
        19 => "NINETEEN",
        20 => "TWENTY",
        _ => return n.to_string(),
    }
    .to_string()
}

fn number_to_roman(n: usize) -> String {
    match n {
        1 => "I",
        2 => "II",
        3 => "III",
        4 => "IV",
        5 => "V",
        6 => "VI",
        7 => "VII",
        8 => "VIII",
        9 => "IX",
        10 => "X",
        11 => "XI",
        12 => "XII",
        _ => return n.to_string(),
    }
    .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::publish::profile::get_builtin_profiles;

    #[test]
    fn test_pagination_breaks_pages() {
        let profiles = get_builtin_profiles("The Forgotten Vaelrion");
        let profile = &profiles[0];

        let docs = vec![
            ManuscriptDocument {
                relative_path: "Manuscript/Chapter-01.md".to_string(),
                title: "Chapter 1".to_string(),
                content: "# Chapter One\n\nParagraph 1.\n\nParagraph 2.\n\n* * *\n\nParagraph 3.".to_string(),
            },
            ManuscriptDocument {
                relative_path: "Manuscript/Chapter-02.md".to_string(),
                title: "Chapter 2".to_string(),
                content: "# Chapter Two\n\nSecond chapter prose.".to_string(),
            },
        ];

        let res = paginate_manuscript(profile, &docs);
        assert!(res.total_pages >= 3); // Title page + 2 chapters
        assert!(res.front_matter_pages >= 1);
        assert!(res.word_count > 10);
    }
}
