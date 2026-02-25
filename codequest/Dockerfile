# Frontend: React + Node
FROM node:20

# Set working directory
WORKDIR /app

# Install dependencies separately to leverage Docker cache
COPY package*.json ./
RUN npm install

# Copy only package-lock.json first (if present) to cache install
COPY package-lock.json ./

# Now copy the rest of the code
COPY . .

# Environment variables to fix hot reload in Docker
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true
ENV WDS_SOCKET_HOST=0.0.0.0
ENV WDS_SOCKET_PORT=3000

# Expose React dev server port
EXPOSE 3000

# Run React in development mode
CMD ["npm", "start"]
