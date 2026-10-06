use crate::error::Result;
use crate::publish::pagination::{PaginationResult, RenderedBlock};
use crate::publish::profile::PublicationProfile;
use printpdf::{
    BuiltinFont, Color, Mm, PdfDocument, Rgb,
};
use std::fs::File;
use std::io::BufWriter;
use std::path::Path;

pub fn generate_pdf(
    profile: &PublicationProfile,
    pagination: &PaginationResult,
    output_path: &Path,
) -> Result<()> {
    let width_mm = profile.page_size.width_in * 25.4;
    let height_mm = profile.page_size.height_in * 25.4;

    let doc_title = if !profile.front_matter.title.is_empty() {
        &profile.front_matter.title
    } else {
        "Swrite Manuscript"
    };

    let (doc, page1, layer1) = PdfDocument::new(doc_title, Mm(width_mm as f32), Mm(height_mm as f32), "Layer 1");

    // Map profile font to built-in standard PDF font
    let (body_font, heading_font) = match profile.typography.body_font.to_lowercase().as_str() {
        s if s.contains("courier") || s.contains("mono") => (
            doc.add_builtin_font(BuiltinFont::Courier).map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(e.to_string()))?,
            doc.add_builtin_font(BuiltinFont::CourierBold).map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(e.to_string()))?,
        ),
        s if s.contains("sans") || s.contains("helvetica") || s.contains("arial") => (
            doc.add_builtin_font(BuiltinFont::Helvetica).map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(e.to_string()))?,
            doc.add_builtin_font(BuiltinFont::HelveticaBold).map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(e.to_string()))?,
        ),
        _ => (
            doc.add_builtin_font(BuiltinFont::TimesRoman).map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(e.to_string()))?,
            doc.add_builtin_font(BuiltinFont::TimesBold).map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(e.to_string()))?,
        ),
    };

    let body_font_size = profile.typography.font_size_pt as f32;
    let line_height_mm = (profile.typography.font_size_pt * profile.typography.line_height * 0.352778) as f32;

    for (idx, rendered_page) in pagination.pages.iter().enumerate() {
        let (current_page, current_layer) = if idx == 0 {
            (page1, layer1)
        } else {
            doc.add_page(Mm(width_mm as f32), Mm(height_mm as f32), "Layer 1")
        };

        let layer = doc.get_page(current_page).get_layer(current_layer);
        layer.set_fill_color(Color::Rgb(Rgb::new(0.1, 0.1, 0.1, None)));

        let margin_top_mm = (rendered_page.margin_top_pt * 0.352778) as f32;
        let margin_left_mm = (rendered_page.margin_left_pt * 0.352778) as f32;
        let margin_right_mm = (rendered_page.margin_right_pt * 0.352778) as f32;
        let usable_width_mm = (width_mm as f32) - margin_left_mm - margin_right_mm;

        let mut current_y_mm = (height_mm as f32) - margin_top_mm;

        // Running Headers
        if profile.headers_footers.show_header && !rendered_page.is_front_matter {
            let header_y = (height_mm as f32) - (margin_top_mm * 0.6);
            if !rendered_page.header_left.is_empty() {
                layer.use_text(&rendered_page.header_left, 9.0, Mm(margin_left_mm), Mm(header_y), &body_font);
            }
            if !rendered_page.header_right.is_empty() {
                let text_len_est = rendered_page.header_right.len() as f32 * 1.8;
                let right_x = ((width_mm as f32) - margin_right_mm - text_len_est).max(margin_left_mm);
                layer.use_text(&rendered_page.header_right, 9.0, Mm(right_x), Mm(header_y), &body_font);
            }
        }

        // Running Footers / Page Numbers
        if profile.headers_footers.show_footer && !rendered_page.is_front_matter {
            let footer_y = (rendered_page.margin_bottom_pt * 0.352778 * 0.6) as f32;
            if !rendered_page.footer_center.is_empty() {
                let center_x = (width_mm as f32) / 2.0 - 4.0;
                layer.use_text(&rendered_page.footer_center, 9.5, Mm(center_x), Mm(footer_y), &body_font);
            }
        }

        // Page Blocks
        for block in &rendered_page.blocks {
            match block {
                RenderedBlock::TitlePage { title, subtitle, author, edition, .. } => {
                    let title_y = (height_mm as f32) * 0.65;
                    layer.use_text(title, 24.0, Mm(margin_left_mm + 10.0), Mm(title_y), &heading_font);
                    if let Some(ref sub) = subtitle {
                        layer.use_text(sub, 14.0, Mm(margin_left_mm + 10.0), Mm(title_y - 12.0), &body_font);
                    }
                    layer.use_text(author, 14.0, Mm(margin_left_mm + 10.0), Mm(title_y - 35.0), &body_font);
                    if let Some(ref ed) = edition {
                        layer.use_text(ed, 10.0, Mm(margin_left_mm + 10.0), Mm(title_y - 45.0), &body_font);
                    }
                }
                RenderedBlock::CopyrightPage { text } => {
                    let mut cp_y = 40.0;
                    for line in text.lines() {
                        layer.use_text(line, 9.0, Mm(margin_left_mm), Mm(cp_y), &body_font);
                        cp_y -= 4.0;
                    }
                }
                RenderedBlock::DedicationPage { text } => {
                    let ded_y = (height_mm as f32) * 0.55;
                    layer.use_text(text, 11.0, Mm(margin_left_mm + 15.0), Mm(ded_y), &body_font);
                }
                RenderedBlock::EpigraphPage { text } => {
                    let epi_y = (height_mm as f32) * 0.55;
                    layer.use_text(text, 10.5, Mm(margin_left_mm + 15.0), Mm(epi_y), &body_font);
                }
                RenderedBlock::ChapterTitle { number_label, title, ornament } => {
                    current_y_mm -= (profile.chapter_style.spacing_top_pt * 0.352778) as f32;
                    if let Some(ref label) = number_label {
                        let label_x = if profile.chapter_style.alignment == "center" {
                            margin_left_mm + (usable_width_mm / 2.0) - (label.len() as f32 * 2.2)
                        } else {
                            margin_left_mm
                        };
                        layer.use_text(label, 12.0, Mm(label_x.max(margin_left_mm)), Mm(current_y_mm), &heading_font);
                        current_y_mm -= 8.0;
                    }

                    let title_text = match profile.chapter_style.title_case.as_str() {
                        "uppercase" => title.to_uppercase(),
                        _ => title.clone(),
                    };

                    let title_x = if profile.chapter_style.alignment == "center" {
                        margin_left_mm + (usable_width_mm / 2.0) - (title_text.len() as f32 * 2.8)
                    } else {
                        margin_left_mm
                    };
                    layer.use_text(&title_text, 16.0, Mm(title_x.max(margin_left_mm)), Mm(current_y_mm), &heading_font);
                    current_y_mm -= 10.0;

                    if let Some(ref orn) = ornament {
                        let orn_x = margin_left_mm + (usable_width_mm / 2.0) - (orn.len() as f32 * 2.0);
                        layer.use_text(orn, 11.0, Mm(orn_x.max(margin_left_mm)), Mm(current_y_mm), &body_font);
                        current_y_mm -= 8.0;
                    }
                    current_y_mm -= 4.0;
                }
                RenderedBlock::Paragraph { text, is_first_in_chapter } => {
                    let indent_mm = if *is_first_in_chapter || profile.typography.paragraph_indent_in == 0.0 {
                        0.0
                    } else {
                        (profile.typography.paragraph_indent_in * 25.4) as f32
                    };

                    // Simple word wrap
                    let words = text.split_whitespace().collect::<Vec<&str>>();
                    let mut current_line = String::new();
                    let mut is_first_line = true;

                    for word in words {
                        let test_line = if current_line.is_empty() {
                            word.to_string()
                        } else {
                            format!("{} {}", current_line, word)
                        };

                        let max_chars = if is_first_line {
                            ((usable_width_mm - indent_mm) / 1.9) as usize
                        } else {
                            (usable_width_mm / 1.9) as usize
                        };

                        if test_line.len() > max_chars && !current_line.is_empty() {
                            let start_x = if is_first_line {
                                margin_left_mm + indent_mm
                            } else {
                                margin_left_mm
                            };
                            layer.use_text(&current_line, body_font_size, Mm(start_x), Mm(current_y_mm), &body_font);
                            current_y_mm -= line_height_mm;
                            current_line = word.to_string();
                            is_first_line = false;
                        } else {
                            current_line = test_line;
                        }
                    }

                    if !current_line.is_empty() {
                        let start_x = if is_first_line {
                            margin_left_mm + indent_mm
                        } else {
                            margin_left_mm
                        };
                        layer.use_text(&current_line, body_font_size, Mm(start_x), Mm(current_y_mm), &body_font);
                        current_y_mm -= line_height_mm;
                    }

                    current_y_mm -= (profile.typography.paragraph_spacing_pt * 0.352778) as f32;
                }
                RenderedBlock::SceneBreak { symbol } => {
                    current_y_mm -= 4.0;
                    let break_x = margin_left_mm + (usable_width_mm / 2.0) - (symbol.len() as f32 * 2.0);
                    layer.use_text(symbol, 11.0, Mm(break_x.max(margin_left_mm)), Mm(current_y_mm), &body_font);
                    current_y_mm -= 8.0;
                }
                RenderedBlock::Image { alt, .. } => {
                    layer.use_text(&format!("[Image: {}]", alt), 10.0, Mm(margin_left_mm), Mm(current_y_mm), &body_font);
                    current_y_mm -= 8.0;
                }
            }
        }
    }

    let file = File::create(output_path)?;
    let mut writer = BufWriter::new(file);
    doc.save(&mut writer).map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(e.to_string()))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::publish::pagination::paginate_manuscript;
    use crate::publish::preflight::ManuscriptDocument;
    use crate::publish::profile::get_builtin_profiles;
    use tempfile::tempdir;

    #[test]
    fn test_pdf_generation_smoke() {
        let dir = tempdir().unwrap();
        let pdf_path = dir.path().join("test_book.pdf");

        let profiles = get_builtin_profiles("The Forgotten Vaelrion");
        let profile = &profiles[0]; // Trade Paperback

        let docs = vec![ManuscriptDocument {
            relative_path: "Manuscript/Chapter-01.md".to_string(),
            title: "Chapter 1".to_string(),
            content: "# Chapter One\n\nThe snow fell heavily upon the obsidian spires.\n\n* * *\n\nKael turned towards the gate.".to_string(),
        }];

        let pagination = paginate_manuscript(profile, &docs);
        generate_pdf(profile, &pagination, &pdf_path).unwrap();

        assert!(pdf_path.exists());
        let meta = std::fs::metadata(&pdf_path).unwrap();
        assert!(meta.len() > 100);
    }
}
