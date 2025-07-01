# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# 1. Copy package manifests, install deps
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

# 2. Copy all frontend source
COPY frontend/ ./

# 3. Build the Next.js app for production
RUN npm run build

# 4. Expose Next’s default port
EXPOSE 3000

# 5. Start Next in production mode
CMD ["npm", "run", "start"]
