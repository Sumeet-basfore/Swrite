use crate::error::Result;
use crate::publish::preflight::ManuscriptDocument;
use crate::publish::profile::PublicationProfile;
use std::fs::File;
use std::io::Write;
use std::path::Path;

pub fn generate_markdown(
    profile: &PublicationProfile,
    documents: &[ManuscriptDocument],
    output_path: &Path,
) -> Result<()> {
    let mut out = String::new();

    // Front matter
    if profile.front_matter.include_title_page {
        out.push_str(&format!("# {}\n\n", profile.front_matter.title));
        if let Some(ref sub) = profile.front_matter.subtitle {
            out.push_str(&format!("*{}*\n\n", sub));
        }
        out.push_str(&format!("By {}\n\n", profile.front_matter.author));
        if let Some(ref cp) = profile.front_matter.copyright {
            out.push_str(&format!("{}\n\n", cp));
        }
        out.push_str("---\n\n");
    }

    // Chapters
    for (idx, doc) in documents.iter().enumerate() {
        if idx > 0 && !profile.front_matter.include_title_page {
            out.push_str("\n\n---\n\n");
        }

        let trimmed = doc.content.trim();
        out.push_str(trimmed);
        out.push_str("\n\n");
    }

    let mut file = File::create(output_path)?;
    file.write_all(out.as_bytes())?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::publish::profile::get_builtin_profiles;
    use tempfile::tempdir;

    #[test]
    fn test_markdown_export_cleanliness() {
        let dir = tempdir().unwrap();
        let out_path = dir.path().join("exported.md");

        let profiles = get_builtin_profiles("The Forgotten Vaelrion");
        let profile = &profiles[5]; // Plain Markdown

        let docs = vec![
            ManuscriptDocument {
                relative_path: "Manuscript/Chapter-01.md".to_string(),
                title: "Chapter 1".to_string(),
                content: "# Chapter One\n\nFirst paragraph.\n\n* * *\n\nSecond paragraph.".to_string(),
            },
        ];

        generate_markdown(profile, &docs, &out_path).unwrap();

        let read_back = std::fs::read_to_string(&out_path).unwrap();
        assert!(read_back.contains("# Chapter One"));
        assert!(read_back.contains("* * *"));
    }
}
