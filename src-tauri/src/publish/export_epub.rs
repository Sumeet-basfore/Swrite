use crate::error::Result;
use crate::publish::preflight::ManuscriptDocument;
use crate::publish::profile::PublicationProfile;
use std::fs::File;
use std::io::Write;
use std::path::Path;
use uuid::Uuid;
use zip::write::SimpleFileOptions;
use zip::ZipWriter;

pub fn generate_epub(
    _project_root: &Path,
    profile: &PublicationProfile,
    documents: &[ManuscriptDocument],
    output_path: &Path,
) -> Result<()> {
    let file = File::create(output_path)?;
    let mut zip = ZipWriter::new(file);

    // 1. mimetype (MUST be first, uncompressed)
    let stored_options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Stored);
    let deflated_options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    zip.start_file("mimetype", stored_options)
        .map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(e.to_string()))?;
    zip.write_all(b"application/epub+zip")?;

    // 2. META-INF/container.xml
    zip.start_file("META-INF/container.xml", deflated_options)
        .map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(e.to_string()))?;
    let container_xml = r#"<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>"#;
    zip.write_all(container_xml.as_bytes())?;

    // 3. EPUB/style.css
    zip.start_file("EPUB/style.css", deflated_options)
        .map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(e.to_string()))?;
    let css = format!(
        r#"body {{
  font-family: {body_font};
  font-size: {font_size}pt;
  line-height: {line_height};
  text-align: {align};
  margin: 5% 5%;
  color: #111;
}}
h1, h2, h3 {{
  font-family: {head_font};
  text-align: {head_align};
  margin-top: 2em;
  margin-bottom: 1em;
}}
p {{
  margin: 0;
  padding: 0;
  text-indent: {indent}in;
}}
p.first-p {{
  text-indent: 0;
}}
.scene-break {{
  text-align: center;
  margin: 1.5em 0;
  font-size: 1.1em;
  letter-spacing: 0.2em;
}}
.title-page {{
  text-align: center;
  margin-top: 20%;
}}
.book-title {{
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 0.5em;
}}
.book-author {{
  font-size: 1.2em;
  margin-top: 2em;
}}"#,
        body_font = &profile.typography.body_font,
        font_size = profile.typography.font_size_pt,
        line_height = profile.typography.line_height,
        align = if profile.typography.text_align == "justify" { "justify" } else { "left" },
        head_font = &profile.typography.heading_font,
        head_align = &profile.chapter_style.alignment,
        indent = profile.typography.paragraph_indent_in,
    );
    zip.write_all(css.as_bytes())?;

    let book_uuid = Uuid::new_v4().to_string();
    let mut manifest_items = Vec::new();
    let mut spine_items = Vec::new();
    let mut nav_toc_entries = Vec::new();

    manifest_items.push(r#"<item id="style" href="style.css" media-type="text/css"/>"#.to_string());
    manifest_items.push(r#"<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>"#.to_string());
    manifest_items.push(r#"<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>"#.to_string());

    // Title page item
    if profile.front_matter.include_title_page {
        zip.start_file("EPUB/titlepage.xhtml", deflated_options)
            .map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(e.to_string()))?;
        let title_html = format!(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head>
  <title>{title}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <section class="title-page">
    <h1 class="book-title">{title}</h1>
    {subtitle_html}
    <p class="book-author">by {author}</p>
  </section>
</body>
</html>"#,
            title = escape_html(&profile.front_matter.title),
            subtitle_html = profile.front_matter.subtitle.as_ref()
                .map(|s| format!(r#"<p class="book-subtitle">{}</p>"#, escape_html(s)))
                .unwrap_or_default(),
            author = escape_html(&profile.front_matter.author),
        );
        zip.write_all(title_html.as_bytes())?;

        manifest_items.push(r#"<item id="titlepage" href="titlepage.xhtml" media-type="application/xhtml+xml"/>"#.to_string());
        spine_items.push(r#"<itemref idref="titlepage"/>"#.to_string());
    }

    // Chapters
    for (idx, doc) in documents.iter().enumerate() {
        let file_id = format!("ch{:02}", idx + 1);
        let file_name = format!("{}.xhtml", file_id);

        let mut lines = doc.content.lines().peekable();
        let mut chapter_title = doc.title.clone();

        if let Some(first_line) = lines.peek() {
            if first_line.starts_with("# ") {
                chapter_title = first_line.trim_start_matches("# ").trim().to_string();
                lines.next();
            }
        }

        let mut ch_body_html = String::new();
        ch_body_html.push_str(&format!(
            r#"<h1>{}</h1>"#,
            escape_html(&chapter_title)
        ));

        let rest_content = lines.collect::<Vec<&str>>().join("\n");
        let paragraphs = rest_content.split("\n\n");
        let mut is_first = true;

        for raw_p in paragraphs {
            let p = raw_p.trim();
            if p.is_empty() {
                continue;
            }

            if p == "* * *" || p == "✦ ✦ ✦" || p == "---" || p == "***" || p == "#" {
                let symbol = profile.scene_break_style.custom_text.clone().unwrap_or_else(|| "* * *".to_string());
                ch_body_html.push_str(&format!(
                    r#"<div class="scene-break">{}</div>"#,
                    escape_html(&symbol)
                ));
                is_first = true;
            } else {
                let p_class = if is_first { r#" class="first-p""# } else { "" };
                ch_body_html.push_str(&format!(
                    r#"<p{}>{}</p>"#,
                    p_class,
                    escape_html(p)
                ));
                is_first = false;
            }
        }

        let ch_xhtml = format!(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head>
  <title>{title}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <section epub:type="chapter">
    {body}
  </section>
</body>
</html>"#,
            title = escape_html(&chapter_title),
            body = ch_body_html
        );

        zip.start_file(format!("EPUB/{}", file_name), deflated_options)
            .map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(e.to_string()))?;
        zip.write_all(ch_xhtml.as_bytes())?;

        manifest_items.push(format!(
            r#"<item id="{id}" href="{href}" media-type="application/xhtml+xml"/>"#,
            id = file_id,
            href = file_name
        ));
        spine_items.push(format!(r#"<itemref idref="{}"/>"#, file_id));
        nav_toc_entries.push(format!(
            r#"<li><a href="{}">{}</a></li>"#,
            file_name,
            escape_html(&chapter_title)
        ));
    }

    // EPUB/nav.xhtml
    zip.start_file("EPUB/nav.xhtml", deflated_options)
        .map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(e.to_string()))?;
    let nav_xhtml = format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      {toc_items}
    </ol>
  </nav>
</body>
</html>"#,
        toc_items = nav_toc_entries.join("\n      ")
    );
    zip.write_all(nav_xhtml.as_bytes())?;

    // EPUB/toc.ncx (for EPUB 2 backward compatibility)
    zip.start_file("EPUB/toc.ncx", deflated_options)
        .map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(e.to_string()))?;
    let ncx_xml = format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:{uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>{title}</text>
  </docTitle>
  <navMap>
    {nav_points}
  </navMap>
</ncx>"#,
        uuid = book_uuid,
        title = escape_html(&profile.front_matter.title),
        nav_points = documents.iter().enumerate().map(|(idx, d)| {
            format!(
                r#"<navPoint id="navPoint-{n}" playOrder="{n}"><navLabel><text>{title}</text></navLabel><content src="ch{n:02}.xhtml"/></navPoint>"#,
                n = idx + 1,
                title = escape_html(&d.title)
            )
        }).collect::<Vec<String>>().join("\n    ")
    );
    zip.write_all(ncx_xml.as_bytes())?;

    // EPUB/package.opf
    zip.start_file("EPUB/package.opf", deflated_options)
        .map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(e.to_string()))?;
    let package_opf = format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">urn:uuid:{uuid}</dc:identifier>
    <dc:title>{title}</dc:title>
    <dc:creator>{author}</dc:creator>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">{modified}</meta>
  </metadata>
  <manifest>
    {manifest}
  </manifest>
  <spine toc="ncx">
    {spine}
  </spine>
</package>"#,
        uuid = book_uuid,
        title = escape_html(&profile.front_matter.title),
        author = escape_html(&profile.front_matter.author),
        modified = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%SZ"),
        manifest = manifest_items.join("\n    "),
        spine = spine_items.join("\n    ")
    );
    zip.write_all(package_opf.as_bytes())?;

    zip.finish().map_err(|e| crate::error::DocumentSerializeError::SerializationFailed(e.to_string()))?;
    Ok(())
}

fn escape_html(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#39;")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::publish::profile::get_builtin_profiles;
    use tempfile::tempdir;

    #[test]
    fn test_epub_package_generation() {
        let dir = tempdir().unwrap();
        let root = dir.path();
        let epub_path = root.join("book.epub");

        let profiles = get_builtin_profiles("The Forgotten Vaelrion");
        let profile = &profiles[4]; // Digital EPUB

        let docs = vec![
            ManuscriptDocument {
                relative_path: "Manuscript/Chapter-01.md".to_string(),
                title: "Chapter 1".to_string(),
                content: "# Chapter One\n\nEPUB paragraph 1.\n\n* * *\n\nEPUB paragraph 2.".to_string(),
            },
        ];

        generate_epub(root, profile, &docs, &epub_path).unwrap();

        assert!(epub_path.exists());
        let meta = std::fs::metadata(&epub_path).unwrap();
        assert!(meta.len() > 500);

        // Verify it's a valid zip with mimetype as first file
        let file = File::open(&epub_path).unwrap();
        let mut archive = zip::ZipArchive::new(file).unwrap();
        let mut first = archive.by_index(0).unwrap();
        assert_eq!(first.name(), "mimetype");
        let mut buf = Vec::new();
        std::io::Read::read_to_end(&mut first, &mut buf).unwrap();
        assert_eq!(buf, b"application/epub+zip");
    }
}
