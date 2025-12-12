# 🔧 Troubleshooting - Errore 502

## Problema: "Application failed to respond"

Questo errore significa che il backend Railway non sta rispondendo. Ecco come risolvere:

---

## ✅ Step 1: Verifica Stato Backend su Railway

1. Vai su https://railway.app
2. Apri il tuo progetto
3. Controlla il servizio backend:
   - Dovrebbe essere **"Active"** (verde)
   - Se è **"Inactive"** o **"Error"**, c'è un problema

---

## ✅ Step 2: Controlla i Log Railway

1. Railway → Backend → "Deployments"
2. Clicca sul deployment più recente
3. Clicca "View Logs"
4. Cerca errori in rosso

### Errori Comuni:

#### ❌ "Prisma Client initialization error"
**Causa**: Database non connesso o `DATABASE_URL` mancante
**Soluzione**: 
- Verifica che PostgreSQL sia aggiunto
- Controlla che `DATABASE_URL` sia presente nelle variabili

#### ❌ "JWT_SECRET is required"
**Causa**: Variabile `JWT_SECRET` mancante
**Soluzione**: Aggiungi `JWT_SECRET` nelle variabili d'ambiente

#### ❌ "Port already in use" o "EADDRINUSE"
**Causa**: Porta già in uso
**Soluzione**: Verifica che `PORT=3001` sia configurato

#### ❌ "Cannot find module" o errori di import
**Causa**: Build fallita o dipendenze mancanti
**Soluzione**: 
- Controlla che il build sia completato
- Verifica che tutte le dipendenze siano installate

---

## ✅ Step 3: Verifica Variabili d'Ambiente

Railway → Backend → "Variables"

**Variabili Obbligatorie:**
- ✅ `JWT_SECRET` (deve essere presente)
- ✅ `DATABASE_URL` (creata automaticamente da PostgreSQL)
- ✅ `PORT=3001`
- ✅ `NODE_ENV=production`

**Se manca `JWT_SECRET`:**
1. Genera una chiave: `openssl rand -hex 32`
2. Aggiungila come variabile `JWT_SECRET`

---

## ✅ Step 4: Verifica Database

1. Railway → PostgreSQL → "Connect"
2. Copia la connection string
3. Verifica che `DATABASE_URL` nel backend sia corretta

---

## ✅ Step 5: Riavvia il Servizio

1. Railway → Backend → "Settings"
2. Scrolla fino a "Danger Zone"
3. Clicca "Restart"
4. Attendi che riparta
5. Controlla i log per verificare che sia partito correttamente

---

## ✅ Step 6: Test Health Endpoint

Dopo il riavvio, testa:
```bash
curl https://idrodesk-production.up.railway.app/health
```

Dovresti vedere:
```json
{"status":"ok","timestamp":"..."}
```

Se funziona, il backend è online!

---

## 🎯 Creare Super Admin (Alternative)

Se il backend non risponde ancora, puoi creare il super admin direttamente nel database:

### Opzione A: Via Prisma Studio (Locale)

1. Connetti il database locale al database Railway:
   ```bash
   cd backend
   # Aggiungi DATABASE_URL nel .env con la connection string di Railway
   npx prisma studio
   ```
2. Vai su "User"
3. Crea nuovo utente con:
   - `email`: hellonomoslab@gmail.com
   - `nome`: Alessandro
   - `cognome`: Terazzan
   - `passwordHash`: (usa bcrypt per hashare "Atdrums.1200!")
   - `ruolo`: OWNER
   - `isSuperAdmin`: true
   - `companyId`: null
   - `attivo`: true

### Opzione B: Via SQL Diretto

1. Railway → PostgreSQL → "Connect" → "Query"
2. Esegui (sostituisci il passwordHash con quello generato):
```sql
INSERT INTO users (id, "companyId", nome, cognome, email, ruolo, "passwordHash", attivo, "isSuperAdmin", "createdAt")
VALUES (
  'clx1234567890', -- genera un ID univoco
  NULL,
  'Alessandro',
  'Terazzan',
  'hellonomoslab@gmail.com',
  'OWNER',
  '$2a$10$...', -- hash bcrypt della password
  true,
  true,
  NOW()
);
```

**Per generare passwordHash:**
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Atdrums.1200!', 10).then(h => console.log(h))"
```

### Opzione C: Via Terminale Railway

1. Railway → Backend → "Deployments"
2. Tre puntini → "Open in Terminal"
3. Esegui:
```bash
npm run create-admin
```

Oppure:
```bash
ADMIN_EMAIL=hellonomoslab@gmail.com ADMIN_PASSWORD="Atdrums.1200!" ADMIN_NOME="Alessandro" ADMIN_COGNOME="Terazzan" npm run create-admin
```

---

## 📋 Checklist Debug

- [ ] Backend è "Active" su Railway?
- [ ] Log Railway mostrano errori?
- [ ] `JWT_SECRET` è configurato?
- [ ] `DATABASE_URL` è presente?
- [ ] PostgreSQL è connesso?
- [ ] Health endpoint risponde?
- [ ] Servizio è stato riavviato?

---

## 🆘 Se Nulla Funziona

1. **Controlla i log Railway** - Spesso l'errore è chiaro nei log
2. **Verifica il Dockerfile** - Assicurati che sia corretto
3. **Controlla le variabili** - Tutte devono essere presenti
4. **Riavvia il servizio** - A volte risolve problemi temporanei

---

## 💡 Pro Tip

Il modo più semplice per creare il super admin è:
1. Assicurati che il backend sia online (health endpoint funziona)
2. Usa il terminale Railway per eseguire lo script
3. Non serve configurare nulla, funziona direttamente

