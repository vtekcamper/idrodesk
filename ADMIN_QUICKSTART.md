# 🚀 Quick Start - Sistema Admin

## 1. Esegui Migrazioni Database

Dopo aver aggiornato lo schema Prisma, esegui le migrazioni:

```bash
cd backend
npx prisma migrate dev --name add_admin_system
```

Questo creerà:
- Campo `isSuperAdmin` in `User`
- Campo `companyId` nullable in `User` (per super admin)
- Campi `abbonamentoAttivo` e `dataScadenza` in `Company`
- Tabella `SubscriptionHistory`

## 2. Crea il Primo Super Admin

```bash
cd backend
npm run create-admin
```

Oppure con credenziali personalizzate:
```bash
ADMIN_EMAIL=admin@idrodesk.com ADMIN_PASSWORD=password123 npm run create-admin
```

## 3. Accedi al Pannello Admin

1. Vai su `https://your-app.netlify.app/admin/login`
2. Usa le credenziali del super admin
3. Accedi alla dashboard

## 4. Gestisci Aziende

- Vedi tutte le aziende
- Modifica piani abbonamento
- Attiva/disattiva abbonamenti
- Vedi statistiche di utilizzo

---

## 📋 Checklist Setup

- [ ] Migrazioni Prisma eseguite
- [ ] Primo super admin creato
- [ ] Login admin funzionante
- [ ] Dashboard admin accessibile
- [ ] Test modifica piano abbonamento
- [ ] Test attivazione/disattivazione abbonamento

---

## 🔧 Configurazione Limiti

I limiti sono in `backend/src/config/planLimits.ts`. Puoi modificarli facilmente.

---

## 📚 Documentazione Completa

Vedi `ADMIN_GUIDE.md` per la documentazione completa del sistema.

