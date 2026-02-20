# syntax = docker/dockerfile:1

FROM node:20-alpine

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Install build tools for better-sqlite3 (python3-dev includes distutils)
RUN apk add --no-cache python3 python3-dev make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source
COPY . .

# Set production environment
ENV NODE_ENV="production"

# Setup sqlite3 on a separate volume
RUN mkdir -p /data
VOLUME /data

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "src/index.js"]
