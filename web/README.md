# web/

Files used only by the GitHub Pages deploy (`.github/workflows/deploy-pages.yml`).

- `coi-serviceworker.js` — [coi-serviceworker](https://github.com/gzuidhof/coi-serviceworker)
  v0.1.7 (MIT), vendored unchanged. GitHub Pages cannot send the
  `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` headers that
  `expo-sqlite` needs on the web (SharedArrayBuffer); this service worker adds
  them in the browser. The local dev server already sends them (`metro.config.js`),
  so the script is only injected into the exported Pages build.
