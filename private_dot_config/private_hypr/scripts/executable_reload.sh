#!/usr/bin/env bash

# Reload Script
# This script kills existing services to ensure a clean restart, 
# then calls autostart.sh to launch them again.

# 1. Smart Reload (IPC-based)
# AGS: Graceful exit (it will be restarted by autostart.sh)
if pgrep -x ags >/dev/null; then
    ags quit
fi

# SwayNC: Reloads config and CSS
if pgrep -x swaync >/dev/null; then
    swaync-client -R
    swaync-client -rs
fi

# 2. Hard Restart (Services without reload)
# These need to be killed so autostart.sh can relaunch them with new configs
killall -q hyprpaper
killall -q hypridle
killall -q wl-paste

# 3. Wait for process cleanup
sleep 0.5

# 4. Start missing/killed services
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
"$DIR/autostart.sh"

notify-send "System" "Desktop Config Reloaded"
