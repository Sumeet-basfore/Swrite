import React from 'react';
import { ActivePluginInstance } from './types';
import { Puzzle, CheckCircle2, AlertTriangle, XCircle, RefreshCw, X } from 'lucide-react';

interface PluginDrawerProps {
  plugins: ActivePluginInstance[];
  loading: boolean;
  onTogglePlugin: (pluginId: string, enabled: boolean) => Promise<void>;
  onRefresh: () => void;
  onClose: () => void;
}

export const PluginDrawer: React.FC<PluginDrawerProps> = ({
  plugins,
  loading,
  onTogglePlugin,
  onRefresh,
  onClose,
}) => {
  return (
    <div className="swrite-plugin-drawer">
      <div className="plugin-drawer-header">
        <div className="plugin-header-title">
          <Puzzle size={16} />
          <span>Local Extensions & Plugins</span>
        </div>
        <div className="plugin-header-actions">
          <button onClick={onRefresh} className="plugin-icon-btn" title="Refresh Plugins" disabled={loading}>
            <RefreshCw size={13} className={loading ? 'spinning' : ''} />
          </button>
          <button onClick={onClose} className="plugin-icon-btn" title="Close">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="plugin-drawer-body">
        {plugins.length === 0 ? (
          <div className="plugin-empty-state">
            <Puzzle size={28} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <p>No extensions discovered.</p>
            <span className="plugin-empty-hint">
              Place extensions with a <code>manifest.json</code> in the <code>plugins/</code> directory.
            </span>
          </div>
        ) : (
          <div className="plugin-list">
            {plugins.map((plugin) => {
              const isEnabled = plugin.status === 'active';
              return (
                <div key={plugin.manifest.id} className={`plugin-card status-${plugin.status}`}>
                  <div className="plugin-card-top">
                    <div className="plugin-card-info">
                      <div className="plugin-card-name-row">
                        <span className="plugin-name">{plugin.manifest.name}</span>
                        <span className="plugin-version">v{plugin.manifest.version}</span>
                        <span className={`plugin-badge badge-${plugin.status}`}>
                          {plugin.status === 'active' && <CheckCircle2 size={11} />}
                          {plugin.status === 'error' && <AlertTriangle size={11} />}
                          {plugin.status === 'disabled' && <XCircle size={11} />}
                          {plugin.status}
                        </span>
                      </div>
                      {plugin.manifest.description && (
                        <p className="plugin-desc">{plugin.manifest.description}</p>
                      )}
                    </div>

                    <div className="plugin-card-toggle">
                      <label className="plugin-switch">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) => onTogglePlugin(plugin.manifest.id, e.target.checked)}
                        />
                        <span className="slider round"></span>
                      </label>
                    </div>
                  </div>

                  {/* Permissions & Commands summary */}
                  <div className="plugin-meta-row">
                    <span className="plugin-meta-label">Permissions:</span>
                    <div className="plugin-permissions-tags">
                      {plugin.manifest.permissions.length === 0 ? (
                        <span className="perm-tag none">None (Pure)</span>
                      ) : (
                        plugin.manifest.permissions.map((perm) => (
                          <span key={perm} className="perm-tag">
                            {perm}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  {plugin.errorMessage && (
                    <div className="plugin-error-banner">
                      <AlertTriangle size={12} />
                      <span>{plugin.errorMessage}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="plugin-drawer-footer">
        <span className="plugin-footer-note">
          API v1 • Extensions run in isolated client sandboxes.
        </span>
      </div>
    </div>
  );
};
