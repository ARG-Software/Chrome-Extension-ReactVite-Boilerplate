# Chrome Extension with React, TypeScript, and Vite

This repository is the runnable companion to ARG Software's guide to building a Manifest V3 Chrome extension with React and Vite.

It demonstrates:

- A React popup built with TypeScript and Vite
- A statically declared content script
- Typed messaging between the popup and content script
- An event-driven extension service worker
- Bounded local storage that only records a page after a user action
- Explicit controls to inspect and clear saved pages

## Requirements

- Node.js 20.19 or newer, or Node.js 22.13 or newer
- Google Chrome or another Chromium browser with Manifest V3 support

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

The development command rebuilds the extension into `dist/` whenever a source file changes. In `chrome://extensions/`, enable Developer mode, choose **Load unpacked**, and select the `dist/` directory. Reload the extension from that page after a rebuild.

Chrome does not inject content scripts into browser-internal pages such as `chrome://extensions/`. Open a regular HTTP or HTTPS page when testing the popup actions.

## Production Build

```bash
npm run build
```

The output in `dist/` contains the popup bundle, manifest, content script, service worker, and icons required by Chrome.

## Verification

```bash
npm run verify
```

This lints the source and shipped scripts, type-checks the TypeScript, creates the production build, and runs smoke tests against the generated extension package.

## Privacy

The example does not monitor tab changes or silently collect browsing history. A URL and title are stored locally only after the user reads the current page and selects **Save page**. The extension keeps at most ten entries and exposes a **Clear** action.

If you publish a derivative extension, narrow the content-script match patterns to the sites the feature needs and provide the disclosures required by the Chrome Web Store policies.

## Structure

```text
public/
  background.js
  content-script.js
  manifest.json
src/
  App.tsx
  main.tsx
tests/
  extension-package.test.mjs
```

## License

MIT
