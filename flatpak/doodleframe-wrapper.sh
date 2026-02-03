#!/bin/sh

# DoodleFrame wrapper script for Flatpak
# Enables native theme integration and proper sandboxing

# Export GTK theme variables for Electron to pick up
electron_config="${XDG_CONFIG_HOME:-$HOME/.config}"

# Ensure proper cursor and icon themes are available
export XCURSOR_PATH=/run/host/share/icons:$XCURSOR_PATH

# Launch DoodleFrame
exec /app/doodleframe/doodleframe "$@"
