import GLib from "gi://GLib?version=2.0";
import { exec } from "ags/process";
import { createPoll } from "ags/time";
import { readFile } from "ags/file";
import { With, createState } from "gnim";
import { Gtk } from "ags/gtk4";

// ─── CPU Usage ───────────────────────────────────────────────────────────────
let prevCpusIdle: number[] = [];
let prevCpusTotal: number[] = [];

function getCpuUsage() {
    try {
        const stat = readFile("/proc/stat");
        const lines = stat.split("\n").filter(l => l.startsWith("cpu"));

        const currentUsage = lines.map((line, i) => {
            const parts = line.split(/\s+/).slice(1).map(Number);
            const idle = parts[3] + parts[4]; // idle + iowait
            const total = parts.reduce((a, b) => a + b, 0);

            const deltaIdle = idle - (prevCpusIdle[i] || 0);
            const deltaTotal = total - (prevCpusTotal[i] || 0);

            prevCpusIdle[i] = idle;
            prevCpusTotal[i] = total;

            if (deltaTotal === 0) return 0;
            return Math.round(((deltaTotal - deltaIdle) / deltaTotal) * 100);
        });

        return {
            total: currentUsage[0],
            cores: currentUsage.slice(1)
        };
    } catch {
        return { total: 0, cores: [] };
    }
}

// ─── RAM Usage ───────────────────────────────────────────────────────────────
export interface RamInfo {
    usedPercent: number;
    usedGb: number;
    totalGb: number;
}

function getRamUsage(): RamInfo {
    try {
        const meminfo = readFile("/proc/meminfo");
        const getValue = (key: string): number => {
            const match = meminfo.match(new RegExp(`${key}:\\s+(\\d+)`));
            return match ? parseInt(match[1], 10) : 0;
        };

        const total = getValue("MemTotal");
        const available = getValue("MemAvailable");
        const used = total - available;

        return {
            usedPercent: Math.round((used / total) * 100),
            usedGb: parseFloat((used / 1048576).toFixed(1)),
            totalGb: parseFloat((total / 1048576).toFixed(1)),
        };
    } catch {
        return { usedPercent: 0, usedGb: 0, totalGb: 0 };
    }
}

// ─── GPU Info ────────────────────────────────────────────────────────────────
export interface GpuInfo {
    usage: number;
    vram: {
        usedMb: number;
        totalMb: number;
        usedPercent: number;
    };
}

function getGpuInfo(): GpuInfo {
    try {
        const basePath = "/sys/class/drm/card1/device";
        const usage = parseInt(readFile(`${basePath}/gpu_busy_percent`) || "0", 10);
        const vramTotal = parseInt(readFile(`${basePath}/mem_info_vram_total`) || "0", 10);
        const vramUsed = parseInt(readFile(`${basePath}/mem_info_vram_used`) || "0", 10);

        return {
            usage: Math.min(100, Math.max(0, usage)),
            vram: {
                usedMb: Math.round(vramUsed / 1048576),
                totalMb: Math.round(vramTotal / 1048576),
                usedPercent: vramTotal > 0 ? Math.round((vramUsed / vramTotal) * 100) : 0,
            }
        };
    } catch {
        return { usage: 0, vram: { usedMb: 0, totalMb: 0, usedPercent: 0 } };
    }
}

// ─── Storage Usage ───────────────────────────────────────────────────────────
export interface StorageInfo {
    usedPercent: number;
    usedGb: number;
    totalGb: number;
}

function getStorageUsage(): StorageInfo {
    try {
        const output = exec("df -B1 /");
        const lines = output.split("\n");
        if (lines.length < 2) return { usedPercent: 0, usedGb: 0, totalGb: 0 };

        const parts = lines[1].split(/\s+/);
        const total = parseInt(parts[1], 10);
        const used = parseInt(parts[2], 10);

        return {
            usedPercent: Math.round((used / total) * 100),
            usedGb: parseFloat((used / 1073741824).toFixed(1)),
            totalGb: parseFloat((total / 1073741824).toFixed(1)),
        };
    } catch {
        return { usedPercent: 0, usedGb: 0, totalGb: 0 };
    }
}

