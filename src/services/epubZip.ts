/**
 * Minimal, standard-compliant pure JavaScript ZIP archive builder for EPUB 3 packages.
 * Produces valid uncompressed (Store) ZIP files suitable for EPUB 3 containers.
 * The first entry is always the uncompressed 'mimetype' file.
 */

function makeCrc32Table(): Uint32Array {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
}

const CRC32_TABLE = makeCrc32Table();

function calculateCrc32(bytes: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ bytes[i]) & 0xFF];
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

export interface EpubFileEntry {
  name: string;
  data: string | Uint8Array;
}

export class EpubZipBuilder {
  private entries: EpubFileEntry[] = [];

  addFile(name: string, content: string | Uint8Array) {
    this.entries.push({ name, data: content });
  }

  buildUint8Array(): Uint8Array {
    const textEncoder = new TextEncoder();
    const processedEntries: {
      nameBytes: Uint8Array;
      dataBytes: Uint8Array;
      crc32: number;
      offset: number;
    }[] = [];

    // Calculate total size
    let offset = 0;
    const localHeaders: Uint8Array[] = [];

    for (const entry of this.entries) {
      const nameBytes = textEncoder.encode(entry.name);
      const dataBytes = typeof entry.data === 'string' ? textEncoder.encode(entry.data) : entry.data;
      const crc = calculateCrc32(dataBytes);

      const localHeader = new Uint8Array(30 + nameBytes.length + dataBytes.length);
      const view = new DataView(localHeader.buffer);

      // Local file header signature = 0x04034b50
      view.setUint32(0, 0x04034b50, true);
      view.setUint16(4, 20, true); // Version needed to extract (2.0)
      view.setUint16(6, 0, true); // General purpose bit flag
      view.setUint16(8, 0, true); // Compression method: 0 = Stored (uncompressed)
      view.setUint16(10, 0, true); // File last mod time
      view.setUint16(12, 0, true); // File last mod date
      view.setUint32(14, crc, true); // CRC-32
      view.setUint32(18, dataBytes.length, true); // Compressed size
      view.setUint32(22, dataBytes.length, true); // Uncompressed size
      view.setUint16(26, nameBytes.length, true); // File name length
      view.setUint16(28, 0, true); // Extra field length

      localHeader.set(nameBytes, 30);
      localHeader.set(dataBytes, 30 + nameBytes.length);

      processedEntries.push({
        nameBytes,
        dataBytes,
        crc32: crc,
        offset,
      });

      localHeaders.push(localHeader);
      offset += localHeader.length;
    }

    const centralDirectoryStart = offset;
    const centralHeaders: Uint8Array[] = [];

    for (const p of processedEntries) {
      const cdHeader = new Uint8Array(46 + p.nameBytes.length);
      const view = new DataView(cdHeader.buffer);

      // Central file header signature = 0x02014b50
      view.setUint32(0, 0x02014b50, true);
      view.setUint16(4, 20, true); // Version made by
      view.setUint16(6, 20, true); // Version needed to extract
      view.setUint16(8, 0, true); // General purpose bit flag
      view.setUint16(10, 0, true); // Compression method: 0
      view.setUint16(12, 0, true); // File last mod time
      view.setUint16(14, 0, true); // File last mod date
      view.setUint32(16, p.crc32, true); // CRC-32
      view.setUint32(20, p.dataBytes.length, true); // Compressed size
      view.setUint32(24, p.dataBytes.length, true); // Uncompressed size
      view.setUint16(28, p.nameBytes.length, true); // File name length
      view.setUint16(30, 0, true); // Extra field length
      view.setUint16(32, 0, true); // File comment length
      view.setUint16(34, 0, true); // Disk number start
      view.setUint16(36, 0, true); // Internal file attributes
      view.setUint32(38, 0, true); // External file attributes
      view.setUint32(42, p.offset, true); // Relative offset of local header

      cdHeader.set(p.nameBytes, 46);
      centralHeaders.push(cdHeader);
      offset += cdHeader.length;
    }

    const centralDirectorySize = offset - centralDirectoryStart;

    // End of central directory record (22 bytes)
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);

    // End of central dir signature = 0x06054b50
    eocdView.setUint32(0, 0x06054b50, true);
    eocdView.setUint16(4, 0, true); // Number of this disk
    eocdView.setUint16(6, 0, true); // Number of disk with start of central directory
    eocdView.setUint16(8, processedEntries.length, true); // Total entries in central directory on this disk
    eocdView.setUint16(10, processedEntries.length, true); // Total entries in central directory
    eocdView.setUint32(12, centralDirectorySize, true); // Size of central directory
    eocdView.setUint32(16, centralDirectoryStart, true); // Offset of start of central directory
    eocdView.setUint16(20, 0, true); // ZIP file comment length

    // Assemble final buffer
    const totalSize = offset + eocd.length;
    const finalBuffer = new Uint8Array(totalSize);

    let pos = 0;
    for (const lh of localHeaders) {
      finalBuffer.set(lh, pos);
      pos += lh.length;
    }
    for (const ch of centralHeaders) {
      finalBuffer.set(ch, pos);
      pos += ch.length;
    }
    finalBuffer.set(eocd, pos);

    return finalBuffer;
  }

  buildBlob(): Blob {
    const bytes = this.buildUint8Array();
    return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/epub+zip' });
  }
}
