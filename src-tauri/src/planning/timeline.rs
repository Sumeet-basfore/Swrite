use crate::error::Result;
use crate::filesystem::atomic_write::atomic_write_string;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct TimelineEvent {
    pub id: String,
    pub title: String,
    pub temporal_position: String,
    pub narrative_marker: Option<String>,
    pub linked_scene: Option<String>,
    pub description: String,
    pub notes: String,
    pub order_index: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default, PartialEq)]
pub struct TimelineData {
    pub events: Vec<TimelineEvent>,
}

impl TimelineData {
    /// Loads timeline events from `Planning/Timeline.md`
    pub fn load_from_project(project_root: &Path) -> Self {
        let timeline_file = project_root.join("Planning").join("Timeline.md");
        if !timeline_file.exists() {
            return Self::default();
        }

        match fs::read_to_string(&timeline_file) {
            Ok(content) => Self::parse_markdown(&content),
            Err(_) => Self::default(),
        }
    }

    /// Saves timeline events to `Planning/Timeline.md` in clean human-readable Markdown
    pub fn save_to_project(&self, project_root: &Path) -> Result<()> {
        let planning_dir = project_root.join("Planning");
        if !planning_dir.exists() {
            fs::create_dir_all(&planning_dir)?;
        }

        let timeline_file = planning_dir.join("Timeline.md");
        let markdown = self.serialize_to_markdown();
        atomic_write_string(&timeline_file, &markdown)?;
        Ok(())
    }

    /// Serializes TimelineData to readable Markdown
    pub fn serialize_to_markdown(&self) -> String {
        let mut md = String::from("# Story Timeline\n\n");

        for event in &self.events {
            md.push_str(&format!("## {}\n", event.title));
            md.push_str(&format!("- **ID**: `{}`\n", event.id));
            md.push_str(&format!("- **Time**: {}\n", event.temporal_position));
            if let Some(marker) = &event.narrative_marker {
                md.push_str(&format!("- **Marker**: {}\n", marker));
            }
            if let Some(scene) = &event.linked_scene {
                md.push_str(&format!("- **Scene**: `{}`\n", scene));
            }
            md.push_str(&format!("- **Order**: {}\n\n", event.order_index));

            if !event.description.is_empty() {
                md.push_str(&format!("{}\n\n", event.description));
            }

            if !event.notes.is_empty() {
                md.push_str("### Notes\n");
                md.push_str(&format!("{}\n\n", event.notes));
            }

            md.push_str("* * *\n\n");
        }

        md
    }

    /// Parses TimelineData from Markdown representation
    pub fn parse_markdown(source: &str) -> Self {
        let mut events = Vec::new();
        let sections = source.split("\n## ");

        for (idx, section) in sections.enumerate() {
            if idx == 0 {
                // Header section "# Story Timeline"
                continue;
            }

            let lines: Vec<&str> = section.lines().collect();
            if lines.is_empty() {
                continue;
            }

            let title = lines[0].trim().to_string();
            let mut id = Uuid::new_v4().to_string();
            let mut temporal_position = String::from("Unknown");
            let mut narrative_marker = None;
            let mut linked_scene = None;
            let mut order_index = events.len() + 1;
            let mut description_lines = Vec::new();
            let mut notes_lines = Vec::new();
            let mut reading_notes = false;

            for line in &lines[1..] {
                let trimmed = line.trim();
                if trimmed.starts_with("- **ID**:") {
                    id = trimmed
                        .replace("- **ID**:", "")
                        .replace('`', "")
                        .trim()
                        .to_string();
                } else if trimmed.starts_with("- **Time**:") {
                    temporal_position = trimmed.replace("- **Time**:", "").trim().to_string();
                } else if trimmed.starts_with("- **Marker**:") {
                    let m = trimmed.replace("- **Marker**:", "").trim().to_string();
                    if !m.is_empty() {
                        narrative_marker = Some(m);
                    }
                } else if trimmed.starts_with("- **Scene**:") {
                    let s = trimmed
                        .replace("- **Scene**:", "")
                        .replace('`', "")
                        .trim()
                        .to_string();
                    if !s.is_empty() {
                        linked_scene = Some(s);
                    }
                } else if trimmed.starts_with("- **Order**:") {
                    if let Ok(ord) = trimmed.replace("- **Order**:", "").trim().parse::<usize>() {
                        order_index = ord;
                    }
                } else if trimmed == "### Notes" {
                    reading_notes = true;
                } else if trimmed == "* * *" || trimmed == "---" {
                    // Divider
                    continue;
                } else if reading_notes {
                    notes_lines.push(*line);
                } else if !trimmed.is_empty() || !description_lines.is_empty() {
                    description_lines.push(*line);
                }
            }

            events.push(TimelineEvent {
                id,
                title,
                temporal_position,
                narrative_marker,
                linked_scene,
                description: description_lines.join("\n").trim().to_string(),
                notes: notes_lines.join("\n").trim().to_string(),
                order_index,
            });
        }

        events.sort_by_key(|e| e.order_index);
        TimelineData { events }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_timeline_roundtrip_markdown() {
        let mut data = TimelineData::default();
        data.events.push(TimelineEvent {
            id: "evt-1".to_string(),
            title: "The River Incident".to_string(),
            temporal_position: "3 years before the present".to_string(),
            narrative_marker: Some("Flashback".to_string()),
            linked_scene: Some("Manuscript/Chapter 01.md".to_string()),
            description: "Julian discovers the ancient watchtower.".to_string(),
            notes: "Needs stronger transition.".to_string(),
            order_index: 1,
        });

        let md = data.serialize_to_markdown();
        let parsed = TimelineData::parse_markdown(&md);

        assert_eq!(parsed.events.len(), 1);
        assert_eq!(parsed.events[0].id, "evt-1");
        assert_eq!(parsed.events[0].title, "The River Incident");
        assert_eq!(parsed.events[0].temporal_position, "3 years before the present");
        assert_eq!(parsed.events[0].narrative_marker, Some("Flashback".to_string()));
        assert_eq!(parsed.events[0].linked_scene, Some("Manuscript/Chapter 01.md".to_string()));
    }

    #[test]
    fn test_timeline_save_and_load_from_disk() {
        let dir = tempdir().unwrap();
        let root = dir.path();

        let mut data = TimelineData::default();
        data.events.push(TimelineEvent {
            id: "evt-2".to_string(),
            title: "Siege of Vareth".to_string(),
            temporal_position: "17 Frostfall 2042".to_string(),
            narrative_marker: None,
            linked_scene: None,
            description: "The city gates fell at dusk.".to_string(),
            notes: "".to_string(),
            order_index: 2,
        });

        data.save_to_project(root).unwrap();

        let loaded = TimelineData::load_from_project(root);
        assert_eq!(loaded.events.len(), 1);
        assert_eq!(loaded.events[0].title, "Siege of Vareth");
    }
}
