#!/usr/bin/lua

-- Colortime script (Lua Port)

local date_color = "#b4befe"
local time_color = "#94e2d5"
local sep_color  = "#6c7086"

local args = {...}
local format = args[1]

if format == "alt" then
    -- Format: 24/12/09 ● 21:38:45
    -- Lua os.date
    local year = os.date("%y")
    local month = os.date("%m")
    local day = os.date("%d")
    local hour = os.date("%H")
    local min = os.date("%M")
    local sec = os.date("%S")
    
    print(string.format(
        "<span foreground='%s'>%s</span><span foreground='%s'>/</span><span foreground='%s'>%s</span><span foreground='%s'>/</span><span foreground='%s'>%s</span> <span foreground='#ffffff30'>●</span> <span foreground='%s'>%s</span><span foreground='%s'>:</span><span foreground='%s'>%s</span><span foreground='%s'>:</span><span foreground='%s'>%s</span>",
        date_color, year, sep_color, date_color, month, sep_color, date_color, day,
        time_color, hour, sep_color, time_color, min, sep_color, time_color, sec
    ))
else
    -- Format: Dec 09 ● 21:38
    local month = os.date("%b")
    local day = os.date("%d")
    local hour = os.date("%H")
    local min = os.date("%M")
    
    print(string.format(
        "<span foreground='%s'>%s %s</span> <span foreground='#ffffff30'>●</span> <span foreground='%s'>%s</span><span foreground='%s'>:</span><span foreground='%s'>%s</span>",
        date_color, month, day, time_color, hour, sep_color, time_color, min
    ))
end
