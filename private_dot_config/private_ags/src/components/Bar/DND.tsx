import { Gtk, Gdk } from "ags/gtk4"
import { With, createState } from "gnim";
import { execAsync, subprocess } from "ags/process";

// Icons
const ICON_DND_OFF = "󰂚";  // Notifications enabled
const ICON_DND_ON = "󰂜";   // Do Not Disturb enabled

export default function DND() {
    const [dndOn, setDndOn] = createState(false);
    const [icon, setIcon] = createState(ICON_DND_OFF);

    // Subscribe to swaync events
    subprocess(
        ["swaync-client", "--subscribe"],
        (output) => {
            try {
                const data = JSON.parse(output);
                // swaync output: { "count": 1, "dnd": true, "visible": false, "inhibited": false }
                setDndOn(data.dnd);
                setIcon(data.dnd ? ICON_DND_ON : ICON_DND_OFF);
            } catch (e) {
                // Ignore parse errors
            }
        }
    );

    const toggleDND = () => {
        execAsync("swaync-client -d").catch(() => { });
    };

    return (
        <button
            class={dndOn((on) => `dnd ${on ? "active" : ""}`)}
            tooltipMarkup={dndOn((on) =>
                `Do Not Disturb: <span color="${on ? "#f7768e" : "#9aa5ce"}">${on ? "ON" : "OFF"}</span>`
            )}
            onClicked={toggleDND}
        >
            <With value={icon}>
                {(i) => <label label={i} />}
            </With>
        </button>
    );
}
