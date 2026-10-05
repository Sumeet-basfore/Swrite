use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum SwriteError {
    #[error("Project error: {0}")]
    Project(#[from] ProjectError),

    #[error("Filesystem error: {0}")]
    Filesystem(#[from] FilesystemError),

    #[error("Path security error: {0}")]
    PathSecurity(#[from] PathSecurityError),

    #[error("Document parse error: {0}")]
    DocumentParse(#[from] DocumentParseError),

    #[error("Document serialize error: {0}")]
    DocumentSerialize(#[from] DocumentSerializeError),

    #[error("Format error: {0}")]
    Format(#[from] FormatError),

    #[error("Recovery error: {0}")]
    Recovery(#[from] RecoveryError),

    #[error("Watcher error: {0}")]
    Watcher(#[from] WatcherError),

    #[error("Reconciliation error: {0}")]
    Reconciliation(#[from] ReconciliationError),

    #[error("Validation error: {0}")]
    Validation(#[from] ValidationError),
}

#[derive(Error, Debug, Serialize, Deserialize, Clone)]
pub enum ProjectError {
    #[error("Project not found at path: {0}")]
    NotFound(String),

    #[error("Project already exists at path: {0}")]
    AlreadyExists(String),

    #[error("Project manifest corrupted: {0}")]
    ManifestCorrupted(String),

    #[error("Invalid project structure: {0}")]
    InvalidStructure(String),

    #[error("No active project is currently open")]
    NoActiveProject,

    #[error("Project is locked or busy: {0}")]
    ProjectBusy(String),
}

#[derive(Error, Debug, Serialize, Deserialize, Clone)]
pub enum FilesystemError {
    #[error("I/O error: {0}")]
    Io(String),

    #[error("File not found: {0}")]
    NotFound(String),

    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    #[error("File or directory already exists: {0}")]
    AlreadyExists(String),

    #[error("Atomic write failed: {0}")]
    AtomicWriteFailed(String),
}

#[derive(Error, Debug, Serialize, Deserialize, Clone)]
pub enum PathSecurityError {
    #[error("Path traversal blocked outside project root: {0}")]
    PathTraversalBlocked(String),

    #[error("Symlink escape blocked: {0}")]
    SymlinkEscapeBlocked(String),

    #[error("Invalid relative path: {0}")]
    InvalidRelativePath(String),

    #[error("Access to internal hidden file blocked: {0}")]
    InternalFileBlocked(String),
}

#[derive(Error, Debug, Serialize, Deserialize, Clone)]
pub enum DocumentParseError {
    #[error("Invalid document format: {0}")]
    InvalidFormat(String),

    #[error("UTF-8 decoding error: {0}")]
    Utf8Error(String),

    #[error("Corrupt DOCX archive: {0}")]
    CorruptDocx(String),

    #[error("Unsupported syntax or construct: {0}")]
    UnsupportedFeature(String),
}

#[derive(Error, Debug, Serialize, Deserialize, Clone)]
pub enum DocumentSerializeError {
    #[error("Serialization failed: {0}")]
    SerializationFailed(String),

    #[error("Format mismatch: {0}")]
    FormatMismatch(String),
}

#[derive(Error, Debug, Serialize, Deserialize, Clone)]
pub enum FormatError {
    #[error("Format mismatch. Expected: {expected}, detected: {detected}")]
    SniffMismatch { expected: String, detected: String },

    #[error("Unknown or unsupported format: {0}")]
    UnknownFormat(String),
}

#[derive(Error, Debug, Serialize, Deserialize, Clone)]
pub enum RecoveryError {
    #[error("Recovery draft not found: {0}")]
    DraftNotFound(String),

    #[error("Recovery draft corrupted: {0}")]
    DraftCorrupted(String),

    #[error("Recovery draft write failed: {0}")]
    WriteFailed(String),
}

#[derive(Error, Debug, Serialize, Deserialize, Clone)]
pub enum WatcherError {
    #[error("Failed to initialize file watcher: {0}")]
    InitFailed(String),

    #[error("Watcher failed: {0}")]
    WatchFailed(String),
}

#[derive(Error, Debug, Serialize, Deserialize, Clone)]
pub enum ReconciliationError {
    #[error("Three-way conflict detected: {0}")]
    Conflict(String),

    #[error("Base version mismatch: {0}")]
    InvalidBaseVersion(String),
}

#[derive(Error, Debug, Serialize, Deserialize, Clone)]
pub enum ValidationError {
    #[error("Validation failed with issues: {0:?}")]
    Failed(Vec<String>),
}

// Convert std::io::Error to SwriteError
impl From<std::io::Error> for SwriteError {
    fn from(err: std::io::Error) -> Self {
        SwriteError::Filesystem(FilesystemError::Io(err.to_string()))
    }
}

// Convert serde_json::Error to SwriteError
impl From<serde_json::Error> for SwriteError {
    fn from(err: serde_json::Error) -> Self {
        SwriteError::Filesystem(FilesystemError::Io(format!("JSON error: {}", err)))
    }
}

// Serializable error payload for Tauri IPC
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct IpcError {
    pub code: String,
    pub message: String,
    pub details: Option<serde_json::Value>,
}

impl Serialize for SwriteError {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        let (code, message, details) = match self {
            SwriteError::Project(e) => {
                ("PROJECT_ERROR", e.to_string(), serde_json::to_value(e).ok())
            }
            SwriteError::Filesystem(e) => (
                "FILESYSTEM_ERROR",
                e.to_string(),
                serde_json::to_value(e).ok(),
            ),
            SwriteError::PathSecurity(e) => (
                "PATH_SECURITY_ERROR",
                e.to_string(),
                serde_json::to_value(e).ok(),
            ),
            SwriteError::DocumentParse(e) => {
                ("PARSE_ERROR", e.to_string(), serde_json::to_value(e).ok())
            }
            SwriteError::DocumentSerialize(e) => (
                "SERIALIZE_ERROR",
                e.to_string(),
                serde_json::to_value(e).ok(),
            ),
            SwriteError::Format(e) => ("FORMAT_ERROR", e.to_string(), serde_json::to_value(e).ok()),
            SwriteError::Recovery(e) => (
                "RECOVERY_ERROR",
                e.to_string(),
                serde_json::to_value(e).ok(),
            ),
            SwriteError::Watcher(e) => {
                ("WATCHER_ERROR", e.to_string(), serde_json::to_value(e).ok())
            }
            SwriteError::Reconciliation(e) => (
                "RECONCILIATION_ERROR",
                e.to_string(),
                serde_json::to_value(e).ok(),
            ),
            SwriteError::Validation(e) => (
                "VALIDATION_ERROR",
                e.to_string(),
                serde_json::to_value(e).ok(),
            ),
        };

        let ipc_err = IpcError {
            code: code.to_string(),
            message,
            details,
        };

        ipc_err.serialize(serializer)
    }
}

pub type Result<T> = std::result::Result<T, SwriteError>;
