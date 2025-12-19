#!/usr/bin/env lua

local method = arg[1]

if method == "pick" then
    -- Launch hyprpicker, autocopy (-a), and capture output
    local handle = io.popen("hyprpicker -a")
    if not handle then return end
    local color = handle:read("*a")
    handle:close()

    if color and color ~= "" then
        -- Trim whitespace
        color = color:gsub("^%s*(.-)%s*$", "%1")
        -- Notify
        os.execute("notify-send 'Color Picked' 'Copied " .. color .. " to clipboard' -i color-picker")
    end
end
