import { DiscoveredPlugin } from '../types/ipc';
import { reportError } from '../lib/errors';
import { createPluginContext } from './PluginContext';
import { ActivePluginInstance, EditorExtensionApi, PluginCommand, PluginPanel } from './types';

export class PluginManager {
  private instances: Map<string, ActivePluginInstance> = new Map();
  private commands: Map<string, PluginCommand> = new Map();
  private panels: Map<string, PluginPanel> = new Map();
  private projectRoot: string = '';
  private editorApi?: Partial<EditorExtensionApi>;

  constructor(projectRoot: string = '') {
    this.projectRoot = projectRoot;
  }

  public setProjectRoot(root: string) {
    this.projectRoot = root;
  }

  public setEditorApi(api: Partial<EditorExtensionApi>) {
    this.editorApi = api;
  }

  public loadPlugins(discovered: DiscoveredPlugin[]): ActivePluginInstance[] {
    // Unload existing
    this.unloadAll();

    for (const item of discovered) {
      if (!item.is_enabled) {
        this.instances.set(item.manifest.id, {
          manifest: item.manifest,
          status: 'disabled',
          commands: [],
          panels: [],
        });
        continue;
      }

      if (!item.entry_code) {
        this.instances.set(item.manifest.id, {
          manifest: item.manifest,
          status: 'error',
          errorMessage: 'Missing entry script content',
          commands: [],
          panels: [],
        });
        continue;
      }

      this.loadSinglePlugin(item);
    }

    return this.getInstances();
  }

  private loadSinglePlugin(item: DiscoveredPlugin) {
    const pluginCommands: PluginCommand[] = [];
    const pluginPanels: PluginPanel[] = [];

    const context = createPluginContext({
      manifest: item.manifest,
      projectRoot: this.projectRoot,
      editorApi: this.editorApi,
      onRegisterCommand: (cmd) => {
        const fullId = `${item.manifest.id}:${cmd.id}`;
        const namespacedCmd = { ...cmd, id: fullId };
        pluginCommands.push(namespacedCmd);
        this.commands.set(fullId, namespacedCmd);
      },
      onRegisterPanel: (pnl) => {
        const fullId = `${item.manifest.id}:${pnl.id}`;
        const namespacedPnl = { ...pnl, id: fullId };
        pluginPanels.push(namespacedPnl);
        this.panels.set(fullId, namespacedPnl);
      },
    });

    try {
      // Safe execution container
      const exportsObj: { activate?: (ctx: any) => void; deactivate?: () => void } = {};
      const runner = new Function('context', 'exports', `
        try {
          ${item.entry_code}
          if (typeof activate === 'function') {
            activate(context);
          } else if (typeof exports.activate === 'function') {
            exports.activate(context);
          }
        } catch (err) {
          throw err;
        }
      `);

      runner(context, exportsObj);

      this.instances.set(item.manifest.id, {
        manifest: item.manifest,
        status: 'active',
        commands: pluginCommands,
        panels: pluginPanels,
        unload: () => {
          try {
            if (typeof exportsObj.deactivate === 'function') {
              exportsObj.deactivate();
            }
          } catch (e) {
            console.warn(`Error during deactivate of plugin ${item.manifest.id}:`, e);
          }
        },
      });
    } catch (err: any) {
      // Drawer already shows errorMessage; console record only, no toast.
      reportError(`plugin-activate:${item.manifest.id}`, err);
      // Clean up partial registrations
      for (const cmd of pluginCommands) {
        this.commands.delete(cmd.id);
      }
      for (const pnl of pluginPanels) {
        this.panels.delete(pnl.id);
      }

      this.instances.set(item.manifest.id, {
        manifest: item.manifest,
        status: 'error',
        errorMessage: err?.message || String(err),
        commands: [],
        panels: [],
      });
    }
  }

  public unloadPlugin(pluginId: string) {
    const instance = this.instances.get(pluginId);
    if (!instance) return;

    if (instance.unload) {
      try {
        instance.unload();
      } catch (e) {
        console.warn(`Error unloading plugin ${pluginId}:`, e);
      }
    }

    for (const cmd of instance.commands) {
      this.commands.delete(cmd.id);
    }
    for (const pnl of instance.panels) {
      this.panels.delete(pnl.id);
    }

    this.instances.set(pluginId, {
      ...instance,
      status: 'disabled',
      commands: [],
      panels: [],
      unload: undefined,
    });
  }

  public unloadAll() {
    for (const id of Array.from(this.instances.keys())) {
      this.unloadPlugin(id);
    }
    this.instances.clear();
    this.commands.clear();
    this.panels.clear();
  }

  public getInstances(): ActivePluginInstance[] {
    return Array.from(this.instances.values());
  }

  public getAllCommands(): PluginCommand[] {
    return Array.from(this.commands.values());
  }

  public getAllPanels(): PluginPanel[] {
    return Array.from(this.panels.values());
  }
}
