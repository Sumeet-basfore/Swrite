export interface Document {
  id: string;
  schema_version: number;
  metadata: DocumentMetadata;
  blocks: BlockNode[];
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  created_at?: string;
  updated_at?: string;
  custom?: Record<string, string>;
}

export type BlockNode =
  | { type: 'Paragraph'; data: { inlines: InlineNode[] } }
  | { type: 'Heading'; data: { level: number; inlines: InlineNode[] } }
  | { type: 'BlockQuote'; data: { blocks: BlockNode[] } }
  | { type: 'List'; data: { ordered: boolean; start?: number; items: ListItem[] } }
  | { type: 'Table'; data: { headers: TableCell[]; rows: TableCell[][]; alignments: TableAlignment[] } }
  | { type: 'CodeBlock'; data: { language?: string; code: string } }
  | { type: 'Divider'; data?: undefined }
  | { type: 'SceneBreak'; data: { symbol?: string } }
  | { type: 'PageBreak'; data?: undefined }
  | { type: 'RawBlock'; data: { format: string; raw_content: string } };

export interface ListItem {
  checked?: boolean | null;
  blocks: BlockNode[];
}

export interface TableCell {
  inlines: InlineNode[];
}

export type TableAlignment = 'None' | 'Left' | 'Center' | 'Right';

export type InlineNode =
  | { type: 'Text'; data: string }
  | { type: 'Emphasis'; data: InlineNode[] }
  | { type: 'Strong'; data: InlineNode[] }
  | { type: 'Strikethrough'; data: InlineNode[] }
  | { type: 'CodeSpan'; data: string }
  | { type: 'Link'; data: { url: string; title?: string; inlines: InlineNode[] } }
  | { type: 'Wikilink'; data: { target: string; alias?: string } }
  | { type: 'Image'; data: { url: string; alt_text: string; title?: string } }
  | { type: 'InlineCommentAnchor'; data: { comment_id: string; inlines: InlineNode[] } }
  | { type: 'RawInline'; data: { format: string; raw_content: string } };
