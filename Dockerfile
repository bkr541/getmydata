# Use the official Playwright image for the correct Node version
FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy application code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the port Next.js will run on
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
