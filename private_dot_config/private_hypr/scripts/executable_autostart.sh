#!/usr/bin/env bash

# 1. Start Services
# We run them in the background (&) so the script doesn't block.

# Service Manager / Bar
if ! pgrep -x eww >/dev/null; then
    eww daemon && eww open bar &
fi

# Notification Daemon
if ! pgrep -x swaync >/dev/null; then
    swaync &
fi

# Wallpaper
if ! pgrep -x hyprpaper >/dev/null; then
    hyprpaper &
fi

# Idle Daemon
if ! pgrep -x hypridle >/dev/null; then
    nohup hypridle > /dev/null 2>&1 &
fi

# Polkit Agent
# Systemd manages this, so we just ensure it's running/restarted if needed, 
# but for a pure "autostart" we might just want to start it if missing.
# However, restarting systemd service is usually safe/idempotent.
systemctl --user restart hyprpolkitagent

# Clipboard Watchers
if ! pgrep -f "wl-paste --type text" >/dev/null; then
    wl-paste --type text --watch cliphist store &
fi
if ! pgrep -f "wl-paste --type image" >/dev/null; then
    wl-paste --type image --watch cliphist store &
fi
