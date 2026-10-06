import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DocumentTabBar } from '../DocumentTabBar';
import { DocumentTab } from '../types';

describe('Milestone 15 — Unified Document Tabs', () => {
  afterEach(() => {
    cleanup();
  });

  const mockTabs: DocumentTab[] = [
    {
      id: 'Manuscript/Chapter 01.md',
      relativePath: 'Manuscript/Chapter 01.md',
      title: 'Chapter 01.md',
      format: 'markdown',
      isDirty: false,
    },
    {
      id: 'Planning/Timeline.md',
      relativePath: 'Planning/Timeline.md',
      title: 'Timeline.md',
      format: 'markdown',
      isDirty: true,
    },
    {
      id: 'Desk/Characters/Kael.md',
      relativePath: 'Desk/Characters/Kael.md',
      title: 'Kael.md',
      format: 'markdown',
      isDirty: false,
    },
  ];

  it('renders DocumentTabBar with list of open tabs and dirty indicators', () => {
    const onSelectTab = vi.fn();
    const onCloseTab = vi.fn();
    const onNewDocument = vi.fn();

    render(
      <DocumentTabBar
        tabs={mockTabs}
        activeTabId="Manuscript/Chapter 01.md"
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
        onNewDocument={onNewDocument}
      />
    );

    expect(screen.getByText('Chapter 01.md')).toBeDefined();
    expect(screen.getByText('Timeline.md')).toBeDefined();
    expect(screen.getByText('Kael.md')).toBeDefined();

    // Verify dirty indicator for modified document
    expect(screen.getByTitle('Unsaved changes')).toBeDefined();
  });

  it('handles tab selection when clicking a tab', () => {
    const onSelectTab = vi.fn();
    const onCloseTab = vi.fn();

    render(
      <DocumentTabBar
        tabs={mockTabs}
        activeTabId="Manuscript/Chapter 01.md"
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
      />
    );

    const timelineTab = screen.getByText('Timeline.md');
    fireEvent.click(timelineTab);

    expect(onSelectTab).toHaveBeenCalledWith('Planning/Timeline.md');
  });

  it('handles tab closing without deleting the document', () => {
    const onSelectTab = vi.fn();
    const onCloseTab = vi.fn();

    render(
      <DocumentTabBar
        tabs={mockTabs}
        activeTabId="Planning/Timeline.md"
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
      />
    );

    const closeBtn = screen.getByLabelText('Close Timeline.md');
    fireEvent.click(closeBtn);

    expect(onCloseTab).toHaveBeenCalledWith('Planning/Timeline.md');
  });

  it('supports middle-click on tab to close', () => {
    const onSelectTab = vi.fn();
    const onCloseTab = vi.fn();

    render(
      <DocumentTabBar
        tabs={mockTabs}
        activeTabId="Manuscript/Chapter 01.md"
        onSelectTab={onSelectTab}
        onCloseTab={onCloseTab}
      />
    );

    const kaelTab = screen.getByText('Kael.md').closest('.swrite-tab-item')!;
    fireEvent.mouseDown(kaelTab, { button: 1 }); // Button 1 is middle-click

    expect(onCloseTab).toHaveBeenCalledWith('Desk/Characters/Kael.md');
  });
});
