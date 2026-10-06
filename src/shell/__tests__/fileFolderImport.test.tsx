import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { ImportModal } from '../ImportModal';
import { ImportSummary } from '../../types/ipc';

describe('Milestone 14 — File and Folder Import System', () => {
  afterEach(() => {
    cleanup();
  });
  it('renders ImportModal with mode switcher, target selector, and conflict strategy options', () => {
    const onImportBatch = vi.fn();
    const onImportFolder = vi.fn();
    const onClose = vi.fn();

    render(
      <ImportModal
        open={true}
        initialSection="Manuscript"
        onClose={onClose}
        onImportBatch={onImportBatch}
        onImportFolder={onImportFolder}
      />
    );

    expect(screen.getByText('Import into Project')).toBeDefined();
    expect(screen.getByText('Files (.md, .txt, .docx)')).toBeDefined();
    expect(screen.getByText('Recursive Folder')).toBeDefined();
    expect(screen.getByText('Destination Studio Section')).toBeDefined();
    expect(screen.getByText('Auto-Rename (Keep Both)')).toBeDefined();
    expect(screen.getByText('Skip Existing')).toBeDefined();
    expect(screen.getByText('Overwrite')).toBeDefined();
  });

  it('allows adding paths, selecting conflict strategy, and executing file batch import', async () => {
    const mockSummary: ImportSummary = {
      total_found: 3,
      imported_count: 3,
      skipped_count: 0,
      conflict_count: 0,
      unsupported_count: 0,
      imported_files: ['Manuscript/Chapter 01.md', 'Manuscript/Chapter 02.md', 'Manuscript/Notes.docx'],
      skipped_files: [],
      errors: [],
    };

    const onImportBatch = vi.fn().mockResolvedValue(mockSummary);
    const onImportFolder = vi.fn();
    const onClose = vi.fn();

    render(
      <ImportModal
        open={true}
        initialSection="Manuscript"
        onClose={onClose}
        onImportBatch={onImportBatch}
        onImportFolder={onImportFolder}
      />
    );

    const input = screen.getByPlaceholderText('/path/to/chapter1.md, /path/to/notes.docx');
    fireEvent.change(input, { target: { value: '/external/chapter1.md' } });
    fireEvent.click(screen.getByText('Add'));

    // Check that item is added to preview
    expect(screen.getByText('/external/chapter1.md')).toBeDefined();

    // Click Start Import
    const importBtn = screen.getByText('Start Import');
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(onImportBatch).toHaveBeenCalledWith(
        ['/external/chapter1.md'],
        'Manuscript',
        'rename'
      );
    });

    // Check summary screen is displayed
    await waitFor(() => {
      expect(screen.getByText('Import Completed Successfully')).toBeDefined();
      expect(screen.getByText('Manuscript/Chapter 01.md')).toBeDefined();
    });
  });

  it('switches to recursive folder import mode and executes correctly', async () => {
    const mockSummary: ImportSummary = {
      total_found: 5,
      imported_count: 2,
      skipped_count: 1,
      conflict_count: 1,
      unsupported_count: 1,
      imported_files: ['Planning/Lore/Magic.md', 'Planning/Characters/Hero.md'],
      skipped_files: ['Planning/.DS_Store'],
      errors: [],
    };

    const onImportBatch = vi.fn();
    const onImportFolder = vi.fn().mockResolvedValue(mockSummary);
    const onClose = vi.fn();

    render(
      <ImportModal
        open={true}
        initialSection="Planning"
        onClose={onClose}
        onImportBatch={onImportBatch}
        onImportFolder={onImportFolder}
      />
    );

    // Switch to recursive folder mode
    fireEvent.click(screen.getByText('Recursive Folder'));

    const folderInput = screen.getByPlaceholderText('/path/to/my-novel-drafts');
    fireEvent.change(folderInput, { target: { value: '/external/world-notes' } });
    fireEvent.click(screen.getByText('Add'));

    const importBtn = screen.getByText('Start Import');
    fireEvent.click(importBtn);

    await waitFor(() => {
      expect(onImportFolder).toHaveBeenCalledWith(
        '/external/world-notes',
        'Planning',
        'rename'
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Import Completed Successfully')).toBeDefined();
      expect(screen.getByText('Planning/Lore/Magic.md')).toBeDefined();
    });
  });

  it('handles and displays error message when import fails', async () => {
    const onImportBatch = vi.fn().mockRejectedValue(new Error('Permission denied to source file'));
    const onImportFolder = vi.fn();
    const onClose = vi.fn();

    render(
      <ImportModal
        open={true}
        initialSection="Manuscript"
        onClose={onClose}
        onImportBatch={onImportBatch}
        onImportFolder={onImportFolder}
      />
    );

    const input = screen.getByPlaceholderText('/path/to/chapter1.md, /path/to/notes.docx');
    fireEvent.change(input, { target: { value: '/protected/doc.md' } });
    fireEvent.click(screen.getByText('Add'));

    fireEvent.click(screen.getByText('Start Import'));

    await waitFor(() => {
      expect(screen.getByText(/Permission denied to source file/)).toBeDefined();
    });
  });
});
