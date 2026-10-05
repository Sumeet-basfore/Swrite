import {
  Comment,
  ProofreadingFinding,
  RevisionNote,
  TextAnchor,
} from '../types/ipc';

export type EditStudioTab = 'review' | 'comments' | 'revisions' | 'history';

export type ReviewScope = 'current_doc' | 'current_chapter' | 'all_manuscript';

export type ReviewItemType = 'proofreading' | 'comment' | 'revision';

export interface ReviewQueueItem {
  id: string;
  type: ReviewItemType;
  title: string;
  detail: string;
  documentPath: string;
  documentId?: string;
  anchor?: TextAnchor | null;
  severity: 'low' | 'medium' | 'high' | 'info' | 'warning' | 'error';
  category?: string;
  status: 'open' | 'resolved' | 'ignored';
  matchedText?: string;
  suggestedReplacement?: string | null;
  lineNumber?: number;
  columnNumber?: number;
  rawComment?: Comment;
  rawRevision?: RevisionNote;
  rawFinding?: ProofreadingFinding;
}

export interface ReviewFilters {
  scope: ReviewScope;
  typeFilter: 'all' | 'proofreading' | 'comments' | 'revisions';
  severityFilter: 'all' | 'high' | 'medium' | 'low';
  searchQuery: string;
}

export interface FindReplaceOptions {
  searchQuery: string;
  replaceQuery: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  scope: 'document' | 'manuscript';
}

export interface FindReplaceMatch {
  documentPath: string;
  lineNumber: number;
  startOffset: number;
  endOffset: number;
  preview: string;
  matchedText: string;
}
