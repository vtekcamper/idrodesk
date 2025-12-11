FROM node:18-alpine

WORKDIR /app

# Install OpenSSL for Prisma (required for linux-musl binary)
RUN apk add --no-cache openssl1.1-compat

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

CMD ["npm", "start"]
