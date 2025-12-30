import { Gtk } from "ags/gtk4"
import Apps from "gi://AstalApps"
import { createState, createComputed, With } from "gnim"

const ITEM_HEIGHT = 50
const VISIBLE_COUNT = 10

export default function AppList() {
    const appsService = new Apps.Apps()
    const [list, setList] = createState(appsService.list)

    const [scrollTop, setScrollTop] = createState(0)

    appsService.connect("notify::list", () => setList(appsService.list))

    const computed = createComputed(() => {
        const apps = list()

        const total = apps.length
        const start = Math.floor(scrollTop() / ITEM_HEIGHT)
        // Ensure start is within bounds
        const safeStart = Math.min(Math.max(0, start), Math.max(0, total - VISIBLE_COUNT))
        
        const visibleApps = apps.slice(safeStart, safeStart + VISIBLE_COUNT)
        const topHeight = safeStart * ITEM_HEIGHT
        const bottomHeight = Math.max(0, (total - safeStart - visibleApps.length) * ITEM_HEIGHT)

        return { visibleApps, topHeight, bottomHeight }
    })

    const adjustment = new Gtk.Adjustment()
    adjustment.connect("notify::value", () => setScrollTop(adjustment.value))

    return (
        <scrolledwindow
            vexpand={true}
            hexpand={true}
            vadjustment={adjustment}
        >
            <With value={computed}>
                {({ visibleApps, topHeight, bottomHeight }) => (
                    <box orientation={Gtk.Orientation.VERTICAL}>
                        <label label={`Apps: ${list().length}, Scroll: ${Math.floor(scrollTop())}`} />


                        <box css={`min-height: ${topHeight}px;`} />
                        {visibleApps.map((app: Apps.Application) => (
                            <button
                                heightRequest={ITEM_HEIGHT}
                                onClicked={() => {
                                    app.launch()
                                }}
                            >
                                <box spacing={10}>
                                    <Gtk.Image iconName={app.iconName || "application-x-executable"} />
                                    <label label={app.name} />
                                </box>
                            </button>
                        ))}
                        <box css={`min-height: ${bottomHeight}px;`} />
                    </box>
                )}
            </With>
        </scrolledwindow>
    )
}