import { Gtk, Gdk } from "ags/gtk4"
import { createPoll } from "ags/time"
import { With, createState, createComputed } from "gnim";
import { monitorFile, writeFile } from "ags/file";
import GLib from "gi://GLib?version=2.0";
import Gio from "gi://Gio?version=2.0";

const TIME_ALT_MODE_FILE = GLib.build_filenamev([GLib.get_home_dir(), ".cache", "ags", "time-alt.mode"]);

// Check if file exists at startup
function fileExists(path: string): boolean {
    return GLib.file_test(path, GLib.FileTest.EXISTS);
}

// Color palette (matches eww colortime.lua)
const DATE_COLOR = "#b4befe";  // lavender
const TIME_COLOR = "#94e2d5";  // teal
const SEP_COLOR = "#6c7086";   // muted
const BULLET_COLOR = "#ffffff30"; // faint white

// Helper for Pango span
const span = (color: string, text: string) => `<span foreground='${color}'>${text}</span>`;

// Format time with Pango markup for colored text
function formatTime(date: Date, alt: boolean): string {
    const pad = (n: number) => n.toString().padStart(2, "0");

    if (alt) {
        // Alt: "25/12/20 ● 16:13:19"
        const y = pad(date.getFullYear() % 100);
        const m = pad(date.getMonth() + 1);
        const d = pad(date.getDate());
        const h = pad(date.getHours());
        const min = pad(date.getMinutes());
        const s = pad(date.getSeconds());

        return [
            span(DATE_COLOR, y), span(SEP_COLOR, "/"),
            span(DATE_COLOR, m), span(SEP_COLOR, "/"),
            span(DATE_COLOR, d),
            " ", span(BULLET_COLOR, "●"), " ",
            span(TIME_COLOR, h), span(SEP_COLOR, ":"),
            span(TIME_COLOR, min), span(SEP_COLOR, ":"),
            span(TIME_COLOR, s),
        ].join("");
    } else {
        // Main: "Dec 20 ● 16:13"
        const month = date.toLocaleString("en-US", { month: "short" });
        const day = pad(date.getDate());
        const h = pad(date.getHours());
        const min = pad(date.getMinutes());

        return [
            span(DATE_COLOR, `${month} ${day}`),
            " ", span(BULLET_COLOR, "●"), " ",
            span(TIME_COLOR, h), span(SEP_COLOR, ":"),
            span(TIME_COLOR, min),
        ].join("");
    }
}

export default function Time() {
    const time = createPoll(new Date(), 1000, () => new Date());
    const [altMode, setAltMode] = createState(fileExists(TIME_ALT_MODE_FILE));

    // Sync file to state (for external changes only, e.g. from terminal)
    monitorFile(TIME_ALT_MODE_FILE, (_file, event) => {
        if (event === Gio.FileMonitorEvent.CREATED) {
            setAltMode(true);
        } else if (event === Gio.FileMonitorEvent.DELETED) {
            setAltMode(false);
        }
    });

    // Persist state to file (fire-and-forget)
    const syncToFile = (enabled: boolean) => {
        try {
            if (enabled) {
                writeFile(TIME_ALT_MODE_FILE, "1");
            } else {
                const file = Gio.File.new_for_path(TIME_ALT_MODE_FILE);
                if (fileExists(TIME_ALT_MODE_FILE)) {
                    file.delete(null);
                }
            }
        } catch (e) {
            // Ignore file sync errors
        }
    };

    // Toggle on secondary click - update state immediately, then persist
    const toggleMode = () => {
        const newMode = !altMode.peek();
        setAltMode(newMode);
        syncToFile(newMode);
    };

    // Computed label that reacts to both time and mode changes
    const displayLabel = createComputed(() => formatTime(time(), altMode()));

    return (
        <menubutton $type="end" class="time" hexpand halign={Gtk.Align.CENTER}>
            <Gtk.GestureClick button={Gdk.BUTTON_SECONDARY} onPressed={toggleMode} />
            <With value={displayLabel}>
                {(markup) => <label label={markup} useMarkup={true} />}
            </With>
            <popover>
                <Gtk.Calendar class="calendar" />
            </popover>
        </menubutton>
    )
}
