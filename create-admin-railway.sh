#!/bin/bash
# Script per creare super admin via Railway

cd /app/backend || cd backend

# Usa le variabili d'ambiente o i valori di default
ADMIN_EMAIL=${ADMIN_EMAIL:-"hellonomoslab@gmail.com"}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-"Atdrums.1200!"}
ADMIN_NOME=${ADMIN_NOME:-"Alessandro"}
ADMIN_COGNOME=${ADMIN_COGNOME:-"Terazzan"}

node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function create() {
  try {
    const email = process.env.ADMIN_EMAIL || '$ADMIN_EMAIL';
    const password = process.env.ADMIN_PASSWORD || '$ADMIN_PASSWORD';
    const nome = process.env.ADMIN_NOME || '$ADMIN_NOME';
    const cognome = process.env.ADMIN_COGNOME || '$ADMIN_COGNOME';
    
    console.log('🔐 Creazione Super Admin...');
    console.log(\`Email: \${email}\`);
    
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existing) {
      if (existing.isSuperAdmin) {
        console.log('✅ Super admin già esistente con questa email');
        process.exit(0);
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
        process.exit(0);
      }
    }
    
    const hash = await bcrypt.hash(password, 10);
    const superAdmin = await prisma.user.create({
      data: {
        nome,
        cognome,
        email,
        passwordHash: hash,
        ruolo: 'OWNER',
        isSuperAdmin: true,
        companyId: null,
        attivo: true,
      },
    });
    
    console.log('✅ Super admin creato con successo!');
    console.log(\`   ID: \${superAdmin.id}\`);
    console.log(\`   Email: \${superAdmin.email}\`);
    console.log(\`   Nome: \${superAdmin.nome} \${superAdmin.cognome}\`);
    console.log('\\n📝 Puoi ora accedere a /admin/login con queste credenziali');
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  } finally {
    await prisma.\$disconnect();
  }
}

create();
"

