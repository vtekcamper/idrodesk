/**
 * Script per creare la migrazione iniziale usando il database Railway
 * 
 * Uso:
 * 1. Vai su Railway → Il tuo database → Variables → copia DATABASE_URL
 * 2. Crea un file .env nella directory backend con: DATABASE_URL="postgresql://..."
 * 3. Esegui: npm run create-migration
 */

import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carica .env dalla directory backend
dotenv.config({ path: path.join(__dirname, '../.env') });

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL non trovato nel file .env');
  console.error('');
  console.error('Per creare le migrazioni:');
  console.error('1. Vai su Railway → Il tuo database PostgreSQL → Variables');
  console.error('2. Copia il valore di DATABASE_URL');
  console.error('3. Crea un file .env nella directory backend con:');
  console.error('   DATABASE_URL="postgresql://user:password@host:port/database"');
  console.error('4. Esegui di nuovo: npm run create-migration');
  process.exit(1);
}

console.log('📦 Creazione migrazione iniziale...');
console.log('   Database:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')); // Nascondi password

try {
  // Crea la migrazione iniziale
  execSync('npx prisma migrate dev --name init --create-only', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
  });
  
  console.log('');
  console.log('✅ Migrazione creata con successo!');
  console.log('');
  console.log('Prossimi passi:');
  console.log('1. Controlla la migrazione in: backend/prisma/migrations/');
  console.log('2. Fai commit e push delle migrazioni');
  console.log('3. Railway eseguirà automaticamente le migrazioni al prossimo deploy');
} catch (error) {
  console.error('❌ Errore nella creazione della migrazione:', error);
  process.exit(1);
}

