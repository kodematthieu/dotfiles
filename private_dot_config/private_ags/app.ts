import app from "ags/gtk4/app"
import style from "./style.scss"
import Bar from "./src/components/Bar"
import Menu from "./src/components/Menu"

app.start({
  css: style,
  icons: `${SRC}/assets`,
  main() {
    // Bar is per monitor
    app.get_monitors().map(Bar)
    // Menu is global (or singleton per app instance)
    Menu()
  },
})
