import { Gtk, Gdk } from "ags/gtk4"
import { exec, execAsync } from "ags/process"
import { createPoll } from "ags/time"
import { readFile } from "ags/file"
import { With, createState } from "gnim"
import AstalNetwork from "gi://AstalNetwork"

const network = AstalNetwork.get_default()

// ─── Speed Monitor ───────────────────────────────────────────────────────────
interface SpeedData {
    down: string
    up: string
    downBytes: number
    upBytes: number
    device: string
    ip: string
    gateway: string
    dns: string
    mac: string
}

function formatSpeed(bytesPerSec: number): string {
    // Format to max 3 digits: X.XX, XX.X, or XXX
    const formatValue = (val: number): string => {
        if (val < 10) return val.toFixed(2)      // X.XX
        if (val < 100) return val.toFixed(1)     // XX.X
        return Math.round(val).toString()         // XXX
    }

    if (bytesPerSec < 1024) return `${formatValue(bytesPerSec)} B`
    if (bytesPerSec < 1024 * 1024) return `${formatValue(bytesPerSec / 1024)} K`
    return `${formatValue(bytesPerSec / 1024 / 1024)} M`
}

function getDefaultInterface(): string | null {
    try {
        const route = readFile("/proc/net/route")
        const lines = route.split("\n").slice(1) // Skip header
        for (const line of lines) {
            const parts = line.split("\t")
            if (parts[1] === "00000000") { // Default route
                return parts[0]
            }
        }
    } catch { }
    return null
}

function getNetworkInfo(iface: string): { ip: string; gateway: string; dns: string; mac: string } {
    let ip = "—"
    let gateway = "—"
    let dns = "—"
    let mac = "—"

    try {
        // Get IP address
        const ipOutput = exec(`ip -4 addr show ${iface}`)
        const ipMatch = ipOutput.match(/inet ([0-9.]+)/)
        if (ipMatch) ip = ipMatch[1]

        // Get MAC address
        const macFile = readFile(`/sys/class/net/${iface}/address`)
        if (macFile) mac = macFile.trim().toUpperCase()

        // Get default gateway
        const routeOutput = exec("ip route show default")
        const gwMatch = routeOutput.match(/via ([0-9.]+)/)
        if (gwMatch) gateway = gwMatch[1]

        // Get DNS from resolv.conf
        const resolvConf = readFile("/etc/resolv.conf")
        const dnsMatch = resolvConf.match(/nameserver ([0-9.]+)/)
        if (dnsMatch) dns = dnsMatch[1]
    } catch { }

    return { ip, gateway, dns, mac }
}

let prevRxBytes = 0
let prevTxBytes = 0

function getNetworkSpeed(): SpeedData {
    const iface = getDefaultInterface()
    if (!iface) {
        return { down: "—", up: "—", downBytes: 0, upBytes: 0, device: "—", ip: "—", gateway: "—", dns: "—", mac: "—" }
    }

    try {
        const rxBytes = parseInt(readFile(`/sys/class/net/${iface}/statistics/rx_bytes`) || "0", 10)
        const txBytes = parseInt(readFile(`/sys/class/net/${iface}/statistics/tx_bytes`) || "0", 10)

        const downSpeed = prevRxBytes > 0 ? rxBytes - prevRxBytes : 0
        const upSpeed = prevTxBytes > 0 ? txBytes - prevTxBytes : 0

        prevRxBytes = rxBytes
        prevTxBytes = txBytes

        const info = getNetworkInfo(iface)

        return {
            down: formatSpeed(downSpeed),
            up: formatSpeed(upSpeed),
            downBytes: downSpeed,
            upBytes: upSpeed,
            device: iface,
            ...info,
        }
    } catch {
        return { down: "—", up: "—", downBytes: 0, upBytes: 0, device: "—", ip: "—", gateway: "—", dns: "—", mac: "—" }
    }
}

// ─── WiFi Icon Mapping ───────────────────────────────────────────────────────
function getWifiIcon(strength: number, state: AstalNetwork.DeviceState): string {
    if (state === AstalNetwork.DeviceState.DISCONNECTED) return "wifi-off-symbolic"
    if (state === AstalNetwork.DeviceState.PREPARE || state === AstalNetwork.DeviceState.CONFIG) return "wifi-sync-symbolic"
    
    if (strength <= 25) return "wifi-s1-symbolic"
    if (strength <= 50) return "wifi-s2-symbolic"
    if (strength <= 75) return "wifi-s3-symbolic"
    return "wifi-s4-symbolic"
}

