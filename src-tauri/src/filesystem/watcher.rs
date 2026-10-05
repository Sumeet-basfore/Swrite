use crate::error::{Result, SwriteError, WatcherError};
use crate::filesystem::paths::{is_hidden_or_internal, to_relative_path_string};
use notify::{Config, Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::mpsc::{channel, Sender};
use std::thread;
use std::time::{Duration, Instant};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(tag = "type", content = "data")]
pub enum FsWatchEvent {
    FileCreated {
        relative_path: String,
    },
    FileModified {
        relative_path: String,
    },
    FileDeleted {
        relative_path: String,
    },
    FileRenamed {
        old_relative_path: String,
        new_relative_path: String,
    },
}

pub struct ProjectWatcher {
    _watcher: RecommendedWatcher,
    stop_tx: Sender<()>,
}

impl ProjectWatcher {
    pub fn start<F>(project_root: PathBuf, mut callback: F) -> Result<Self>
    where
        F: FnMut(FsWatchEvent) + Send + 'static,
    {
        let (raw_tx, raw_rx) = channel::<notify::Result<Event>>();
        let (stop_tx, stop_rx) = channel::<()>();

        let mut watcher = RecommendedWatcher::new(
            move |res| {
                let _ = raw_tx.send(res);
            },
            Config::default().with_poll_interval(Duration::from_millis(200)),
        )
        .map_err(|e| SwriteError::Watcher(WatcherError::InitFailed(e.to_string())))?;

        watcher
            .watch(&project_root, RecursiveMode::Recursive)
            .map_err(|e| SwriteError::Watcher(WatcherError::WatchFailed(e.to_string())))?;

        let root_clone = project_root.clone();

        thread::spawn(move || {
            let mut last_event_time = Instant::now();
            let mut pending_events: Vec<FsWatchEvent> = Vec::new();

            loop {
                // Check if stopped
                if stop_rx.try_recv().is_ok() {
                    break;
                }

                // Poll raw watcher events with short timeout
                if let Ok(Ok(event)) = raw_rx.recv_timeout(Duration::from_millis(50)) {
                    for path in &event.paths {
                        // Check if internal/hidden
                        if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
                            if is_hidden_or_internal(file_name) || file_name.contains(".tmp.") {
                                continue;
                            }
                        }

                        if let Ok(rel) = to_relative_path_string(&root_clone, path) {
                            if rel.starts_with(".swrite") || rel.starts_with(".git") {
                                continue;
                            }

                            let watch_event = match event.kind {
                                EventKind::Create(_) => {
                                    Some(FsWatchEvent::FileCreated { relative_path: rel })
                                }
                                EventKind::Modify(_) => {
                                    Some(FsWatchEvent::FileModified { relative_path: rel })
                                }
                                EventKind::Remove(_) => {
                                    Some(FsWatchEvent::FileDeleted { relative_path: rel })
                                }
                                _ => None,
                            };

                            if let Some(ev) = watch_event {
                                if !pending_events.contains(&ev) {
                                    pending_events.push(ev);
                                }
                            }
                        }
                    }
                    last_event_time = Instant::now();
                }

                // Flush debounced events if 100ms has elapsed since last event
                if !pending_events.is_empty()
                    && last_event_time.elapsed() >= Duration::from_millis(100)
                {
                    for ev in pending_events.drain(..) {
                        callback(ev);
                    }
                }
            }
        });

        Ok(Self {
            _watcher: watcher,
            stop_tx,
        })
    }

    pub fn stop(self) {
        let _ = self.stop_tx.send(());
    }
}
