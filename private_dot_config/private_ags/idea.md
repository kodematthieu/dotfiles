# 🏛️ Architectural Decision: Monolithic UI Strategy

**Goal:** Consolidate disparate UI tools (SwayNC, Rofi, Loginctl, Regreet) into a single AGS-driven stack.

**Verdict:**

1.  **Immediate Action:** Replace **Loginctl UI (wlogout)** and **Regreet** (Greeter).
2.  **Deferred:** Keep **SwayNC** (Notifications) and **Rofi** (Launcher) for now to prioritize core stability.

## 📊 Tradeoff Analysis

### 1. SwayNC → AGS Notification Center

| Feature                | SwayNC                         | AGS Custom Implementation               | Verdict     |
| :--------------------- | :----------------------------- | :-------------------------------------- | :---------- |
| **Visual Consistency** | Medium (Requires CSS matching) | **High** (Shared SCSS/Variables)        | AGS wins    |
| **Complexity**         | Low (Config only)              | **High** (Manual Logic for History/DND) | SwayNC wins |
| **Integration**        | Standard DBus                  | **Deep** (Scripting/Interactions)       | AGS wins    |
| **Reliability**        | **High** (Mature Rust binary)  | Medium (Dependent on JS Runtime)        | SwayNC wins |

**Conclusion:** **Defer.** SwayNC is reliable and "good enough" for now. Visual consistency is secondary to stability in this phase.

#### 🛠️ Technical Feasibility Notes

- **History:** AGS has a built-in `Notifications` service. _Warning:_ excessive history can slow down the JS runtime; implement a "clear limit" (e.g., last 50).
- **DND:** No native "DND" switch existed in previous versions; requires a custom variable (e.g., `const dnd = Variable(false)`) to mute/hide popups.
- **Libraries:** GTK constraints apply. Complex animations must be optimized to avoid frame drops.

### 2. Rofi → AGS App Launcher

| Feature         | Rofi                        | AGS Custom Implementation       | Verdict   |
| :-------------- | :-------------------------- | :------------------------------ | :-------- |
| **Performance** | **Extreme** (C/Native)      | Good (JS/GTK)                   | Rofi wins |
| **Flexibility** | Low (Lists/Grids only)      | **Unlimited** (Full UI Toolkit) | AGS wins  |
| **Ecosystem**   | **Huge** (Existing Scripts) | None (Write from scratch)       | Rofi wins |
| **Keyboard UX** | Excellent (Mature)          | Requires manual event handling  | Rofi wins |

**Conclusion:** **Defer.** Rofi is "good enough" and very fast. Replicating its keyboard efficiency in AGS takes significant tuning.

#### 🛠️ Technical Feasibility Notes

- **Fuzzy Search:** GJS supports libraries like **fuse.js** or **fuzzysort** for approximate matching.
- **Keyboard Nav:** Requires manual `key-press-event` handling and `keymode: exclusive` or `on-demand` on the window. Replicating Rofi's "always snappy" arrow-key navigation requires careful focus management.
- **Performance:** Rofi (C/Native) will always beat AGS (JS/GTK) on startup time, but AGS can keep the window properly "hidden" (resident) for instant appearance.

### 3. Loginctl UI (wlogout) → AGS Power Menu

| Feature     | wlogout                        | AGS Custom Implementation          | Verdict      |
| :---------- | :----------------------------- | :--------------------------------- | :----------- |
| **Latency** | Medium (Process startup)       | **None** (Already resident)        | AGS wins     |
| **Styling** | Painful (Limited CSS)          | **Excellent** (Full CSS/Box Model) | AGS wins     |
| **Safety**  | **High** (Independent process) | Medium (Fails if AGS crashes)      | wlogout wins |

**Conclusion:** **Replace.** The implementation is simple (a few buttons) and the instant responsiveness is a great UX upgrade.

#### 🛠️ Technical Feasibility Notes

- **Stability Risk:** AGS is a single process. If the shell crashes, the Power Menu crashes.
- **Mitigation:** Keep a hardware binding (e.g., `Ctrl+Alt+Delete`) mapped to a raw `systemctl poweroff` or a lightweight fallback (like `wlogout`) as a safety net.
- **Implementation:** Simple GTK Box with buttons invoking `Utils.exec('systemctl ...')`.

### 4. Regreet → AGS Greeter

| Feature     | Regreet                        | AGS Custom Greeter                | Verdict      |
| :---------- | :----------------------------- | :-------------------------------- | :----------- |
| **Styling** | "Ugly" (Limited to GTK themes) | **Perfect** (Full CSS/JS control) | AGS wins     |
| **Safety**  | **High** (Standard greeter)    | Low (Custom session logic)        | Regreet wins |

**Conclusion:** **Replace.**

- **User Condition:** "Defer if calendar and layout modifiable."
- **Research:** Regreet **does not** support a Calendar widget (only text clock) or layout reordering via config.
- **Verdict:** Since it fails the "Calendar" requirement, we proceed with a custom AGS greeter.