// ─── Speed Monitor Widget ────────────────────────────────────────────────────
function SpeedMonitor() {
    const speed = createPoll(getNetworkSpeed(), 1000, getNetworkSpeed)

    const copyToClipboard = () => {
        const s = speed()
        const text = `Device: ${s.device}\nIP: ${s.ip}\nGateway: ${s.gateway}\nDNS: ${s.dns}\nMAC: ${s.mac}`
        execAsync(["bash", "-c", `echo -n "${text}" | wl-copy`])
            .then(() => execAsync(["notify-send", "Network Info", "Copied to clipboard"]))
            .catch(() => { })
    }

    return (
        <box 
            class="speed-monitor"
            tooltipMarkup={speed((s) => 
                `<span color="#7aa2f7">Device:</span> ${s.device}\n` +
                `<span color="#9ece6a">IP:</span> ${s.ip}\n` +
                `<span color="#e0af68">Gateway:</span> ${s.gateway}\n` +
                `<span color="#7dcfff">DNS:</span> ${s.dns}\n` +
                `<span color="#bb9af7">MAC:</span> ${s.mac}`
            )}
        >
            <Gtk.GestureClick button={Gdk.BUTTON_SECONDARY} onPressed={copyToClipboard} />
            <box class="speed-item down">
                <image iconName="download-symbolic" halign={Gtk.Align.START} />
                <With value={speed}>
                    {(s) => <label label={s.down} hexpand={true} xalign={1} />}
                </With>
            </box>
            <box class="speed-item up">
                <image iconName="upload-symbolic" halign={Gtk.Align.START} />
                <With value={speed}>
                    {(s) => <label label={s.up} hexpand={true} xalign={1} />}
                </With>
            </box>
        </box>
    )
}

// ─── Network Status Widget ───────────────────────────────────────────────────
function NetworkStatus() {
    const wifi = network.wifi
    const wired = network.wired
    
    const [icon, setIcon] = createState("wifi-off-symbolic")
    const [tooltip, setTooltip] = createState("Disconnected")
    const [connected, setConnected] = createState(false)

        const updateStatus = () => {
        // Check WiFi first
        if (wifi && wifi.enabled) {
            const strength = wifi.strength ?? 0
            const state = wifi.state ?? AstalNetwork.DeviceState.DISCONNECTED
            const ssid = wifi.ssid ?? "Unknown"
            
            setIcon(getWifiIcon(strength, state))
            setConnected(state === AstalNetwork.DeviceState.ACTIVATED)
            setTooltip(state === AstalNetwork.DeviceState.ACTIVATED 
                ? `${ssid} (${strength}%)` 
                : "WiFi Disconnected")
            return
        }

        // Check Wired
        if (wired) {
            const state = wired.state ?? AstalNetwork.DeviceState.DISCONNECTED
            if (state === AstalNetwork.DeviceState.ACTIVATED) {
                setIcon("network-symbolic")
                setConnected(true)
                setTooltip("Ethernet Connected")
                return
            }
        }

        // Fallback: disconnected
        setIcon("wifi-off-symbolic")
        setConnected(false)
        setTooltip("Disconnected")
    }

    // Subscribe to changes
    wifi?.connect("notify::state", updateStatus)
    wifi?.connect("notify::strength", updateStatus)
    wifi?.connect("notify::ssid", updateStatus)
    wired?.connect("notify::state", updateStatus)
    network.connect("notify::primary", updateStatus)
    
    // Initial update
    updateStatus()

    const openSettings = () => {
        execAsync(["hyprctl", "dispatch", "exec", "[float; pin; size 800 600; center] nm-connection-editor"]).catch(() => { })
    }

    return (
        <button
            class={connected((c) => `network-status ${c ? "connected" : "disconnected"}`)}
            tooltipText={tooltip()}
            onClicked={openSettings}
        >
            <With value={icon}>
                {(i) => <image iconName={i} />}
            </With>
        </button>
    )
}

// ─── Network Island ──────────────────────────────────────────────────────────
export default function Network() {
    return (
        <box class="network">
            <SpeedMonitor />
            <NetworkStatus />
        </box>
    )
}
