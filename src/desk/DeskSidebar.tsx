import React from 'react';
import { DeskFilter } from './types';
import {
  FileText,
  User,
  MapPin,
  Globe,
  BookOpen,
  LayoutGrid,
  Image as ImageIcon,
  FolderTree,
} from 'lucide-react';

export interface DeskSidebarProps {
  activeFilter: DeskFilter;
  onSelectFilter: (filter: DeskFilter) => void;
  counts: Record<DeskFilter, number>;
}

export const DeskSidebar: React.FC<DeskSidebarProps> = ({
  activeFilter,
  onSelectFilter,
  counts,
}) => {
  const filterOptions: { id: DeskFilter; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Supporting Material', icon: <FolderTree size={16} /> },
    { id: 'notes', label: 'Freeform Notes', icon: <FileText size={16} /> },
    { id: 'characters', label: 'Characters', icon: <User size={16} /> },
    { id: 'locations', label: 'Locations & Settings', icon: <MapPin size={16} /> },
    { id: 'world', label: 'Worldbuilding & Lore', icon: <Globe size={16} /> },
    { id: 'research', label: 'Research & References', icon: <BookOpen size={16} /> },
    { id: 'moodboards', label: 'Moodboards', icon: <LayoutGrid size={16} /> },
    { id: 'assets', label: 'Image Assets', icon: <ImageIcon size={16} /> },
  ];

  return (
    <aside className="swrite-desk-sidebar">
      <div className="desk-sidebar-header">
        <span className="sidebar-section-title">CREATIVE DESK</span>
      </div>

      <nav className="desk-sidebar-nav">
        {filterOptions.map((opt) => (
          <button
            key={opt.id}
            className={`desk-nav-item ${activeFilter === opt.id ? 'active' : ''}`}
            onClick={() => onSelectFilter(opt.id)}
          >
            <div className="nav-item-left">
              {opt.icon}
              <span className="nav-item-label">{opt.label}</span>
            </div>
            <span className="nav-item-count">{counts[opt.id] || 0}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};
