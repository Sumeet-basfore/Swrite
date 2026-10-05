pub mod discovery;
pub mod identity;
pub mod manifest;
pub mod validation;

pub use discovery::*;
pub use identity::*;
pub use manifest::*;
pub use validation::*;

use crate::error::{ProjectError, Result, SwriteError};
use crate::filesystem::atomic_write::atomic_write_string;
use std::fs;
use std::path::Path;

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
pub struct ProjectSummary {
    pub project_id: String,
    pub name: String,
    pub root_path: String,
    pub manifest: ProjectManifest,
    pub file_counts: ProjectFileCounts,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
pub struct ProjectFileCounts {
    pub manuscript_count: usize,
    pub planning_count: usize,
    pub desk_count: usize,
    pub asset_count: usize,
}

/// Creates a new Swrite 2 project directory with canonical structure.
pub fn create_project(project_dir: &Path, name: &str) -> Result<ProjectSummary> {
    if project_dir.exists()
        && project_dir
            .read_dir()
            .map(|mut i| i.next().is_some())
            .unwrap_or(false)
        && project_dir.join(".swrite/project.json").exists()
    {
        return Err(SwriteError::Project(ProjectError::AlreadyExists(
            project_dir.display().to_string(),
        )));
    }

    fs::create_dir_all(project_dir.join("Manuscript"))?;
    fs::create_dir_all(project_dir.join("Planning"))?;
    fs::create_dir_all(project_dir.join("Desk"))?;
    fs::create_dir_all(project_dir.join("Assets"))?;

    let swrite_dir = project_dir.join(".swrite");
    fs::create_dir_all(swrite_dir.join("indexes"))?;
    fs::create_dir_all(swrite_dir.join("history"))?;
    fs::create_dir_all(swrite_dir.join("recovery"))?;
    fs::create_dir_all(swrite_dir.join("cache"))?;

    let manifest = ProjectManifest::new(name);
    let manifest_json = serde_json::to_string_pretty(&manifest)
        .map_err(|e| SwriteError::Project(ProjectError::ManifestCorrupted(e.to_string())))?;

    atomic_write_string(&swrite_dir.join("project.json"), &manifest_json)?;

    Ok(ProjectSummary {
        project_id: manifest.project_id.clone(),
        name: manifest.name.clone(),
        root_path: project_dir.display().to_string(),
        manifest,
        file_counts: ProjectFileCounts {
            manuscript_count: 0,
            planning_count: 0,
            desk_count: 0,
            asset_count: 0,
        },
    })
}

/// Opens and validates an existing Swrite 2 project directory.
pub fn open_project(project_dir: &Path) -> Result<ProjectSummary> {
    let report = validate_and_heal_project(project_dir)?;
    if !report.is_valid {
        return Err(SwriteError::Project(ProjectError::InvalidStructure(
            report.issues.join(", "),
        )));
    }

    let manifest_path = project_dir.join(".swrite/project.json");
    let content = fs::read_to_string(&manifest_path).unwrap_or_default();

    let mut manifest: ProjectManifest = match serde_json::from_str(&content) {
        Ok(m) => m,
        Err(_) => {
            let name = project_dir
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("Untitled Project");
            ProjectManifest::new(name)
        }
    };

    let discovered = discover_project_files(project_dir)?;

    let all_paths: Vec<String> = discovered
        .manuscript_files
        .iter()
        .chain(discovered.planning_files.iter())
        .chain(discovered.desk_files.iter())
        .filter(|f| !f.is_directory)
        .map(|f| f.relative_path.clone())
        .collect();

    IdentityManager::reconcile_identities(&mut manifest, &all_paths);

    let updated_json = serde_json::to_string_pretty(&manifest).unwrap_or_default();
    let _ = atomic_write_string(&manifest_path, &updated_json);

    let summary = ProjectSummary {
        project_id: manifest.project_id.clone(),
        name: manifest.name.clone(),
        root_path: project_dir.display().to_string(),
        file_counts: ProjectFileCounts {
            manuscript_count: discovered
                .manuscript_files
                .iter()
                .filter(|f| !f.is_directory)
                .count(),
            planning_count: discovered
                .planning_files
                .iter()
                .filter(|f| !f.is_directory)
                .count(),
            desk_count: discovered
                .desk_files
                .iter()
                .filter(|f| !f.is_directory)
                .count(),
            asset_count: discovered
                .asset_files
                .iter()
                .filter(|f| !f.is_directory)
                .count(),
        },
        manifest,
    };

    Ok(summary)
}

/// Saves the project manifest to `.swrite/project.json`.
pub fn save_manifest(project_root: &Path, manifest: &ProjectManifest) -> Result<()> {
    let manifest_path = project_root.join(".swrite/project.json");
    let json = serde_json::to_string_pretty(manifest)
        .map_err(|e| SwriteError::Project(ProjectError::ManifestCorrupted(e.to_string())))?;
    atomic_write_string(&manifest_path, &json)
}
