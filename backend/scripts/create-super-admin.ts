/**
 * Script per creare il primo super admin
 * 
 * Uso:
 *   tsx scripts/create-super-admin.ts
 * 
 * Oppure con variabili d'ambiente:
 *   ADMIN_EMAIL=admin@idrodesk.com ADMIN_PASSWORD=password123 tsx scripts/create-super-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@idrodesk.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const nome = process.env.ADMIN_NOME || 'Super';
  const cognome = process.env.ADMIN_COGNOME || 'Admin';

  console.log('🔐 Creazione Super Admin...');
  console.log(`Email: ${email}`);

  try {
    // Verifica se esiste già
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.isSuperAdmin) {
        console.log('✅ Super admin già esistente con questa email');
        return;
      } else {
        console.log('⚠️  Utente esistente ma non è super admin. Aggiornamento...');
        const updated = await prisma.user.update({
          where: { id: existing.id },
          data: {
            isSuperAdmin: true,
            companyId: null,
          },
        });
        console.log('✅ Utente aggiornato a super admin');
        return;
      }
    }

    // Crea nuovo super admin
    const superAdmin = await prisma.user.create({
      data: {
        nome,
        cognome,
        email,
        passwordHash: await hashPassword(password),
        ruolo: 'OWNER',
        isSuperAdmin: true,
        companyId: null,
        attivo: true,
      },
    });

    console.log('✅ Super admin creato con successo!');
    console.log(`   ID: ${superAdmin.id}`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Nome: ${superAdmin.nome} ${superAdmin.cognome}`);
    console.log('\n📝 Puoi ora accedere a /admin/login con queste credenziali');
  } catch (error: any) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();

