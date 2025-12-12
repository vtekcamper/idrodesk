# Dockerfile per Railway - build context dalla root
FROM node:18-slim

WORKDIR /app

# Install OpenSSL and other dependencies for Prisma
RUN apt-get update && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy backend package files
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install dependencies
RUN npm install

# Copy backend source code
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Generate Prisma Client
RUN npx prisma generate

# Build
RUN npm run build

EXPOSE 3001

# Run migrations and start server
# Esegui sempre db push per creare/aggiornare le tabelle
CMD ["sh", "-c", "echo 'Running prisma db push...' && npx prisma db push --accept-data-loss --skip-generate && echo 'Database schema synced!' && npm start"]


