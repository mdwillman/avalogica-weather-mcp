FROM node:20-slim

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies (omit dev dependencies for production)
RUN npm install --omit=dev

# Copy the full project
COPY . .

# Build TypeScript to dist/
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Run the compiled server using HTTP transport
CMD ["node", "dist/index.js", "--port", "8080"]