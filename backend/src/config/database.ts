import { PrismaClient } from '@prisma/client';

// Verifica DATABASE_URL prima di inizializzare Prisma
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('   Please add a PostgreSQL database on Railway and ensure DATABASE_URL is configured.');
  console.error('   Steps:');
  console.error('   1. Go to Railway → Your Project → New → Database → Add PostgreSQL');
  console.error('   2. Railway will automatically create DATABASE_URL variable');
  console.error('   3. Make sure the database is linked to your backend service');
  // Non blocchiamo l'avvio, ma Prisma fallirà quando verrà usato
}

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Test connection on startup (solo se DATABASE_URL è presente)
if (process.env.DATABASE_URL) {
  prisma.$connect()
    .then(() => {
      console.log('✅ Database connected successfully');
    })
    .catch((error) => {
      console.error('❌ Database connection error:', error.message);
      if (error.code === 'P1012') {
        console.error('   This usually means DATABASE_URL is missing or invalid.');
      }
      // Non blocchiamo l'avvio del server, ma loggiamo l'errore
    });
}

export default prisma;

