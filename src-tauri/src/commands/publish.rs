use crate::history::store::HistoryStore;
use crate::project::discovery::discover_project_files;
use crate::publish::export_docx::generate_docx;
use crate::publish::export_epub::generate_epub;
use crate::publish::export_markdown::generate_markdown;
use crate::publish::export_pdf::generate_pdf;
use crate::publish::export_txt::generate_txt;
use crate::publish::pagination::{paginate_manuscript, PaginationResult};
use crate::publish::preflight::{run_preflight_check, ManuscriptDocument, PreflightCheckResult};
use crate::publish::profile::{
    get_builtin_profiles, load_profiles_data, save_profiles_data, OutputFormat,
    PublicationProfile, PublishProfilesData,
};
use std::path::{Path, PathBuf};
use tauri::command;

#[command]
pub fn publish_profiles_load(project_root: String, project_name: String) -> Result<PublishProfilesData, String> {
    let root = Path::new(&project_root);
    let mut data = load_profiles_data(root, &project_name).map_err(|e| e.to_string())?;

    let builtins = get_builtin_profiles(&project_name);
    let mut all_profiles = builtins;
    for custom in data.custom_profiles {
        if !all_profiles.iter().any(|p| p.id == custom.id) {
            all_profiles.push(custom);
        }
    }
    data.custom_profiles = all_profiles;
    Ok(data)
}

#[command]
pub fn publish_profile_save(
    project_root: String,
    profile: PublicationProfile,
    set_active: bool,
) -> Result<PublishProfilesData, String> {
    let root = Path::new(&project_root);
    let mut data = load_profiles_data(root, "Manuscript").map_err(|e| e.to_string())?;

    if set_active {
        data.active_profile_id = profile.id.clone();
    }

    if !profile.is_builtin {
        if let Some(pos) = data.custom_profiles.iter().position(|p| p.id == profile.id) {
            data.custom_profiles[pos] = profile;
        } else {
            data.custom_profiles.push(profile);
        }
    }

    save_profiles_data(root, &data).map_err(|e| e.to_string())?;
    Ok(data)
}

#[command]
pub fn publish_profile_delete(project_root: String, profile_id: String) -> Result<PublishProfilesData, String> {
    let root = Path::new(&project_root);
    let mut data = load_profiles_data(root, "Manuscript").map_err(|e| e.to_string())?;
    data.custom_profiles.retain(|p| p.id != profile_id);

    if data.active_profile_id == profile_id {
        data.active_profile_id = "builtin_trade_paperback_6x9".to_string();
    }

    save_profiles_data(root, &data).map_err(|e| e.to_string())?;
    Ok(data)
}

fn collect_manuscript_docs(root: &Path) -> Result<Vec<ManuscriptDocument>, String> {
    let view = discover_project_files(root).map_err(|e| e.to_string())?;
    let mut docs = Vec::new();

    for file in view.manuscript_files {
        if file.is_directory {
            continue;
        }
        let full_path = root.join(&file.relative_path);
        if full_path.exists() {
            let content = std::fs::read_to_string(&full_path).map_err(|e| e.to_string())?;
            let title = file
                .name
                .strip_suffix(".md")
                .or_else(|| file.name.strip_suffix(".txt"))
                .unwrap_or(&file.name)
                .to_string();

            docs.push(ManuscriptDocument {
                relative_path: file.relative_path,
                title,
                content,
            });
        }
    }

    Ok(docs)
}

#[command]
pub fn publish_preflight_run(
    project_root: String,
    profile: PublicationProfile,
) -> Result<PreflightCheckResult, String> {
    let root = Path::new(&project_root);
    let docs = collect_manuscript_docs(root)?;
    run_preflight_check(root, &profile, &docs).map_err(|e| e.to_string())
}

#[command]
pub fn publish_paginate(
    project_root: String,
    profile: PublicationProfile,
) -> Result<PaginationResult, String> {
    let root = Path::new(&project_root);
    let docs = collect_manuscript_docs(root)?;
    Ok(paginate_manuscript(&profile, &docs))
}

#[command]
pub fn publish_export(
    project_root: String,
    profile: PublicationProfile,
    target_absolute_path: String,
) -> Result<String, String> {
    let root = Path::new(&project_root);
    let docs = collect_manuscript_docs(root)?;

    // 1. Run Preflight to catch blocking errors
    let preflight = run_preflight_check(root, &profile, &docs).map_err(|e| e.to_string())?;
    if !preflight.is_valid {
        return Err(format!(
            "Export blocked by {} preflight issue(s). Resolve blocking errors in Publish Studio before exporting.",
            preflight.blocking_count
        ));
    }

    // 2. Take Auto Safety Snapshot of the manuscript before export
    for doc in &docs {
        let _ = HistoryStore::record_save(
            root,
            &doc.relative_path,
            &doc.relative_path,
            &doc.content,
            Some(&format!("Pre-export safety snapshot for {}", profile.name)),
        );
    }

    // 3. Export to requested target path
    let out_path = PathBuf::from(&target_absolute_path);
    if let Some(parent) = out_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }

    match profile.format {
        OutputFormat::Pdf => {
            let pagination = paginate_manuscript(&profile, &docs);
            generate_pdf(&profile, &pagination, &out_path).map_err(|e| e.to_string())?;
        }
        OutputFormat::Docx => {
            generate_docx(&profile, &docs, &out_path).map_err(|e| e.to_string())?;
        }
        OutputFormat::Epub => {
            generate_epub(root, &profile, &docs, &out_path).map_err(|e| e.to_string())?;
        }
        OutputFormat::Markdown => {
            generate_markdown(&profile, &docs, &out_path).map_err(|e| e.to_string())?;
        }
        OutputFormat::Txt => {
            generate_txt(&profile, &docs, &out_path).map_err(|e| e.to_string())?;
        }
    }

    Ok(target_absolute_path)
}
