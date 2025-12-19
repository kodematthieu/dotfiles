#!/usr/bin/lua

-- Caffeine script (Lua Port)
local statefile = "/tmp/eww-caffeine.state"

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

local function write_file(path, content)
    local file = io.open(path, "w")
    if file then
        file:write(content .. "\n")
        file:close()
    end
end

local args = {...}
local action = args[1]

-- Init
if not read_file(statefile) then
    local pgrep = os.execute("pgrep -x hypridle > /dev/null")
    if pgrep then
        write_file(statefile, "false")
    else
        write_file(statefile, "true")
    end
end

if action == "toggle" then
    local pgrep = os.execute("pgrep -x hypridle > /dev/null")
    if pgrep then
        -- Disable (Caffeine ON)
        os.execute("killall hypridle")
        write_file(statefile, "true")
    else
        -- Enable (Caffeine OFF)
        os.execute("hypridle > /dev/null 2>&1 &") -- Detatch
        write_file(statefile, "false")
    end

elseif action == "listen" then
    local content = read_file(statefile)
    print(content)
    
    local handle = io.popen("inotifywait -m -e modify " .. statefile)
    for line in handle:lines() do
        local new_content = read_file(statefile)
        print(new_content)
    end
    handle:close()
end
