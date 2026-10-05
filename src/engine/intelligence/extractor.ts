/**
 * SWRITE — Project Intelligence Engine: Pass 1 (Contextual Extraction)
 * Analyzes full project context (Acts, Chapters, Scenes, Notes, Codex) and extracts
 * candidate entities, timeline markers, plot threads, and structural boundaries
 * with mandatory provenance tracking.
 */

import { ProjectData, Chapter, Scene } from '../../types';
import { 
  OrganizationDomain, OrganizationProposal, SourceReference 
} from '../../types/intelligence';

function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractParagraphs(content: string): string[] {
  if (!content) return [];
  // If html has <p> tags
  if (content.includes('<p>') || content.includes('<p ')) {
    const matches = content.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
    if (matches && matches.length > 0) {
      return matches.map(m => stripHtml(m)).filter(p => p.length > 0);
    }
  }
  // Otherwise split by double newlines
  return content
    .split(/\n\s*\n/)
    .map(p => stripHtml(p))
    .filter(p => p.length > 0);
}

// Common title/honorific prefixes
const HONORIFICS = ['Lord', 'Lady', 'Sir', 'Dame', 'King', 'Queen', 'Prince', 'Princess', 'Captain', 'Commander', 'High Inquisitor', 'Inquisitor', 'Master', 'Doctor', 'Dr.', 'Archmage', 'Father', 'Mother', 'Elder'];
// Common faction markers
const FACTION_MARKERS = ['Guard', 'Order', 'Guild', 'Brotherhood', 'Sisterhood', 'Covenant', 'Legion', 'Cult', 'Syndicate', 'Council', 'Watch', 'Alliance', 'Dynasty', 'Clan', 'Houses', 'Kingdom', 'Empire'];
// Common location markers
const LOCATION_MARKERS = ['City', 'Town', 'Village', 'Fortress', 'Castle', 'Tower', 'Citadel', 'Keep', 'Gate', 'Quarter', 'Street', 'River', 'Forest', 'Mountain', 'Pass', 'Valley', 'Isle', 'Island', 'Sea', 'Bay', 'Haven', 'Reach', 'Threshold'];
// Common item markers
const ITEM_MARKERS = ['Sword', 'Blade', 'Dagger', 'Staff', 'Wand', 'Crown', 'Amulet', 'Ring', 'Tome', 'Grimoire', 'Scroll', 'Shield', 'Armor', 'Relic', 'Chalice', 'Cipher', 'Vessel', 'Stone', 'Orb'];

// False-positive stop words (frequently capitalized words that are NOT entities)
const COMMON_NON_ENTITIES = new Set([
  'Chapter', 'Scene', 'Act', 'Part', 'The', 'And', 'Then', 'Suddenly', 'Meanwhile', 
  'After', 'Before', 'When', 'While', 'Every', 'Some', 'Many', 'Nothing', 'Everything',
  'However', 'Although', 'Perhaps', 'Tonight', 'Tomorrow', 'Yesterday', 'Today',
  'Style Guide', 'Untitled Scene', 'Draft', 'Notes', 'Prologue', 'Epilogue', 'Interlude'
]);

export interface RawExtractedCandidate {
  domain: OrganizationDomain;
  name: string;
  confidence: number;
  reasoning: string;
  sourceReferences: SourceReference[];
  attributes: Record<string, any>;
  timelineOffset?: string;
  isPotentialDuplicateOf?: string;
}

