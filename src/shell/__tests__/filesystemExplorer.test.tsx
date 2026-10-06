import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Sidebar } from '../Sidebar';
import { buildProjectTree, naturalCompare } from '../treeUtils';
import { DiscoveredFile, ProjectFilesystemView, ProjectSummary } from '../../types/ipc';

describe('Milestone 15 — Pure Filesystem Explorer', () => {
  afterEach(() => {
    cleanup();
  });

  const mockDiscoveredFiles: DiscoveredFile[] = [
    {
      relative_path: 'Manuscript/Act 1/Chapter 10.md',
      name: 'Chapter 10.md',
      is_directory: false,
      format: 'markdown',
      size_bytes: 1200,
    },
    {
      relative_path: 'Manuscript/Act 1/Chapter 2.md',
      name: 'Chapter 2.md',
      is_directory: false,
      format: 'markdown',
      size_bytes: 900,
    },
    {
      relative_path: 'Planning/Characters/Protagonists/Kael.md',
      name: 'Kael.md',
      is_directory: false,
      format: 'markdown',
      size_bytes: 450,
    },
    {
      relative_path: 'Desk/Worldbuilding/Oakhaven.md',
      name: 'Oakhaven.md',
      is_directory: false,
      format: 'markdown',
      size_bytes: 600,
    },
    {
      relative_path: 'Assets/CoverArt.png',
      name: 'CoverArt.png',
      is_directory: false,
      format: 'binary',
      size_bytes: 204800,
    },
  ];

  it('buildProjectTree builds single hierarchical tree with arbitrary nesting support', () => {
    const tree = buildProjectTree(mockDiscoveredFiles);

    // Root level folders should include Manuscript, Planning, Desk, Assets
    expect(tree.length).toBe(4);

    const manuscriptNode = tree.find((n) => n.name === 'Manuscript');
    expect(manuscriptNode).toBeDefined();
    expect(manuscriptNode?.isDirectory).toBe(true);

    // Nested Act 1 inside Manuscript
    const act1Node = manuscriptNode?.children.find((n) => n.name === 'Act 1');
    expect(act1Node).toBeDefined();
    expect(act1Node?.isDirectory).toBe(true);

    // Act 1 children should contain Chapter 2 and Chapter 10 sorted naturally (Chapter 2 before Chapter 10)
    expect(act1Node?.children.length).toBe(2);
    expect(act1Node?.children[0].name).toBe('Chapter 2.md');
    expect(act1Node?.children[1].name).toBe('Chapter 10.md');

    // Deep arbitrary nesting (Planning -> Characters -> Protagonists -> Kael.md)
    const planningNode = tree.find((n) => n.name === 'Planning');
    const charactersNode = planningNode?.children.find((n) => n.name === 'Characters');
    const protagonistsNode = charactersNode?.children.find((n) => n.name === 'Protagonists');
    const kaelFile = protagonistsNode?.children.find((n) => n.name === 'Kael.md');

    expect(kaelFile).toBeDefined();
    expect(kaelFile?.relativePath).toBe('Planning/Characters/Protagonists/Kael.md');
  });

  it('naturalCompare sorts alphanumeric numbers naturally', () => {
    expect(naturalCompare('Chapter 2.md', 'Chapter 10.md')).toBeLessThan(0);
    expect(naturalCompare('Scene 1.md', 'Scene 2.md')).toBeLessThan(0);
    expect(naturalCompare('Scene 10.md', 'Scene 9.md')).toBeGreaterThan(0);
  });

  it('renders Sidebar as pure Filesystem Explorer without hardcoded category count headers', () => {
    const mockProject: ProjectSummary = {
      project_id: 'test-project',
      name: 'The Cartographer of Shadows',
      root_path: '/tmp/test-project',
      manifest: {
        schema_version: 1,
        project_id: 'test-project',
        name: 'The Cartographer of Shadows',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        document_identities: {},
        metadata: {},
      },
      file_counts: {
        manuscript_count: 2,
        planning_count: 1,
        desk_count: 1,
        asset_count: 1,
      },
    };

    const mockView: ProjectFilesystemView = {
      manuscript_files: [mockDiscoveredFiles[0], mockDiscoveredFiles[1]],
      planning_files: [mockDiscoveredFiles[2]],
      desk_files: [mockDiscoveredFiles[3]],
      asset_files: [mockDiscoveredFiles[4]],
      other_visible_files: [],
    };

    const onOpenFile = vi.fn();
    const onToggleFolder = vi.fn();
    const onCollapseAllFolders = vi.fn();
    const onRefreshFiles = vi.fn();
    const onNewDocument = vi.fn();
    const onNewFolder = vi.fn();
    const onContextMenu = vi.fn();
    const onRenameCommit = vi.fn();
    const onMoveFile = vi.fn();
    const onOpenImport = vi.fn();

    render(
      <Sidebar
        project={mockProject}
        filesView={mockView}
        selectedFile={null}
        expandedFolders={new Set(['Manuscript', 'Manuscript/Act 1', 'Planning'])}
        collapsed={false}
        onOpenFile={onOpenFile}
        onToggleFolder={onToggleFolder}
        onCollapseAllFolders={onCollapseAllFolders}
        onRefreshFiles={onRefreshFiles}
        onNewDocument={onNewDocument}
        onNewFolder={onNewFolder}
        onContextMenu={onContextMenu}
        onRenameCommit={onRenameCommit}
        onMoveFile={onMoveFile}
        onOpenImport={onOpenImport}
      />
    );

    // Verify project name appears in Explorer toolbar
    expect(screen.getByTitle('The Cartographer of Shadows')).toBeDefined();

    // Verify Explorer action buttons are rendered
    expect(screen.getByLabelText('New File')).toBeDefined();
    expect(screen.getByLabelText('New Folder')).toBeDefined();
    expect(screen.getByLabelText('Import')).toBeDefined();
    expect(screen.getByLabelText('Collapse All')).toBeDefined();
    expect(screen.getByLabelText('Refresh')).toBeDefined();

    // Verify files in expanded folders are rendered directly in unified tree
    expect(screen.getByText('Manuscript')).toBeDefined();
    expect(screen.getByText('Act 1')).toBeDefined();
    expect(screen.getByText('Chapter 2.md')).toBeDefined();
    expect(screen.getByText('Chapter 10.md')).toBeDefined();

    // Test Collapse All action
    fireEvent.click(screen.getByLabelText('Collapse All'));
    expect(onCollapseAllFolders).toHaveBeenCalled();
  });
});
