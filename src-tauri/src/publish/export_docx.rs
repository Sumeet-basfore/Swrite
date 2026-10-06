use crate::error::Result;
use crate::publish::preflight::ManuscriptDocument;
use crate::publish::profile::PublicationProfile;
use std::fs::File;
use std::io::Write;
use std::path::Path;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

pub fn generate_docx(
    profile: &PublicationProfile,
    documents: &[ManuscriptDocument],
    output_path: &Path,
) -> Result<()> {
    let file = File::create(output_path)?;
    let mut zip = ZipWriter::new(file);
    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    // 1. [Content_Types].xml
    zip.start_file("[Content_Types].xml", options)
        .map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(e.to_string()))?;
    zip.write_all(CONTENT_TYPES_XML.as_bytes())?;

    // 2. _rels/.rels
    zip.start_file("_rels/.rels", options)
        .map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(e.to_string()))?;
    zip.write_all(RELS_XML.as_bytes())?;

    // 3. word/_rels/document.xml.rels
    zip.start_file("word/_rels/document.xml.rels", options)
        .map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(e.to_string()))?;
    zip.write_all(DOCUMENT_RELS_XML.as_bytes())?;

    // 4. word/styles.xml
    zip.start_file("word/styles.xml", options)
        .map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(e.to_string()))?;
    zip.write_all(STYLES_XML.as_bytes())?;

    // 5. word/document.xml
    zip.start_file("word/document.xml", options)
        .map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(e.to_string()))?;

    let top_dxa = (profile.margins.top_in * 1440.0) as u32;
    let bottom_dxa = (profile.margins.bottom_in * 1440.0) as u32;
    let left_dxa = (profile.margins.inside_in * 1440.0) as u32;
    let right_dxa = (profile.margins.outside_in * 1440.0) as u32;
    let width_dxa = (profile.page_size.width_in * 1440.0) as u32;
    let height_dxa = (profile.page_size.height_in * 1440.0) as u32;

    let font_family = &profile.typography.body_font;
    let half_pt_size = (profile.typography.font_size_pt * 2.0) as u32;
    let line_spacing_dxa = (profile.typography.font_size_pt * profile.typography.line_height * 20.0) as u32;
    let indent_dxa = (profile.typography.paragraph_indent_in * 1440.0) as u32;

    let mut body_xml = String::new();

    // Front Matter Title Page
    if profile.front_matter.include_title_page {
        body_xml.push_str(&format!(
            r#"<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="2880" w:after="720"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="{font}" w:hAnsi="{font}"/><w:b/><w:sz w:val="{title_sz}"/></w:rPr><w:t>{title}</w:t></w:r></w:p>"#,
            font = font_family,
            title_sz = half_pt_size + 16,
            title = escape_xml(&profile.front_matter.title)
        ));

        if let Some(ref sub) = profile.front_matter.subtitle {
            body_xml.push_str(&format!(
                r#"<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="1440"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="{font}" w:hAnsi="{font}"/><w:sz w:val="{sub_sz}"/></w:rPr><w:t>{sub}</w:t></w:r></w:p>"#,
                font = font_family,
                sub_sz = half_pt_size + 4,
                sub = escape_xml(sub)
            ));
        }

        body_xml.push_str(&format!(
            r#"<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="1440" w:after="720"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="{font}" w:hAnsi="{font}"/><w:sz w:val="{half_sz}"/></w:rPr><w:t>by {author}</w:t></w:r></w:p>"#,
            font = font_family,
            half_sz = half_pt_size + 2,
            author = escape_xml(&profile.front_matter.author)
        ));

        // Page break after title page
        body_xml.push_str(r#"<w:p><w:r><w:br w:type="page"/></w:r></w:p>"#);
    }

    // Chapters
    for (doc_idx, doc) in documents.iter().enumerate() {
        if doc_idx > 0 && !profile.front_matter.include_title_page {
            body_xml.push_str(r#"<w:p><w:r><w:br w:type="page"/></w:r></w:p>"#);
        }

        let mut lines = doc.content.lines().peekable();
        let mut chapter_title = doc.title.clone();

        if let Some(first_line) = lines.peek() {
            if first_line.starts_with("# ") {
                chapter_title = first_line.trim_start_matches("# ").trim().to_string();
                lines.next();
            }
        }

        // Chapter Heading
        body_xml.push_str(&format!(
            r#"<w:p><w:pPr><w:jc w:val="{align}"/><w:spacing w:before="{top_space}" w:after="720"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="{font}" w:hAnsi="{font}"/><w:b/><w:sz w:val="{head_sz}"/></w:rPr><w:t>{title}</w:t></w:r></w:p>"#,
            align = profile.chapter_style.alignment,
            top_space = (profile.chapter_style.spacing_top_pt * 20.0) as u32,
            font = font_family,
            head_sz = half_pt_size + 8,
            title = escape_xml(&chapter_title)
        ));

        let rest_content = lines.collect::<Vec<&str>>().join("\n");
        let paragraphs = rest_content.split("\n\n");

        for raw_p in paragraphs {
            let p = raw_p.trim();
            if p.is_empty() {
                continue;
            }

            if p == "* * *" || p == "✦ ✦ ✦" || p == "---" || p == "***" || p == "#" {
                let symbol = profile.scene_break_style.custom_text.clone().unwrap_or_else(|| "* * *".to_string());
                body_xml.push_str(&format!(
                    r#"<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="360" w:after="360"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="{font}" w:hAnsi="{font}"/><w:sz w:val="{half_sz}"/></w:rPr><w:t>{sym}</w:t></w:r></w:p>"#,
                    font = font_family,
                    half_sz = half_pt_size,
                    sym = escape_xml(&symbol)
                ));
            } else {
                body_xml.push_str(&format!(
                    r#"<w:p><w:pPr><w:ind w:firstLine="{indent}"/><w:spacing w:line="{line_sp}" w:lineRule="exact"/><w:jc w:val="{align}"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="{font}" w:hAnsi="{font}"/><w:sz w:val="{half_sz}"/></w:rPr><w:t xml:space="preserve">{text}</w:t></w:r></w:p>"#,
                    indent = indent_dxa,
                    line_sp = line_spacing_dxa,
                    align = if profile.typography.text_align == "justify" { "both" } else { "left" },
                    font = font_family,
                    half_sz = half_pt_size,
                    text = escape_xml(p)
                ));
            }
        }
    }

    let doc_xml = format!(
        r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {body}
    <w:sectPr>
      <w:pgSz w:w="{w}" w:h="{h}"/>
      <w:pgMar w:top="{top}" w:right="{right}" w:bottom="{bottom}" w:left="{left}" w:header="720" w:footer="720"/>
    </w:sectPr>
  </w:body>
</w:document>"#,
        body = body_xml,
        w = width_dxa,
        h = height_dxa,
        top = top_dxa,
        right = right_dxa,
        bottom = bottom_dxa,
        left = left_dxa
    );

    zip.write_all(doc_xml.as_bytes())?;
    zip.finish().map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(e.to_string()))?;

    Ok(())
}

fn escape_xml(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&apos;")
}

const CONTENT_TYPES_XML: &str = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>"#;

const RELS_XML: &str = r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
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
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>"#;

#[cfg(test)]
mod tests {
    use super::*;
    use crate::publish::profile::get_builtin_profiles;
    use tempfile::tempdir;

    #[test]
    fn test_docx_export_generation() {
        let dir = tempdir().unwrap();
        let out_path = dir.path().join("manuscript.docx");

        let profiles = get_builtin_profiles("The Forgotten Vaelrion");
        let profile = &profiles[1]; // Standard Manuscript — Shunn

        let docs = vec![ManuscriptDocument {
            relative_path: "Manuscript/Chapter-01.md".to_string(),
            title: "Chapter 1".to_string(),
            content: "# Chapter One\n\nDouble spaced prose for submission.\n\n#\n\nNext scene begins.".to_string(),
        }];

        generate_docx(profile, &docs, &out_path).unwrap();

        assert!(out_path.exists());
        let meta = std::fs::metadata(&out_path).unwrap();
        assert!(meta.len() > 500);
    }
}
