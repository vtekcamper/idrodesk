# 🔐 Guida Sistema Amministrativo - IdroDesk

## Panoramica

Il sistema amministrativo di IdroDesk gestisce:
- **Multi-tenant**: Isolamento completo dei dati per azienda
- **Abbonamenti**: 3 piani (BASIC, PRO, ELITE) con limiti configurabili
- **Super Admin**: Pannello per gestire tutte le aziende
- **Controllo limiti**: Enforcement automatico dei limiti per piano

---

## 🎯 Architettura Multi-Tenant

### Come Funziona

1. **Isolamento Dati**:
   - Ogni entità (Client, Quote, Job, Material, ecc.) ha `companyId`
   - Tutte le query filtrano automaticamente per `companyId`
   - Un utente non può vedere dati di altre aziende

2. **Autenticazione**:
   - JWT token contiene `companyId`
   - Middleware `authenticate` estrae `companyId` e lo mette in `req.companyId`
   - Ogni controller usa `req.companyId!` per filtrare

3. **Sicurezza**:
   - Anche se un utente prova a passare un ID di un'altra azienda, il filtro lo blocca
   - Super admin può vedere tutto (bypassa i filtri)

---

## 💳 Sistema Abbonamenti

### Piani Disponibili

#### BASIC
- **Utenti**: 3
- **Clienti**: 50
- **Lavori/mese**: 100
- **Preventivi/mese**: 100
- **Storage**: 1GB
- **Prezzo**: Gratuito o base

#### PRO
- **Utenti**: 10
- **Clienti**: Illimitati
- **Lavori/mese**: Illimitati
- **Preventivi/mese**: Illimitati
- **Storage**: 10GB
- **Prezzo**: Medio

#### ELITE
- **Utenti**: Illimitati
- **Clienti**: Illimitati
- **Lavori/mese**: Illimitati
- **Preventivi/mese**: Illimitati
- **Storage**: 100GB
- **Prezzo**: Premium

### Enforcement Limiti

I limiti vengono verificati automaticamente quando:
- Si crea un nuovo utente → verifica limite utenti
- Si crea un nuovo cliente → verifica limite clienti
- Si crea un nuovo lavoro → verifica limite lavori/mese
- Si crea un nuovo preventivo → verifica limite preventivi/mese

**Middleware**: `checkPlanLimits('users'|'clients'|'jobs'|'quotes')`

**Esempio**:
```typescript
router.post('/', checkPlanLimits('users'), createUser);
```

Se il limite è raggiunto, l'API restituisce:
```json
{
  "error": "Limite users raggiunto per il piano BASIC. Passa a un piano superiore per continuare.",
  "code": "LIMIT_EXCEEDED",
  "current": 3,
  "limit": 3,
  "plan": "BASIC"
}
```

### Abbonamento Scaduto

Se `abbonamentoAttivo = false`:
- Tutte le operazioni sono bloccate (tranne ELITE)
- L'API restituisce: `SUBSCRIPTION_EXPIRED`

---

## 👑 Super Admin

### Cosa Può Fare

1. **Vedere tutte le aziende** (bypassa isolamento multi-tenant)
2. **Modificare piani abbonamento** di qualsiasi azienda
3. **Attivare/disattivare abbonamenti**
4. **Vedere statistiche globali** del sistema
5. **Creare altri super admin**
6. **Gestire utenti** di qualsiasi azienda

### Creare il Primo Super Admin

#### Opzione 1: Via API (dopo deploy)

```bash
curl -X POST https://YOUR_API/admin/super-admins \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Admin",
    "cognome": "Sistema",
    "email": "admin@idrodesk.com",
    "password": "password-sicura"
  }'
```

**Nota**: La prima volta, devi creare il super admin direttamente nel database o tramite script.

#### Opzione 2: Script Node.js

Crea un file `create-super-admin.js`:

