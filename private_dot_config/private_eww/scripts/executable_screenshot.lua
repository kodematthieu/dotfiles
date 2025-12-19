#!/usr/bin/env lua

local method = arg[1]
local home = os.getenv("HOME")
local screenshots_dir = home .. "/Pictures/screenshots"

-- Ensure directory exists
os.execute("mkdir -p " .. screenshots_dir)

local function get_filename()
    return screenshots_dir .. "/" .. os.date("%Y-%m-%d-%H%M%S") .. ".png"
end

if method == "full" then
    local file = get_filename()
    -- Capture full screen, save to file
    os.execute("grim " .. file)
    -- Copy to clipboard
    os.execute("wl-copy < " .. file)
    -- Send notification
    os.execute("notify-send -u critical 'Screenshot Taken' 'Saved to " .. file .. "' -i " .. file)
elseif method == "region" then
    -- Region capture with Satty
    -- Format for satty output filename: %Y-%m-%d-%H%M%S.png (satty uses strftime format specifiers)
    local output_format = screenshots_dir .. "/%Y-%m-%d-%H%M%S.png"
    
    -- Construct command
    -- 1. slurp: select region
    -- 2. grim -g: capture region
    -- 3. satty: annotate
    --    --filename -: read from stdin
    --    --output-filename: where to save if user hits save
    --    --early-exit: exit after copy/save
    --    --copy-command: use wl-copy for clipboard
    local cmd = string.format("grim -g \"$(slurp)\" - | satty --filename - --output-filename '%s' --early-exit --copy-command wl-copy", output_format)
    
    os.execute(cmd)
elseif method == "open" then
    os.execute("xdg-open " .. screenshots_dir)
end
