import React, { useEffect, useRef } from 'react';
import { TreeNode } from './types';
import {
  FileText,
  FolderPlus,
  FilePlus,
  Copy,
  Edit2,
  Trash2,
  Clipboard,
} from 'lucide-react';

export interface FileContextMenuProps {
  x: number;
  y: number;
  node: TreeNode | null;
  section: string | null;
  onClose: () => void;
  onOpen: (path: string) => void;
  onNewDocument: (parentFolder: string) => void;
  onNewFolder: (parentFolder: string) => void;
  onNewChapter: () => void;
  onNewScene: (parentFolder: string) => void;
  onRename: (node: TreeNode) => void;
  onDuplicate: (path: string) => void;
  onDeleteSafe: (path: string) => void;
}

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
  x,
  y,
  node,
  section,
  onClose,
  onOpen,
  onNewDocument,
  onNewFolder,
  onNewChapter,
  onNewScene,
  onRename,
  onDuplicate,
  onDeleteSafe,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const copyRelativePath = (path: string) => {
    navigator.clipboard.writeText(path);
    onClose();
  };

  // Adjust menu bounds to stay inside viewport
  const adjustedX = Math.min(x, window.innerWidth - 210);
  const adjustedY = Math.min(y, window.innerHeight - 260);

  return (
    <div
      ref={menuRef}
      className="swrite-context-menu"
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
    >
      {/* File-specific options */}
      {node && !node.isDirectory && (
        <>
          <button
            className="menu-item"
            onClick={() => {
              onOpen(node.relativePath);
              onClose();
            }}
          >
            <FileText size={14} />
            <span>Open Document</span>
          </button>
          <button
            className="menu-item"
            onClick={() => {
              onRename(node);
              onClose();
            }}
          >
            <Edit2 size={14} />
            <span>Rename (F2)</span>
          </button>
          <button
            className="menu-item"
            onClick={() => {
              onDuplicate(node.relativePath);
              onClose();
            }}
          >
            <Copy size={14} />
            <span>Duplicate Document</span>
          </button>
          <div className="menu-divider" />
          <button
            className="menu-item"
            onClick={() => copyRelativePath(node.relativePath)}
          >
            <Clipboard size={14} />
            <span>Copy Relative Path</span>
          </button>
          <div className="menu-divider" />
          <button
            className="menu-item danger"
            onClick={() => {
              onDeleteSafe(node.relativePath);
              onClose();
            }}
          >
            <Trash2 size={14} />
            <span>Move to Trash</span>
          </button>
        </>
      )}

      {/* Folder-specific options */}
      {node && node.isDirectory && (
        <>
          <button
            className="menu-item"
            onClick={() => {
              onNewDocument(node.relativePath);
              onClose();
            }}
          >
            <FilePlus size={14} />
            <span>New Document</span>
          </button>
          {node.section === 'Manuscript' && (
            <button
              className="menu-item"
              onClick={() => {
                onNewScene(node.relativePath);
                onClose();
              }}
            >
              <FileText size={14} />
              <span>New Scene</span>
            </button>
          )}
          <button
            className="menu-item"
            onClick={() => {
              onNewFolder(node.relativePath);
              onClose();
            }}
          >
            <FolderPlus size={14} />
            <span>New Subfolder</span>
          </button>
          <div className="menu-divider" />
          <button
            className="menu-item"
            onClick={() => {
              onRename(node);
              onClose();
            }}
          >
            <Edit2 size={14} />
            <span>Rename Folder</span>
          </button>
          <button
            className="menu-item"
            onClick={() => copyRelativePath(node.relativePath)}
          >
            <Clipboard size={14} />
            <span>Copy Path</span>
          </button>
          <div className="menu-divider" />
          <button
            className="menu-item danger"
            onClick={() => {
              onDeleteSafe(node.relativePath);
              onClose();
            }}
          >
            <Trash2 size={14} />
            <span>Delete Folder</span>
          </button>
        </>
      )}

      {/* Section Root options */}
      {!node && section && (
        <>
          {section === 'Manuscript' && (
            <button
              className="menu-item"
              onClick={() => {
                onNewChapter();
                onClose();
              }}
            >
              <FilePlus size={14} />
              <span>New Chapter</span>
            </button>
          )}
          <button
            className="menu-item"
            onClick={() => {
              onNewDocument(section);
              onClose();
            }}
          >
            <FilePlus size={14} />
            <span>New Document in {section}</span>
          </button>
          <button
            className="menu-item"
            onClick={() => {
              onNewFolder(section);
              onClose();
            }}
          >
            <FolderPlus size={14} />
            <span>New Folder in {section}</span>
          </button>
        </>
      )}
    </div>
  );
};
