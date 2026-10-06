use std::time::Instant;
use swrite_core::document::markdown::{parse_markdown, serialize_markdown};
use swrite_core::document::txt::parse_txt;
use swrite_core::filesystem::hashing::sha256_digest;
use swrite_core::search::EphemeralSearchIndex;

fn generate_corpus(word_count: usize) -> String {
    let paragraph_template =
        "The ancient towers of Aethelgard stood silent beneath the gathering storm. \
Lucan reached for his sword, feeling the chill of the northern wind piercing through his cloak. \
In the shadows of the courtyard, whispers spoke of old kings and forgotten oaths. \
Every step forward echoed against the weathered granite stones of the forgotten fortress.\n\n";

    let words_per_paragraph = 55;
    let paragraphs_needed = (word_count / words_per_paragraph) + 1;

    let mut corpus = String::new();
    corpus.push_str("# Manuscript Draft\n\n");

    for i in 1..=paragraphs_needed {
        if i % 20 == 0 {
            corpus.push_str(&format!("## Chapter {}\n\n* * *\n\n", i / 20));
        }
        corpus.push_str(paragraph_template);
    }

    corpus
}

#[test]
fn test_benchmarks_all_tiers() {
    let tiers = vec![1_000, 10_000, 50_000, 100_000, 120_000];

    println!("\n========================================================");
    println!(" SWRITE 2 RUST CORE BENCHMARK PERFORMANCE RESULTS");
    println!("========================================================");

    for &tier in &tiers {
        let corpus = generate_corpus(tier);
        let actual_words = corpus.split_whitespace().count();

        // 1. Markdown Parse Benchmark
        let t0 = Instant::now();
        let doc = parse_markdown(&corpus, None).unwrap();
        let parse_duration = t0.elapsed();

        // 2. Markdown Serialize Benchmark
        let t1 = Instant::now();
        let _serialized = serialize_markdown(&doc);
        let serialize_duration = t1.elapsed();

        // 3. TXT Parse Benchmark
        let t2 = Instant::now();
        let _txt_doc = parse_txt(&corpus, None).unwrap();
        let txt_parse_duration = t2.elapsed();

        // 4. SHA-256 Hashing Benchmark
        let t3 = Instant::now();
        let _hash = sha256_digest(corpus.as_bytes());
        let hash_duration = t3.elapsed();

        // 5. Search Indexing Benchmark
        let mut index = EphemeralSearchIndex::new();
        let t4 = Instant::now();
        index.update_document("Manuscript/Full.md", &corpus);
        let index_duration = t4.elapsed();

        println!(
            "Tier: {:>7} words (Actual: {:>7} w, {:>8} bytes)\n  - MD Parse:     {:>8.2?}\n  - MD Serialize: {:>8.2?}\n  - TXT Parse:    {:>8.2?}\n  - SHA256 Hash:  {:>8.2?}\n  - Search Index: {:>8.2?}",
            tier,
            actual_words,
            corpus.len(),
            parse_duration,
            serialize_duration,
            txt_parse_duration,
            hash_duration,
            index_duration
        );

        if tier == 120_000 {
            // Must meet locked specification target (< 35ms)
            assert!(
                parse_duration.as_millis() < 35,
                "120k words parse took {:?}, exceeding 35ms target!",
                parse_duration
            );
        }
    }
    println!("========================================================\n");
}