// ─── Temperatures ────────────────────────────────────────────────────────────
export interface TempInfo {
    cpu: number;
    gpu: number;
}

function getTemperatures(): TempInfo {
    try {
        const output = exec("sensors -j");
        const data = JSON.parse(output);

        return {
            cpu: Math.round(data["k10temp-pci-00c3"]?.Tctl?.temp1_input ?? 0),
            gpu: Math.round(data["amdgpu-pci-0800"]?.edge?.temp1_input ?? 0),
        };
    } catch {
        return { cpu: 0, gpu: 0 };
    }
}

// ─── SEPARATED POLLS ─────────────────────────────────────────────────────────
// Each runs on its own independent timer to avoid blocking the main thread
export const cpu = createPoll(getCpuUsage(), 1000, getCpuUsage);
export const gpu = createPoll(getGpuInfo(), 1000, getGpuInfo);
export const ram = createPoll(getRamUsage(), 1000, getRamUsage);
export const temps = createPoll(getTemperatures(), 2000, getTemperatures);
export const storage = createPoll(getStorageUsage(), 10000, getStorageUsage);

// ─── Widget ──────────────────────────────────────────────────────────────────
export default function SysInfo() {
    return (
        <box class="sysinfo">
            <box
                class="sys-item cpu"
                tooltipMarkup={cpu((v) => {
                    const colors = ["#7aa2f7", "#bb9af7", "#9ece6a", "#e0af68", "#7dcfff", "#f7768e"];
                    return v.cores.map((c, i) =>
                        `<span color="${colors[i % colors.length]}">Core ${i}:</span> ${c}%`
                    ).join("\n");
                })}
            >
                <image class="icon" iconName="cpu-symbolic" halign={Gtk.Align.START} />
                <With value={cpu}>
                    {(v) => <label label={`${v.total}%`} hexpand={true} xalign={1} />}
                </With>
            </box>

            <box
                class="sys-item gpu"
                tooltipMarkup={gpu((v) =>
                    `<span color="#bb9af7">VRAM:</span> ${v.vram.usedMb}/${v.vram.totalMb} MB (${v.vram.usedPercent}%)`
                )}
            >
                <image class="icon" iconName="gpu-symbolic" halign={Gtk.Align.START} />
                <With value={gpu}>
                    {(v) => <label label={`${v.usage}%`} hexpand={true} xalign={1} />}
                </With>
            </box>

            <box
                class="sys-item ram"
                tooltipMarkup={ram((v) =>
                    `<span color="#9ece6a">Used:</span> ${v.usedGb}/${v.totalGb} GiB`
                )}
            >
                <image class="icon" iconName="ram-symbolic" halign={Gtk.Align.START} />
                <With value={ram}>
                    {(v) => <label label={`${v.usedPercent}%`} hexpand={true} xalign={1} />}
                </With>
            </box>

            <box
                class="sys-item storage"
                tooltipMarkup={storage((v) =>
                    `<span color="#e0af68">Used:</span> ${v.usedGb}/${v.totalGb} GB`
                )}
            >
                <image class="icon" iconName="disk-symbolic" halign={Gtk.Align.START} />
                <With value={storage}>
                    {(v) => <label label={`${v.usedPercent}%`} hexpand={true} xalign={1} />}
                </With>
            </box>

            <box
                class="sys-item temp"
                tooltipMarkup={temps((v) =>
                    `<span color="#f7768e">CPU:</span> ${v.cpu}°C\n<span color="#f7768e">GPU:</span> ${v.gpu}°C`
                )}
            >
                <image class="icon" iconName="temp-symbolic" halign={Gtk.Align.START} />
                <With value={temps}>
                    {(v) => {
                        const severity = v.cpu < 50 ? "cool" : v.cpu < 70 ? "warm" : "hot";
                        return <label class={severity} label={`${v.cpu}°C`} hexpand={true} xalign={1} />;
                    }}
                </With>
            </box>
        </box>
    )
}