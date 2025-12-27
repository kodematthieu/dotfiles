import app from "ags/gtk4/app"
import { Astal, Gtk, Gdk } from "ags/gtk4"
import BarTime from "./BarTime"
import BarCaffeine from "./BarCaffeine"
import BarDND from "./BarDND"
import BarSysInfo from "./BarSysInfo"
import BarWorkspaces from "./BarWorkspaces"

import BarPower from "./BarPower"
import BarUtilities from "./BarUtilities"
import BarAudio from "./BarAudio"
import BarNetwork from "./BarNetwork"

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
            <BarSysInfo />
            <BarWorkspaces />
          </box>
          <box halign={Gtk.Align.END} hexpand={true} spacing={10}>
            <BarNetwork />
            <BarAudio />
            <BarUtilities />
            <BarPower />
          </box>
        </box>

        {/* Overlay layer: true centered content */}
        <box $type="overlay" halign={Gtk.Align.CENTER} valign={Gtk.Align.CENTER} spacing={10}>
          <BarCaffeine />
          <BarTime />
          <BarDND />
        </box>
      </overlay>
    </window>
  )
}
