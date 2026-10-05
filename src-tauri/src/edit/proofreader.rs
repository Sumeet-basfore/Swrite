use crate::edit::comments::TextAnchor;
use crate::edit::dictionary::ProjectDictionary;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct ProofreadingFinding {
    pub id: String,
    pub document_id: String,
    pub category: String, // "proofreading", "formatting", "repetition", "punctuation"
    pub severity: String, // "info", "minor", "important"
    pub title: String,
    pub description: String,
    pub suggested_replacement: Option<String>,
    pub anchor: TextAnchor,
    pub status: String, // "open", "ignored", "resolved"
}

/// Runs deterministic, rule-based proofreading analysis on text
pub fn analyze_document_text(
    document_id: &str,
    text: &str,
    dictionary: &ProjectDictionary,
) -> Vec<ProofreadingFinding> {
    let mut findings = Vec::new();

    // 1. Repeated Consecutive Words Check (e.g. "the the", "in in", "had had")
    let words: Vec<(usize, usize, &str)> = text
        .match_indices(|c: char| c.is_alphabetic() || c == '\'')
        .fold(Vec::new(), |mut acc, (idx, _)| {
            if let Some(last) = acc.last_mut() {
                let (_, last_end, _) = *last;
                if idx == last_end {
                    // Continuing current word
                    *last = (last.0, idx + 1, &text[last.0..idx + 1]);
                    return acc;
                }
            }
            acc.push((idx, idx + 1, &text[idx..idx + 1]));
            acc
        });

    for i in 0..words.len().saturating_sub(1) {
        let (start1, end1, w1) = words[i];
        let (start2, end2, w2) = words[i + 1];

        // Check if words are identical (case-insensitive) and separated only by spaces
        if w1.eq_ignore_ascii_case(w2) && w1.len() > 1 {
            let between = &text[end1..start2];
            if between.trim().is_empty() {
                let finding_id = format!("rep-{}-{}-{}", document_id, start1, w1);
                if !dictionary.is_finding_ignored(&finding_id) {
                    let anchor = TextAnchor {
                        from: start1,
                        to: end2,
                        text: format!("{} {}", w1, w2),
                        context_before: text.get(start1.saturating_sub(20)..start1).map(|s| s.to_string()),
                        context_after: text.get(end2..text.len().min(end2 + 20)).map(|s| s.to_string()),
                    };

                    findings.push(ProofreadingFinding {
                        id: finding_id,
                        document_id: document_id.to_string(),
                        category: "repetition".to_string(),
                        severity: "minor".to_string(),
                        title: format!("Repeated word: '{}'", w1),
                        description: format!("'{}' is repeated consecutively.", w1),
                        suggested_replacement: Some(w1.to_string()),
                        anchor,
                        status: "open".to_string(),
                    });
                }
            }
        }
    }

    // 2. Double / Malformed Punctuation Check (e.g. ",,", ";;", ",.")
    let bad_puncts = [
        (",,", "Double comma", Some(",")),
        (";;", "Double semicolon", Some(";")),
        (",.", "Comma followed by period", Some(".")),
        (" ,", "Space before comma", Some(",")),
        (" .", "Space before period", Some(".")),
        (" ?", "Space before question mark", Some("?")),
        (" !", "Space before exclamation mark", Some("!")),
    ];

    for &(bad, title, replacement) in &bad_puncts {
        for (idx, _) in text.match_indices(bad) {
            let finding_id = format!("punc-{}-{}-{}", document_id, idx, bad);
            if !dictionary.is_finding_ignored(&finding_id) {
                let end = idx + bad.len();
                let anchor = TextAnchor {
                    from: idx,
                    to: end,
                    text: bad.to_string(),
                    context_before: text.get(idx.saturating_sub(20)..idx).map(|s| s.to_string()),
                    context_after: text.get(end..text.len().min(end + 20)).map(|s| s.to_string()),
                };

                findings.push(ProofreadingFinding {
                    id: finding_id,
                    document_id: document_id.to_string(),
                    category: "punctuation".to_string(),
                    severity: "minor".to_string(),
                    title: title.to_string(),
                    description: format!("Found malformed punctuation sequence '{}'.", bad),
                    suggested_replacement: replacement.map(|s| s.to_string()),
                    anchor,
                    status: "open".to_string(),
                });
            }
        }
    }

    findings
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_proofreading_detections() {
        let dict = ProjectDictionary::default();
        let sample = "He went to the the market , and saw it ..";

        let findings = analyze_document_text("Manuscript/Chapter 01.md", sample, &dict);
        assert!(findings.len() >= 2);

        let rep = findings.iter().find(|f| f.category == "repetition").unwrap();
        assert_eq!(rep.suggested_replacement, Some("the".to_string()));

        let space_punc = findings.iter().find(|f| f.title.contains("Space before comma"));
        assert!(space_punc.is_some());
    }
}
