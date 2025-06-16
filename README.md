# Chrome Extension: React + TypeScript + Vite

This is a minimal boilerplate for building a **Chrome Extension** using **React**, **Vite**, and **TypeScript**. It includes a popup UI that displays a simple `"Hello World"` message.

## 🚀 Features

- Manifest v3 support
- React + TypeScript with Vite
- Ready to expand with extension features (content scripts, background workers, etc.)

## 🛠️ Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Run in development mode

```bash
npm run dev
```

This builds the extension to the `dist` folder and watches for changes.

### 3. Build for production

```bash
npm run build
```

### 4. Load in Chrome

- Open `chrome://extensions/`
- Enable **Developer mode**
- Click **Load unpacked**
- Select the `dist/` folder

---

## 📁 Folder Structure

```
├── public/
│   ├── manifest.json      # Chrome extension manifest (v3)
│   ├── icon16.png         # Extension icon
│   ├── icon48.png
│   └── icon128.png
├── src/
│   ├── App.tsx            # Popup UI component
│   ├── main.tsx           # Entry point
│   └── index.css          # (Optional) Basic styling
├── index.html             # Injected as the extension popup
├── vite.config.ts         # Vite configuration
├── tsconfig.json
└── README.md
```

---

## 🧩 Manifest Overview

The extension uses **Manifest v3** with a single popup UI:

```json
{
  "manifest_version": 3,
  "name": "Hello World Extension",
  "version": "1.0",
  "action": {
    "default_popup": "index.html"
  }
}
```

---

## License

MIT
