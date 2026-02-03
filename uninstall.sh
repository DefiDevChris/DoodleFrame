#!/bin/bash
# LinuxDraw Uninstallation Script

set -e

echo "========================================"
echo "  LinuxDraw Uninstallation Script"
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

echo "This will remove LinuxDraw from your system."
read -p "Are you sure? (y/N): " confirm

if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Uninstallation cancelled."
    exit 0
fi

echo ""
echo "Removing LinuxDraw..."

# Remove installation directory
if [ -d "$INSTALL_DIR" ]; then
    echo "Removing $INSTALL_DIR..."
    sudo rm -rf "$INSTALL_DIR"
fi

# Remove symlink
if [ -L "$BIN_DIR/linuxdraw" ]; then
    echo "Removing symlink..."
    sudo rm "$BIN_DIR/linuxdraw"
fi

# Remove desktop entry
if [ -f "$DESKTOP_DIR/linuxdraw.desktop" ]; then
    echo "Removing desktop entry..."
    sudo rm "$DESKTOP_DIR/linuxdraw.desktop"
fi

# Remove icons
for size in 16x16 32x32 48x48 64x64 128x128 256x256 512x512; do
    if [ -f "$ICON_DIR/$size/apps/linuxdraw.png" ]; then
        sudo rm "$ICON_DIR/$size/apps/linuxdraw.png"
    fi
done

# Update caches
echo "Updating system caches..."
sudo gtk-update-icon-cache -f -t "$ICON_DIR" 2>/dev/null || true
sudo update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  LinuxDraw has been removed.${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
