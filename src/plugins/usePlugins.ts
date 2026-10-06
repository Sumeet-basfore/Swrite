import { useState, useEffect, useCallback, useRef } from 'react';
import { SwriteIpc } from '../lib/ipc';
import { reportError } from '../lib/errors';
import { PluginManager } from './PluginManager';
import { ActivePluginInstance, EditorExtensionApi, PluginCommand, PluginPanel } from './types';

export interface UsePluginsProps {
  projectRoot: string;
  editorApi?: Partial<EditorExtensionApi>;
}

export function usePlugins({ projectRoot, editorApi }: UsePluginsProps) {
  const managerRef = useRef<PluginManager>(new PluginManager(projectRoot));
  const [plugins, setPlugins] = useState<ActivePluginInstance[]>([]);
  const [commands, setCommands] = useState<PluginCommand[]>([]);
  const [panels, setPanels] = useState<PluginPanel[]>([]);
  const [loading, setLoading] = useState(false);

  // Update editor API in manager
  useEffect(() => {
    if (editorApi) {
      managerRef.current.setEditorApi(editorApi);
    }
  }, [editorApi]);

  const refreshPlugins = useCallback(async () => {
    if (!projectRoot) return;
    setLoading(true);
    try {
      managerRef.current.setProjectRoot(projectRoot);
      const discovered = await SwriteIpc.pluginsDiscover(projectRoot);
      const instances = managerRef.current.loadPlugins(discovered);
      setPlugins(instances);
      setCommands(managerRef.current.getAllCommands());
      setPanels(managerRef.current.getAllPanels());
    } catch (e) {
      reportError('plugins-discover', e);
    } finally {
      setLoading(false);
    }
  }, [projectRoot]);

  useEffect(() => {
    refreshPlugins();
    return () => {
      managerRef.current.unloadAll();
    };
  }, [refreshPlugins]);

  const togglePlugin = useCallback(
    async (pluginId: string, enabled: boolean) => {
      if (!projectRoot) return;
      try {
        await SwriteIpc.pluginsSetEnabled(projectRoot, pluginId, enabled);
        await refreshPlugins();
      } catch (e) {
        reportError('plugins-toggle', e, { notify: true });
      }
    },
    [projectRoot, refreshPlugins]
  );

  return {
    plugins,
    commands,
    panels,
    loading,
    refreshPlugins,
    togglePlugin,
  };
}
