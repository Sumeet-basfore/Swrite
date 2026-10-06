export interface DeskTemplate {
  id: string;
  name: string;
  category: 'characters' | 'locations' | 'research' | 'world' | 'notes';
  folder: string;
  defaultFilename: string;
  templateContent: (title: string) => string;
}

export const DESK_TEMPLATES: Record<string, DeskTemplate> = {
  character: {
    id: 'character',
    name: 'Character Note',
    category: 'characters',
    folder: 'Desk/Characters',
    defaultFilename: 'New Character.md',
    templateContent: (title: string) => `# ${title}

## Summary & Role
<!-- Primary narrative role, archetype, or relationship to protagonist -->

## Appearance
- **Age**: 
- **Distinguishing Features**: 
- **Voice / Mannerisms**: 

## Personality & Motivation
- **Core Want**: 
- **Internal Need / Conflict**: 
- **Flaws & Blindspots**: 

## Background & History
<!-- Key historical events shaping this character -->

## Key Relationships
- **Allies**: 
- **Antagonists**: 

## Story Notes
<!-- Ideas, scenes to write, things to fix -->
`,
  },

  location: {
    id: 'location',
    name: 'Location Note',
    category: 'locations',
    folder: 'Desk/Locations',
    defaultFilename: 'New Location.md',
    templateContent: (title: string) => `# ${title}

## Overview & Atmosphere
<!-- Sensory atmosphere, lighting, soundscapes, smell -->

## Geography & Architecture
<!-- Physical layout, key buildings, defensive terrain -->

## History & Significance
<!-- What happened here in the past? Why does it matter now? -->

## Important Scenes & Conflicts
<!-- Scenes occurring here in the manuscript -->

## References & Visuals
<!-- Notes on real-world inspirations or linked moodboards -->
`,
  },

  world: {
    id: 'world',
    name: 'World / Lore Note',
    category: 'world',
    folder: 'Desk/World',
    defaultFilename: 'New World Lore.md',
    templateContent: (title: string) => `# ${title}

## Concept & Overview
<!-- Kingdom, magic system, religion, faction, or cultural tradition -->

## Rules, Mechanics & Limitations
<!-- How does it work? What are the strict costs or laws? -->

## Social & Political Influence
<!-- How does this affect ordinary people and rulers? -->

## History & Legends
<!-- Origins, myths, and known historical figures -->

## Story Impact
<!-- How this impacts the main plot -->
`,
  },

  research: {
    id: 'research',
    name: 'Research Note',
    category: 'research',
    folder: 'Desk/Research',
    defaultFilename: 'New Research.md',
    templateContent: (title: string) => `# ${title}

## Research Topic
<!-- Historical era, technology, language, nautical, weapons, etc. -->

## Key Facts & Discoveries
- 

## Real-World Sources & References
- 

## Creative Adaptations for Story
<!-- How we modify or apply this factual research to fiction -->
`,
  },

  note: {
    id: 'note',
    name: 'Freeform Note',
    category: 'notes',
    folder: 'Desk/Notes',
    defaultFilename: 'New Note.md',
    templateContent: (title: string) => `# ${title}

`,
  },
};
