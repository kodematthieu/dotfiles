import { Gtk, Gdk } from "ags/gtk4"
import { execAsync } from "ags/process"
import GLib from "gi://GLib?version=2.0"

// ─── Screenshot ──────────────────────────────────────────────────────────────
function screenshot(mode: "full" | "region" | "open") {
    const dir = `${GLib.get_home_dir()}/Pictures/screenshots`
    const timestamp = GLib.DateTime.new_now_local()?.format("%Y-%m-%d-%H%M%S") ?? "screenshot"
    const file = `${dir}/${timestamp}.png`

    switch (mode) {
        case "full":
            execAsync(`bash -c 'mkdir -p "${dir}" && grim "${file}" && wl-copy < "${file}" && notify-send "Screenshot" "Saved to ${file}" -i "${file}"'`)
                .catch(console.error)
            break
        case "region":
            execAsync(`bash -c 'grim -g "$(slurp)" - | satty --filename - --output-filename "${file}" --early-exit --copy-command wl-copy'`)
                .catch(console.error)
            break
        case "open":
            execAsync(`xdg-open "${dir}"`).catch(console.error)
            break
    }
}

// ─── Color Picker ────────────────────────────────────────────────────────────
function colorPicker() {
    execAsync("hyprpicker -a").catch(console.error)
}

// ─── Clipboard History ───────────────────────────────────────────────────────
function showClipboard() {
    // Launch cliphist with rofi picker (silent on cancel)
    execAsync(["bash", "-c", `cliphist list | rofi -dmenu -p "Clipboard" | cliphist decode | wl-copy`])
        .catch(() => { }) // User cancelled or empty - ignore
}

// ─── Keybind List ────────────────────────────────────────────────────────────
function showKeybinds() {
    // Show Hyprland keybinds in a rofi menu (silent on cancel)
    execAsync(["bash", "-c", `hyprctl binds -j | jq -r '.[] | "\\(.modmask) + \\(.key) → \\(.dispatcher) \\(.arg)"' | rofi -dmenu -p "Keybinds" -i`])
        .catch(() => { }) // User cancelled or empty - ignore
}

// ─── Widget ──────────────────────────────────────────────────────────────────
export default function Utilities() {
    return (
        <box class="utilities" spacing={4}>
            {/* Screenshot: L=full, R=region, M=open dir */}
            <button
                class="util-item screenshot"
                tooltipText="Screenshot (L: Full, R: Region, M: Open)"
                onClicked={() => screenshot("full")}
            >
                <Gtk.GestureClick button={Gdk.BUTTON_SECONDARY} onPressed={() => screenshot("region")} />
                <Gtk.GestureClick button={Gdk.BUTTON_MIDDLE} onPressed={() => screenshot("open")} />
                <image iconName="focus-symbolic" />
            </button>

            {/* Color Picker */}
            <button
                class="util-item colorpicker"
                tooltipText="Color Picker"
                onClicked={colorPicker}
            >
                <image iconName="pipette-symbolic" />
            </button>

            {/* Clipboard History */}
            <button
                class="util-item clipboard"
                tooltipText="Clipboard History"
                onClicked={showClipboard}
            >
                <image iconName="clipboard-symbolic" />
            </button>

            {/* Keybind List */}
            <button
                class="util-item keybinds"
                tooltipText="Keybind List"
                onClicked={showKeybinds}
            >
                <image iconName="command-symbolic" />
            </button>
        </box>
    )
}
