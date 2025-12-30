import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import { createState, With } from "gnim"
import AppList from "./AppList"
import ClipboardList from "./ClipboardList"
import KeybindList from "./KeybindList"

const WINDOW_NAME = "menu"

export default function Menu() {
    const [mode, setMode] = createState<"apps" | "clipboard" | "keybinds">("apps")

    const hide = () => app.toggle_window(WINDOW_NAME)
    const { TOP, BOTTOM, LEFT, RIGHT } = Astal.WindowAnchor

    return (
        <window
            name={WINDOW_NAME}
            visible={false}
            keymode={Astal.Keymode.EXCLUSIVE}
            anchor={TOP | BOTTOM | LEFT | RIGHT}
            exclusivity={Astal.Exclusivity.IGNORE}
            application={app}
        >
            <Gtk.EventControllerKey
                onKeyPressed={(_, keyval, _2, _3) => {
                    if (keyval === Gdk.KEY_Escape) {
                        hide()
                        return true
                    }
                    return false
                }}
            />
            <box 
                css="min-width: 400px; min-height: 520px; background-color: #1e1e2e; border-radius: 12px; border: 1px solid #cba6f7; padding: 10px;" 
                halign={Gtk.Align.CENTER} 
                valign={Gtk.Align.CENTER}
            >
                <Gtk.GestureClick 
                    propagationPhase={Gtk.PropagationPhase.CAPTURE}
                    button={Gdk.BUTTON_PRIMARY}
                    onPressed={() => hide()}
                />

                <With value={mode}>
                    {m => {
                        if (m === "apps") return <AppList />
                        if (m === "clipboard") return <ClipboardList />
                        if (m === "keybinds") return <KeybindList />
                    }}
                </With>
            </box>
        </window>
    )
}
