import { Gtk, Gdk } from "ags/gtk4"
import { exec, execAsync } from "ags/process"
import { createPoll } from "ags/time"
import { readFile } from "ags/file"
import { With, createState, createComputed } from "gnim"
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

// ─── Network Menu ────────────────────────────────────────────────────────────
function WifiItem({ ap }: { ap: any }) {
    return (
        <box class={`wifi-item ${ap.active ? "active" : ""}`} spacing={8} hexpand>
            <image iconName={ap.iconName} />
            <label label={ap.ssid || "Unknown"} hexpand xalign={0} />
            {ap.statusIcon && <image iconName={ap.statusIcon} halign={Gtk.Align.END} />}
        </box>
    )
}

function WifiList({ wifi }: { wifi: AstalNetwork.Wifi }) {
    const [aps, setAps] = createState(wifi.accessPoints || [])
    const [scanning, setScanning] = createState(wifi.scanning)

    wifi.connect("notify::access-points", () => setAps(wifi.accessPoints))
    wifi.connect("notify::scanning", () => setScanning(wifi.scanning))
    
    const list = createComputed(() => {
        const unique = new Map<string, any>()
        
        // @ts-ignore
        const conns = network.wifi?.connections || network.connections || []
        const known = new Set(conns.map((c: any) => c.id))

        for (const ap of aps()) {
            if (!ap.ssid) continue
            if (!unique.has(ap.ssid) || unique.get(ap.ssid).strength < ap.strength) {
                unique.set(ap.ssid, ap)
            }
        }

        return Array.from(unique.values())
            .map(ap => {
                // @ts-ignore
                const isSecured = (ap.flags & 1) > 0 || (ap.wpaFlags > 0) || (ap.rsnFlags > 0)
                const isKnown = known.has(ap.ssid)
                const isActive = wifi.activeAccessPoint?.ssid === ap.ssid
                
                let statusIcon = null
                
                if (isActive) {
                    statusIcon = "check-symbolic"
                } else if (isSecured) {
                     if (isKnown) {
                         statusIcon = "lock-open-symbolic"
                     } else {
                         statusIcon = "lock-symbolic"
                     }
                }
                
                return {
                    ssid: ap.ssid,
                    strength: ap.strength,
                    iconName: getWifiIcon(ap.strength, AstalNetwork.DeviceState.UNKNOWN),
                    active: isActive,
                    statusIcon: statusIcon
                }
            })
            .sort((a, b) => {
                if (a.active && !b.active) return -1
                if (!a.active && b.active) return 1
                return b.strength - a.strength
            })
            .slice(0, 15) // Limit to top 15
    })

    const scan = () => {
        wifi.scan()
    }
    
    return (
        <box orientation={Gtk.Orientation.VERTICAL} spacing={4} class="wifi-list">
             <box spacing={8} class="header">
                <label label="Wi-Fi" hexpand xalign={0} css="font-weight: bold;" />
                <switch 
                    valign={Gtk.Align.CENTER} 
                    active={wifi.enabled}
                    onStateSet={(_, state) => {
                        wifi.set_enabled(state)
                        return false
                    }}
                    onNotify={(self) => {
                        if (self.active !== wifi.enabled) {
                             wifi.set_enabled(self.active)
                        }
                    }}
                />
                <button onClicked={scan} tooltipText="Scan for networks">
                    <With value={scanning}>
                        {(s) => <image class={s ? "spinning" : ""} iconName={s ? "process-working-symbolic" : "view-refresh-symbolic"} />}
                    </With>
                </button>
             </box>
             
             <Gtk.Separator />

             <Gtk.ScrolledWindow minContentHeight={200} minContentWidth={200} hscrollbarPolicy={Gtk.PolicyType.NEVER}>
                <With value={list}>
                    {(items) => (
                        <box orientation={Gtk.Orientation.VERTICAL} spacing={2}>
                        {items.length > 0 ? items.map(ap => (
                             <WifiItem ap={ap} />
                        )) : <label label="No networks found" />}
                        </box>
                    )}
                </With>
             </Gtk.ScrolledWindow>
        </box>
    )
}


// ─── Network Status Widget ───────────────────────────────────────────────────
function NetworkStatus() {
    const wifi = network.wifi
    const wired = network.wired
    
    // Icon & Label State
    const [icon, setIcon] = createState("wifi-off-symbolic")
    const [tooltip, setTooltip] = createState("Disconnected")
    const [status, setStatus] = createState("disabled") 

    const updateStatus = () => {
        // Check WiFi
        if (wifi) {
             if (wifi.enabled) {
                const strength = wifi.strength ?? 0
                const state = wifi.state ?? AstalNetwork.DeviceState.DISCONNECTED
                const ssid = wifi.ssid ?? "Unknown"
                
                setIcon(getWifiIcon(strength, state))
                
                if (state === AstalNetwork.DeviceState.ACTIVATED) {
                    setStatus("connected")
                    setTooltip(`${ssid} (${strength}%)`)
                } else {
                    setStatus("disconnected")
                    setTooltip("WiFi Disconnected")
                }
             } else {
                setIcon("wifi-off-symbolic")
                setStatus("disabled")
                setTooltip("WiFi Disabled")
             }
             return
        }

        // Check Wired
        if (wired) {
            const state = wired.state ?? AstalNetwork.DeviceState.DISCONNECTED
            if (state === AstalNetwork.DeviceState.ACTIVATED) {
                setIcon("network-symbolic")
                setStatus("connected")
                setTooltip("Ethernet Connected")
                return
            }
        }

        // Fallback
        setIcon("wifi-off-symbolic")
        setStatus("disabled")
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

    const toggleWifi = () => {
        if (wifi) {
            wifi.set_enabled(!wifi.enabled)
        }
    }

    return (
        <menubutton
            class={status((s) => `network-status ${s}`)}
            tooltipText={tooltip()}
            halign={Gtk.Align.CENTER}
        >
            <Gtk.GestureClick button={Gdk.BUTTON_SECONDARY} onPressed={toggleWifi} />
            <With value={icon}>
                {(i) => <image iconName={i} />}
            </With>
            
            <popover>
                <box orientation={Gtk.Orientation.VERTICAL} spacing={10} class="network-menu" widthRequest={250}>
                     {wifi && <WifiList wifi={wifi} />}
                     
                     <button onClicked={openSettings} class="settings-btn">
                        <box spacing={8} halign={Gtk.Align.CENTER}>
                            <image iconName="preferences-system-network-symbolic" />
                            <label label="Network Settings" />
                        </box>
                     </button>
                </box>
            </popover>
        </menubutton>
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
