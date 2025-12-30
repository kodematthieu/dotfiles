#!/bin/bash

# Parse comments from hyprctl binds -j
# Expected description format: "[Group] Description" or "[Group|Subgroup] Description"

hyprctl binds -j | jq -r '
  .[] | select(.description != "") |
  (.description | capture("\\[(?<group>.*)\\]\\s*(?<desc>.*)") // {group: "Ungrouped", desc: .}) as $info |
  "\( $info.group )\t\( $info.desc )\t\(.modmask) + \(.key)"
' | \
sed 's/64/Super/g; s/65/Super+Shift/g; s/8/Alt/g; s/1/Shift/g; s/4/Ctrl/g' | \
column -t -s $'\t' | \
awk '{print $0 "\0icon\x1finput-keyboard"}'
