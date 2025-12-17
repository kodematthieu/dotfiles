#!/usr/bin/lua

-- Active Window script: Listen to Hyprland events
local socket = os.getenv("XDG_RUNTIME_DIR") .. "/hypr/" .. os.getenv("HYPRLAND_INSTANCE_SIGNATURE") .. "/.socket2.sock"

local function exec(cmd)
    local handle = io.popen(cmd)
    local result = handle:read("*a")
    handle:close()
    return (result:gsub("^%s*(.-)%s*$", "%1"))
end

local function output_active()
    local output = exec("hyprctl activewindow -j")
    -- Match "title": "Window Title"
    local title = output:match('"title":%s*"([^"]*)"') or ""
    print(title)
end

output_active()

local handle = io.popen("socat -u UNIX-CONNECT:" .. socket .. " -")
for line in handle:lines() do
    if line:find("^activewindow") or line:find("^closewindow") then
        output_active()
    end
end
handle:close()
