# Flatpak Packaging for DoodleFrame

This directory contains the files needed to build DoodleFrame as a Flatpak package.

## Files

- `com.doodleframe.DoodleFrame.yml` - Flatpak manifest (build recipe)
- `com.doodleframe.DoodleFrame.desktop` - Desktop entry file (GNOME HIG compliant)
- `com.doodleframe.DoodleFrame.metainfo.xml` - AppStream metadata for app stores
- `doodleframe-wrapper.sh` - Launcher script for theme integration
- `generate-sources.sh` - Script to generate npm sources

## GNOME Human Interface Guidelines Compliance

DoodleFrame follows GNOME HIG where applicable:

- **Keyboard Shortcuts**: 
  - `Ctrl+Z` / `Ctrl+Shift+Z` for Undo/Redo
  - `Ctrl+Y` for Redo (GNOME HIG compliant)
  - `Delete` to remove selected items
- **Desktop Integration**: 
  - Uses `StartupWMClass` for proper window matching
  - Supports native GTK theme detection
  - Includes symbolic icon support
- **AppStream Metadata**:
  - OARS content rating
  - Brand colors for GNOME Software
  - Keywords for searchability

## Building Locally

### Prerequisites

Install Flatpak and Flatpak Builder:

```bash
# Fedora
sudo dnf install flatpak flatpak-builder

# Ubuntu/Debian
sudo apt install flatpak flatpak-builder

# Arch
sudo pacman -S flatpak flatpak-builder
```

Add Flathub repository:
```bash
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
```

Install the Electron BaseApp:
```bash
flatpak install flathub org.electronjs.Electron2.BaseApp//24.08
flatpak install flathub org.freedesktop.Sdk.Extension.node22//24.08
```

### Generate npm Sources

Before building, you need to generate the npm sources:

```bash
cd flatpak
./generate-sources.sh
```

This creates `generated-sources.json` which contains all npm packages needed for the build.

### Build the Flatpak

```bash
# Build
cd flatpak
flatpak-builder --force-clean build-dir com.doodleframe.DoodleFrame.yml

# Install locally
flatpak-builder --user --install --force-clean build-dir com.doodleframe.DoodleFrame.yml

# Run
flatpak run com.doodleframe.DoodleFrame
```

### Create a Bundle

```bash
flatpak-builder --repo=repo --force-clean build-dir com.doodleframe.DoodleFrame.yml
flatpak build-bundle repo doodleframe.flatpak com.doodleframe.DoodleFrame
```

## Submitting to Flathub

To get DoodleFrame into GNOME Software, you need to submit it to Flathub:

### 1. Fork the Flathub Repository

Fork https://github.com/flathub/flathub

### 2. Create Your App Branch

```bash
git clone https://github.com/YOUR_USERNAME/flathub.git
cd flathub
git checkout -b com.doodleframe.DoodleFrame
```

### 3. Copy Your Files

Copy these files to the flathub repo root:
- `com.doodleframe.DoodleFrame.yml`
- `com.doodleframe.DoodleFrame.desktop`
- `com.doodleframe.DoodleFrame.metainfo.xml`
- `doodleframe-wrapper.sh`
- `generated-sources.json`

### 4. Commit and Push

```bash
git add .
git commit -m "Add com.doodleframe.DoodleFrame"
git push origin com.doodleframe.DoodleFrame
```

### 5. Create Pull Request

Go to https://github.com/flathub/flathub and create a pull request.

The Flathub team will review your submission. Once merged, your app will appear in:
- GNOME Software
- KDE Discover
- `flatpak search doodleframe`
- https://flathub.org/apps

## Required Screenshots

Before submitting, add screenshots to your GitHub repository:

1. Create a `screenshots/` directory in your main repo
2. Add at least 2 screenshots (1400x900 or 16:9 ratio)
3. Update the screenshot URLs in `com.doodleframe.DoodleFrame.metainfo.xml`

Example:
```bash
mkdir -p screenshots
# Add your screenshots
```

## AppStream Validation

Validate your metainfo file before submitting:

```bash
flatpak install flathub org.freedesktop.appstream-glib
appstream-util validate com.doodleframe.DoodleFrame.metainfo.xml
```

## References

- [GNOME Human Interface Guidelines](https://developer.gnome.org/hig/)
- [Flathub App Submission](https://docs.flathub.org/docs/for-app-authors/submission)
- [Flatpak Manifest Documentation](https://docs.flatpak.org/en/latest/manifests.html)
- [AppStream Specification](https://www.freedesktop.org/software/appstream/docs/)
- [Flathub Quality Guidelines](https://docs.flathub.org/docs/for-app-authors/appdata-guidelines/quality-guidelines/)
