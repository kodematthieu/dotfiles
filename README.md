# Dotfiles

Managed via [chezmoi](https://www.chezmoi.io/).

## Configured Components

- **Window Manager**: Hyprland
- **Bar / Widgets**: Eww
- **Shell**: Fish
- **Terminal**: Kitty
- **Idle Daemon**: hypridle
- **Notification Daemon**: SwayNC (Native reload implemented)
- **Application Launcher**: Eww (integrated)

## Pending Configuration

The following items are defined or planned but not yet fully configured:

- [ ] regreet (Greeter)
- [ ] fastfetch (System info)
- [ ] hyprlock (Screen locker)
- [ ] hyprpaper (Wallpaper utility)
- [ ] dolphin (File manager)
- [ ] rofi (Alternative runner)
- [ ] loginctl ui (Session management)
- [ ] idk (Future additions)

## Structure

- `.config/hypr/`: Hyprland configuration (modularized).
- `.config/eww/`: Eww widgets and scss styles.
- `packages/`: Package manifests (e.g., `arch.txt`).
