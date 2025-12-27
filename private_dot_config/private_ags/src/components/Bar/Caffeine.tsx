import { Gtk, Gdk } from "ags/gtk4"
import { With, createState } from "gnim";
import { execAsync, exec } from "ags/process";

// Check if hypridle is running (caffeine OFF means hypridle is running)
function isHypridleRunning(): boolean {
    try {
        exec("pgrep -x hypridle");
        return true;
    } catch {
        return false;
    }
}

export default function Caffeine() {
    // Caffeine ON = hypridle NOT running
    const [caffeineOn, setCaffeineOn] = createState(!isHypridleRunning());

    const toggleCaffeine = () => {
        const currentlyOn = caffeineOn.peek();

        if (currentlyOn) {
            // Turn OFF caffeine = start hypridle
            // setsid detaches hypridle from AGS process tree
            execAsync("setsid -f hypridle").catch(() => { });
            setCaffeineOn(false);
        } else {
            // Turn ON caffeine = kill hypridle
            execAsync("killall hypridle").catch(() => { });
            setCaffeineOn(true);
        }
    };

    return (
        <button
            class={caffeineOn((on) => `caffeine ${on ? "active" : ""}`)}
            tooltipMarkup={caffeineOn((on) =>
                `Caffeine: <span color="${on ? "#e0af68" : "#9aa5ce"}">${on ? "ON" : "OFF"}</span>`
            )}
            onClicked={toggleCaffeine}
        >
            <label label="" />
        </button>
    );
}
