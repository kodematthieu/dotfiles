import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import Time from "./Time"
import Caffeine from "./Caffeine"
import DND from "./DND"
import SysInfo from "./SysInfo"
import Workspaces from "./Workspaces"

import Power from "./Power"
import Utilities from "./Utilities"
import Audio from "./Audio"
import Network from "./Network"

export default function Bar(gdkmonitor: Gdk.Monitor) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

  return (
    <window
      visible
      name="bar"
      class="bar"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <overlay>
        {/* Base layer: left and right content */}
        <box hexpand={true}>
          <box halign={Gtk.Align.START} hexpand={true} spacing={10}>
            <SysInfo />
            <Workspaces />
          </box>
          <box halign={Gtk.Align.END} hexpand={true} spacing={10}>
            <Network />
            <Audio />
            <Utilities />
            <Power />
          </box>
        </box>

        {/* Overlay layer: true centered content */}
        <box $type="overlay" halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER} spacing={10}>
          <Caffeine />
          <Time />
          <DND />
        </box>
      </overlay>
    </window>
  )
}
