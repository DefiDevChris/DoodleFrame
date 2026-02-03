# DoodleFrame 🎨

A simple drawing and wireframing tool for Linux.

Repository: https://github.com/DefiDevChris/DoodleFrame.git

<p align="center">
  <img src="assets/icons/icon.png" width="120" alt="DoodleFrame Logo">
</p>

## Features

- ✏️ **Drawing Tools** - Pen, marker, arrow, rectangle, circle, text, eraser
- 📐 **Wireframing** - Phone, browser, and tablet templates
- 🔗 **Grouping** - Group objects with Ctrl+G, ungroup with Ctrl+Shift+G
- 🔍 **Zoom & Pan** - Navigate with mouse wheel and hand tool
- #️⃣ **Grid & Snap** - Optional grid with snap-to-grid
- 🔒 **Lock Objects** - Prevent accidental changes
- 💾 **Export** - Save as PNG
- ↩️ **Undo/Redo** - Full history

## Installation

### Flatpak (Recommended)
```bash
flatpak install flathub com.doodleframe.DoodleFrame
```

### AppImage
```bash
chmod +x DoodleFrame-x86_64.AppImage
./DoodleFrame-x86_64.AppImage
```

### Build from Source
```bash
npm install
npm run electron:build:linux
```

## Shortcuts

| Key | Action |
|-----|--------|
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+G | Group selected |
| Ctrl+Shift+G | Ungroup |
| Delete | Delete selected |

## Development

```bash
npm install
npm run electron:dev    # Dev mode
npm test                # Run tests
npm run build           # Production build
```

## Tech Stack

- React 19 + TypeScript
- Konva.js + react-konva
- Vite
- Tailwind CSS
- Electron

## License

MIT
