#!/bin/bash
# LinuxDraw Installation Script using AppImage
# This script installs LinuxDraw as a system application

set -e

echo "========================================"
echo "  LinuxDraw Installation Script"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

APP_NAME="LinuxDraw"
INSTALL_DIR="/opt/$APP_NAME"
BIN_DIR="/usr/local/bin"
ICON_DIR="/usr/share/icons/hicolor"
DESKTOP_DIR="/usr/share/applications"

# Check if running as root for system install
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}Note: This script will ask for sudo access to install system-wide.${NC}"
    echo ""
fi

# Find the AppImage
APPIMAGE_SOURCE=""
if [ -f "dist-electron/LinuxDraw-1.0.0.AppImage" ]; then
    APPIMAGE_SOURCE="dist-electron/LinuxDraw-1.0.0.AppImage"
elif [ -f "LinuxDraw-1.0.0.AppImage" ]; then
    APPIMAGE_SOURCE="LinuxDraw-1.0.0.AppImage"
elif [ -f "LinuxDraw-x86_64.AppImage" ]; then
    APPIMAGE_SOURCE="LinuxDraw-x86_64.AppImage"
else
    echo -e "${RED}AppImage not found. Please run 'npm run electron:build:appimage' first.${NC}"
    exit 1
fi

echo -e "${GREEN}Found AppImage: $APPIMAGE_SOURCE${NC}"
echo ""

# Create installation directories
echo "Creating installation directories..."
sudo mkdir -p "$INSTALL_DIR"
sudo mkdir -p "$ICON_DIR"/{16x16,32x32,48x48,64x64,128x128,256x256,512x512}/apps

# Install the AppImage
echo "Installing AppImage..."
sudo cp "$APPIMAGE_SOURCE" "$INSTALL_DIR/$APP_NAME.AppImage"
sudo chmod +x "$INSTALL_DIR/$APP_NAME.AppImage"

# Create symlink in /usr/local/bin
echo "Creating symlink..."
sudo ln -sf "$INSTALL_DIR/$APP_NAME.AppImage" "$BIN_DIR/linuxdraw"

# Install icons
echo "Installing icons..."
if [ -d "assets/icons" ]; then
    sudo cp assets/icons/icon-16.png "$ICON_DIR/16x16/apps/linuxdraw.png"
    sudo cp assets/icons/icon-32.png "$ICON_DIR/32x32/apps/linuxdraw.png"
    sudo cp assets/icons/icon-48.png "$ICON_DIR/48x48/apps/linuxdraw.png"
    sudo cp assets/icons/icon-64.png "$ICON_DIR/64x64/apps/linuxdraw.png"
    sudo cp assets/icons/icon-128.png "$ICON_DIR/128x128/apps/linuxdraw.png"
    sudo cp assets/icons/icon-256.png "$ICON_DIR/256x256/apps/linuxdraw.png"
    sudo cp assets/icons/icon-512.png "$ICON_DIR/512x512/apps/linuxdraw.png"
else
    echo -e "${YELLOW}Warning: Icons not found. Using default.${NC}"
fi

# Create desktop entry
echo "Creating desktop entry..."
sudo tee "$DESKTOP_DIR/linuxdraw.desktop" > /dev/null << EOF
[Desktop Entry]
Name=LinuxDraw
Comment=A simple drawing and annotation tool
Exec=$INSTALL_DIR/$APP_NAME.AppImage
Type=Application
Icon=linuxdraw
Categories=Graphics;Office;
StartupWMClass=LinuxDraw
Terminal=false
MimeType=image/png;image/jpeg;image/gif;image/webp;
StartupNotify=true
X-Desktop-File-Install-Version=0.26
EOF

# Update icon cache and desktop database
echo "Updating system caches..."
sudo gtk-update-icon-cache -f -t "$ICON_DIR" 2>/dev/null || true
sudo update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  LinuxDraw installed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Installation details:"
echo "  - Application: $INSTALL_DIR/$APP_NAME.AppImage"
echo "  - Command: linuxdraw"
echo "  - Desktop entry: $DESKTOP_DIR/linuxdraw.desktop"
echo ""
echo "You can now run LinuxDraw by:"
echo "  - Searching for 'LinuxDraw' in your applications menu"
echo "  - Running 'linuxdraw' from the terminal"
echo ""
