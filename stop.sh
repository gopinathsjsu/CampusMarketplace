#!/bin/bash
# Stop script for Campus Marketplace

echo "🛑 Stopping Campus Marketplace..."

# Stop processes on ports 5001 and 3050
lsof -ti:5001,3050 | xargs kill -9 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ All services stopped"
else
    echo "ℹ️  No running services found"
fi

# Clean up log files
rm -f /tmp/campus-backend.log /tmp/campus-frontend.log 2>/dev/null
echo "🧹 Cleaned up log files"
