# 💡 AGS Bar Widget Ideas

A scratchpad for future widget implementations, informed by existing Eww patterns.

## 📋 Implementation Status

### ⬅️ Left Container

- [x] **System Info** (CPU, RAM, Temp, Storage)
- [x] **Workspaces**
- [ ] **Active Window** (Client Title/Class)

### ⏺️ Center Container

- [x] **Caffeine** (Idle Inhibitor)
- [x] **DateTime**
- [x] **Notifications** (DND Status)

### ➡️ Right Container

- [x] **Network Island**
  - [x] Speed Monitor (Up/Down)
  - [x] Status Icon & Widget
- [x] **Audio Island**
  - [x] Volume (One-click mute, Scroll)
  - [x] Microphone (One-click mute)
- [x] **Utilities Island** (Tray/Tools)
  - [x] Screenshot
  - [x] Color Picker
  - [x] Clipboard History
  - [x] Keybind List
- [x] **Power Menu** (Session)

---

## 🚀 Phase 2: AGS-Native Windows

Replace external tools with integrated AGS windows for a cohesive experience.

### Windows to Implement

- [ ] **NetworkWindow** - WiFi/Ethernet manager
  - [ ] List available WiFi networks (SSID, signal, security)
  - [ ] Connect/disconnect buttons
  - [ ] Show current connection details
  - [ ] Scan/refresh button
- [ ] **AudioWindow** - Advanced mixer
  - [ ] Device selection (outputs/inputs)
  - [ ] Per-application volume control
  - [ ] Visual sliders with icons
- [ ] **PowerMenu** - Session manager (replace wlogout)
  - [ ] Lock, Logout, Suspend, Reboot, Shutdown
  - [ ] Confirmation dialogs
  - [ ] Keyboard navigation
- [ ] **NotificationCenter** - Replace swaync
  - [ ] Notification history
  - [ ] Grouped by app
  - [ ] Clear all / individual dismiss
  - [ ] DND toggle
- [ ] **AppLauncher** - Replace rofi
  - [ ] Search applications
  - [ ] Fuzzy matching
  - [ ] Pin favorites
  - [ ] Recent apps

---

## 🔊 Audio Controls Widget

**Reference**: `eww/yuck/widgets.yuck` → `audio-widget`

### Output (Speakers/Headphones)

- **Icon**: `󰕾` (unmuted) / `󰖁` (muted)
- **Display**: `XX%` volume
- **Interactions**:
  - **Click**: Toggle mute → `wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle`
  - **Right-Click**: Open `pavucontrol` (floating, pinned, centered)
  - **Scroll**: Adjust volume ±1% → `wpctl set-volume -l 1.0 @DEFAULT_AUDIO_SINK@ 1%±`

### Input (Microphone)

- **Icon**: `󰍬` (unmuted) / `󰍭` (muted)
- **Display**: `XX%` volume
- **Interactions**:
  - **Click**: Toggle mute → `wpctl set-mute @DEFAULT_AUDIO_SOURCE@ toggle`
  - **Right-Click**: Open `pavucontrol` to input tab → `pavucontrol -t 4`
  - **Scroll**: Adjust volume ±1% → `wpctl set-volume -l 1.0 @DEFAULT_AUDIO_SOURCE@ 1%±`

**Styling**:

- Red background/accent when muted
- Hover effect on each control

---

## 📸 Screenshot Button

**Reference**: `eww/scripts/executable_screenshot.lua`

**Icon**: ` ` (camera)

**Interactions**:

- **Left Click**: Fullscreen capture
  - `grim <file>` → `wl-copy < <file>` → `notify-send`
- **Right Click**: Region capture with annotation
  - `grim -g "$(slurp)" - | satty --filename - --output-filename '<path>' --early-exit --copy-command wl-copy`
- **Middle Click**: Open screenshots directory
  - `xdg-open ~/Pictures/screenshots`

**Output Directory**: `~/Pictures/screenshots/`
**Filename Format**: `%Y-%m-%d-%H%M%S.png`

**Notification**: Critical urgency with thumbnail preview

---

## 🎨 Color Picker Button

**Reference**: `eww/scripts/executable_colorpicker.lua`

**Icon**: `󰈊` (palette)

**Interactions**:

- **Click**: Launch `hyprpicker -a` (autocopy mode)
- On pick: Notify with picked color → `notify-send 'Color Picked' 'Copied #XXXXXX to clipboard'`

**Enhancement Ideas**:

- Show last picked color as button background tint
- History of recent colors in tooltip

