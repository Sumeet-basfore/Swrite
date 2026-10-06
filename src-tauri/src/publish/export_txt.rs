use crate::error::Result;
use crate::publish::preflight::ManuscriptDocument;
use crate::publish::profile::PublicationProfile;
use std::fs::File;
use std::io::Write;
use std::path::Path;

pub fn generate_txt(
    profile: &PublicationProfile,
    documents: &[ManuscriptDocument],
    output_path: &Path,
) -> Result<()> {
    let mut out = String::new();

    if profile.front_matter.include_title_page {
        out.push_str(&profile.front_matter.title.to_uppercase());
        out.push_str("\n");
        if let Some(ref sub) = profile.front_matter.subtitle {
            out.push_str(sub);
            out.push_str("\n");
        }
        out.push_str(&format!("by {}\n\n", profile.front_matter.author));
        if let Some(ref cp) = profile.front_matter.copyright {
            out.push_str(cp);
            out.push_str("\n\n");
        }
        out.push_str("========================================\n\n");
    }

    for (idx, doc) in documents.iter().enumerate() {
        if idx > 0 {
            out.push_str("\n\n----------------------------------------\n\n");
        }

        // Clean markdown heading hashes for plain text
        for line in doc.content.lines() {
            if line.starts_with("# ") {
                out.push_str(&line.trim_start_matches("# ").trim().to_uppercase());
                out.push_str("\n");
            } else if line.starts_with("## ") {
                out.push_str(&line.trim_start_matches("## ").trim());
                out.push_str("\n");
            } else {
                out.push_str(line);
                out.push_str("\n");
            }
        }
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
    fn test_txt_export_generation() {
        let dir = tempdir().unwrap();
        let out_path = dir.path().join("exported.txt");

        let profiles = get_builtin_profiles("The Forgotten Vaelrion");
        let profile = &profiles[6]; // Plain Text

        let docs = vec![
            ManuscriptDocument {
                relative_path: "Manuscript/Chapter-01.md".to_string(),
                title: "Chapter 1".to_string(),
                content: "# Chapter One\n\nPlain text content.\n\n* * *\n\nEnd of chapter.".to_string(),
            },
        ];

        generate_txt(profile, &docs, &out_path).unwrap();

        let read_back = std::fs::read_to_string(&out_path).unwrap();
        assert!(read_back.contains("CHAPTER ONE"));
        assert!(read_back.contains("Plain text content."));
    }
}
