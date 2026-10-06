use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum DiffTag {
    Equal,
    Insert,
    Delete,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct DiffChunk {
    pub tag: DiffTag,
    pub text: String,
    pub old_line: Option<usize>,
    pub new_line: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub struct DocumentDiffResult {
    pub old_label: String,
    pub new_label: String,
    pub chunks: Vec<DiffChunk>,
    pub additions_count: usize,
    pub deletions_count: usize,
}

/// Computes a clean line-based diff between old text and new text
pub fn compute_line_diff(
    old_text: &str,
    new_text: &str,
    old_label: &str,
    new_label: &str,
) -> DocumentDiffResult {
    let old_lines: Vec<&str> = old_text.lines().collect();
    let new_lines: Vec<&str> = new_text.lines().collect();

    // Standard LCS (Longest Common Subsequence) diff
    let m = old_lines.len();
    let n = new_lines.len();

    let mut dp = vec![vec![0usize; n + 1]; m + 1];
    for i in 1..=m {
        for j in 1..=n {
            if old_lines[i - 1] == new_lines[j - 1] {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = dp[i - 1][j].max(dp[i][j - 1]);
            }
        }
    }

    let mut chunks = Vec::new();
    let mut i = m;
    let mut j = n;
    let mut additions = 0;
    let mut deletions = 0;

    while i > 0 || j > 0 {
        if i > 0 && j > 0 && old_lines[i - 1] == new_lines[j - 1] {
            chunks.push(DiffChunk {
                tag: DiffTag::Equal,
                text: old_lines[i - 1].to_string(),
                old_line: Some(i),
                new_line: Some(j),
            });
            i -= 1;
            j -= 1;
        } else if j > 0 && (i == 0 || dp[i][j - 1] >= dp[i - 1][j]) {
            chunks.push(DiffChunk {
                tag: DiffTag::Insert,
                text: new_lines[j - 1].to_string(),
                old_line: None,
                new_line: Some(j),
            });
            additions += 1;
            j -= 1;
        } else if i > 0 && (j == 0 || dp[i][j - 1] < dp[i - 1][j]) {
            chunks.push(DiffChunk {
                tag: DiffTag::Delete,
                text: old_lines[i - 1].to_string(),
                old_line: Some(i),
                new_line: None,
            });
            deletions += 1;
            i -= 1;
        }
    }

    chunks.reverse();

    DocumentDiffResult {
        old_label: old_label.to_string(),
        new_label: new_label.to_string(),
        chunks,
        additions_count: additions,
        deletions_count: deletions,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_line_diff_calculation() {
        let old_text = "Chapter 1\nThe wind was cold.\nHe ran.";
        let new_text = "Chapter 1\nThe wind was freezing cold.\nHe sprinted.\nHe stopped.";

        let res = compute_line_diff(old_text, new_text, "Snapshot 1", "Current");

        assert_eq!(res.old_label, "Snapshot 1");
        assert_eq!(res.new_label, "Current");
        assert!(res.additions_count > 0);
        assert!(res.deletions_count > 0);

        let equal_chunks: Vec<_> = res.chunks.iter().filter(|c| c.tag == DiffTag::Equal).collect();
        assert!(equal_chunks.iter().any(|c| c.text == "Chapter 1"));
    }
}
