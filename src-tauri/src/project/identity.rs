use crate::project::manifest::ProjectManifest;
use std::collections::HashMap;
use uuid::Uuid;

pub struct IdentityManager;

impl IdentityManager {
    /// Returns existing UUID for a relative path or registers a new UUID v4.
    pub fn get_or_create_id(manifest: &mut ProjectManifest, relative_path: &str) -> String {
        // Look up if path already has an assigned ID
        for (id, path) in &manifest.document_identities {
            if path == relative_path {
                return id.clone();
            }
        }

        // Otherwise generate a new stable UUID v4
        let new_id = Uuid::new_v4().to_string();
        manifest
            .document_identities
            .insert(new_id.clone(), relative_path.to_string());
        new_id
    }

    /// Finds relative path corresponding to a document ID.
    pub fn find_path_by_id(manifest: &ProjectManifest, id: &str) -> Option<String> {
        manifest.document_identities.get(id).cloned()
    }

    /// Updates the relative path for an existing document ID (e.g. after rename or move).
    pub fn update_path_for_id(manifest: &mut ProjectManifest, id: &str, new_relative_path: &str) {
        manifest
            .document_identities
            .insert(id.to_string(), new_relative_path.to_string());
    }

    /// Removes a document ID from mapping (e.g. on file deletion).
    pub fn remove_id(manifest: &mut ProjectManifest, id: &str) {
        manifest.document_identities.remove(id);
    }

    /// Reconciles the manifest identities map against a list of currently discovered relative paths.
    /// Preserves existing UUIDs and assigns new UUIDs to new files.
    pub fn reconcile_identities(manifest: &mut ProjectManifest, discovered_paths: &[String]) {
        let mut path_to_id: HashMap<String, String> = HashMap::new();
        for (id, path) in &manifest.document_identities {
            path_to_id.insert(path.clone(), id.clone());
        }

        let mut new_map = HashMap::new();
        for path in discovered_paths {
            if let Some(existing_id) = path_to_id.get(path) {
                new_map.insert(existing_id.clone(), path.clone());
            } else {
                let fresh_id = Uuid::new_v4().to_string();
                new_map.insert(fresh_id, path.clone());
            }
        }

        manifest.document_identities = new_map;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_identity_persistence_and_update() {
        let mut manifest = ProjectManifest::new("Novel");
        let id1 = IdentityManager::get_or_create_id(&mut manifest, "Manuscript/Chapter 01.md");
        assert!(!id1.is_empty());

        let id1_again =
            IdentityManager::get_or_create_id(&mut manifest, "Manuscript/Chapter 01.md");
        assert_eq!(id1, id1_again);

        // Rename
        IdentityManager::update_path_for_id(&mut manifest, &id1, "Manuscript/Act 1/Chapter 01.md");
        let path = IdentityManager::find_path_by_id(&manifest, &id1).unwrap();
        assert_eq!(path, "Manuscript/Act 1/Chapter 01.md");
    }
}
