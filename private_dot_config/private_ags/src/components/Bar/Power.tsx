import { Gtk } from "ags/gtk4"
import { execAsync } from "ags/process"
import GLib from "gi://GLib?version=2.0"

export default function Power() {
    return (
        <box class="power">
            <button
                class="power-item"
                onClicked={() => execAsync("wlogout").catch(console.error)}
                tooltipText="Session Management"
            >
                <image iconName="power-symbolic" />
            </button>
        </box>
    )
}
