#!/usr/bin/lua

-- Calendar hover script (Lua Port)
-- Needs to handle PIDs and delayed execution. 
-- In Lua, starting a background sleep+actions is tricky without forks.
-- Easiest way: call out to sh/nohup.

local open_delay = 0.5
local close_delay = 0.25
local open_pidfile = "/tmp/eww-calendar-open.pid"
local close_pidfile = "/tmp/eww-calendar-close.pid"

local function read_pid(file)
    local f = io.open(file, "r")
    if not f then return nil end
    local pid = f:read("*a")
    f:close()
    return pid:gsub("%s+", "")
end

local function kill_pid(pid)
    if pid and pid ~= "" then
        os.execute("kill " .. pid .. " 2>/dev/null")
    end
end

local function write_pid(file, pid)
    local f = io.open(file, "w")
    if f then
        f:write(pid)
        f:close()
    end
end

local function remove_file(file)
    os.remove(file)
end

local args = {...}
local action = args[1]

if action == "enter" then
    -- Cancel pending close
    kill_pid(read_pid(close_pidfile))
    remove_file(close_pidfile)
    
    -- Kill pending open
    kill_pid(read_pid(open_pidfile))
    remove_file(open_pidfile)
    
    -- Start delayed open
    -- We construct a shell command that runs in background
    local cmd = string.format("sh -c 'sleep %s; eww open calendar' > /dev/null 2>&1 & echo $!", open_delay)
    local handle = io.popen(cmd)
    local pid = handle:read("*a")
    handle:close()
    write_pid(open_pidfile, pid:gsub("%s+", ""))
    
elseif action == "leave" then
    -- Kill pending open
    kill_pid(read_pid(open_pidfile))
    remove_file(open_pidfile)
    
    -- Cancel pending close
    kill_pid(read_pid(close_pidfile))
    
    -- Start delayed close
    local cmd = string.format("sh -c 'sleep %s; eww close calendar' > /dev/null 2>&1 & echo $!", close_delay)
    local handle = io.popen(cmd)
    local pid = handle:read("*a")
    handle:close()
    write_pid(close_pidfile, pid:gsub("%s+", ""))
    
elseif action == "cancel-close" then
    kill_pid(read_pid(close_pidfile))
    remove_file(close_pidfile)
end
