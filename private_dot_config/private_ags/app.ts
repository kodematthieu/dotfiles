import app from "ags/gtk4/app"
import style from "./style.scss"
import Bar from "./src/components/Bar"

app.start({
  css: style,
  icons: `${SRC}/assets`,
  main() {
    app.get_monitors().map(Bar)
  },
})
