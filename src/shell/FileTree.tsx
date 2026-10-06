import React, { useState } from 'react';
import { reportError } from '../lib/errors';
import { TreeNode } from './types';
import {
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  Image as ImageIcon,
  ChevronDown,
  ChevronRight,
  File,
} from 'lucide-react';

export interface FileTreeProps {
  nodes: TreeNode[];
  selectedFile: string | null;
  expandedFolders: Set<string>;
  onOpenFile: (relativePath: string) => void;
  onToggleFolder: (folderPath: string) => void;
  onContextMenu: (e: React.MouseEvent, node: TreeNode) => void;
  onRenameCommit: (oldRelative: string, newRelative: string) => Promise<void>;
  onMoveFile: (sourceRelative: string, targetRelative: string) => Promise<void>;
  depth?: number;
}

export const FileTree: React.FC<FileTreeProps> = ({
  nodes,
  selectedFile,
  expandedFolders,
  onOpenFile,
  onToggleFolder,
  onContextMenu,
  onRenameCommit,
  onMoveFile,
  depth = 0,
}) => {
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);

  const startRename = (node: TreeNode) => {
    setEditingNodeId(node.id);
    setEditName(node.name);
  };

  const handleRenameSubmit = async (node: TreeNode) => {
    if (!editName.trim() || editName === node.name) {
      setEditingNodeId(null);
      return;
    }

    const pathParts = node.relativePath.split('/');
    pathParts[pathParts.length - 1] = editName.trim();
    const newRelative = pathParts.join('/');

    try {
      await onRenameCommit(node.relativePath, newRelative);
    } catch (e) {
      reportError('file-rename', e, { notify: true });
    } finally {
      setEditingNodeId(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, node: TreeNode) => {
    e.dataTransfer.setData('text/plain', node.relativePath);
    e.dataTransfer.setData('application/swrite-node', JSON.stringify({
      relativePath: node.relativePath,
      isDirectory: node.isDirectory,
    }));
  };

  const handleDragOver = (e: React.DragEvent, node: TreeNode) => {
    if (node.isDirectory) {
      e.preventDefault();
      setDragOverNodeId(node.id);
    }
  };

  const handleDragLeave = () => {
    setDragOverNodeId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetFolderNode: TreeNode) => {
    e.preventDefault();
    setDragOverNodeId(null);

    const sourcePath = e.dataTransfer.getData('text/plain');
    if (!sourcePath || sourcePath === targetFolderNode.relativePath) return;

    const fileName = sourcePath.split('/').pop()!;
    const newTarget = `${targetFolderNode.relativePath}/${fileName}`;

    if (sourcePath !== newTarget) {
      await onMoveFile(sourcePath, newTarget);
    }
  };

  const renderFileIcon = (node: TreeNode) => {
    if (node.isDirectory) {
      const isExpanded = expandedFolders.has(node.relativePath);
      return isExpanded ? (
        <FolderOpen size={14} className="node-icon folder-icon" />
      ) : (
        <Folder size={14} className="node-icon folder-icon" />
      );
    }

    switch (node.format) {
      case 'markdown':
        return <FileText size={14} className="node-icon md-icon" />;
      case 'docx':
        return <FileCode size={14} className="node-icon docx-icon" />;
      case 'binary':
        return <ImageIcon size={14} className="node-icon img-icon" />;
      default:
        return <File size={14} className="node-icon txt-icon" />;
    }
  };

  return (
    <div className="swrite-file-tree">
      {nodes.map((node) => {
        const isSelected = selectedFile === node.relativePath;
        const isExpanded = expandedFolders.has(node.relativePath);
        const isEditing = editingNodeId === node.id;
        const isDragTarget = dragOverNodeId === node.id;

        return (
          <div key={node.id} className="tree-node-wrapper">
            <div
              className={`tree-node-row ${isSelected ? 'selected' : ''} ${
                isDragTarget ? 'drag-over' : ''
              }`}
              style={{ paddingLeft: `${depth * 14 + 14}px` }}
              onClick={() => {
                if (node.isDirectory) {
                  onToggleFolder(node.relativePath);
                } else {
                  onOpenFile(node.relativePath);
                }
              }}
              onContextMenu={(e) => onContextMenu(e, node)}
              draggable={!isEditing}
              onDragStart={(e) => handleDragStart(e, node)}
              onDragOver={(e) => handleDragOver(e, node)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => node.isDirectory && handleDrop(e, node)}
              onKeyDown={(e) => {
                if (e.key === 'F2') {
                  e.preventDefault();
                  startRename(node);
                }
              }}
              tabIndex={0}
            >
              {/* Folder Toggle Arrow */}
              {node.isDirectory ? (
                <span
                  className="folder-arrow"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFolder(node.relativePath);
                  }}
                >
                  {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </span>
              ) : (
                <span className="file-spacer" />
              )}

              {/* Node Icon */}
              {renderFileIcon(node)}

              {/* Node Name or Inline Rename Input */}
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleRenameSubmit(node)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit(node);
                    if (e.key === 'Escape') setEditingNodeId(null);
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  className="tree-rename-input"
                />
              ) : (
                <span className="tree-node-name" title={node.name}>
                  {node.name}
                </span>
              )}
            </div>

            {/* Recursive Children for Expanded Folders */}
            {node.isDirectory && isExpanded && node.children.length > 0 && (
              <FileTree
                nodes={node.children}
                selectedFile={selectedFile}
                expandedFolders={expandedFolders}
                onOpenFile={onOpenFile}
                onToggleFolder={onToggleFolder}
                onContextMenu={onContextMenu}
                onRenameCommit={onRenameCommit}
                onMoveFile={onMoveFile}
                depth={depth + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
