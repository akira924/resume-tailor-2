import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';

import pkg from './package.json';

// ----------------------------------------------------------------------

const DEFAULT_API_URL = 'http://localhost:7272';

const WEBSITE_FONTS = path.resolve(__dirname, '../vite-ts/public/fonts');

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
    // downloads: only this can save into a subfolder of Chrome's download folder.
    permissions: ['sidePanel', 'storage', 'downloads'],
    // The PDF renderer's layout engine is WebAssembly, which Chrome blocks by default.
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
    },
    // Lets the extension call the API without being listed in the server's CORS_ORIGIN.
    // A pattern without a port matches every port on that host.
    host_permissions: [`${apiUrl.protocol}//${apiUrl.hostname}/*`],
    // The AI prompt shortcut has to work in text fields on any website, in any frame.
    content_scripts: [
      {
        matches: ['http://*/*', 'https://*/*'],
        js: ['content.js'],
        all_frames: true,
        match_about_blank: true,
      },
    ],
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
      {
        // The resume PDF is the website's own component, which loads its fonts from /fonts.
        name: 'emit-website-fonts',
        generateBundle() {
          for (const fileName of fs.readdirSync(WEBSITE_FONTS)) {
            this.emitFile({
              type: 'asset',
              fileName: `fonts/${fileName}`,
              source: fs.readFileSync(path.join(WEBSITE_FONTS, fileName)),
            });
          }
        },
      },
    ],
    resolve: {
      // Website code imports its own files as "src/...".
      alias: [{ find: /^src\//, replacement: `${path.resolve(__dirname, '../vite-ts/src')}/` }],
      // Website code imported from ../vite-ts must use the extension's copies of these packages.
      dedupe: ['react', 'react-dom', '@react-pdf/renderer', 'react-phone-number-input', 'dayjs'],
    },
    define: {
      __API_URL__: JSON.stringify(apiUrl.origin),
      // A define, as the content script can't import anything it shares with the panel.
      __DEFAULT_PROMPT_TRIGGER__: JSON.stringify('zx'),
    },
    build: {
      rollupOptions: {
        input: {
          sidepanel: path.resolve(__dirname, 'sidepanel.html'),
          background: path.resolve(__dirname, 'src/background.ts'),
          content: path.resolve(__dirname, 'src/expander/content.ts'),
        },
        output: {
          // The manifest refers to these by fixed names.
          entryFileNames: ({ name }) =>
            name === 'background' || name === 'content' ? `${name}.js` : 'assets/[name]-[hash].js',
        },
      },
    },
  };
});
