# Submitting to Flathub / GNOME Software

This guide explains how to get LinuxDraw listed in GNOME Software through Flathub.

## Quick Summary

1. **Build the Flatpak locally** to test it works
2. **Generate npm sources** for offline building
3. **Add screenshots** to your repository
4. **Submit a PR** to the Flathub repository
5. **Wait for review** and approval

## Step-by-Step Guide

### Step 1: Prepare Your Repository

Make sure your GitHub repository is public and contains:

```
linuxdraw/
├── src/                          # Source code
├── assets/icons/                 # App icons
├── flatpak/
│   ├── com.linuxdraw.LinuxDraw.yml
│   ├── com.linuxdraw.LinuxDraw.desktop
│   ├── com.linuxdraw.LinuxDraw.metainfo.xml
│   └── linuxdraw-wrapper.sh
├── screenshots/                  # App screenshots (add these!)
├── README.md
├── LICENSE
└── package.json
```

### Step 2: Add Screenshots

Create a `screenshots/` directory and add at least 2 screenshots:

```bash
mkdir -p screenshots
```

**Requirements:**
- Resolution: 1400x900 or 16:9 ratio (e.g., 1920x1080)
- Format: PNG
- Content: Show the app in use
- Upload to your GitHub repository

Update the screenshot URLs in `flatpak/com.linuxdraw.LinuxDraw.metainfo.xml`:

```xml
<screenshots>
  <screenshot type="default">
    <caption>Main interface with toolbar and canvas</caption>
    <image type="source" width="1400" height="900">
      https://raw.githubusercontent.com/YOUR_USERNAME/linuxdraw/main/screenshots/screenshot1.png
    </image>
  </screenshot>
</screenshots>
```

### Step 3: Test Local Build

Install prerequisites:
```bash
# Fedora
sudo dnf install flatpak flatpak-builder

# Add Flathub
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo

# Install base apps
flatpak install flathub org.electronjs.Electron2.BaseApp//24.08
flatpak install flathub org.freedesktop.Sdk.Extension.node22//24.08
```

Install flatpak-node-generator:
```bash
pip3 install flatpak-node-generator
```

Generate npm sources:
```bash
cd flatpak
./generate-sources.sh
```

Build:
```bash
flatpak-builder --force-clean build-dir com.linuxdraw.LinuxDraw.yml
```

Test:
```bash
flatpak-builder --user --install --force-clean build-dir com.linuxdraw.LinuxDraw.yml
flatpak run com.linuxdraw.LinuxDraw
```

### Step 4: Fork Flathub

Go to https://github.com/flathub/flathub and click "Fork"

### Step 5: Create Your Submission

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/flathub.git
cd flathub

# Create a new branch
git checkout -b com.linuxdraw.LinuxDraw

# Copy your files
cp /path/to/linuxdraw/flatpak/com.linuxdraw.LinuxDraw.yml .
cp /path/to/linuxdraw/flatpak/com.linuxdraw.LinuxDraw.desktop .
cp /path/to/linuxdraw/flatpak/com.linuxdraw.LinuxDraw.metainfo.xml .
cp /path/to/linuxdraw/flatpak/linuxdraw-wrapper.sh .
cp /path/to/linuxdraw/flatpak/generated-sources.json .

# Commit
git add .
git commit -m "Add com.linuxdraw.LinuxDraw"
git push origin com.linuxdraw.LinuxDraw
```

### Step 6: Submit Pull Request

1. Go to https://github.com/YOUR_USERNAME/flathub
2. Click "Compare & pull request"
3. Fill in the PR template with:
   - App name: LinuxDraw
   - Description: A simple drawing and annotation tool
   - Hompage: https://github.com/YOUR_USERNAME/linuxdraw
   - License: MIT
4. Submit the PR

### Step 7: Respond to Review

The Flathub team will review your PR. Common issues:

- **Missing AppStream metadata** - Make sure metainfo.xml is valid
- **Screenshots too small** - Must be at least 1000x700
- **Missing icons** - All icon sizes required
- **Npm sources missing** - Make sure generated-sources.json is included

### Step 8: After Approval

Once merged:
- Your app appears at https://flathub.org/apps/com.linuxdraw.LinuxDraw
- Users can install with: `flatpak install flathub com.linuxdraw.LinuxDraw`
- GNOME Software and KDE Discover will show your app
- Automatic updates when you push new releases

## Maintaining Your App

When you release a new version:

1. Update version in `package.json`
2. Update `<releases>` section in `com.linuxdraw.LinuxDraw.metainfo.xml`
3. Create a git tag: `git tag v1.1.0 && git push origin v1.1.0`
4. Update the Flathub repository with the new sources

## Getting Help

- [Flathub Documentation](https://docs.flathub.org/)
- [Flathub Issues](https://github.com/flathub/flathub/issues)
- [Flatpak Matrix Chat](https://matrix.to/#/#flathub:matrix.org)
- [GNOME Software Documentation](https://apps.gnome.org/Software/)

## Checklist Before Submitting

- [ ] App builds successfully with `flatpak-builder`
- [ ] App launches and works correctly
- [ ] Icons present in all sizes (16, 32, 48, 64, 128, 256, 512)
- [ ] Desktop file is valid
- [ ] Metainfo/AppStream file passes validation
- [ ] Screenshots added to repository
- [ ] Screenshots meet size requirements (min 1000x700)
- [ ] All npm sources generated
- [ ] License file included
- [ ] README with build instructions

Good luck! 🚀
