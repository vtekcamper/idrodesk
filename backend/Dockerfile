FROM node:18-slim

WORKDIR /app

# Install OpenSSL and other dependencies for Prisma
RUN apt-get update && \
    apt-get install -y openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build
RUN npm run build

EXPOSE 3001

# Run migrations and start server
# Se le migrazioni falliscono, loggiamo l'errore ma avviamo comunque il server
CMD ["sh", "-c", "npx prisma migrate deploy || echo 'Migration failed, continuing anyway...' && npm start"]
