# LinuxDraw 🎨🐧

**A Simple Drawing Tool for Linux**

<p align="center">
  <img src="assets/icons/icon.png" width="180" alt="LinuxDraw Logo">
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#building">Building</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-Linux-blue?style=flat-square&logo=linux" alt="Platform">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/version-1.0.0-orange?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/Flatpak-available-purple?style=flat-square&logo=linux" alt="Flatpak">
</p>

---

## 🎯 What is LinuxDraw?

LinuxDraw is a simple, easy-to-use drawing and annotation tool for Linux. Perfect for quick sketches, diagrams, and image annotations.

Perfect for:
- 📝 Taking screenshots and adding annotations
- 🎨 Creating quick sketches and diagrams
- 🔍 Highlighting areas in images
- 📚 Creating tutorials and documentation
- 💼 Professional presentations

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| ✏️ **Drawing Tools** | Pen, marker, arrow, rectangle, circle, text, and eraser |
| 🖼️ **Image Support** | Import any image (PNG, JPEG, WebP, GIF) and annotate directly |
| 💾 **Export** | Save as high-quality PNG with 2x resolution |
| ↩️ **Undo/Redo** | Full history with keyboard shortcuts |
| ⌨️ **Shortcuts** | Ctrl+Z, Ctrl+Shift+Z, Delete, and more |
| 🎯 **Selection Tool** | Move, resize, and rotate any object |
| 🎨 **Customizable** | Multiple colors, stroke widths, and fill options |

---

## 🚀 Installation

### Option 1: Flathub / GNOME Software (Recommended)

```bash
flatpak install flathub com.linuxdraw.LinuxDraw
```

Or search for **"LinuxDraw"** in GNOME Software.

### Option 2: AppImage (Portable)

```bash
# Download the latest AppImage from Releases
chmod +x LinuxDraw-x86_64.AppImage
./LinuxDraw-x86_64.AppImage
```

### Option 3: Build from Source

```bash
# Install dependencies (Fedora)
sudo dnf install -y nodejs npm

# Clone and build
git clone https://github.com/DefiDevChris/LinuxDraw.git
cd linuxdraw
npm install
npm run build
npm run electron:build:appimage
```

---

## 🖼️ Screenshots

<p align="center">
  <img src="screenshots/screenshot1.png" width="80%" alt="LinuxDraw Main Interface">
  <br>
  <em>Main interface with drawing tools and canvas</em>
</p>

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Z` | Undo |
| `Ctrl + Shift + Z` | Redo |
| `Delete` / `Backspace` | Delete selected object |
| `Ctrl + Shift + E` | Export as PNG |
| `Ctrl + Shift + C` | Clear canvas |

---

## 🛠️ Building

### Prerequisites

- Node.js 18+
- npm
- Linux OS

### Development Mode

```bash
npm install
npm run electron:dev
```

### Production Build

```bash
# Build AppImage
npm run electron:build:appimage

# Build RPM package
npm run electron:build:rpm

# Build all Linux targets
npm run electron:build:linux
```

### Flatpak Build

See [flatpak/README.md](flatpak/README.md) for detailed instructions.

---

## 🏗️ Tech Stack

- ⚛️ **React 19** - Modern UI framework
- 📘 **TypeScript** - Type-safe code
- ⚡ **Vite** - Fast build tooling
- 🎨 **Tailwind CSS** - Utility-first styling
- 🖌️ **Konva.js** - High-performance canvas rendering
- 🖥️ **Electron** - Cross-platform desktop wrapper

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- Logo created with love for the Linux community 🐧
- Built with modern open-source technologies
- Made for Linux users who want a simple drawing tool

---

<p align="center">
  Made with ❤️ for Linux users everywhere
  <br>
  <a href="https://github.com/DefiDevChris/LinuxDraw">⭐ Star us on GitHub!</a>
</p>
