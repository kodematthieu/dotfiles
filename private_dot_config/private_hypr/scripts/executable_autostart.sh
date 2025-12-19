#!/usr/bin/env bash

# 1. Kill ALL the processes
# We use -q (quiet) so it doesn't complain if something isn't running
killall -q eww
killall -q swaync
killall -q hyprpaper
killall -q hypridle
killall -q hyprpolkitagent
killall -q wl-paste  # <--- Kills the clipboard watchers

# 2. Wait for them to die properly
# This prevents "race conditions" where we try to start a new one 
# before the old one is fully gone.
sleep 0.5

# 3. Start them again
eww daemon && eww open bar &
swaync &
hyprpaper &
hypridle &
systemctl --user restart hyprpolkitagent

# Restart Clipboard Watchers
wl-paste --type text --watch cliphist store &
wl-paste --type image --watch cliphist store &

notify-send "System" "All Desktop Services Reloaded"
