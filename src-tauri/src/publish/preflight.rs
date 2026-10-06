use crate::error::Result;
use crate::publish::profile::PublicationProfile;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::LazyLock;

/// Static patterns: compiled once, and a bad pattern fails at first use
/// with a message instead of panicking inside every preflight run.
static IMAGE_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"!\[.*?\]\((.*?)\)").expect("preflight IMAGE pattern is valid"));
static WIKILINK_REGEX: LazyLock<Regex> =
    LazyLock::new(|| Regex::new(r"\[\[(.*?)\]\]").expect("preflight WIKILINK pattern is valid"));
static DOUBLE_SCENE_BREAK_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(\*\s*\*\s*\*|✦\s*✦\s*✦|#)\s*\n+\s*(\*\s*\*\s*\*|✦\s*✦\s*✦|#)")
        .expect("preflight SCENE_BREAK pattern is valid")
});

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum PreflightSeverity {
    Info,
    Warning,
    Blocking,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct PreflightIssue {
    pub id: String,
    pub severity: PreflightSeverity,
    pub category: String, // "content", "structure", "output"
    pub message: String,
    pub document_path: Option<String>,
    pub line_number: Option<usize>,
    pub suggestion: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct PreflightCheckResult {
    pub is_valid: bool,
    pub chapters_checked: usize,
    pub images_checked: usize,
    pub links_checked: usize,
    pub issues: Vec<PreflightIssue>,
    pub blocking_count: usize,
    pub warning_count: usize,
    pub info_count: usize,
}

pub struct ManuscriptDocument {
    pub relative_path: String,
    pub title: String,
    pub content: String,
}

pub fn run_preflight_check(
    project_root: &Path,
    profile: &PublicationProfile,
    documents: &[ManuscriptDocument],
) -> Result<PreflightCheckResult> {
    let mut issues = Vec::new();
    let mut images_checked = 0;
    let mut links_checked = 0;

    let image_regex = &*IMAGE_REGEX;
    let wikilink_regex = &*WIKILINK_REGEX;
    let double_scene_break_regex = &*DOUBLE_SCENE_BREAK_REGEX;

    // 1. Check Front Matter
    if profile.front_matter.include_title_page {
        if profile.front_matter.title.trim().is_empty() {
            issues.push(PreflightIssue {
                id: "frontmatter_empty_title".to_string(),
                severity: PreflightSeverity::Blocking,
                category: "content".to_string(),
                message: "Book title is empty in publication profile front matter.".to_string(),
                document_path: None,
                line_number: None,
                suggestion: Some("Set the title in Publish Studio front matter settings.".to_string()),
            });
        }
        if profile.front_matter.author.trim().is_empty() {
            issues.push(PreflightIssue {
                id: "frontmatter_empty_author".to_string(),
                severity: PreflightSeverity::Warning,
                category: "content".to_string(),
                message: "Author name is empty in publication profile front matter.".to_string(),
                document_path: None,
                line_number: None,
                suggestion: Some("Specify the author name for the title page.".to_string()),
            });
        }
    }

    // 2. Check each manuscript document
    for doc in documents {
        let trimmed = doc.content.trim();
        
        // Empty document check
        if trimmed.is_empty() {
            issues.push(PreflightIssue {
                id: format!("empty_doc_{}", doc.relative_path),
                severity: PreflightSeverity::Warning,
                category: "content".to_string(),
                message: format!("Document '{}' contains no prose.", doc.relative_path),
                document_path: Some(doc.relative_path.clone()),
                line_number: None,
                suggestion: Some("Add content to this chapter or exclude it from manuscript.".to_string()),
            });
            continue;
        }

        // Heading check
        let has_h1 = doc.content.lines().any(|l| l.starts_with("# "));
        if !has_h1 {
            issues.push(PreflightIssue {
                id: format!("missing_h1_{}", doc.relative_path),
                severity: PreflightSeverity::Info,
                category: "structure".to_string(),
                message: format!("Document '{}' has no top-level '# Heading'.", doc.relative_path),
                document_path: Some(doc.relative_path.clone()),
                line_number: Some(1),
                suggestion: Some("Add a '# Chapter Title' heading at the start of the file if desired.".to_string()),
            });
        }

        // Check images in content
        for cap in image_regex.captures_iter(&doc.content) {
            images_checked += 1;
            let img_src = &cap[1];
            // If it's a local relative path, check existence
            if !img_src.starts_with("http://") && !img_src.starts_with("https://") && !img_src.starts_with("data:") {
                let img_clean = img_src.split('?').next().unwrap_or(img_src);
                let full_img_path = project_root.join(img_clean);
                if !full_img_path.exists() {
                    issues.push(PreflightIssue {
                        id: format!("broken_img_{}_{}", doc.relative_path, img_clean),
                        severity: PreflightSeverity::Blocking,
                        category: "content".to_string(),
                        message: format!("Referenced image not found: '{}'", img_clean),
                        document_path: Some(doc.relative_path.clone()),
                        line_number: None,
                        suggestion: Some("Verify the image asset exists in Assets/Images/.".to_string()),
                    });
                }
            }
        }

        // Check internal wikilinks
        for cap in wikilink_regex.captures_iter(&doc.content) {
            links_checked += 1;
            let target_name = &cap[1];
            let target_exists = documents.iter().any(|d| {
                d.relative_path.ends_with(target_name) ||
                d.relative_path.ends_with(&format!("{}.md", target_name)) ||
                d.title.eq_ignore_ascii_case(target_name)
            });
            if !target_exists {
                issues.push(PreflightIssue {
                    id: format!("broken_link_{}_{}", doc.relative_path, target_name),
                    severity: PreflightSeverity::Warning,
                    category: "content".to_string(),
                    message: format!("Unresolved wikilink '[[{}]]'", target_name),
                    document_path: Some(doc.relative_path.clone()),
                    line_number: None,
                    suggestion: Some("Verify target document exists or update link text.".to_string()),
                });
            }
        }

        // Check consecutive scene breaks
        if double_scene_break_regex.is_match(&doc.content) {
            issues.push(PreflightIssue {
                id: format!("consecutive_scene_breaks_{}", doc.relative_path),
                severity: PreflightSeverity::Warning,
                category: "structure".to_string(),
                message: "Found consecutive scene breaks without intervening text.".to_string(),
                document_path: Some(doc.relative_path.clone()),
                line_number: None,
                suggestion: Some("Remove redundant scene break separator.".to_string()),
            });
        }
    }

    // 3. Output Format Sanity Checks
    if profile.format == crate::publish::profile::OutputFormat::Pdf {
        if profile.margins.inside_in + profile.margins.outside_in >= profile.page_size.width_in {
            issues.push(PreflightIssue {
                id: "invalid_pdf_margins_width".to_string(),
                severity: PreflightSeverity::Blocking,
                category: "output".to_string(),
                message: "Horizontal margins exceed total page width.".to_string(),
                document_path: None,
                line_number: None,
                suggestion: Some("Adjust inside/outside margins in Layout settings.".to_string()),
            });
        }
        if profile.margins.top_in + profile.margins.bottom_in >= profile.page_size.height_in {
            issues.push(PreflightIssue {
                id: "invalid_pdf_margins_height".to_string(),
                severity: PreflightSeverity::Blocking,
                category: "output".to_string(),
                message: "Vertical margins exceed total page height.".to_string(),
                document_path: None,
                line_number: None,
                suggestion: Some("Adjust top/bottom margins in Layout settings.".to_string()),
            });
        }
    }

    let blocking_count = issues.iter().filter(|i| i.severity == PreflightSeverity::Blocking).count();
    let warning_count = issues.iter().filter(|i| i.severity == PreflightSeverity::Warning).count();
    let info_count = issues.iter().filter(|i| i.severity == PreflightSeverity::Info).count();

    Ok(PreflightCheckResult {
        is_valid: blocking_count == 0,
        chapters_checked: documents.len(),
        images_checked,
        links_checked,
        issues,
        blocking_count,
        warning_count,
        info_count,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::publish::profile::get_builtin_profiles;
    use tempfile::tempdir;

    #[test]
    fn test_preflight_valid_manuscript() {
        let dir = tempdir().unwrap();
        let root = dir.path();
        let profiles = get_builtin_profiles("The Great Novel");
        let profile = &profiles[0];

        let docs = vec![
            ManuscriptDocument {
                relative_path: "Manuscript/Chapter-01.md".to_string(),
                title: "Chapter 1".to_string(),
                content: "# Chapter One\n\nThe morning was cold.\n\n* * *\n\nShe looked across the sea.".to_string(),
            },
        ];

        let result = run_preflight_check(root, profile, &docs).unwrap();
        assert!(result.is_valid);
        assert_eq!(result.blocking_count, 0);
        assert_eq!(result.chapters_checked, 1);
    }

    #[test]
    fn test_preflight_detects_blocking_issues() {
        let dir = tempdir().unwrap();
        let root = dir.path();
        let mut profiles = get_builtin_profiles("");
        let profile = &mut profiles[0];
        profile.front_matter.title = "".to_string(); // Empty title

        let docs = vec![
            ManuscriptDocument {
                relative_path: "Manuscript/Chapter-01.md".to_string(),
                title: "Chapter 1".to_string(),
                content: "![Missing Image](Assets/Images/ghost.png)".to_string(),
            },
        ];

        let result = run_preflight_check(root, profile, &docs).unwrap();
        assert!(!result.is_valid);
        assert!(result.blocking_count >= 2); // Empty title + broken image
    }
}
