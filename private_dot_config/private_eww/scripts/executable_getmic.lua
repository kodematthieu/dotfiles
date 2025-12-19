#!/usr/bin/lua

-- Get microphone volume script (Lua Port)

local json = require("cjson")

local function exec(cmd)
    local handle = io.popen(cmd)
    local result = handle:read("*a")
    handle:close()
    return (result:gsub("^%s*(.-)%s*$", "%1"))
end

local function get_volume()
    local output = exec("wpctl get-volume @DEFAULT_AUDIO_SOURCE@")
    -- Output format: "Volume: 0.45 [MUTED]" or "Volume: 0.45"
    local vol_str = output:match("Volume: ([%d%.]+)") or "0"
    local vol = math.floor((tonumber(vol_str) or 0) * 100)
    
    local muted = output:find("MUTED") ~= nil
    
    print(json.encode({volume = vol, muted = muted}))
end

-- Initial output
get_volume()

-- Listen
local handle = io.popen("pactl subscribe")
for line in handle:lines() do
    -- Listen for source events
    if line:find("source") then
        get_volume()
    end
end
handle:close()
