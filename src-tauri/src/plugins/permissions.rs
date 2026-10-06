use crate::plugins::manifest::{PluginCapability, PluginManifest};
use crate::error::{PathSecurityError, Result, SwriteError};

#[derive(Debug, Clone)]
pub struct PermissionGuard {
    plugin_id: String,
    granted: Vec<PluginCapability>,
}

impl PermissionGuard {
    pub fn new(manifest: &PluginManifest) -> Self {
        Self {
            plugin_id: manifest.id.clone(),
            granted: manifest.permissions.clone(),
        }
    }

    pub fn check(&self, required: &PluginCapability) -> Result<()> {
        if self.granted.contains(required) {
            Ok(())
        } else {
            Err(SwriteError::PathSecurity(PathSecurityError::InternalFileBlocked(format!(
                "Plugin '{}' does not have capability '{:?}'",
                self.plugin_id, required
            ))))
        }
    }

    pub fn has_permission(&self, required: &PluginCapability) -> bool {
        self.granted.contains(required)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_permission_guard_check() {
        let manifest = PluginManifest {
            id: "test.plugin".into(),
            name: "Test".into(),
            version: "1.0.0".into(),
            api_version: 1,
            description: None,
            author: None,
            entry: "index.js".into(),
            permissions: vec![PluginCapability::SelectionRead],
        };

        let guard = PermissionGuard::new(&manifest);
        assert!(guard.check(&PluginCapability::SelectionRead).is_ok());
        assert!(guard.check(&PluginCapability::ProjectWrite).is_err());
    }
}
