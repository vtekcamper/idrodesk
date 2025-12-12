import { PrismaClient, PianoAbbonamento } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

/**
 * Seed produzione: crea dati iniziali per il sistema
 * Eseguire con: npx tsx prisma/seed.ts
 */
async function main() {
  console.log('🌱 Starting seed...');

  // Crea super admin se non esiste
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { isSuperAdmin: true },
  });

  if (!existingSuperAdmin) {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@idrodesk.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!';

    console.log(`Creating super admin: ${superAdminEmail}`);

    const superAdmin = await prisma.user.create({
      data: {
        nome: 'Super',
        cognome: 'Admin',
        email: superAdminEmail,
        passwordHash: await hashPassword(superAdminPassword),
        ruolo: 'OWNER',
        isSuperAdmin: true,
        attivo: true,
        companyId: null,
      },
    });

    console.log(`✅ Super admin created: ${superAdmin.id}`);
    console.log(`⚠️  IMPORTANT: Change password after first login!`);
  } else {
    console.log('ℹ️  Super admin already exists');
  }

  // Crea company di esempio (solo se in development)
  if (process.env.NODE_ENV === 'development') {
    const existingCompany = await prisma.company.findFirst({
      where: { piva: '12345678901' },
    });

    if (!existingCompany) {
      console.log('Creating example company...');

      const company = await prisma.company.create({
        data: {
          ragioneSociale: 'IdroDesk Example S.r.l.',
          piva: '12345678901',
          indirizzo: 'Via Example 123',
          telefono: '+39 123 456 7890',
          email: 'example@idrodesk.com',
          pianoAbbonamento: PianoAbbonamento.PRO,
          abbonamentoAttivo: true,
          subscriptionStatus: 'ACTIVE',
          dataScadenza: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 giorni
        },
      });

      // Crea owner per company
      const owner = await prisma.user.create({
        data: {
          nome: 'Mario',
          cognome: 'Rossi',
          email: 'mario.rossi@example.com',
          passwordHash: await hashPassword('Password123!'),
          ruolo: 'OWNER',
          attivo: true,
          companyId: company.id,
        },
      });

      console.log(`✅ Example company created: ${company.id}`);
      console.log(`✅ Example owner created: ${owner.email} / Password123!`);
    } else {
      console.log('ℹ️  Example company already exists');
    }
  }

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

