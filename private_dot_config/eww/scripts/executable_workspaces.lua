#!/usr/bin/lua

-- Workspaces script: Listen to Hyprland events and output JSON
local json = require("cjson")

local function exec(cmd)
    local handle = io.popen(cmd)
    local result = handle:read("*a")
    handle:close()
    return (result:gsub("^%s*(.-)%s*$", "%1"))
end

local socket = os.getenv("XDG_RUNTIME_DIR") .. "/hypr/" .. os.getenv("HYPRLAND_INSTANCE_SIGNATURE") .. "/.socket2.sock"

local function output_workspaces()
    local ws_json = exec("hyprctl workspaces -j")
    local active_json = exec("hyprctl activeworkspace -j")
    
    local ws_data, _ = json.decode(ws_json)
    local active_data, _ = json.decode(active_json)
    
    local workspace_ids = {}
    if ws_data then
        for _, w in ipairs(ws_data) do
            table.insert(workspace_ids, w.id)
        end
        table.sort(workspace_ids)
    end
    
    local active_id = active_data and active_data.id or 1
    
    print(json.encode({ workspaces = workspace_ids, active = active_id }))
end

-- Initial output
output_workspaces()

-- Listen to socket
local handle = io.popen("socat -u UNIX-CONNECT:" .. socket .. " -")
for line in handle:lines() do
    if line:find("^workspace") or line:find("^createworkspace") or line:find("^destroyworkspace") or line:find("^focusedmon") then
        output_workspaces()
    end
end
handle:close()
