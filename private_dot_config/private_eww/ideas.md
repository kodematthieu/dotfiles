# 💡 Future Concept: System Controls Expansion

Enhance the `sys-controls` widget with more interactive modules.

## 1. 🔕 Do Not Disturb (DND)
- **Icon**: `` (On) / `` (DND)
- **Backend**: `dunstctl` or `swaync-client`
- **Function**: Click to pause notifications.
- **Visual**: Dim icon when disabled, red strike-through when DND active.

## 2. 🌔 Night Light / Blue Filter
- **Icon**: ``
- **Backend**: `hyprshade` or `gammastep`
- **Function**: Toggle blue light filter for night usage.
- **Visual**: Icon glows orange when active.

## 3.  Bluetooth Manager
- **Icon**: ``
- **Backend**: `blueman-manager`
- **Function**: 
    - Click: Launch manager (floating window)
    - Tooltip: Show connected device (e.g., "Sony WH-1000XM4")
- **Style**: Blue toggle when enabled.

## 4.  Microphone Mute
- **Icon**: `` (On) / `` (Mutes)
- **Backend**: `wpctl set-mute @DEFAULT_AUDIO_SOURCE@ toggle`
- **Function**: Quick privacy toggle.
- **Visual**: Red background when muted.

## 5.  Screenshot Hub
- **Icon**: ``
- **Backend**: `grim` + `slurp`
- **Function**:
    - Left Click: Fullscreen capture
    - Right Click: Region capture
    - Middle Click: Open gallery dir
