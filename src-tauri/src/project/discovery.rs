use crate::document::sniff::{sniff_format, DocumentFormat};
use crate::error::Result;
use crate::filesystem::paths::{is_hidden_or_internal, to_relative_path_string};
use serde::{Deserialize, Serialize};
use std::path::Path;
use walkdir::WalkDir;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct DiscoveredFile {
    pub relative_path: String,
    pub name: String,
    pub is_directory: bool,
    pub format: DocumentFormat,
    pub size_bytes: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProjectFilesystemView {
    pub manuscript_files: Vec<DiscoveredFile>,
    pub planning_files: Vec<DiscoveredFile>,
    pub desk_files: Vec<DiscoveredFile>,
    pub asset_files: Vec<DiscoveredFile>,
    pub other_visible_files: Vec<DiscoveredFile>,
}

/// Recursively discovers all author-visible project files, filtering out internal/dotfiles.
pub fn discover_project_files(project_root: &Path) -> Result<ProjectFilesystemView> {
    let mut manuscript = Vec::new();
    let mut planning = Vec::new();
    let mut desk = Vec::new();
    let mut assets = Vec::new();
    let mut others = Vec::new();

    for entry in WalkDir::new(project_root)
        .sort_by_file_name()
        .into_iter()
        .filter_entry(|e| {
            if e.depth() == 0 {
                return true;
            }
            let file_name = e.file_name().to_string_lossy();
            !is_hidden_or_internal(&file_name)
        })
        .flatten()
    {
        if entry.path() == project_root {
            continue;
        }

        let is_dir = entry.file_type().is_dir();
        let rel_path = match to_relative_path_string(project_root, entry.path()) {
            Ok(p) => p,
            Err(_) => continue,
        };

        // Skip root section directories themselves
        if rel_path == "Manuscript"
            || rel_path == "Planning"
            || rel_path == "Desk"
            || rel_path == "Assets"
        {
            continue;
        }

        let file_name = entry.file_name().to_string_lossy().to_string();
        let size = if is_dir {
            0
        } else {
            entry.metadata().map(|m| m.len()).unwrap_or(0)
        };

        let ext = entry.path().extension().and_then(|e| e.to_str());
        let format = if is_dir {
            DocumentFormat::PlainText
        } else {
            let first_bytes = std::fs::read(entry.path()).unwrap_or_default();
            sniff_format(&first_bytes, ext)
        };

        let item = DiscoveredFile {
            relative_path: rel_path.clone(),
            name: file_name,
            is_directory: is_dir,
            format,
            size_bytes: size,
        };

        if rel_path.starts_with("Manuscript") {
            manuscript.push(item);
        } else if rel_path.starts_with("Planning") {
            planning.push(item);
        } else if rel_path.starts_with("Desk") {
            desk.push(item);
        } else if rel_path.starts_with("Assets") {
            assets.push(item);
        } else {
            others.push(item);
        }
    }

    manuscript.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));
    planning.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));
    desk.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));
    assets.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));
    others.sort_by(|a, b| a.relative_path.cmp(&b.relative_path));

    Ok(ProjectFilesystemView {
        manuscript_files: manuscript,
        planning_files: planning,
        desk_files: desk,
        asset_files: assets,
        other_visible_files: others,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_discovery_filters_internal_files() {
        let dir = tempdir().unwrap();
        let root = dir.path();

        fs::create_dir_all(root.join("Manuscript/Chapter 01")).unwrap();
        fs::write(root.join("Manuscript/Chapter 01/Scene 01.md"), "# Scene 1").unwrap();
        fs::create_dir_all(root.join(".swrite/history")).unwrap();
        fs::write(root.join(".swrite/project.json"), "{}").unwrap();
        fs::create_dir_all(root.join(".git")).unwrap();
        fs::write(root.join(".git/HEAD"), "ref: refs/heads/main").unwrap();

        let view = discover_project_files(root).unwrap();

        assert_eq!(view.manuscript_files.len(), 2); // Chapter 01 (dir) and Scene 01.md
        assert!(!view
            .manuscript_files
            .iter()
            .any(|f| f.relative_path.contains(".swrite")));
    }
}
