FROM node:22-alpine3.22

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy all source files including data
COPY . .

# Create data directory and ensure permissions
RUN mkdir -p /app/data && \
    chown -R node:node /app && \
    chmod 755 /app/data

# Switch to non-root user
USER node

ENV PORT=8080
EXPOSE 8080

CMD ["node", "index.js"]