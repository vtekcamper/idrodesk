import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Test connection on startup
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('   Please add a PostgreSQL database on Railway and ensure DATABASE_URL is configured.');
} else {
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

