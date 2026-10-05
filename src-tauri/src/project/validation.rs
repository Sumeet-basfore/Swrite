use crate::error::{ProjectError, Result, SwriteError};
use crate::filesystem::atomic_write::atomic_write_string;
use crate::project::discovery::discover_project_files;
use crate::project::manifest::ProjectManifest;
use std::fs;
use std::path::Path;

#[derive(Debug, serde::Serialize, serde::Deserialize, Clone)]
pub struct ProjectValidationReport {
    pub is_valid: bool,
    pub issues: Vec<String>,
    pub warnings: Vec<String>,
    pub healed_structures: Vec<String>,
}

/// Validates an active project directory and self-heals minor missing internal structures.
pub fn validate_and_heal_project(project_root: &Path) -> Result<ProjectValidationReport> {
    let mut issues = Vec::new();
    let mut warnings = Vec::new();
    let mut healed = Vec::new();

    if !project_root.exists() || !project_root.is_dir() {
        return Err(SwriteError::Project(ProjectError::NotFound(
            project_root.display().to_string(),
        )));
    }

    // Required user-facing folders
    let standard_dirs = ["Manuscript", "Planning", "Desk", "Assets"];
    for dir in &standard_dirs {
        let p = project_root.join(dir);
        if !p.exists() {
            if let Ok(()) = fs::create_dir_all(&p) {
                healed.push(format!("Created missing canonical folder: {}", dir));
            } else {
                issues.push(format!("Missing and unable to create folder: {}", dir));
            }
        }
    }

    // Internal .swrite directory
    let swrite_dir = project_root.join(".swrite");
    if !swrite_dir.exists() {
        if let Ok(()) = fs::create_dir_all(&swrite_dir) {
            healed.push("Created missing .swrite directory".to_string());
        } else {
            issues.push("Unable to create .swrite directory".to_string());
        }
    }

    let internal_subdirs = ["indexes", "history", "recovery", "cache"];
    for sub in &internal_subdirs {
        let p = swrite_dir.join(sub);
        if !p.exists() {
            if let Ok(()) = fs::create_dir_all(&p) {
                healed.push(format!("Created missing internal folder: .swrite/{}", sub));
            }
        }
    }

    // Manifest validation & healing
    let manifest_path = swrite_dir.join("project.json");
    if !manifest_path.exists() {
        let name = project_root
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Untitled Project");
        let manifest = ProjectManifest::new(name);
        if let Ok(json) = serde_json::to_string_pretty(&manifest) {
            let _ = atomic_write_string(&manifest_path, &json);
            healed.push("Reconstructed missing .swrite/project.json manifest".to_string());
        }
    } else {
        match fs::read_to_string(&manifest_path) {
            Ok(content) => match serde_json::from_str::<ProjectManifest>(&content) {
                Ok(m) => {
                    if let Err(e) = m.validate() {
                        warnings.push(format!("Manifest validation warning: {}", e));
                    }
                }
                Err(e) => {
                    let name = project_root
                        .file_name()
                        .and_then(|n| n.to_str())
                        .unwrap_or("Untitled Project");
                    let manifest = ProjectManifest::new(name);
                    if let Ok(json) = serde_json::to_string_pretty(&manifest) {
                        let _ = atomic_write_string(&manifest_path, &json);
                        healed.push(format!(
                            "Healed corrupted .swrite/project.json manifest: {}",
                            e
                        ));
                    }
                }
            },
            Err(e) => {
                issues.push(format!("Cannot read manifest: {}", e));
            }
        }
    }

    // Check files discovery
    if let Err(e) = discover_project_files(project_root) {
        issues.push(format!("Project file discovery error: {}", e));
    }

    let is_valid = issues.is_empty();

    Ok(ProjectValidationReport {
        is_valid,
        issues,
        warnings,
        healed_structures: healed,
    })
}
