import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ['**/src-tauri/**']
    }
  },
  build: {
    target: process.env.TAURI_ENV_PLATFORM == 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
    rollupOptions: {
      output: {
        // Split vendor + studio chunks so Tauri updates re-download only
        // what changed. (Studios are still statically imported; React.lazy
        // per studio is the follow-up for cutting initial parse cost.)
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@milkdown') || id.includes('@tiptap') || id.includes('prosemirror')) {
              return 'vendor-editor';
            }
            if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            return 'vendor';
          }
          if (id.includes('/src/publish/')) return 'studio-publish';
          if (id.includes('/src/planning/')) return 'studio-plan';
          if (id.includes('/src/desk/')) return 'studio-desk';
          if (id.includes('/src/edit/')) return 'studio-edit';
          if (id.includes('/src/plugins/')) return 'plugins';
          return undefined;
        },
      },
    },
  },
  // @ts-expect-error vitest config
  test: {
    environment: 'jsdom',
  }
});
