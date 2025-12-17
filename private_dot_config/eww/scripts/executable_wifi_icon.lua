#!/usr/bin/env lua

-- Configuration
local output_path = "/tmp/eww-wifi-icon.svg"
local color_active = "#ffffff"       -- Active band color (White)
local color_inactive = "#5c5f77"     -- Inactive band color (Grey, approx Surface 2)

-- Function to read file content
local function read_file(path)
    local f = io.open(path, "r")
    if not f then return nil end
    local content = f:read("*all")
    f:close()
    return content
end

-- Function to get wifi quality percentage
local function get_wifi_quality()
    local content = read_file("/proc/net/wireless")
    if not content then return 0 end
    
    -- Parse /proc/net/wireless
    -- Example line: wlp5s0: 0000   49.  -61.  ...
    -- 3rd field is link quality.
    for quality in content:gmatch("[%w%-]+:%s+%d+%s+(%d+)%.") do
        local q = tonumber(quality)
        if q then
            -- Standard linux wireless extensions usually imply max quality 70.
            local perc = (q / 70) * 100
            if perc > 100 then perc = 100 end
            return perc
        end
    end
    return 0
end

local quality = get_wifi_quality()

-- Determine colors for each band
-- Band 1: Dot (Always active if connected/quality > 0)
-- Band 2: Inner Arc (> 25%)
-- Band 3: Middle Arc (> 50%)
-- Band 4: Outer Arc (> 75%)

local c1 = (quality > 0) and color_active or color_inactive
local c2 = (quality > 25) and color_active or color_inactive
local c3 = (quality > 50) and color_active or color_inactive
local c4 = (quality > 75) and color_active or color_inactive

-- SVG Content
local svg = string.format([[
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 18C13.1046 18 14 18.8954 14 20C14 21.1046 13.1046 22 12 22C10.8954 22 10 21.1046 10 20C10 18.8954 10.8954 18 12 18Z" fill="%s"/>
  <path d="M16.9497 15.0503C15.5829 13.6834 13.7916 13 12 13C10.2084 13 8.41709 13.6834 7.05025 15.0503L8.46447 16.4645C9.40237 15.5266 10.7012 15 12 15C13.2988 15 14.5976 15.5266 15.5355 16.4645L16.9497 15.0503Z" fill="%s"/>
  <path d="M19.7782 12.2218C17.6534 10.097 14.8258 9 12 9C9.17418 9 6.34661 10.097 4.22183 12.2218L5.63604 13.636C7.32985 11.9422 9.66493 11 12 11C14.3351 11 16.6702 11.9422 18.364 13.636L19.7782 12.2218Z" fill="%s"/>
  <path d="M22.6066 9.3934C19.6749 6.46168 15.8393 5 12 5C8.16071 5 4.32513 6.46168 1.3934 9.3934L2.80761 10.8076C5.23447 8.38075 8.61724 7 12 7C15.3828 7 18.7655 8.38075 21.1924 10.8076L22.6066 9.3934Z" fill="%s"/>
</svg>
]], c1, c2, c3, c4)

-- Write SVG to file
local f = io.open(output_path, "w")
if f then
    f:write(svg)
    f:close()
    print(output_path) -- Output the path for Eww
else
    print("error")
end
