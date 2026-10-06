use serde::{Deserialize, Serialize};
use std::path::Path;
use crate::error::{Result, SwriteError, ValidationError};

pub const CURRENT_PLUGIN_API_VERSION: u32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum PluginCapability {
    #[serde(rename = "project.read")]
    ProjectRead,
    #[serde(rename = "project.write")]
    ProjectWrite,
    #[serde(rename = "document.read")]
    DocumentRead,
    #[serde(rename = "document.write")]
    DocumentWrite,
    #[serde(rename = "selection.read")]
    SelectionRead,
    #[serde(rename = "commands.register")]
    CommandsRegister,
    #[serde(rename = "panels.register")]
    PanelsRegister,
    #[serde(rename = "exporters.register")]
    ExportersRegister,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginManifest {
    pub id: String,
    pub name: String,
    pub version: String,
    pub api_version: u32,
    pub description: Option<String>,
    pub author: Option<String>,
    pub entry: String,
    #[serde(default)]
    pub permissions: Vec<PluginCapability>,
}

impl PluginManifest {
    pub fn validate(&self) -> Result<()> {
        let mut issues = Vec::new();

        // ID Validation
        if self.id.is_empty() || self.id.len() > 64 {
            issues.push("Plugin ID must be between 1 and 64 characters".into());
        }

        if !self.id.chars().all(|c| c.is_ascii_alphanumeric() || c == '.' || c == '-' || c == '_') {
            issues.push("Plugin ID contains invalid characters. Use alphanumeric, '.', '-', '_'".into());
        }

        // Name Validation
        if self.name.trim().is_empty() || self.name.len() > 100 {
            issues.push("Plugin Name must be between 1 and 100 characters".into());
        }

        // Version Validation
        if self.version.trim().is_empty() {
            issues.push("Plugin Version must not be empty".into());
        }

        // API Version Validation
        if self.api_version == 0 || self.api_version > CURRENT_PLUGIN_API_VERSION {
            issues.push(format!(
                "Incompatible Plugin API Version {}. Current supported version is {}",
                self.api_version, CURRENT_PLUGIN_API_VERSION
            ));
        }

        // Entry validation
        if self.entry.trim().is_empty() || self.entry.contains("..") {
            issues.push("Plugin entry script must be a valid relative path without traversal".into());
        }

        if !issues.is_empty() {
            return Err(SwriteError::Validation(ValidationError::Failed(issues)));
        }

        Ok(())
    }

    pub fn load_from_file<P: AsRef<Path>>(path: P) -> Result<Self> {
        let content = std::fs::read_to_string(path.as_ref())?;
        let manifest: PluginManifest = serde_json::from_str(&content)
            .map_err(|e| SwriteError::Validation(ValidationError::Failed(vec![format!("Malformed plugin manifest JSON: {}", e)])))?;
        manifest.validate()?;
        Ok(manifest)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_manifest_validation() {
        let manifest = PluginManifest {
            id: "swrite.word-count".into(),
            name: "Word Count Utility".into(),
            version: "1.0.0".into(),
            api_version: 1,
            description: Some("Displays real-time stats".into()),
            author: Some("Swrite Core".into()),
            entry: "index.js".into(),
            permissions: vec![PluginCapability::SelectionRead, PluginCapability::CommandsRegister],
        };

        assert!(manifest.validate().is_ok());
    }

    #[test]
    fn test_invalid_api_version() {
        let manifest = PluginManifest {
            id: "swrite.future".into(),
            name: "Future Plugin".into(),
            version: "1.0.0".into(),
            api_version: 99,
            description: None,
            author: None,
            entry: "index.js".into(),
            permissions: vec![],
        };

        assert!(manifest.validate().is_err());
    }

    #[test]
    fn test_invalid_id_characters() {
        let manifest = PluginManifest {
            id: "swrite/bad/id".into(),
            name: "Bad Plugin".into(),
            version: "1.0.0".into(),
            api_version: 1,
            description: None,
            author: None,
            entry: "index.js".into(),
            permissions: vec![],
        };

        assert!(manifest.validate().is_err());
    }
}
