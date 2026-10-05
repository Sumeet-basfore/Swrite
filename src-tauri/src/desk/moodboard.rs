use crate::error::{DocumentParseError, DocumentSerializeError, FilesystemError, Result, SwriteError};
use crate::filesystem::atomic_write::atomic_write_bytes;
use crate::filesystem::paths::resolve_secure_path;
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct MoodboardCanvasState {
    pub pan_x: f64,
    pub pan_y: f64,
    pub zoom: f64,
}

impl Default for MoodboardCanvasState {
    fn default() -> Self {
        Self {
            pan_x: 0.0,
            pan_y: 0.0,
            zoom: 1.0,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum MoodboardItem {
    Image {
        id: String,
        x: f64,
        y: f64,
        width: f64,
        height: f64,
        asset_path: String,
        caption: Option<String>,
        z_index: i32,
    },
    Text {
        id: String,
        x: f64,
        y: f64,
        width: f64,
        height: f64,
        text: String,
        style: String, // "title" | "body" | "label"
        z_index: i32,
    },
    Color {
        id: String,
        x: f64,
        y: f64,
        width: f64,
        height: f64,
        hex: String,
        label: Option<String>,
        z_index: i32,
    },
    Note {
        id: String,
        x: f64,
        y: f64,
        width: f64,
        height: f64,
        title: String,
        content: String,
        z_index: i32,
    },
    Link {
        id: String,
        x: f64,
        y: f64,
        width: f64,
        height: f64,
        title: String,
        target_path: String,
        z_index: i32,
    },
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct MoodboardData {
    pub id: String,
    pub name: String,
    pub canvas: MoodboardCanvasState,
    pub items: Vec<MoodboardItem>,
    pub updated_at: u64,
}

impl MoodboardData {
    pub fn new(id: String, name: String) -> Self {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        Self {
            id,
            name,
            canvas: MoodboardCanvasState::default(),
            items: Vec::new(),
            updated_at: now,
        }
    }
}

/// Load a moodboard from a relative json path (e.g. "Desk/Moodboards/Castle Atmosphere/board.json")
pub fn load_moodboard(project_root: &Path, relative_path: &str) -> Result<MoodboardData> {
    let full_path = resolve_secure_path(project_root, relative_path, false)?;
    if !full_path.exists() {
        return Err(SwriteError::Filesystem(FilesystemError::NotFound(
            relative_path.to_string(),
        )));
    }

    let bytes = std::fs::read(&full_path)
        .map_err(|e| SwriteError::Filesystem(FilesystemError::Io(e.to_string())))?;
    let data: MoodboardData = serde_json::from_slice(&bytes).map_err(|e| {
        SwriteError::DocumentParse(DocumentParseError::InvalidFormat(format!(
            "Invalid moodboard JSON: {}",
            e
        )))
    })?;
    Ok(data)
}

/// Save a moodboard atomically to a relative path
pub fn save_moodboard(
    project_root: &Path,
    relative_path: &str,
    data: &MoodboardData,
) -> Result<()> {
    let full_path = resolve_secure_path(project_root, relative_path, false)?;
    if let Some(parent) = full_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| SwriteError::Filesystem(FilesystemError::Io(e.to_string())))?;
    }

    let json_bytes = serde_json::to_vec_pretty(data).map_err(|e| {
        SwriteError::DocumentSerialize(DocumentSerializeError::SerializationFailed(format!(
            "Failed to serialize moodboard: {}",
            e
        )))
    })?;
    atomic_write_bytes(&full_path, &json_bytes)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_moodboard_lifecycle() {
        let dir = tempdir().unwrap();
        let root = dir.path();

        let mut board = MoodboardData::new("board-1".to_string(), "Inspiration Board".to_string());
        board.canvas.zoom = 1.25;
        board.items.push(MoodboardItem::Text {
            id: "txt-1".to_string(),
            x: 100.0,
            y: 150.0,
            width: 200.0,
            height: 80.0,
            text: "High Gothic Atmosphere".to_string(),
            style: "title".to_string(),
            z_index: 1,
        });
        board.items.push(MoodboardItem::Color {
            id: "col-1".to_string(),
            x: 350.0,
            y: 150.0,
            width: 60.0,
            height: 60.0,
            hex: "#2A1F1A".to_string(),
            label: Some("Obsidian".to_string()),
            z_index: 2,
        });
        board.items.push(MoodboardItem::Image {
            id: "img-1".to_string(),
            x: 100.0,
            y: 250.0,
            width: 300.0,
            height: 200.0,
            asset_path: "Assets/Images/fortress.jpg".to_string(),
            caption: Some("Northern Keep".to_string()),
            z_index: 3,
        });

        let target_rel = "Desk/Moodboards/Inspiration Board/board.json";
        save_moodboard(root, target_rel, &board).unwrap();

        let loaded = load_moodboard(root, target_rel).unwrap();
        assert_eq!(loaded.name, "Inspiration Board");
        assert_eq!(loaded.canvas.zoom, 1.25);
        assert_eq!(loaded.items.len(), 3);
        assert_eq!(loaded, board);
    }
}
