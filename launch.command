#!/bin/bash

# Change to the directory where this script is located
cd "$(dirname "$0")"

echo "Checking for existing Next.js dev server..."

# Find and kill any process running 'next dev' or listening on port 3000
# This prevents the ".next/dev/lock" error when reopening the script
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "Found existing process on port 3000. Terminating it to release the lock..."
    lsof -Pi :3000 -sTCP:LISTEN -t | xargs kill -9
    sleep 1 # Give it a moment to release
fi

# Also try to specifically kill node processes running 'next' just in case
pkill -f "next" || true

echo "Starting Flight Search App..."

# Open the app in the default browser after a short delay to let the server start
(sleep 3 && open "http://localhost:3000") &

npm run dev
