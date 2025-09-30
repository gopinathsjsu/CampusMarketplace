# Campus Marketplace

[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/VM5AL9S5)

## Docker Setup

### Quick Start

1. **Prerequisites**
   - Docker Desktop installed and running

2. **Start the application**
   ```bash
   git clone [repository-url]
   cd campus-marketplace
   docker-compose up --build
   ```

3. **Access the services**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017

### Useful Commands

```bash
# Start in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Clean restart (removes data)
docker-compose down -v && docker-compose up --build
```

### Services
- **Frontend**: React/Vite app on port 3000
- **Backend**: Node.js/Express API on port 5000
- **MongoDB**: Database on port 27017
- **Redis**: Caching on port 6379

