#!/bin/bash

# Open Safari and create the first tab
osascript -e 'tell application "Safari" to open location "http://localhost:5173"'

# Open the second tab in the same window
osascript -e 'tell application "Safari" to tell window 1 to make new tab with properties {URL:"http://localhost:5173"}'

# Open the third tab in the same window
osascript -e 'tell application "Safari" to tell window 1 to make new tab with properties {URL:"http://localhost:5173"}'
