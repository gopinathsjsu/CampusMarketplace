# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S frontend -u 1001

# Change ownership
RUN chown -R frontend:nodejs /app

# Switch to non-root user
USER frontend

# Expose port
EXPOSE 3050

# Start the application
CMD ["npm", "run", "dev"]


