#!/bin/bash
# LinuxDraw Build Script
# Builds the application from source

set -e

echo "========================================"
echo "  LinuxDraw Build Script"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+ first.${NC}"
    echo "For Fedora: sudo dnf install -y nodejs npm"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js version 18+ is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}Node.js version: $(node -v)${NC}"

# Install dependencies
echo ""
echo "Installing npm dependencies..."
npm install

# Build the application
echo ""
echo "Building application..."
npm run build

# Build AppImage
echo ""
echo "Building AppImage..."
npm run electron:build:appimage

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Build Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check for the AppImage
APPIMAGE=$(find dist-electron -name "*.AppImage" -type f 2>/dev/null | head -1)

if [ -n "$APPIMAGE" ]; then
    echo -e "${GREEN}AppImage created: $APPIMAGE${NC}"
    
    # Copy to root for easy access
    cp "$APPIMAGE" ./LinuxDraw-x86_64.AppImage
    chmod +x ./LinuxDraw-x86_64.AppImage
    echo -e "${GREEN}Copied to: ./LinuxDraw-x86_64.AppImage${NC}"
    echo ""
    echo "To run the app:"
    echo "  ./LinuxDraw-x86_64.AppImage"
    echo ""
    echo "To install system-wide:"
    echo "  sudo ./install-appimage.sh"
else
    echo -e "${RED}AppImage not found. Build may have failed.${NC}"
    exit 1
fi

echo ""
