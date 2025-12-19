#!/usr/bin/lua

-- CPU usage script: Efficiently reads /proc/stat
-- Output: CPU Avg: X% \n Core 0: Y% \n ...

local function read_stat()
    local file = io.open("/proc/stat", "r")
    if not file then return nil end
    local content = file:read("*a")
    file:close()
    return content
end

local function parse_stat(content)
    local cores = {}
    for line in content:gmatch("[^\r\n]+") do
        if line:find("^cpu") then
            -- cpu  user nice system idle iowait irq softirq steal guest guest_nice
            local name, u, n, s, i, w, x, y, z = line:match("(%S+)%s+(%d+)%s+(%d+)%s+(%d+)%s+(%d+)%s+(%d+)%s+(%d+)%s+(%d+)%s+(%d+)")
            if name then
                local total = u + n + s + i + w + x + y + z
                local idle = i + w
                cores[name] = { total = total, idle = idle }
            end
        end
    end
    return cores
end

local prev_stat = read_stat()
local prev_cores = parse_stat(prev_stat)

-- Sleep handled by Eww script polling usually? 
-- The original script was a tooltip generator running once? 
-- Let's check original logic: it slept 0.1s and calc'd diff.

local function get_usage()
    local stat1 = read_stat()
    os.execute("sleep 0.1")
    local stat2 = read_stat()
    
    local cores1 = parse_stat(stat1)
    local cores2 = parse_stat(stat2)
    
    local output = {}
    
    -- Overall (cpu)
    local t1 = cores1["cpu"].total
    local i1 = cores1["cpu"].idle
    local t2 = cores2["cpu"].total
    local i2 = cores2["cpu"].idle
    
    local td = t2 - t1
    local id = i2 - i1
    local usage = math.floor(100 * (td - id) / td + 0.5)
    
    table.insert(output, "CPU Avg: " .. usage .. "%")
    
    -- Individual cores
    -- We want them sorted cpu0, cpu1...
    local core_names = {}
    for k, _ in pairs(cores2) do
        if k ~= "cpu" then table.insert(core_names, k) end
    end
    -- Sort by number (cpu0, cpu10 problem handled?)
    table.sort(core_names, function(a,b) 
        local an = tonumber(a:match("cpu(%d+)"))
        local bn = tonumber(b:match("cpu(%d+)"))
        return an < bn 
    end)
    
    for _, name in ipairs(core_names) do
        local c1 = cores1[name]
        local c2 = cores2[name]
        local ctx = c2.total - c1.total
        local cix = c2.idle - c1.idle
        local cu = math.floor(100 * (ctx - cix) / ctx + 0.5)
        local id_num = name:match("cpu(%d+)")
        table.insert(output, "Core " .. id_num .. ": " .. cu .. "%")
    end
    
    return table.concat(output, "\n")
end

print(get_usage())
