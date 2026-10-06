use crate::error::Result;
use crate::filesystem::paths::{is_hidden_or_internal, to_relative_path_string};
use std::path::Path;
use walkdir::WalkDir;

/// Scans Markdown files across Manuscript, Planning, and Desk to find backlinks referencing target
pub fn scan_backlinks(project_root: &Path, target_relative_path: &str) -> Result<Vec<String>> {
    let mut backlinks = Vec::new();

    // Derive search terms:
    // e.g. "Desk/Characters/Lucan.md" -> ["Desk/Characters/Lucan.md", "[[Lucan]]", "Lucan.md"]
    let target_path = Path::new(target_relative_path);
    let stem = target_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or(target_relative_path);
    let wikilink = format!("[[{}]]", stem);
    let wikilink_full = format!("[[{}]]", target_relative_path);

    for entry in WalkDir::new(project_root)
        .into_iter()
        .filter_entry(|e| {
            if e.depth() == 0 {
                return true;
            }
            let name = e.file_name().to_string_lossy();
            !is_hidden_or_internal(&name)
        })
        .flatten()
    {
        if !entry.file_type().is_file() {
            continue;
        }

        let ext = entry.path().extension().and_then(|e| e.to_str()).unwrap_or("");
        if ext != "md" && ext != "markdown" && ext != "txt" {
            continue;
        }

        let rel_path = match to_relative_path_string(project_root, entry.path()) {
            Ok(p) => p,
            Err(_) => continue,
        };

        // Don't count self-reference
        if rel_path == target_relative_path {
            continue;
        }

        if let Ok(content) = std::fs::read_to_string(entry.path()) {
            if content.contains(target_relative_path)
                || content.contains(&wikilink)
                || content.contains(&wikilink_full)
            {
                backlinks.push(rel_path);
            }
        }
    }

    backlinks.sort();
    Ok(backlinks)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_backlinks_scanning() {
        let temp = tempdir().unwrap();
        let root = temp.path();

        fs::create_dir_all(root.join("Desk/Characters")).unwrap();
        fs::write(root.join("Desk/Characters/Lucan.md"), "# Lucan\nA guard captain.").unwrap();

        fs::create_dir_all(root.join("Manuscript/Chapter 01")).unwrap();
        fs::write(
            root.join("Manuscript/Chapter 01/Scene 01.md"),
            "The traveler met [[Lucan]] at the city gates.",
        )
        .unwrap();

        fs::create_dir_all(root.join("Planning")).unwrap();
        fs::write(
            root.join("Planning/Notes.md"),
            "Refer to Desk/Characters/Lucan.md for backstory.",
        )
        .unwrap();

        let links = scan_backlinks(root, "Desk/Characters/Lucan.md").unwrap();
        assert_eq!(links.len(), 2);
        assert!(links.contains(&"Manuscript/Chapter 01/Scene 01.md".to_string()));
        assert!(links.contains(&"Planning/Notes.md".to_string()));
    }
}
