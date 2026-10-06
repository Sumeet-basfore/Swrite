use crate::error::Result;
use crate::filesystem::atomic_write::atomic_write_bytes;
use crate::filesystem::paths::resolve_secure_path;
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum OutputFormat {
    Pdf,
    Docx,
    Epub,
    Markdown,
    Txt,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct PageSizeConfig {
    pub width_in: f64,
    pub height_in: f64,
    pub preset: String, // "6x9", "5.5x8.5", "A5", "Letter", "Custom"
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct MarginsConfig {
    pub top_in: f64,
    pub bottom_in: f64,
    pub inside_in: f64,
    pub outside_in: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct TypographyConfig {
    pub body_font: String,
    pub heading_font: String,
    pub font_size_pt: f64,
    pub line_height: f64,
    pub paragraph_indent_in: f64,
    pub paragraph_spacing_pt: f64,
    pub text_align: String, // "justify", "left"
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct ChapterStyleConfig {
    pub numbering_style: String, // "words" (CHAPTER ONE), "arabic" (Chapter 1), "roman" (Chapter I), "none"
    pub title_case: String,      // "uppercase", "titlecase", "lowercase"
    pub alignment: String,       // "center", "left"
    pub spacing_top_pt: f64,
    pub drop_cap: bool,
    pub ornament: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct SceneBreakConfig {
    pub style: String, // "asterisks", "ornament", "blank_line", "custom"
    pub custom_text: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct HeadersFootersConfig {
    pub show_header: bool,
    pub show_footer: bool,
    pub left_header: String,
    pub center_header: String,
    pub right_header: String,
    pub left_footer: String,
    pub center_footer: String,
    pub right_footer: String,
    pub suppress_first_page: bool,
    pub odd_even_different: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct PageNumberingConfig {
    pub style: String, // "arabic", "roman", "none"
    pub start_at: u32,
    pub position: String, // "footer_center", "footer_outside", "header_outside", "header_center"
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct FrontMatterConfig {
    pub include_title_page: bool,
    pub title: String,
    pub subtitle: Option<String>,
    pub author: String,
    pub copyright: Option<String>,
    pub publisher: Option<String>,
    pub edition: Option<String>,
    pub dedication: Option<String>,
    pub epigraph: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct BackMatterConfig {
    pub include_acknowledgements: bool,
    pub acknowledgements_text: Option<String>,
    pub include_about_author: bool,
    pub about_author_text: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct PublicationProfile {
    pub id: String,
    pub name: String,
    pub description: String,
    pub is_builtin: bool,
    pub format: OutputFormat,
    pub page_size: PageSizeConfig,
    pub margins: MarginsConfig,
    pub typography: TypographyConfig,
    pub chapter_style: ChapterStyleConfig,
    pub scene_break_style: SceneBreakConfig,
    pub headers_footers: HeadersFootersConfig,
    pub page_numbering: PageNumberingConfig,
    pub front_matter: FrontMatterConfig,
    pub back_matter: BackMatterConfig,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct PublishProfilesData {
    pub active_profile_id: String,
    pub custom_profiles: Vec<PublicationProfile>,
}

pub fn get_builtin_profiles(project_name: &str) -> Vec<PublicationProfile> {
    vec![
        // 1. Trade Paperback — 6 x 9 in
        PublicationProfile {
            id: "builtin_trade_paperback_6x9".to_string(),
            name: "Trade Paperback — 6 × 9 in".to_string(),
            description: "Standard US trade paperback trim with comfortable margins and elegant serifs.".to_string(),
            is_builtin: true,
            format: OutputFormat::Pdf,
            page_size: PageSizeConfig {
                width_in: 6.0,
                height_in: 9.0,
                preset: "6x9".to_string(),
            },
            margins: MarginsConfig {
                top_in: 0.75,
                bottom_in: 0.75,
                inside_in: 0.75,
                outside_in: 0.5,
            },
            typography: TypographyConfig {
                body_font: "Garamond".to_string(),
                heading_font: "Garamond".to_string(),
                font_size_pt: 11.0,
                line_height: 1.35,
                paragraph_indent_in: 0.25,
                paragraph_spacing_pt: 0.0,
                text_align: "justify".to_string(),
            },
            chapter_style: ChapterStyleConfig {
                numbering_style: "words".to_string(),
                title_case: "uppercase".to_string(),
                alignment: "center".to_string(),
                spacing_top_pt: 72.0,
                drop_cap: false,
                ornament: Some("❦".to_string()),
            },
            scene_break_style: SceneBreakConfig {
                style: "asterisks".to_string(),
                custom_text: Some("* * *".to_string()),
            },
            headers_footers: HeadersFootersConfig {
                show_header: true,
                show_footer: true,
                left_header: project_name.to_string(),
                center_header: String::new(),
                right_header: "{chapter_title}".to_string(),
                left_footer: String::new(),
                center_footer: "{page_num}".to_string(),
                right_footer: String::new(),
                suppress_first_page: true,
                odd_even_different: true,
            },
            page_numbering: PageNumberingConfig {
                style: "arabic".to_string(),
                start_at: 1,
                position: "footer_center".to_string(),
            },
            front_matter: FrontMatterConfig {
                include_title_page: true,
                title: project_name.to_string(),
                subtitle: None,
                author: "Author Name".to_string(),
                copyright: Some("Copyright © 2026. All rights reserved.".to_string()),
                publisher: None,
                edition: Some("First Edition".to_string()),
                dedication: None,
                epigraph: None,
            },
            back_matter: BackMatterConfig {
                include_acknowledgements: false,
                acknowledgements_text: None,
                include_about_author: false,
                about_author_text: None,
            },
        },
        // 2. Standard Manuscript — Shunn
        PublicationProfile {
            id: "builtin_standard_manuscript_shunn".to_string(),
            name: "Standard Manuscript — Shunn".to_string(),
            description: "Industry-standard submission format for short fiction and novels (William Shunn guidelines).".to_string(),
            is_builtin: true,
            format: OutputFormat::Docx,
            page_size: PageSizeConfig {
                width_in: 8.5,
                height_in: 11.0,
                preset: "Letter".to_string(),
            },
            margins: MarginsConfig {
                top_in: 1.0,
                bottom_in: 1.0,
                inside_in: 1.0,
                outside_in: 1.0,
            },
            typography: TypographyConfig {
                body_font: "Courier Prime".to_string(),
                heading_font: "Courier Prime".to_string(),
                font_size_pt: 12.0,
                line_height: 2.0, // Double spaced
                paragraph_indent_in: 0.5,
                paragraph_spacing_pt: 0.0,
                text_align: "left".to_string(), // Flush left, ragged right
            },
            chapter_style: ChapterStyleConfig {
                numbering_style: "words".to_string(),
                title_case: "uppercase".to_string(),
                alignment: "center".to_string(),
                spacing_top_pt: 120.0,
                drop_cap: false,
                ornament: None,
            },
            scene_break_style: SceneBreakConfig {
                style: "custom".to_string(),
                custom_text: Some("#".to_string()),
            },
            headers_footers: HeadersFootersConfig {
                show_header: true,
                show_footer: false,
                left_header: String::new(),
                center_header: String::new(),
                right_header: "AUTHOR / {title_short} / {page_num}".to_string(),
                left_footer: String::new(),
                center_footer: String::new(),
                right_footer: String::new(),
                suppress_first_page: true,
                odd_even_different: false,
            },
            page_numbering: PageNumberingConfig {
                style: "arabic".to_string(),
                start_at: 1,
                position: "header_outside".to_string(),
            },
            front_matter: FrontMatterConfig {
                include_title_page: false, // Shunn uses first-page header block
                title: project_name.to_string(),
                subtitle: None,
                author: "Author Name".to_string(),
                copyright: None,
                publisher: None,
                edition: None,
                dedication: None,
                epigraph: None,
            },
            back_matter: BackMatterConfig {
                include_acknowledgements: false,
                acknowledgements_text: None,
                include_about_author: false,
                about_author_text: None,
            },
        },
        // 3. Digest Paperback — 5.5 x 8.5 in
        PublicationProfile {
            id: "builtin_digest_paperback_5.5x8.5".to_string(),
            name: "Digest Paperback — 5.5 × 8.5 in".to_string(),
            description: "Compact digest trim suitable for novellas, poetry, and compact editions.".to_string(),
            is_builtin: true,
            format: OutputFormat::Pdf,
            page_size: PageSizeConfig {
                width_in: 5.5,
                height_in: 8.5,
                preset: "5.5x8.5".to_string(),
            },
            margins: MarginsConfig {
                top_in: 0.65,
                bottom_in: 0.65,
                inside_in: 0.7,
                outside_in: 0.5,
            },
            typography: TypographyConfig {
                body_font: "Palatino".to_string(),
                heading_font: "Palatino".to_string(),
                font_size_pt: 10.5,
                line_height: 1.3,
                paragraph_indent_in: 0.22,
                paragraph_spacing_pt: 0.0,
                text_align: "justify".to_string(),
            },
            chapter_style: ChapterStyleConfig {
                numbering_style: "words".to_string(),
                title_case: "uppercase".to_string(),
                alignment: "center".to_string(),
                spacing_top_pt: 60.0,
                drop_cap: false,
                ornament: Some("✦ ✦ ✦".to_string()),
            },
            scene_break_style: SceneBreakConfig {
                style: "asterisks".to_string(),
                custom_text: Some("✦ ✦ ✦".to_string()),
            },
            headers_footers: HeadersFootersConfig {
                show_header: true,
                show_footer: true,
                left_header: project_name.to_string(),
                center_header: String::new(),
                right_header: "{chapter_title}".to_string(),
                left_footer: String::new(),
                center_footer: "{page_num}".to_string(),
                right_footer: String::new(),
                suppress_first_page: true,
                odd_even_different: true,
            },
            page_numbering: PageNumberingConfig {
                style: "arabic".to_string(),
                start_at: 1,
                position: "footer_center".to_string(),
            },
            front_matter: FrontMatterConfig {
                include_title_page: true,
                title: project_name.to_string(),
                subtitle: None,
                author: "Author Name".to_string(),
                copyright: Some("Copyright © 2026. All rights reserved.".to_string()),
                publisher: None,
                edition: None,
                dedication: None,
                epigraph: None,
            },
            back_matter: BackMatterConfig {
                include_acknowledgements: false,
                acknowledgements_text: None,
                include_about_author: false,
                about_author_text: None,
            },
        },
        // 4. Classic Book — A5
        PublicationProfile {
            id: "builtin_classic_book_a5".to_string(),
            name: "Classic Book — A5".to_string(),
            description: "European standard ISO A5 trim with classical book proportions.".to_string(),
            is_builtin: true,
            format: OutputFormat::Pdf,
            page_size: PageSizeConfig {
                width_in: 5.83,
                height_in: 8.27,
                preset: "A5".to_string(),
            },
            margins: MarginsConfig {
                top_in: 0.7,
                bottom_in: 0.7,
                inside_in: 0.75,
                outside_in: 0.55,
            },
            typography: TypographyConfig {
                body_font: "Baskerville".to_string(),
                heading_font: "Baskerville".to_string(),
                font_size_pt: 10.5,
                line_height: 1.35,
                paragraph_indent_in: 0.25,
                paragraph_spacing_pt: 0.0,
                text_align: "justify".to_string(),
            },
            chapter_style: ChapterStyleConfig {
                numbering_style: "roman".to_string(),
                title_case: "uppercase".to_string(),
                alignment: "center".to_string(),
                spacing_top_pt: 65.0,
                drop_cap: false,
                ornament: Some("~ ❧ ~".to_string()),
            },
            scene_break_style: SceneBreakConfig {
                style: "asterisks".to_string(),
                custom_text: Some("* * *".to_string()),
            },
            headers_footers: HeadersFootersConfig {
                show_header: true,
                show_footer: true,
                left_header: project_name.to_string(),
                center_header: String::new(),
                right_header: "{chapter_title}".to_string(),
                left_footer: String::new(),
                center_footer: "{page_num}".to_string(),
                right_footer: String::new(),
                suppress_first_page: true,
                odd_even_different: true,
            },
            page_numbering: PageNumberingConfig {
                style: "arabic".to_string(),
                start_at: 1,
                position: "footer_center".to_string(),
            },
            front_matter: FrontMatterConfig {
                include_title_page: true,
                title: project_name.to_string(),
                subtitle: None,
                author: "Author Name".to_string(),
                copyright: Some("Copyright © 2026.".to_string()),
                publisher: None,
                edition: None,
                dedication: None,
                epigraph: None,
            },
            back_matter: BackMatterConfig {
                include_acknowledgements: false,
                acknowledgements_text: None,
                include_about_author: false,
                about_author_text: None,
            },
        },
        // 5. Digital EPUB
        PublicationProfile {
            id: "builtin_digital_epub".to_string(),
            name: "Digital EPUB".to_string(),
            description: "Reflowable EPUB 3 ebook package ready for e-readers and mobile devices.".to_string(),
            is_builtin: true,
            format: OutputFormat::Epub,
            page_size: PageSizeConfig {
                width_in: 0.0,
                height_in: 0.0,
                preset: "Reflowable".to_string(),
            },
            margins: MarginsConfig {
                top_in: 0.0,
                bottom_in: 0.0,
                inside_in: 0.0,
                outside_in: 0.0,
            },
            typography: TypographyConfig {
                body_font: "serif".to_string(),
                heading_font: "sans-serif".to_string(),
                font_size_pt: 12.0,
                line_height: 1.4,
                paragraph_indent_in: 0.25,
                paragraph_spacing_pt: 0.0,
                text_align: "justify".to_string(),
            },
            chapter_style: ChapterStyleConfig {
                numbering_style: "words".to_string(),
                title_case: "titlecase".to_string(),
                alignment: "center".to_string(),
                spacing_top_pt: 30.0,
                drop_cap: false,
                ornament: Some("✦ ✦ ✦".to_string()),
            },
            scene_break_style: SceneBreakConfig {
                style: "asterisks".to_string(),
                custom_text: Some("* * *".to_string()),
            },
            headers_footers: HeadersFootersConfig {
                show_header: false,
                show_footer: false,
                left_header: String::new(),
                center_header: String::new(),
                right_header: String::new(),
                left_footer: String::new(),
                center_footer: String::new(),
                right_footer: String::new(),
                suppress_first_page: true,
                odd_even_different: false,
            },
            page_numbering: PageNumberingConfig {
                style: "none".to_string(),
                start_at: 1,
                position: "none".to_string(),
            },
            front_matter: FrontMatterConfig {
                include_title_page: true,
                title: project_name.to_string(),
                subtitle: None,
                author: "Author Name".to_string(),
                copyright: Some("Copyright © 2026.".to_string()),
                publisher: None,
                edition: None,
                dedication: None,
                epigraph: None,
            },
            back_matter: BackMatterConfig {
                include_acknowledgements: true,
                acknowledgements_text: None,
                include_about_author: true,
                about_author_text: None,
            },
        },
        // 6. Plain Markdown
        PublicationProfile {
            id: "builtin_plain_markdown".to_string(),
            name: "Plain Markdown".to_string(),
            description: "Clean semantic Markdown file without theme styles, UI attributes, or proprietary tags.".to_string(),
            is_builtin: true,
            format: OutputFormat::Markdown,
            page_size: PageSizeConfig {
                width_in: 0.0,
                height_in: 0.0,
                preset: "PlainText".to_string(),
            },
            margins: MarginsConfig {
                top_in: 0.0,
                bottom_in: 0.0,
                inside_in: 0.0,
                outside_in: 0.0,
            },
            typography: TypographyConfig {
                body_font: "monospace".to_string(),
                heading_font: "monospace".to_string(),
                font_size_pt: 12.0,
                line_height: 1.5,
                paragraph_indent_in: 0.0,
                paragraph_spacing_pt: 12.0,
                text_align: "left".to_string(),
            },
            chapter_style: ChapterStyleConfig {
                numbering_style: "words".to_string(),
                title_case: "titlecase".to_string(),
                alignment: "left".to_string(),
                spacing_top_pt: 0.0,
                drop_cap: false,
                ornament: None,
            },
            scene_break_style: SceneBreakConfig {
                style: "custom".to_string(),
                custom_text: Some("* * *".to_string()),
            },
            headers_footers: HeadersFootersConfig {
                show_header: false,
                show_footer: false,
                left_header: String::new(),
                center_header: String::new(),
                right_header: String::new(),
                left_footer: String::new(),
                center_footer: String::new(),
                right_footer: String::new(),
                suppress_first_page: true,
                odd_even_different: false,
            },
            page_numbering: PageNumberingConfig {
                style: "none".to_string(),
                start_at: 1,
                position: "none".to_string(),
            },
            front_matter: FrontMatterConfig {
                include_title_page: false,
                title: project_name.to_string(),
                subtitle: None,
                author: "Author Name".to_string(),
                copyright: None,
                publisher: None,
                edition: None,
                dedication: None,
                epigraph: None,
            },
            back_matter: BackMatterConfig {
                include_acknowledgements: false,
                acknowledgements_text: None,
                include_about_author: false,
                about_author_text: None,
            },
        },
        // 7. Plain Text
        PublicationProfile {
            id: "builtin_plain_text".to_string(),
            name: "Plain Text".to_string(),
            description: "Unformatted plain text stream with clean line breaks.".to_string(),
            is_builtin: true,
            format: OutputFormat::Txt,
            page_size: PageSizeConfig {
                width_in: 0.0,
                height_in: 0.0,
                preset: "PlainText".to_string(),
            },
            margins: MarginsConfig {
                top_in: 0.0,
                bottom_in: 0.0,
                inside_in: 0.0,
                outside_in: 0.0,
            },
            typography: TypographyConfig {
                body_font: "monospace".to_string(),
                heading_font: "monospace".to_string(),
                font_size_pt: 12.0,
                line_height: 1.5,
                paragraph_indent_in: 0.0,
                paragraph_spacing_pt: 12.0,
                text_align: "left".to_string(),
            },
            chapter_style: ChapterStyleConfig {
                numbering_style: "words".to_string(),
                title_case: "uppercase".to_string(),
                alignment: "left".to_string(),
                spacing_top_pt: 0.0,
                drop_cap: false,
                ornament: None,
            },
            scene_break_style: SceneBreakConfig {
                style: "custom".to_string(),
                custom_text: Some("* * *".to_string()),
            },
            headers_footers: HeadersFootersConfig {
                show_header: false,
                show_footer: false,
                left_header: String::new(),
                center_header: String::new(),
                right_header: String::new(),
                left_footer: String::new(),
                center_footer: String::new(),
                right_footer: String::new(),
                suppress_first_page: true,
                odd_even_different: false,
            },
            page_numbering: PageNumberingConfig {
                style: "none".to_string(),
                start_at: 1,
                position: "none".to_string(),
            },
            front_matter: FrontMatterConfig {
                include_title_page: false,
                title: project_name.to_string(),
                subtitle: None,
                author: "Author Name".to_string(),
                copyright: None,
                publisher: None,
                edition: None,
                dedication: None,
                epigraph: None,
            },
            back_matter: BackMatterConfig {
                include_acknowledgements: false,
                acknowledgements_text: None,
                include_about_author: false,
                about_author_text: None,
            },
        },
    ]
}

pub fn load_profiles_data(project_root: &Path, _project_name: &str) -> Result<PublishProfilesData> {
    let internal_path = resolve_secure_path(project_root, ".swrite/publish_profiles.json", true)?;
    if !internal_path.exists() {
        return Ok(PublishProfilesData {
            active_profile_id: "builtin_trade_paperback_6x9".to_string(),
            custom_profiles: Vec::new(),
        });
    }

    let bytes = std::fs::read(&internal_path)?;
    let data: PublishProfilesData = serde_json::from_slice(&bytes)
        .map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(format!("Corrupt publish_profiles.json: {}", e)))?;
    Ok(data)
}

pub fn save_profiles_data(project_root: &Path, data: &PublishProfilesData) -> Result<()> {
    let internal_path = resolve_secure_path(project_root, ".swrite/publish_profiles.json", true)?;
    let serialized = serde_json::to_vec_pretty(data)
        .map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(format!("Failed to serialize publish profiles: {}", e)))?;
    atomic_write_bytes(&internal_path, &serialized)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_builtin_profiles_presence() {
        let profiles = get_builtin_profiles("The Forgotten Vaelrion");
        assert_eq!(profiles.len(), 7);
        assert_eq!(profiles[0].id, "builtin_trade_paperback_6x9");
        assert_eq!(profiles[1].id, "builtin_standard_manuscript_shunn");
        assert_eq!(profiles[4].format, OutputFormat::Epub);
    }

    #[test]
    fn test_profiles_save_and_load() {
        let dir = tempdir().unwrap();
        let root = dir.path();
        std::fs::create_dir_all(root.join(".swrite")).unwrap();

        let mut data = PublishProfilesData {
            active_profile_id: "custom_novel_01".to_string(),
            custom_profiles: vec![],
        };

        let custom = PublicationProfile {
            id: "custom_novel_01".to_string(),
            name: "My Custom Novel".to_string(),
            description: "Custom trim".to_string(),
            is_builtin: false,
            format: OutputFormat::Pdf,
            page_size: PageSizeConfig {
                width_in: 6.0,
                height_in: 9.0,
                preset: "6x9".to_string(),
            },
            margins: MarginsConfig {
                top_in: 0.8,
                bottom_in: 0.8,
                inside_in: 0.8,
                outside_in: 0.6,
            },
            typography: TypographyConfig {
                body_font: "Georgia".to_string(),
                heading_font: "Georgia".to_string(),
                font_size_pt: 11.5,
                line_height: 1.4,
                paragraph_indent_in: 0.3,
                paragraph_spacing_pt: 0.0,
                text_align: "justify".to_string(),
            },
            chapter_style: ChapterStyleConfig {
                numbering_style: "words".to_string(),
                title_case: "uppercase".to_string(),
                alignment: "center".to_string(),
                spacing_top_pt: 72.0,
                drop_cap: false,
                ornament: None,
            },
            scene_break_style: SceneBreakConfig {
                style: "asterisks".to_string(),
                custom_text: Some("* * *".to_string()),
            },
            headers_footers: HeadersFootersConfig {
                show_header: true,
                show_footer: true,
                left_header: "Title".to_string(),
                center_header: String::new(),
                right_header: "{chapter_title}".to_string(),
                left_footer: String::new(),
                center_footer: "{page_num}".to_string(),
                right_footer: String::new(),
                suppress_first_page: true,
                odd_even_different: true,
            },
            page_numbering: PageNumberingConfig {
                style: "arabic".to_string(),
                start_at: 1,
                position: "footer_center".to_string(),
            },
            front_matter: FrontMatterConfig {
                include_title_page: true,
                title: "Custom Title".to_string(),
                subtitle: None,
                author: "Custom Author".to_string(),
                copyright: None,
                publisher: None,
                edition: None,
                dedication: None,
                epigraph: None,
            },
            back_matter: BackMatterConfig {
                include_acknowledgements: false,
                acknowledgements_text: None,
                include_about_author: false,
                about_author_text: None,
            },
        };

        data.custom_profiles.push(custom);
        save_profiles_data(root, &data).unwrap();

        let loaded = load_profiles_data(root, "My Novel").unwrap();
        assert_eq!(loaded.active_profile_id, "custom_novel_01");
        assert_eq!(loaded.custom_profiles.len(), 1);
        assert_eq!(loaded.custom_profiles[0].name, "My Custom Novel");
    }
}
