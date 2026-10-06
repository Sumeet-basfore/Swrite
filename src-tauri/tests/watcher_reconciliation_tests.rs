use swrite_core::filesystem::reconciliation::{reconcile_content, ReconciliationStatus};
use swrite_core::history::HistoryStore;
use swrite_core::project::create_project;
use swrite_core::recovery::drafts::{
    clear_recovery_draft, get_recovery_draft, list_recovery_drafts, save_recovery_draft,
};
use swrite_core::search::EphemeralSearchIndex;
use tempfile::tempdir;

#[test]
fn test_recovery_draft_lifecycle() {
    let dir = tempdir().unwrap();
    let root = dir.path();
    create_project(root, "Recovery Lifecycle").unwrap();

    save_recovery_draft(
        root,
        "doc-uuid-1",
        "Manuscript/Chapter 01.md",
        "Unsaved typing in progress...",
    )
    .unwrap();

    let drafts = list_recovery_drafts(root).unwrap();
    assert_eq!(drafts.len(), 1);
    assert_eq!(drafts[0].document_id, "doc-uuid-1");
    assert_eq!(drafts[0].content, "Unsaved typing in progress...");

    let single = get_recovery_draft(root, "doc-uuid-1").unwrap();
    assert!(single.is_some());
    assert_eq!(single.unwrap().content, "Unsaved typing in progress...");

    clear_recovery_draft(root, "doc-uuid-1").unwrap();
    let drafts_after = list_recovery_drafts(root).unwrap();
    assert_eq!(drafts_after.len(), 0);
}

#[test]
fn test_history_snapshots_store() {
    let dir = tempdir().unwrap();
    let root = dir.path();
    create_project(root, "History Test").unwrap();

    let meta1 = HistoryStore::record_save(
        root,
        "doc-uuid-2",
        "Manuscript/Scene 01.md",
        "First draft text",
        Some("Initial scene"),
    )
    .unwrap();

    let _meta2 = HistoryStore::record_save(
        root,
        "doc-uuid-2",
        "Manuscript/Scene 01.md",
        "Second draft text with edits",
        Some("Revision 1"),
    )
    .unwrap();

    let snapshots = HistoryStore::list(root, "doc-uuid-2").unwrap();
    assert_eq!(snapshots.len(), 2);

    let fetched = HistoryStore::get(root, "doc-uuid-2", &meta1.snapshot_id).unwrap();
    assert!(fetched.is_some());
    assert_eq!(fetched.unwrap().content, "First draft text");
}

#[test]
fn test_three_way_reconciliation_logic() {
    let base = "Original text";
    let user_clean = "Original text";
    let disk_modified = "Original text edited in Vim";
    let res1 = reconcile_content("Scene.md", Some(base), user_clean, Some(disk_modified));
    assert_eq!(res1.status, ReconciliationStatus::ExternalOnlyChanged);

    let user_dirty = "Original text with my new paragraphs";
    let disk_unmodified = "Original text";
    let res2 = reconcile_content("Scene.md", Some(base), user_dirty, Some(disk_unmodified));
    assert_eq!(res2.status, ReconciliationStatus::UserOnlyChanged);

    let disk_conflicting = "Original text with someone else's edits";
    let res3 = reconcile_content("Scene.md", Some(base), user_dirty, Some(disk_conflicting));
    assert_eq!(res3.status, ReconciliationStatus::BothChangedConflict);
    assert!(res3.conflict_details.is_some());
}

#[test]
fn test_ephemeral_search_indexing() {
    let mut index = EphemeralSearchIndex::new();
    index.update_document(
        "Manuscript/Chapter 01.md",
        "Lucan arrived in Aethelgard before nightfall.",
    );
    index.update_document(
        "Planning/Outline.md",
        "In Chapter 1, Lucan will discover the ancient map.",
    );

    let result = index.search("Lucan");
    assert_eq!(result.total_matches, 2);
    assert_eq!(result.matches[0].relative_path, "Manuscript/Chapter 01.md");
    assert_eq!(result.matches[1].relative_path, "Planning/Outline.md");

    let result_case_insensitive = index.search("aethelgard");
    assert_eq!(result_case_insensitive.total_matches, 1);
}
