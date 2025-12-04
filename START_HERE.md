# Campus Marketplace - Quick Start Guide

## Starting the Application

### Option 1: Using the start script (Recommended)

```bash
chmod +x start.sh stop.sh
./start.sh
```

### Option 2: Manual start

**Backend:**

```bash
cd backend/server
npm run dev
```

**Frontend:**

```bash
cd frontend/user
VITE_APP_API_BASE_URL=http://localhost:5001/api npm run dev
```

## Stopping the Application

```bash
./stop.sh
```

Or manually:

```bash
lsof -ti:5001,3050 | xargs kill
```

## Service URLs

- **Frontend**: http://localhost:3050
- **Backend API**: http://localhost:5001/api
- **Health Check**: http://localhost:5001/api/health

## Admin Access

Create an account with one of these emails to get admin privileges:

- admin@sjsu.edu
- admin@university.edu

Then access the admin dashboard at: http://localhost:3050/admin

## Port Configuration

**Important**: Port 5000 is used by macOS AirPlay, so we use **5001** for the backend.

- Backend: Port 5001
- Frontend: Port 3050
- MongoDB: Port 27017 (or MongoDB Atlas)

## Troubleshooting

### Backend won't start

```bash
# Check if port 5001 is in use
lsof -i:5001

# Check backend logs
tail -f /tmp/campus-backend.log
```

### Frontend won't start

```bash
# Check if port 3050 is in use
lsof -i:3050

# Check frontend logs
tail -f /tmp/campus-frontend.log
```

### Network errors

Make sure both services are running and the frontend is configured to use `http://localhost:5001/api`

### Kill all processes

```bash
pkill -f "nodemon.*server.ts"
pkill -f "vite"
```

## Environment Variables

Backend uses `.env` file in `backend/server/` directory.
Current configuration:

- PORT: 5050 (but server.ts defaults to 5001)
- FRONTEND_URL: http://localhost:3050
- MongoDB: MongoDB Atlas (cloud)

Frontend uses Vite environment variables:

- VITE_APP_API_BASE_URL: http://localhost:5001/api (set via command line or defaults in code)
