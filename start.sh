#!/bin/bash
# Start script for Campus Marketplace

echo "🚀 Starting Campus Marketplace..."
echo ""

# Check if MongoDB is running locally
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Starting MongoDB..."
    brew services start mongodb-community@6.0
    sleep 3
fi

# Kill any existing processes on ports 5001 and 3050
echo "🧹 Cleaning up old processes..."
lsof -ti:5001,3050 | xargs kill -9 2>/dev/null || echo "  No old processes to clean"

# Start backend
echo ""
echo "📦 Starting Backend Server on port 5001..."
cd "$(dirname "$0")/backend/server"
npm run dev > /tmp/campus-backend.log 2>&1 &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "  Waiting for backend to be ready..."
sleep 5

# Check if backend started successfully
if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
    echo "  ✅ Backend is running at http://localhost:5001/api"
else
    echo "  ❌ Backend failed to start. Check logs: tail -f /tmp/campus-backend.log"
fi

# Start frontend
echo ""
echo "🎨 Starting Frontend on port 3050..."
cd "$(dirname "$0")/frontend/user"
VITE_APP_API_BASE_URL=http://localhost:5001/api npm run dev > /tmp/campus-frontend.log 2>&1 &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"

# Wait for frontend to start
sleep 3

echo ""
echo "✨ Campus Marketplace is starting!"
echo ""
echo "📍 Services:"
echo "   Backend:  http://localhost:5001/api"
echo "   Frontend: http://localhost:3050"
echo ""
echo "📋 Logs:"
echo "   Backend:  tail -f /tmp/campus-backend.log"
echo "   Frontend: tail -f /tmp/campus-frontend.log"
echo ""
echo "🛑 To stop all services:"
echo "   lsof -ti:5001,3050 | xargs kill"
echo ""
