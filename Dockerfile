# Use a lightweight Node.js image
FROM node:18-slim

# Create app directory
WORKDIR /app

# Copy dependencies first (caches this step for faster builds)
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy the rest of your app code
COPY . .

# Expose the port
EXPOSE 3000

# Start the server
CMD [ "node", "index.js" ]