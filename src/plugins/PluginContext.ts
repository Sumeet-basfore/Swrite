import { PluginCapability, PluginManifest } from '../types/ipc';
import { SwriteIpc } from '../lib/ipc';
import { EditorExtensionApi, PluginCommand, PluginContext, PluginPanel } from './types';

export interface CreateContextOptions {
  manifest: PluginManifest;
  projectRoot: string;
  editorApi?: Partial<EditorExtensionApi>;
  onRegisterCommand: (cmd: PluginCommand) => void;
  onRegisterPanel: (panel: PluginPanel) => void;
}

export function createPluginContext(options: CreateContextOptions): PluginContext {
  const { manifest, projectRoot, editorApi, onRegisterCommand, onRegisterPanel } = options;

  const permissionsSet = new Set<PluginCapability>(manifest.permissions || []);

  const hasPermission = (cap: PluginCapability): boolean => {
    return permissionsSet.has(cap);
  };

  const editor: EditorExtensionApi = {
    getSelectionText: () => {
      if (!hasPermission('selection.read')) {
        throw new Error(`Plugin '${manifest.id}' denied access to selection. Missing 'selection.read' permission.`);
      }
      return editorApi?.getSelectionText?.() || '';
    },
    insertText: (text: string) => {
      if (!hasPermission('document.write')) {
        throw new Error(`Plugin '${manifest.id}' denied access to write. Missing 'document.write' permission.`);
      }
      editorApi?.insertText?.(text);
    },
    replaceSelection: (text: string) => {
      if (!hasPermission('document.write')) {
        throw new Error(`Plugin '${manifest.id}' denied access to write. Missing 'document.write' permission.`);
      }
      editorApi?.replaceSelection?.(text);
    },
  };

  const registerCommand = (command: PluginCommand) => {
    if (!hasPermission('commands.register')) {
      throw new Error(`Plugin '${manifest.id}' denied command registration. Missing 'commands.register' permission.`);
    }
    onRegisterCommand(command);
  };

  const registerPanel = (panel: PluginPanel) => {
    if (!hasPermission('panels.register')) {
      throw new Error(`Plugin '${manifest.id}' denied panel registration. Missing 'panels.register' permission.`);
    }
    onRegisterPanel(panel);
  };

  const storage = {
    get: async () => {
      if (!projectRoot) return {};
      return await SwriteIpc.pluginsGetData(projectRoot, manifest.id);
    },
    set: async (data: any) => {
      if (!projectRoot) return;
      await SwriteIpc.pluginsSetData(projectRoot, manifest.id, data);
    },
  };

  const logger = {
    log: (...args: any[]) => console.log(`[Plugin:${manifest.id}]`, ...args),
    warn: (...args: any[]) => console.warn(`[Plugin:${manifest.id}]`, ...args),
    error: (...args: any[]) => console.error(`[Plugin:${manifest.id}]`, ...args),
  };

  return {
    manifest,
    hasPermission,
    registerCommand,
    registerPanel,
    editor,
    storage,
    logger,
  };
}
