# Dotfiles

Managed via [chezmoi](https://www.chezmoi.io/).

## Configured Components

- **Window Manager**: Hyprland
- **Bar / Widgets**: AGS (Aylurs GTK Shell)
- **Shell**: Fish
- **Terminal**: Kitty
- **Idle Daemon**: hypridle
- **Notification Daemon**: SwayNC (Native reload implemented)
- **Application Launcher**: Rofi / AGS

## Pending Configuration

The following items are defined or planned but not yet fully configured:

- [ ] regreet (Greeter)
- [ ] fastfetch (System info)
- [ ] hyprlock (Screen locker)
- [ ] hyprpaper (Wallpaper utility)
- [ ] dolphin (File manager)
- [ ] loginctl ui (Session management)
- [ ] idk (Future additions)

## Structure

- `.config/hypr/`: Hyprland configuration (modularized).
- `.config/ags/`: AGS TypeSript configuration.
  - `src/components/Bar/`: Modularized Bar components and styles.
- `.config/eww/`: Legacy Eww widgets (Deprecated).
- `packages/`: Package manifests (e.g., `arch.txt`).
- `packages/`: Package manifests (e.g., `arch.txt`).
