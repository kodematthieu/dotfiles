import { Gtk, Gdk } from "ags/gtk4"
import { execAsync } from "ags/process"
import { With, createState, createComputed } from "gnim"
import Wp from "gi://AstalWp"

const wp = Wp.get_default()
const audio = wp.audio

// Icon names (symbolic SVGs)
function getSpeakerIcon(volume: number, muted: boolean): string {
    if (muted) return "volume-x-symbolic"
    if (volume < 0.33) return "volume-low-symbolic"
    if (volume < 0.66) return "volume-med-symbolic"
    return "volume-high-symbolic"
}

function getMicIcon(muted: boolean): string {
    return muted ? "mic-off-symbolic" : "mic-symbolic"
}

// ─── Speaker Widget ──────────────────────────────────────────────────────────
function Speaker() {
    const [volume, setVolume] = createState(0.5)
    const [muted, setMuted] = createState(false)

    const updateFromSpeaker = () => {
        const speaker = audio.default_speaker
        if (speaker) {
            setVolume(speaker.volume)
            setMuted(speaker.mute ?? false)
        }
    }

    const setupSpeaker = () => {
        const speaker = audio.default_speaker
        if (speaker) {
            speaker.connect("notify::volume", updateFromSpeaker)
            speaker.connect("notify::mute", updateFromSpeaker)
            updateFromSpeaker()
        }
    }
    
    setupSpeaker()
    audio.connect("notify::default-speaker", setupSpeaker)

    // Single computed for both icon and percentage
    const displayData = createComputed(() => ({
        icon: getSpeakerIcon(volume(), muted()),
        percent: Math.round(volume() * 100),
    }))

    const toggleMute = () => {
        execAsync(["wpctl", "set-mute", "@DEFAULT_AUDIO_SINK@", "toggle"]).catch(() => { })
    }

    const openMixer = () => {
        execAsync(["hyprctl", "dispatch", "exec", "[float; pin; size 800 600; center] pavucontrol -t 3"]).catch(() => { })
    }

    const adjustVolume = (direction: "up" | "down") => {
        const sign = direction === "up" ? "+" : "-"
        execAsync(["wpctl", "set-volume", "-l", "1.0", "@DEFAULT_AUDIO_SINK@", `5%${sign}`]).catch(() => { })
    }

    return (
        <button
            class={muted((m) => `audio-item speaker ${m ? "muted" : ""}`)}
            tooltipText={displayData((d) => `Volume: ${d.percent}%`)}
            onClicked={toggleMute}
        >
            <Gtk.GestureClick button={Gdk.BUTTON_SECONDARY} onPressed={openMixer} />
            <Gtk.EventControllerScroll
                flags={Gtk.EventControllerScrollFlags.VERTICAL}
                onScroll={(_ctrl: Gtk.EventControllerScroll, _dx: number, dy: number) => {
                    adjustVolume(dy < 0 ? "up" : "down")
                    return true
                }}
            />
            <With value={displayData}>
                {(d) => (
                    <box>
                        <image iconName={d.icon} halign={Gtk.Align.START} />
                        <label label={`${d.percent}%`} hexpand={true} xalign={1} />
                    </box>
                )}
            </With>
        </button>
    )
}

// ─── Microphone Widget ───────────────────────────────────────────────────────
function Microphone() {
    const [volume, setVolume] = createState(0.5)
    const [muted, setMuted] = createState(false)

    const updateFromMic = () => {
        const mic = audio.default_microphone
        if (mic) {
            setVolume(mic.volume)
            setMuted(mic.mute ?? false)
        }
    }

    const setupMic = () => {
        const mic = audio.default_microphone
        if (mic) {
            mic.connect("notify::volume", updateFromMic)
            mic.connect("notify::mute", updateFromMic)
            updateFromMic()
        }
    }
    
    setupMic()
    audio.connect("notify::default-microphone", setupMic)

    // Single computed for both icon and percentage
    const displayData = createComputed(() => ({
        icon: getMicIcon(muted()),
        percent: Math.round(volume() * 100),
    }))

    const toggleMute = () => {
        execAsync(["wpctl", "set-mute", "@DEFAULT_AUDIO_SOURCE@", "toggle"]).catch(() => { })
    }

    const openMixer = () => {
        execAsync(["hyprctl", "dispatch", "exec", "[float; pin; size 800 600; center] pavucontrol -t 4"]).catch(() => { })
    }

    const adjustVolume = (direction: "up" | "down") => {
        const sign = direction === "up" ? "+" : "-"
        execAsync(["wpctl", "set-volume", "-l", "1.0", "@DEFAULT_AUDIO_SOURCE@", `5%${sign}`]).catch(() => { })
    }

    return (
        <button
            class={muted((m) => `audio-item mic ${m ? "muted" : ""}`)}
            tooltipText={displayData((d) => `Mic: ${d.percent}%`)}
            onClicked={toggleMute}
        >
            <Gtk.GestureClick button={Gdk.BUTTON_SECONDARY} onPressed={openMixer} />
            <Gtk.EventControllerScroll
                flags={Gtk.EventControllerScrollFlags.VERTICAL}
                onScroll={(_ctrl: Gtk.EventControllerScroll, _dx: number, dy: number) => {
                    adjustVolume(dy < 0 ? "up" : "down")
                    return true
                }}
            />
            <With value={displayData}>
                {(d) => (
                    <box>
                        <image iconName={d.icon} halign={Gtk.Align.START} />
                        <label label={`${d.percent}%`} hexpand={true} xalign={1} />
                    </box>
                )}
            </With>
        </button>
    )
}

// ─── Audio Island ────────────────────────────────────────────────────────────
export default function BarAudio() {
    return (
        <box class="audio island" spacing={4}>
            <Speaker />
            <Microphone />
        </box>
    )
}
