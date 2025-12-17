#!/usr/bin/env lua

local cjson = require("cjson")

-- Function to print formatted JSON for Eww
local function print_status(dnd_state)
    local result = {}
    if dnd_state then
        result.status = "on"
        result.icon = "󰂜"
        result.class = "dnd-on"
    else
        result.status = "off"
        result.icon = "󰂚"
        result.class = "dnd-off"
    end
    print(cjson.encode(result))
    io.flush()
end

-- Listen to swaync events
local handle = io.popen("swaync-client --subscribe", "r")
if not handle then return end

for line in handle:lines() do
    local ok, data = pcall(cjson.decode, line)
    if ok and data then
        -- swaync output: { "count": 1, "dnd": true, "visible": false, "inhibited": false }
        print_status(data.dnd)
    end
end

handle:close()
