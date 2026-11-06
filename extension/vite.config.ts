import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

import pkg from './package.json';

// ----------------------------------------------------------------------

const DEFAULT_API_URL = 'http://localhost:7272';

export default defineConfig(({ mode }) => {
  const apiUrl = new URL(loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL || DEFAULT_API_URL);

  const manifest = {
    manifest_version: 3,
    name: 'Resume Tailor',
    version: pkg.version,
    description: 'Tailor your resume from the side of your browser.',
    // `openPanelOnActionClick` needs Chrome 116.
    minimum_chrome_version: '116',
    icons: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
      48: 'icons/icon-48.png',
      128: 'icons/icon-128.png',
    },
    action: {
      default_title: 'Open Resume Tailor',
      default_icon: {
        16: 'icons/icon-16.png',
        32: 'icons/icon-32.png',
      },
    },
    side_panel: { default_path: 'sidepanel.html' },
    background: { service_worker: 'background.js', type: 'module' },
    permissions: ['sidePanel', 'storage'],
    // Lets the extension call the API without being listed in the server's CORS_ORIGIN.
    // A pattern without a port matches every port on that host.
    host_permissions: [`${apiUrl.protocol}//${apiUrl.hostname}/*`],
  };

  return {
    base: './',
    plugins: [
      react(),
      {
        name: 'emit-manifest',
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'manifest.json',
            source: JSON.stringify(manifest, null, 2),
          });
        },
      },
    ],
    define: { __API_URL__: JSON.stringify(apiUrl.origin) },
    build: {
      rollupOptions: {
        input: { sidepanel: 'sidepanel.html', background: 'src/background.ts' },
        output: {
          // The manifest refers to the service worker by a fixed name.
          entryFileNames: (chunk) =>
            chunk.name === 'background' ? 'background.js' : 'assets/[name]-[hash].js',
        },
      },
    },
  };
});