```javascript
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@idrodesk.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.log('Super admin già esistente');
    return;
  }

  const superAdmin = await prisma.user.create({
    data: {
      nome: 'Super',
      cognome: 'Admin',
      email,
      passwordHash: await bcrypt.hash(password, 10),
      ruolo: 'OWNER',
      isSuperAdmin: true,
      companyId: null,
    },
  });

  console.log('Super admin creato:', superAdmin.email);
}

createSuperAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Esegui:
```bash
cd backend
node create-super-admin.js
```

#### Opzione 3: Prisma Studio

1. Apri Prisma Studio: `npx prisma studio`
2. Vai su `User`
3. Crea nuovo utente con:
   - `isSuperAdmin: true`
   - `companyId: null`
   - `passwordHash`: hash della password (usa bcrypt)

### Login Super Admin

1. Vai su `/admin/login`
2. Usa email e password del super admin
3. Accedi al pannello admin

---

## 📊 API Admin

### Endpoints Disponibili

#### Companies
- `GET /api/admin/companies` - Lista tutte le aziende
- `GET /api/admin/companies/:id` - Dettaglio azienda
- `PATCH /api/admin/companies/:id/plan` - Modifica piano
- `PATCH /api/admin/companies/:id/subscription` - Attiva/disattiva abbonamento

#### Statistics
- `GET /api/admin/stats` - Statistiche globali sistema

#### Super Admins
- `GET /api/admin/super-admins` - Lista super admin
- `POST /api/admin/super-admins` - Crea super admin

#### Auth
- `POST /api/admin/login` - Login super admin

---

## 🔧 Configurazione Limiti

I limiti sono configurati in `backend/src/config/planLimits.ts`:

```typescript
export const PLAN_LIMITS: Record<string, PlanLimits> = {
  BASIC: {
    maxUsers: 3,
    maxClients: 50,
    // ...
  },
  // ...
};
```

Per modificare i limiti:
1. Modifica `planLimits.ts`
2. Riavvia il backend
3. I nuovi limiti si applicano immediatamente

---

## 🚀 Workflow Tipico

### 1. Nuova Azienda si Registra
- Crea account → diventa OWNER
- Piano: BASIC (default)
- Abbonamento: Attivo (default)

### 2. Azienda Usa il Sistema
- Crea clienti, preventivi, lavori
- I limiti vengono verificati automaticamente
- Se raggiunge un limite, riceve errore con suggerimento di upgrade

### 3. Super Admin Gestisce
- Vede tutte le aziende nel pannello
- Può cambiare piano manualmente
- Può attivare/disattivare abbonamenti
- Vede statistiche di utilizzo

### 4. Upgrade Piano
- Super admin cambia piano da BASIC a PRO
- Storico salvato in `SubscriptionHistory`
- Limiti aggiornati immediatamente

---

## 📝 Note Importanti

1. **Super Admin Bypassa Tutto**:
   - Non ha `companyId` (è `null`)
   - Bypassa middleware `checkPlanLimits`
   - Può vedere tutte le aziende

2. **Isolamento Garantito**:
   - Utenti normali non possono vedere dati di altre aziende
   - Anche se provano a passare ID di altre aziende, il filtro li blocca

3. **Limiti Mensili**:
   - Lavori e preventivi si resettano ogni mese
   - Il conteggio parte dal primo del mese

4. **Storage**:
   - Per ora non implementato
   - Il middleware `checkPlanLimits('storage')` bypassa sempre
   - Da implementare in futuro

---

## 🐛 Troubleshooting

### Super admin non può accedere
- Verifica che `isSuperAdmin = true` nel database
- Verifica che `companyId = null`
- Controlla password hash

### Limiti non funzionano
- Verifica che il middleware `checkPlanLimits` sia applicato alle route
- Controlla che `req.companyId` sia presente
- Verifica configurazione in `planLimits.ts`

### Azienda non vede i suoi dati
- Verifica che `companyId` sia nel JWT token
- Controlla che il middleware `authenticate` sia applicato
- Verifica che le query filtrano per `companyId`

---

## 🔐 Sicurezza

- ✅ Super admin richiede autenticazione JWT
- ✅ Middleware `requireSuperAdmin` verifica permessi
- ✅ Limiti applicati automaticamente
- ✅ Isolamento dati garantito a livello database
- ✅ Storico modifiche abbonamenti tracciato

---

## 📚 Prossimi Sviluppi

- [ ] Integrazione Stripe per pagamenti
- [ ] Webhook per aggiornare piani automaticamente
- [ ] Calcolo storage reale
- [ ] Notifiche scadenza abbonamenti
- [ ] Dashboard analytics avanzate
- [ ] Export dati per aziende


