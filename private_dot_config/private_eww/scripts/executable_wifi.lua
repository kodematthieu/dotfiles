#!/usr/bin/lua

-- Eww WiFi Script (Lua Port)
-- Requires: nmcli, ip

local json = require("cjson")

local function exec(cmd)
    local handle = io.popen(cmd)
    local result = handle:read("*a")
    handle:close()
    return (result:gsub("^%s*(.-)%s*$", "%1")) -- trim
end

local function get_iface()
    -- Parse /proc/net/route to find default interface (Dest=00000000)
    local file = io.open("/proc/net/route", "r")
    if not file then return "wlan0" end
    
    file:read("*line") -- skip header
    while true do
        local line = file:read("*line")
        if not line then break end
        local iface, dest = line:match("^(%S+)%s+(%S+)")
        if dest == "00000000" then
            file:close()
            return iface
        end
    end
    file:close()
    return "wlan0"
end

local function get_ip()
    local iface = get_iface()
    local ip_out = exec("ip -4 addr show " .. iface)
    local ip = ip_out:match("inet%s+(%d+%.%d+%.%d+%.%d+)")
    return ip or "No IP"
end

local args = {...}
local action = args[1]

if action == "current" then
    local status = exec("nmcli -t -f WIFI g")
    if status == "enabled" then
        local wifi_out = exec("nmcli -t -f ACTIVE,SSID,SIGNAL,SECURITY dev wifi")
        local con = wifi_out:match("yes:[^\n]+")
        if con then
            -- Parse ACTIVE:yes:SSID:MyNetwork:SIGNAL:80:...
            -- nmcli -t format is field1:field2:field3
            -- fields: ACTIVE,SSID,SIGNAL,SECURITY
            -- Example: yes:MyAP:80:WPA2
            -- We need to handle potential colons in SSID? nmcli escapes them usually.
            
            -- Simple split by colon won't work perfectly if SSID has colons.
            -- Better approach: Use fixed fields or just match patterns.
            -- But for now simple match:
            local _, _, ssid, signal, security = string.find(con, "^yes:([^:]+):(%d+):(.*)$")
            
            -- If regex failed (maybe weird SSID), fallback to basic
            if not ssid then
                ssid = "Connected"
                signal = 0
            end

            local ip = get_ip()
            print(json.encode({
                ssid = ssid,
                status = "connected",
                icon = "",
                signal = tonumber(signal),
                ip = ip,
                state = "on"
            }))
        else
            print(json.encode({
                ssid = "Disconnected",
                status = "disconnected",
                icon = "睊",
                signal = 0,
                ip = "-",
                state = "on"
            }))
        end
    else
        print(json.encode({
            ssid = "Wi-Fi Off",
            status = "disabled",
            icon = "睊",
            signal = 0,
            ip = "-",
            state = "off"
        }))
    end

elseif action == "list" then
    -- List networks
    local output = exec("nmcli -t -f ACTIVE,SSID,SIGNAL,SECURITY dev wifi list")
    local networks = {}
    
    for line in output:gmatch("[^\r\n]+") do
        -- ACTIVE:SSID:SIGNAL:SECURITY
        -- We scan for the pattern.
        local active, ssid, signal, security = line:match("^(%S+):([^:]+):(%d+):(.*)$")
        
        if ssid and ssid ~= "" and ssid ~= "--" then
            local icon = "󰤟"
            local sig = tonumber(signal) or 0
            if sig > 75 then icon = "󰤨"
            elseif sig > 50 then icon = "󰤥"
            elseif sig > 25 then icon = "󰤢" 
            end

            local lock = (security ~= "") and "" or ""
            
            table.insert(networks, {
                active = active,
                ssid = ssid,
                signal = sig,
                security = security,
                icon = icon,
                lock = lock
            })
        end
    end
    print(json.encode(networks))

elseif action == "toggle" then
    local status = exec("nmcli -t -f WIFI g")
    if status == "enabled" then
        os.execute("nmcli radio wifi off")
    else
        os.execute("nmcli radio wifi on")
    end

elseif action == "connect" then
    local ssid = args[2]
    if not ssid then return end
    
    -- Check if known
    local cons = exec("nmcli -t -f NAME con show")
    local known = cons:match("\n" .. ssid .. "\n") or cons:match("^" .. ssid .. "\n") or cons:match("\n" .. ssid .. "$") or cons == ssid
    if known then
        os.execute("nmcli con up id '" .. ssid .. "'")
    else
        -- Prompt
        local handle = io.popen("zenity --entry --title='Wi-Fi Password' --text='Enter password for " .. ssid .. "' --hide-text")
        local pass = handle:read("*a"):gsub("[\n\r]", "")
        handle:close()
        
        if pass ~= "" then
            os.execute("nmcli dev wifi connect '" .. ssid .. "' password '" .. pass .. "'")
        end
    end
end
