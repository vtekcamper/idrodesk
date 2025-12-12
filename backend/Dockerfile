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
# Prima prova migrate deploy (se ci sono migrazioni), altrimenti usa db push
CMD ["sh", "-c", "if [ -d prisma/migrations ] && [ \"$(ls -A prisma/migrations)\" ]; then npx prisma migrate deploy || echo 'Migration failed, trying db push...' && npx prisma db push --accept-data-loss || echo 'db push failed'; else echo 'No migrations found, using db push to create tables...' && npx prisma db push --accept-data-loss || echo 'db push failed'; fi && npm start"]
