# Resume Tailor Chrome extension

Opens in Chrome's side panel when you click the toolbar icon, and signs in against the API in `../server`.

## Develop

Start the API (`npm run dev` in `../server`), then:

```sh
npm install
npm run dev   # rebuilds into dist/ on every change
```

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select `extension/dist`.
3. Click the extension's icon in the toolbar.

Changes to the panel appear after closing and reopening it. Changes to the manifest or `src/background.ts` need the reload button on `chrome://extensions`.

## Build

```sh
npm run build
```

The API defaults to `http://localhost:7272`. To use another one, copy `.env.example` to `.env` and set `VITE_API_URL`. The build grants the extension access to that host, so the server's `CORS_ORIGIN` doesn't need changing.

Chrome decides which side the panel opens on. The default is the right; users can change it in Chrome's appearance settings.
