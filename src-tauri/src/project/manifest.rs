use crate::error::{ProjectError, Result, SwriteError};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct ProjectManifest {
    pub schema_version: u32,
    pub project_id: String,
    pub name: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    #[serde(default)]
    pub document_identities: HashMap<String, String>, // UUID -> Relative Path
    #[serde(default)]
    pub metadata: HashMap<String, serde_json::Value>,
}

impl ProjectManifest {
    pub fn new(name: &str) -> Self {
        let now = Utc::now();
        Self {
            schema_version: 1,
            project_id: Uuid::new_v4().to_string(),
            name: name.to_string(),
            created_at: now,
            updated_at: now,
            document_identities: HashMap::new(),
            metadata: HashMap::new(),
        }
    }

    pub fn validate(&self) -> Result<()> {
        if self.schema_version == 0 {
            return Err(SwriteError::Project(ProjectError::ManifestCorrupted(
                "Invalid schema version 0".to_string(),
            )));
        }
        if self.project_id.trim().is_empty() {
            return Err(SwriteError::Project(ProjectError::ManifestCorrupted(
                "Missing project_id".to_string(),
            )));
        }
        if self.name.trim().is_empty() {
            return Err(SwriteError::Project(ProjectError::ManifestCorrupted(
                "Empty project name".to_string(),
            )));
        }
        Ok(())
    }
}
