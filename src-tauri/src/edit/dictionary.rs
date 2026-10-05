use crate::error::{FilesystemError, Result, SwriteError};
use crate::filesystem::atomic_write::atomic_write_bytes;
use crate::filesystem::paths::resolve_secure_path;
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone, Default, PartialEq)]
pub struct ProjectDictionary {
    pub custom_words: Vec<String>,
    pub ignored_patterns: Vec<String>,
    pub ignored_findings: Vec<String>,
}

impl ProjectDictionary {
    pub fn load(project_root: &Path) -> Self {
        let path = match resolve_secure_path(project_root, ".swrite/dictionary.json", true) {
            Ok(p) => p,
            Err(_) => return Self::default(),
        };

        if !path.exists() {
            return Self::default();
        }

        match std::fs::read(&path) {
            Ok(bytes) => serde_json::from_slice(&bytes).unwrap_or_default(),
            Err(_) => Self::default(),
        }
    }

    pub fn save(&self, project_root: &Path) -> Result<()> {
        let path = resolve_secure_path(project_root, ".swrite/dictionary.json", true)?;
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| SwriteError::Filesystem(FilesystemError::Io(e.to_string())))?;
        }

        let json = serde_json::to_vec_pretty(self)
            .map_err(|e| SwriteError::Filesystem(FilesystemError::Io(e.to_string())))?;
        atomic_write_bytes(&path, &json)?;
        Ok(())
    }

    pub fn add_word(&mut self, word: &str) -> bool {
        let clean = word.trim();
        if clean.is_empty() {
            return false;
        }
        if !self.custom_words.iter().any(|w| w.eq_ignore_ascii_case(clean)) {
            self.custom_words.push(clean.to_string());
            self.custom_words.sort_by(|a, b| a.to_lowercase().cmp(&b.to_lowercase()));
            true
        } else {
            false
        }
    }

    pub fn remove_word(&mut self, word: &str) -> bool {
        let initial_len = self.custom_words.len();
        self.custom_words.retain(|w| !w.eq_ignore_ascii_case(word));
        self.custom_words.len() < initial_len
    }

    pub fn is_word_allowed(&self, word: &str) -> bool {
        self.custom_words.iter().any(|w| w.eq_ignore_ascii_case(word))
    }

    pub fn add_ignored_finding(&mut self, finding_id_or_hash: &str) {
        if !self.ignored_findings.contains(&finding_id_or_hash.to_string()) {
            self.ignored_findings.push(finding_id_or_hash.to_string());
        }
    }

    pub fn is_finding_ignored(&self, finding_id_or_hash: &str) -> bool {
        self.ignored_findings.contains(&finding_id_or_hash.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_dictionary_lifecycle() {
        let temp = tempdir().unwrap();
        let root = temp.path();

        let mut dict = ProjectDictionary::load(root);
        assert!(!dict.is_word_allowed("Vaelrion"));

        assert!(dict.add_word("Vaelrion"));
        assert!(dict.is_word_allowed("vaelrion"));
        assert!(dict.is_word_allowed("VAELRION"));

        dict.save(root).unwrap();

        let mut loaded = ProjectDictionary::load(root);
        assert!(loaded.is_word_allowed("Vaelrion"));

        assert!(loaded.remove_word("Vaelrion"));
        assert!(!loaded.is_word_allowed("Vaelrion"));
    }
}
