#!/usr/bin/lua

-- Network script: Reads sysfs and formats speed (Lua Port)

local json = require("cjson")

local function exec(cmd)
    local handle = io.popen(cmd)
    local result = handle:read("*a")
    handle:close()
    return (result:gsub("^%s*(.-)%s*$", "%1"))
end

local function read_file(path)
    local file = io.open(path, "r")
    if not file then return nil end
    local content = file:read("*a")
    file:close()
    if not content then return nil end
    return (content:gsub("^%s*(.-)%s*$", "%1"))
end

local function get_iface()
    -- Parse /proc/net/route to find default interface (Dest=00000000)
    local file = io.open("/proc/net/route", "r")
    if not file then return "" end
    
    -- Skip header
    file:read("*line")
    
    while true do
        local line = file:read("*line")
        if not line then break end
        -- Format: Iface Destination Gateway Flags ...
        -- Dest is 2nd column
        local iface, dest = line:match("^(%S+)%s+(%S+)")
        if dest == "00000000" then
            file:close()
            return iface
        end
    end
    
    file:close()
    return ""
end

local function bytes_to_human(b)
    local u, v = "B", b
    if b >= 1073741824 then
        v = b / 1073741824
        u = "GB"
    elseif b >= 1048576 then
        v = b / 1048576
        u = "MB"
    elseif b >= 1024 then
        v = b / 1024
        u = "KB"
    end

    if u == "B" then
        return string.format("%.0f%s", v, u)
    elseif v < 9.995 then
        return string.format("%.2f%s", v, u)
    elseif v < 99.95 then
        return string.format("%.1f%s", v, u)
    else
        return string.format("%.0f%s", v, u)
    end
end

local iface = get_iface()
if iface == "" then iface = "lo" end

local rx_prev = tonumber(read_file("/sys/class/net/" .. iface .. "/statistics/rx_bytes")) or 0
local tx_prev = tonumber(read_file("/sys/class/net/" .. iface .. "/statistics/tx_bytes")) or 0

print(json.encode({down = "0B", up = "0B"}))

while true do
    os.execute("sleep 1")

    if read_file("/sys/class/net/" .. iface .. "/operstate") == nil then
        -- Interface lost, try to find new one
        iface = get_iface()
        if iface == "" then iface = "lo" end
        -- Reset counters
        rx_prev = tonumber(read_file("/sys/class/net/" .. iface .. "/statistics/rx_bytes")) or 0
        tx_prev = tonumber(read_file("/sys/class/net/" .. iface .. "/statistics/tx_bytes")) or 0
        print(json.encode({status = "disconnected", down = "0B", up = "0B"}))
    else
        local rx_now = tonumber(read_file("/sys/class/net/" .. iface .. "/statistics/rx_bytes")) or 0
        local tx_now = tonumber(read_file("/sys/class/net/" .. iface .. "/statistics/tx_bytes")) or 0

        local rx_rate = rx_now - rx_prev
        local tx_rate = tx_now - tx_prev
        
        if rx_rate < 0 then rx_rate = 0 end
        if tx_rate < 0 then tx_rate = 0 end

        local operstate = read_file("/sys/class/net/" .. iface .. "/operstate")

        if operstate == "up" then
            local ip_out = exec("ip -4 addr show " .. iface)
            local ip = ip_out:match("inet%s+(%d+%.%d+%.%d+%.%d+)")
            if not ip then ip = "No IP" end
            
            print(json.encode({
                status = "connected",
                down = bytes_to_human(rx_rate),
                up = bytes_to_human(tx_rate),
                ip = ip,
                iface = iface
            }))
        else
            print(json.encode({
                status = "disconnected",
                down = "0B",
                up = "0B",
                ip = "-",
                iface = iface
            }))
        end

        rx_prev = rx_now
        tx_prev = tx_now
    end
end
