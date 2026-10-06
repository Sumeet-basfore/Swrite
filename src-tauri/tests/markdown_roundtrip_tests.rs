use swrite_core::document::markdown::{parse_markdown, serialize_markdown};

#[test]
fn test_golden_markdown_headings_and_inlines() {
    let source = r#"# Act I: The Gathering

## Chapter 1: The Outskirts

It was a cold, misty dawn. Lucan adjusted his heavy woolen cloak and watched the distant horizon.

### Scene 1.1

He reached into his pocket and found the **ancient key**, noticing its *faint golden glow*.

The inscription read: `Aethelgard 1420`.

~~Nothing remained of the old order.~~
"#;

    let doc = parse_markdown(source, None).unwrap();
    let serialized = serialize_markdown(&doc);
    let doc_roundtrip = parse_markdown(&serialized, None).unwrap();

    assert_eq!(doc.blocks, doc_roundtrip.blocks);
}

#[test]
fn test_golden_markdown_lists_and_tasks() {
    let source = r#"# Planning Checklist

- [ ] Unfinished task
- [x] Completed task
- [ ] Research ancient cartography

1. Opening gate
2. Meeting with the elder
3. The sudden betrayal
"#;

    let doc = parse_markdown(source, None).unwrap();
    let serialized = serialize_markdown(&doc);
    let doc_roundtrip = parse_markdown(&serialized, None).unwrap();

    assert_eq!(doc.blocks, doc_roundtrip.blocks);
}

#[test]
fn test_golden_markdown_tables_and_quotes() {
    let source = r#"# World Attributes

| Realm | Ruler | Element |
| :--- | :---: | ---: |
| Solaris | Aurelius | Fire |
| Aquaria | Thalassa | Water |
| Terran | Gaia | Earth |

> "The stars do not lie, young traveler. Only men do."
"#;

    let doc = parse_markdown(source, None).unwrap();
    let serialized = serialize_markdown(&doc);
    let doc_roundtrip = parse_markdown(&serialized, None).unwrap();

    assert_eq!(doc.blocks, doc_roundtrip.blocks);
}

#[test]
fn test_golden_markdown_wikilinks_and_scene_breaks() {
    let source = r#"# Chapter 4

Lucan traveled north toward [[Aethelgard|The City of Spires]] to meet [[Kaelen]].

* * *

Meanwhile, at the citadel gates, guards stood motionless in the rain.

---

The night had finally fallen.
"#;

    let doc = parse_markdown(source, None).unwrap();
    let serialized = serialize_markdown(&doc);
    let doc_roundtrip = parse_markdown(&serialized, None).unwrap();

    assert_eq!(doc.blocks, doc_roundtrip.blocks);
}

#[test]
fn test_golden_markdown_raw_html_preservation() {
    let source = r#"# Chapter with Raw Construct

<div class="custom-note">
Special manuscript note here.
</div>

Standard prose resumes here.
"#;

    let doc = parse_markdown(source, None).unwrap();
    let serialized = serialize_markdown(&doc);

    assert!(serialized.contains("custom-note"));
}
