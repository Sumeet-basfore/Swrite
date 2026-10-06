import { PluginCapability, PluginManifest } from '../types/ipc';

export interface PluginCommand {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  slashTrigger?: string;
  execute: () => void | Promise<void>;
}

export interface PluginPanel {
  id: string;
  title: string;
  icon?: string;
  render: () => React.ReactNode;
}

export interface EditorExtensionApi {
  getSelectionText: () => string;
  insertText: (text: string) => void;
  replaceSelection: (text: string) => void;
}

export interface PluginContext {
  manifest: PluginManifest;
  hasPermission: (permission: PluginCapability) => boolean;
  registerCommand: (command: PluginCommand) => void;
  registerPanel: (panel: PluginPanel) => void;
  editor: EditorExtensionApi;
  storage: {
    get: () => Promise<any>;
    set: (data: any) => Promise<void>;
  };
  logger: {
    log: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    error: (...args: any[]) => void;
  };
}

export type PluginLifecycleStatus = 'unloaded' | 'active' | 'disabled' | 'error';

export interface ActivePluginInstance {
  manifest: PluginManifest;
  status: PluginLifecycleStatus;
  errorMessage?: string;
  commands: PluginCommand[];
  panels: PluginPanel[];
  unload?: () => void;
}