---

## 🌐 Network Island (Consolidated)

**Concept**: unified island merging status, control, and real-time interface monitoring.

**Reference**: `eww/scripts/executable_network.lua`, `eww/scripts/executable_wifi.lua`

**Composition**: `[Speed | Status]`
`[ ↓ 12.5 MB/s  ↑ 0.8 MB/s  |  󰤨 ]`

1.  **Speed Monitor**:
    - **Source**: `/sys/class/net/<iface>/statistics/` (rx_bytes/tx_bytes)
    - **Display**:
      - Down: `↓ XX.X Unit` (Color: `$green` or `$sky`)
      - Up: `↑ XX.X Unit` (Color: `$mauve` or `$pink`)
    - **Logic**: Poll 1s.

2.  **Status Indicator**:
    - **Icon**:
      - WiFi: `󰤨` `󰤥` `󰤢` `󰤟` (`wifi-strength-*`)
      - Ethernet: `󰈁` (`network-wired`)
      - Disconnected: `󰤭` (`network-wireless-disconnected`)
    - **Color**: Reactive to state (Green/Blue = Active, Red/Grey = DC)

**Interactions**:

- **Left Click**: Toggle **Network Selection Popup**.
  - Scans and lists available networks.
  - Click item to connect.
- **Right Click**: Open `nm-connection-editor` or `gnome-control-center wifi`.
- **Tooltip**:
  - ESSID
  - Local IP / Public IP?
  - Signal Strength %

---

## 🌙 Night Light Toggle

**Reference**: `eww/ideas.md`

**Icon**: `󰌵` (Sun) / `󰌶` (Moon)

**Backend**: `hyprshade` or `gammastep`

- Toggle: `hyprshade toggle blue-light-filter`

**Styling**:

- Orange glow when active

---

## 🔵 Bluetooth Manager

**Reference**: `eww/ideas.md`

**Icon**: `󰂯` (enabled) / `󰂲` (disabled)

**Interactions**:

- **Click**: Launch `blueman-manager` (floating)
- **Tooltip**: Connected device name (e.g., "Sony WH-1000XM4")

**Backend**: `bluetoothctl` for status, `blueman-manager` for GUI

---

## ⏻ Session Management (Power Menu)

**Reference**: `eww/yuck/widgets.yuck` → `power-widget`

**Icon**: ``

**Interactions**:

- **Click**: Launch `wlogout`

**Alternative (Custom Popup)**:

- Lock: `loginctl lock-session`
- Logout: `hyprctl dispatch exit`
- Suspend: `systemctl suspend`
- Reboot: `systemctl reboot`
- Shutdown: `systemctl poweroff`

---

## 🌤️ Weather Widget (Optional)

**Condition**: Only display when API key is configured or local weather service available.

**Data Sources**:

- OpenWeatherMap API
- `wttr.in` (no API key needed, but rate-limited)

**Display**:

- Current temperature
- Weather condition icon (☀️ ⛅ 🌧️ ❄️)

**Tooltip**:

- Extended forecast (today + tomorrow)
- Humidity, wind speed

**Config**:

- Store API key in `~/.cache/ags/weather.key` or env var
- Location: auto-detect via IP or manual config

---

## 📐 Widget Layout Reference (from Eww)

```
┌─────────────────────────────────────────────────────────────────┐
│ [SysStats] [Workspaces] [ActiveWindow]  ││  [Caffeine] [Time] [DND]  ││  [Network] [Audio] [Controls] [Power] │
│         LEFT                            ││         CENTER            ││              RIGHT                    │
└─────────────────────────────────────────────────────────────────┘
```

**Controls Island** (sys-controls):

- Screenshot | ColorPicker | WiFi/Network Launcher

---

## 🛠️ Implementation Notes

1. **Polling vs Streaming**:
   - Network speed, CPU: Polling (1-2s interval)
   - Audio, DND: Event-driven (subscribe to pipewire/swaync)
   - Caffeine: File watch + inotify

2. **Lua Scripts**:
   - Existing Eww Lua scripts can be adapted or called directly
   - Consider TypeScript rewrites for tighter AGS integration

3. **Styling**:
   - Reuse existing SCSS variables (`$mauve`, `$blue`, `$green`, etc.)
   - Consistent hover effects (`.hover` class pattern)
   - Consistent spacing and padding

4. **Error Handling**:
   - Gracefully handle missing tools (`hyprpicker`, `satty`, etc.)
   - Show fallback icons/states when data unavailable