export const ProjectIntelligenceExtractor = {
  /**
   * Pass 1: Extract all entity candidates across manuscript and project context.
   */
  extractProjectCandidates(project: ProjectData): RawExtractedCandidate[] {
    const candidatesMap = new Map<string, RawExtractedCandidate>();

    const addOrUpdateCandidate = (
      domain: OrganizationDomain,
      name: string,
      confidence: number,
      reasoning: string,
      ref: SourceReference,
      attributes: Record<string, any> = {}
    ) => {
      const cleanName = name.trim();
      if (!cleanName || cleanName.length < 2) return;
      if (COMMON_NON_ENTITIES.has(cleanName)) return;

      const key = `${domain}:${cleanName.toLowerCase()}`;
      const existing = candidatesMap.get(key);

      if (existing) {
        existing.confidence = Math.min(0.98, Math.max(existing.confidence, confidence) + 0.05);
        // Avoid duplicate snippets from same paragraph
        if (!existing.sourceReferences.some(r => r.documentId === ref.documentId && r.paragraphIndex === ref.paragraphIndex)) {
          existing.sourceReferences.push(ref);
        }
        existing.attributes = { ...existing.attributes, ...attributes };
      } else {
        candidatesMap.set(key, {
          domain,
          name: cleanName,
          confidence,
          reasoning,
          sourceReferences: [ref],
          attributes,
        });
      }
    };

    // 1. Scan all Chapters & Scenes
    project.acts.forEach(act => {
      act.chapters.forEach(chapter => {
        const docTitle = `${act.title} · ${chapter.title}`;
        const paragraphs = extractParagraphs(chapter.content);

        paragraphs.forEach((para, pIndex) => {
          this.scanParagraphForEntities(para, chapter.id, docTitle, 'chapter', pIndex, addOrUpdateCandidate);
          this.scanParagraphForTimeline(para, chapter.id, docTitle, 'chapter', pIndex, addOrUpdateCandidate);
          this.scanParagraphForPlotThreads(para, chapter.id, docTitle, 'chapter', pIndex, addOrUpdateCandidate);
        });

        // Also scan individual scenes if present
        chapter.scenes?.forEach(scene => {
          const sceneTitle = `${docTitle} · ${scene.title || 'Scene'}`;
          const sceneParas = extractParagraphs(scene.content || '');
          sceneParas.forEach((para, pIndex) => {
            this.scanParagraphForEntities(para, scene.id, sceneTitle, 'scene', pIndex, addOrUpdateCandidate);
            this.scanParagraphForTimeline(para, scene.id, sceneTitle, 'scene', pIndex, addOrUpdateCandidate);
          });
        });
      });
    });

    // 2. Scan Codex Entries (if any exist)
    project.codex?.forEach(entry => {
      const domain: OrganizationDomain = entry.category === 'character' 
        ? 'character' 
        : entry.category === 'location' 
        ? 'location' 
        : entry.category === 'faction' 
        ? 'faction' 
        : entry.category === 'item' 
        ? 'item' 
        : 'research';

      const ref: SourceReference = {
        documentId: entry.id,
        documentTitle: `Codex: ${entry.name}`,
        documentType: 'research',
        snippet: (entry.content || entry.summary || '').substring(0, 150),
        reason: `Explicitly recorded in project codex as ${entry.category}.`
      };

      addOrUpdateCandidate(domain, entry.name, 0.95, `Codex entry in category ${entry.category}`, ref, {
        description: entry.content || entry.summary || '',
        aliases: entry.aliases || [],
        tags: entry.tags || []
      });
    });

    // 3. Scan Research Notes
    project.researchNotes?.forEach(note => {
      const ref: SourceReference = {
        documentId: note.id,
        documentTitle: `Research Note: ${note.title}`,
        documentType: 'research',
        snippet: (note.content || note.summary || '').substring(0, 150),
        reason: 'Explicit research note.'
      };

      addOrUpdateCandidate('research', note.title, 0.90, 'Research note document', ref, {
        content: note.content || '',
        category: note.category
      });

      const paragraphs = extractParagraphs(note.content || '');
      paragraphs.forEach((para, pIndex) => {
        this.scanParagraphForEntities(para, note.id, `Research: ${note.title}`, 'research', pIndex, addOrUpdateCandidate);
      });
    });

    // 4. Scan Cut Drawer Scenes
    project.cutScenes?.forEach(cut => {
      const ref: SourceReference = {
        documentId: cut.id,
        documentTitle: `Cut Drawer: ${cut.title}`,
        documentType: 'scene',
        snippet: (cut.content || '').substring(0, 150),
        reason: `Preserved in cut drawer from ${cut.originalChapterTitle || 'manuscript'}.`
      };

      addOrUpdateCandidate('outline', cut.title, 0.75, 'Draft scene preserved in cut drawer', ref, {
        rawContent: cut.content,
        wordCount: cut.wordCount,
        cutReason: cut.reason
      });
    });

    return Array.from(candidatesMap.values());
  },

  /**
   * Scans a single paragraph for character, location, faction, and item entities.
   */
  scanParagraphForEntities(
    paragraph: string,
    docId: string,
    docTitle: string,
    docType: 'chapter' | 'scene' | 'research' | 'file',
    pIndex: number,
    emit: (domain: OrganizationDomain, name: string, conf: number, reason: string, ref: SourceReference, attrs?: Record<string, any>) => void
  ) {
    if (!paragraph || paragraph.length < 15) return;

    // A. Character Dialogue Attribution Patterns:
    // e.g. "...", said Lucan. / Elena whispered, "..." / Lucan looked at / Lord Vane nodded.
    const dialogueAttributionRegex = /(?:["”]\s*(?:said|whispered|shouted|replied|muttered|asked|demanded|growled|gasped|laughed|sighed)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)|([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:said|whispered|shouted|replied|muttered|asked|demanded|growled|gasped|looked|stepped|turned|walked|smiled|nodded|drew|paused)[,\s])/g;
    let match: RegExpExecArray | null;

    while ((match = dialogueAttributionRegex.exec(paragraph)) !== null) {
      const name = (match[1] || match[2])?.trim();
      if (name && !COMMON_NON_ENTITIES.has(name)) {
        const snippet = paragraph.substring(Math.max(0, match.index - 30), Math.min(paragraph.length, match.index + 80));
        emit('character', name, 0.90, 'Identified via direct dialogue attribution or character physical action.', {
          documentId: docId,
          documentTitle: docTitle,
          documentType: docType,
          paragraphIndex: pIndex,
          snippet: `“...${snippet}...”`,
          reason: `Character active dialogue or gesture: "${match[0].trim()}"`
        }, {
          role: 'Primary / Speaking Character'
        });
      }
    }

    // B. Honorific Names: e.g. "Lord Lucan", "High Inquisitor Corvus", "Captain Thorne"
    HONORIFICS.forEach(hon => {
      const honRegex = new RegExp(`\\b(${hon}\\s+[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)\\b`, 'g');
      while ((match = honRegex.exec(paragraph)) !== null) {
        const fullName = match[1].trim();
        const snippet = paragraph.substring(Math.max(0, match.index - 20), Math.min(paragraph.length, match.index + 70));
        emit('character', fullName, 0.92, `Character identified with formal honorific/title "${hon}".`, {
          documentId: docId,
          documentTitle: docTitle,
          documentType: docType,
          paragraphIndex: pIndex,
          snippet: `...${snippet}...`,
          reason: `Formal title attribution: "${fullName}"`
        }, {
          title: hon,
          role: 'Titled Entity / Character'
        });
      }
    });

    // B2. Character Physical Traits & Attributes: e.g. "Corvus has violet eyes"
    const physicalTraitRegex = /\b([A-Z][a-z]+)\s+(?:has|had|with)\s+([a-z]+)\s+(eyes|hair|skin|cloak|robes?|scars?)\b/gi;
    while ((match = physicalTraitRegex.exec(paragraph)) !== null) {
      const charName = match[1];
      const detail = `${match[2]} ${match[3]}`.toLowerCase();
      if (!COMMON_NON_ENTITIES.has(charName)) {
        const snippet = paragraph.substring(Math.max(0, match.index - 20), Math.min(paragraph.length, match.index + 80));
        emit('character', charName, 0.86, `Physical attribute detected: "${detail}".`, {
          documentId: docId,
          documentTitle: docTitle,
          documentType: docType,
          paragraphIndex: pIndex,
          snippet: `...${snippet}...`,
          reason: `Physical description: "${match[0]}"`
        }, {
          physicalDetail: detail,
          traitType: match[3].toLowerCase()
        });
      }
    }

    // C. Faction Patterns: e.g. "The Ash Guard", "Order of the Eclipse", "Iron Guild"
    FACTION_MARKERS.forEach(marker => {
      const factionRegex = new RegExp(`\\b(?:The\\s+)?([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?\\s+${marker}|${marker}\\s+of\\s+(?:the\\s+)?[A-Z][a-z]+)\\b`, 'g');
      while ((match = factionRegex.exec(paragraph)) !== null) {
        const factionName = match[0].trim();
        if (!COMMON_NON_ENTITIES.has(factionName)) {
          const snippet = paragraph.substring(Math.max(0, match.index - 20), Math.min(paragraph.length, match.index + 70));
          emit('faction', factionName, 0.88, `Organizational faction detected with suffix/prefix "${marker}".`, {
            documentId: docId,
            documentTitle: docTitle,
            documentType: docType,
            paragraphIndex: pIndex,
            snippet: `...${snippet}...`,
            reason: `Faction/group name: "${factionName}"`
          });
        }
      }
    });

    // D. Location Patterns: e.g. "in Oakhaven", "gates of Vareth", "arrived at the Sunken Citadel"
    LOCATION_MARKERS.forEach(marker => {
      const locRegex = new RegExp(`\\b(?:in|at|near|outside|beyond|towards|within)\\s+(?:the\\s+)?([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?\\s+${marker}|${marker}\\s+of\\s+[A-Z][a-z]+|[A-Z][a-z]+(?:haven|hold|vale|shire|ford|bury|garde|stead|port|fell|wood|stone))\\b`, 'g');
      while ((match = locRegex.exec(paragraph)) !== null) {
        const locName = (match[1] || match[0]).replace(/^(?:in|at|near|outside|beyond|towards|within)\s+(?:the\s+)?/i, '').trim();
        if (locName && !COMMON_NON_ENTITIES.has(locName)) {
          const snippet = paragraph.substring(Math.max(0, match.index - 20), Math.min(paragraph.length, match.index + 70));
          emit('location', locName, 0.85, `Geographic location identified via spatial preposition and landmark marker "${marker}".`, {
            documentId: docId,
            documentTitle: docTitle,
            documentType: docType,
            paragraphIndex: pIndex,
            snippet: `...${snippet}...`,
            reason: `Spatial setting reference: "${locName}"`
          });
        }
      }
    });

    // E. Important Items & Artifacts: e.g. "The Obsidian Blade", "Amulet of Dawn", "Silver Cipher"
    ITEM_MARKERS.forEach(marker => {
      const itemRegex = new RegExp(`\\b(?:the\\s+)?([A-Z][a-z]+\\s+${marker}|${marker}\\s+of\\s+[A-Z][a-z]+)\\b`, 'g');
      while ((match = itemRegex.exec(paragraph)) !== null) {
        const itemName = match[0].trim();
        if (!COMMON_NON_ENTITIES.has(itemName)) {
          const snippet = paragraph.substring(Math.max(0, match.index - 20), Math.min(paragraph.length, match.index + 70));
          emit('item', itemName, 0.82, `Important artifact or item identified via object noun "${marker}".`, {
            documentId: docId,
            documentTitle: docTitle,
            documentType: docType,
            paragraphIndex: pIndex,
            snippet: `...${snippet}...`,
            reason: `Special item/artifact reference: "${itemName}"`
          });
        }
      }
    });
  },

  /**
   * Scans paragraph for explicit dates and relative chronological markers.
   */
  scanParagraphForTimeline(
    paragraph: string,
    docId: string,
    docTitle: string,
    docType: 'chapter' | 'scene' | 'research' | 'file',
    pIndex: number,
    emit: (domain: OrganizationDomain, name: string, conf: number, reason: string, ref: SourceReference, attrs?: Record<string, any>) => void
  ) {
    // Relative phrases: "Three years before the siege", "Fourteen days later", "In the winter of his youth"
    const relativeTimeRegex = /\b((?:[Tt]hree|[Ff]our|[Ff]ive|[Ss]ix|[Ss]even|[Ee]ight|[Nn]ine|[Tt]en|[Tt]welve|[Ff]ourteen|[Tt]wenty|\d+)\s+(?:years?|months?|days?|hours?|decades?)\s+(?:before|after|earlier|later|prior to)\s+(?:the\s+)?([A-Za-z\s]+?))[.,;]/g;
    let match: RegExpExecArray | null;

    while ((match = relativeTimeRegex.exec(paragraph)) !== null) {
      const fullPhrase = match[1].trim();
      const anchorEvent = match[2]?.trim();
      const snippet = paragraph.substring(Math.max(0, match.index - 20), Math.min(paragraph.length, match.index + 80));

      emit('timeline', fullPhrase, 0.88, `Relative chronological temporal offset anchored to "${anchorEvent || 'event'}".`, {
        documentId: docId,
        documentTitle: docTitle,
        documentType: docType,
        paragraphIndex: pIndex,
        snippet: `...${snippet}...`,
        reason: `Relative temporal anchor: "${fullPhrase}"`
      }, {
        relativeOffset: fullPhrase,
        anchorEvent: anchorEvent || 'Narrative Present',
        classification: fullPhrase.toLowerCase().includes('before') || fullPhrase.toLowerCase().includes('earlier') ? 'flashback' : 'flashforward'
      });
    }

    // Explicit year timestamps: "Year 1042", "400 BCE", "In 1892"
    const explicitYearRegex = /\b(?:In\s+the\s+year\s+|Year\s+|circa\s+)(\d{1,4}(?:\s*(?:BCE|CE|BC|AD|A\.D\.|B\.C\.))?)\b/gi;
    while ((match = explicitYearRegex.exec(paragraph)) !== null) {
      const yearStr = match[0].trim();
      const snippet = paragraph.substring(Math.max(0, match.index - 20), Math.min(paragraph.length, match.index + 70));

      emit('timeline', yearStr, 0.94, `Explicit chronological era timestamp "${yearStr}".`, {
        documentId: docId,
        documentTitle: docTitle,
        documentType: docType,
        paragraphIndex: pIndex,
        snippet: `...${snippet}...`,
        reason: `Explicit date reference: "${yearStr}"`
      }, {
        dateStr: yearStr,
        classification: 'historical'
      });
    }
  },

  /**
   * Scans paragraph for narrative plot threads, dramatic stakes, and unresolved questions.
   */
  scanParagraphForPlotThreads(
    paragraph: string,
    docId: string,
    docTitle: string,
    docType: 'chapter' | 'scene' | 'research' | 'file',
    pIndex: number,
    emit: (domain: OrganizationDomain, name: string, conf: number, reason: string, ref: SourceReference, attrs?: Record<string, any>) => void
  ) {
    // Dramatic stakes patterns: e.g. "The mystery of ...", "conspiracy behind ...", "vowed to avenge ..."
    const threadRegex = /\b(?:the\s+)?(mystery\s+of\s+[A-Za-z\s]+|conspiracy\s+behind\s+[A-Za-z\s]+|curse\s+of\s+[A-Za-z\s]+|quest\s+for\s+[A-Za-z\s]+|secret\s+of\s+[A-Za-z\s]+|threat\s+of\s+[A-Za-z\s]+)\b/gi;
    let match: RegExpExecArray | null;

    while ((match = threadRegex.exec(paragraph)) !== null) {
      const rawThread = match[1].trim();
      const threadTitle = rawThread.replace(/\b\w/g, l => l.toUpperCase());
      const snippet = paragraph.substring(Math.max(0, match.index - 20), Math.min(paragraph.length, match.index + 80));

      emit('plotThread', threadTitle, 0.84, `Dramatic plot thread or unresolved mystery identified in prose.`, {
        documentId: docId,
        documentTitle: docTitle,
        documentType: docType,
        paragraphIndex: pIndex,
        snippet: `...${snippet}...`,
        reason: `Dramatic narrative thread: "${threadTitle}"`
      }, {
        type: threadTitle.toLowerCase().includes('mystery') || threadTitle.toLowerCase().includes('secret') ? 'mystery' : 'main-plot',
        status: 'active'
      });
    }
  }
};
