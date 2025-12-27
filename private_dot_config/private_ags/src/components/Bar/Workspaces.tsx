import { Gtk } from "ags/gtk4"
import Hyprland from "gi://AstalHyprland"
import { With, createState, createComputed } from "gnim"

export default function Workspaces() {
    const hypr = Hyprland.get_default()
    const [focused, setFocused] = createState(hypr.get_focused_workspace())
    const [workspaces, setWorkspaces] = createState(hypr.get_workspaces())
    const [clients, setClients] = createState(hypr.get_clients())

    hypr.connect("notify::focused-workspace", () => setFocused(hypr.focusedWorkspace))
    hypr.connect("notify::workspaces", () => setWorkspaces(hypr.workspaces))
    hypr.connect("notify::clients", () => setClients(hypr.clients))

    const dispatch = (arg: string) => hypr.dispatch("workspace", arg)

    // Combine focused, list, and clients into a single reactive object
    const workspacesData = createComputed(() => {
        const list = workspaces().sort((a: any, b: any) => a.id - b.id)
        const focusedId = focused()?.id
        const currentClients = clients()

        const truncate = (str: string, max: number) => {
            const clean = str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            return clean.length > max ? clean.substring(0, max - 1) + "…" : clean
        }

        const mapped = list.map((ws: any) => {
            const wsClients = currentClients.filter((c: any) => c.workspace.id === ws.id)
            const tooltip = wsClients.length > 0
                ? wsClients.map((c: any) => {
                    const isFocused = c.address === hypr.get_focused_client()?.address
                    const content = `<span color="#bb9af7">${c.class}</span>: ${truncate(c.title, 40)}`
                    return isFocused ? `<u>${content}</u>` : content
                }).join("\n")
                : "Empty Workspace"

            return {
                id: ws.id,
                active: focusedId === ws.id,
                tooltip: tooltip
            }
        })

        return { list: mapped, focusedId }
    })

    return (
        <box class="workspaces">
            <With value={workspacesData}>
                {({ list, focusedId }) => (
                    <box spacing={8}
                        children={list.map((ws: any) => (
                            <button
                                onClicked={() => focusedId !== ws.id && dispatch(ws.id.toString())}
                                class={`workspace-item ${ws.active ? "active" : ""}`}
                                tooltipMarkup={ws.tooltip}
                            >
                                <label label={ws.id.toString()} />
                            </button>
                        ))}
                    />
                )}
            </With>
        </box>
    )
}
