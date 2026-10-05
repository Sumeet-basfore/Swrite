use crate::error::Result;
use crate::project::discovery::discover_project_files;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct SearchMatch {
    pub relative_path: String,
    pub line_number: usize,
    pub character_offset: usize,
    pub matched_text: String,
    pub excerpt: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchResult {
    pub query: String,
    pub total_matches: usize,
    pub matches: Vec<SearchMatch>,
}

#[derive(Default)]
pub struct EphemeralSearchIndex {
    documents: HashMap<String, String>, // relative_path -> content
}

impl EphemeralSearchIndex {
    pub fn new() -> Self {
        Self {
            documents: HashMap::new(),
        }
    }

    /// Rebuilds the search index from files on disk.
    pub fn rebuild_from_disk(&mut self, project_root: &Path) -> Result<()> {
        let mut docs = HashMap::new();
        let discovered = discover_project_files(project_root)?;

        let all_files = discovered
            .manuscript_files
            .into_iter()
            .chain(discovered.planning_files)
            .chain(discovered.desk_files);

        for file in all_files {
            if !file.is_directory {
                let full_path = project_root.join(&file.relative_path);
                if let Ok(content) = fs::read_to_string(&full_path) {
                    docs.insert(file.relative_path, content);
                }
            }
        }

        self.documents = docs;
        Ok(())
    }

    /// Updates a single document in the in-memory index.
    pub fn update_document(&mut self, relative_path: &str, content: &str) {
        self.documents
            .insert(relative_path.to_string(), content.to_string());
    }

    /// Removes a document from the index.
    pub fn remove_document(&mut self, relative_path: &str) {
        self.documents.remove(relative_path);
    }

    /// Performs a case-insensitive search across indexed documents with deterministic ordering.
    pub fn search(&self, query: &str) -> SearchResult {
        if query.trim().is_empty() {
            return SearchResult {
                query: query.to_string(),
                total_matches: 0,
                matches: Vec::new(),
            };
        }

        let query_lower = query.to_lowercase();
        let mut matches = Vec::new();

        for (path, content) in &self.documents {
            for (line_idx, line) in content.lines().enumerate() {
                let line_lower = line.to_lowercase();
                let mut start_idx = 0;

                while let Some(found_idx) = line_lower[start_idx..].find(&query_lower) {
                    let absolute_char_idx = start_idx + found_idx;
                    let matched_segment = &line[absolute_char_idx..absolute_char_idx + query.len()];

                    let excerpt_start = absolute_char_idx.saturating_sub(40);
                    let excerpt_end = (absolute_char_idx + query.len() + 40).min(line.len());
                    let excerpt = line[excerpt_start..excerpt_end].to_string();

                    matches.push(SearchMatch {
                        relative_path: path.clone(),
                        line_number: line_idx + 1,
                        character_offset: absolute_char_idx,
                        matched_text: matched_segment.to_string(),
                        excerpt,
                    });

                    start_idx = absolute_char_idx + query.len();
                    if start_idx >= line.len() {
                        break;
                    }
                }
            }
        }

        // Sort deterministically by relative_path then line_number then character_offset
        matches.sort_by(|a, b| {
            a.relative_path
                .cmp(&b.relative_path)
                .then_with(|| a.line_number.cmp(&b.line_number))
                .then_with(|| a.character_offset.cmp(&b.character_offset))
        });

        SearchResult {
            query: query.to_string(),
            total_matches: matches.len(),
            matches,
        }
    }
}
