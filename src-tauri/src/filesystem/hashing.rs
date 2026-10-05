use sha2::{Digest, Sha256};

/// Computes a standard hex-encoded SHA-256 digest of content bytes.
/// Used for collision-resistant content identity, snapshots, and integrity checks.
pub fn sha256_digest(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    format!("{:x}", hasher.finalize())
}

/// Computes a fast 64-bit FNV-1a hash of content bytes.
/// Used for rapid in-memory dirty buffer detection and quick equality heuristics.
pub fn fast_content_hash(bytes: &[u8]) -> u64 {
    const FNV_OFFSET_BASIS: u64 = 0xcbf29ce484222325;
    const FNV_PRIME: u64 = 0x100000001b3;

    let mut hash = FNV_OFFSET_BASIS;
    for &byte in bytes {
        hash ^= byte as u64;
        hash = hash.wrapping_mul(FNV_PRIME);
    }
    hash
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sha256_consistency() {
        let text = b"The quick brown fox jumps over the lazy dog";
        let digest = sha256_digest(text);
        assert_eq!(
            digest,
            "d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592"
        );
    }

    #[test]
    fn test_fast_hash_differs_on_change() {
        let t1 = b"Chapter 1: The Beginning";
        let t2 = b"Chapter 1: The End";
        assert_ne!(fast_content_hash(t1), fast_content_hash(t2));
    }
}
