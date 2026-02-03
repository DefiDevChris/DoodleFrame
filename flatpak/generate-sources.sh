#!/bin/bash
# Generate Flatpak sources from npm packages
# This script generates the generated-sources.json file needed for Flatpak builds

set -e

echo "Generating Flatpak npm sources..."

# Check if flatpak-node-generator is available
if ! command -v flatpak-node-generator &> /dev/null; then
    echo "Installing flatpak-node-generator..."
    pip3 install flatpak-node-generator
fi

# Generate sources from package-lock.json
cd ..
flatpak-node-generator npm package-lock.json --output flatpak/generated-sources.json

echo "Sources generated: flatpak/generated-sources.json"
