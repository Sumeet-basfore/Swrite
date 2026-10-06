pub mod manifest;
pub mod permissions;
pub mod store;
pub mod manager;

pub use manifest::{PluginCapability, PluginManifest, CURRENT_PLUGIN_API_VERSION};
pub use permissions::PermissionGuard;
pub use store::PluginDataStore;
pub use manager::{PluginManager, DiscoveredPlugin, PluginStateConfig};
