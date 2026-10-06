import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PluginManager } from '../PluginManager';
import { DiscoveredPlugin } from '../../types/ipc';

describe('PluginManager & Plugin Runtime Isolation', () => {
  const mockWordCountPlugin: DiscoveredPlugin = {
    manifest: {
      id: 'swrite.word-count',
      name: 'Word Count',
      version: '1.0.0',
      api_version: 1,
      entry: 'index.js',
      permissions: ['selection.read', 'commands.register'],
    },
    is_enabled: true,
    directory_path: '/path/to/plugins/word-count',
    entry_code: `
      function activate(context) {
        context.registerCommand({
          id: 'count',
          name: 'Count Words',
          execute: () => {
            const text = context.editor.getSelectionText();
            return text.length;
          }
        });
      }
    `,
  };

  const mockFaultyPlugin: DiscoveredPlugin = {
    manifest: {
      id: 'swrite.faulty',
      name: 'Faulty Plugin',
      version: '1.0.0',
      api_version: 1,
      entry: 'index.js',
      permissions: ['commands.register'],
    },
    is_enabled: true,
    directory_path: '/path/to/plugins/faulty',
    entry_code: `
      function activate(context) {
        throw new Error("Deliberate plugin crash during initialization");
      }
    `,
  };

  const mockUnpermittedPlugin: DiscoveredPlugin = {
    manifest: {
      id: 'swrite.unpermitted',
      name: 'Unpermitted Plugin',
      version: '1.0.0',
      api_version: 1,
      entry: 'index.js',
      permissions: ['commands.register'], // Missing selection.read
    },
    is_enabled: true,
    directory_path: '/path/to/plugins/unpermitted',
    entry_code: `
      function activate(context) {
        context.registerCommand({
          id: 'steal-text',
          name: 'Steal Text',
          execute: () => {
            return context.editor.getSelectionText();
          }
        });
      }
    `,
  };

  let manager: PluginManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new PluginManager('/test/project');
  });

  it('loads valid plugin, registers commands, and executes safely', () => {
    manager.setEditorApi({
      getSelectionText: () => 'The silent citadel in the fog.',
    });

    const instances = manager.loadPlugins([mockWordCountPlugin]);
    expect(instances.length).toBe(1);
    expect(instances[0].status).toBe('active');
    expect(instances[0].commands.length).toBe(1);

    const registered = manager.getAllCommands();
    expect(registered.length).toBe(1);
    expect(registered[0].id).toBe('swrite.word-count:count');

    // Execute command
    const res = (registered[0].execute as any)();
    expect(res).toBe(30);
  });

  it('isolates faulty plugin errors without taking down the application', () => {
    const instances = manager.loadPlugins([mockWordCountPlugin, mockFaultyPlugin]);

    expect(instances.length).toBe(2);

    const validInstance = instances.find((i) => i.manifest.id === 'swrite.word-count');
    const faultyInstance = instances.find((i) => i.manifest.id === 'swrite.faulty');

    expect(validInstance?.status).toBe('active');
    expect(faultyInstance?.status).toBe('error');
    expect(faultyInstance?.errorMessage).toContain('Deliberate plugin crash');

    // Only valid plugin commands are registered
    expect(manager.getAllCommands().length).toBe(1);
  });

  it('enforces capability permissions and denies unauthorized access', () => {
    manager.setEditorApi({
      getSelectionText: () => 'Secret manuscript text',
    });

    manager.loadPlugins([mockUnpermittedPlugin]);
    const command = manager.getAllCommands()[0];

    expect(() => command.execute()).toThrow(
      "Plugin 'swrite.unpermitted' denied access to selection. Missing 'selection.read' permission."
    );
  });

  it('unloads plugin and removes registered commands completely', () => {
    manager.loadPlugins([mockWordCountPlugin]);
    expect(manager.getAllCommands().length).toBe(1);

    manager.unloadPlugin('swrite.word-count');
    expect(manager.getAllCommands().length).toBe(0);

    const instance = manager.getInstances().find((i) => i.manifest.id === 'swrite.word-count');
    expect(instance?.status).toBe('disabled');
  });
});
