# 🚀 Setup Immediato - Cosa Fare Ora

## ✅ Step 1: Configura Variabili d'Ambiente su Railway

1. Vai su https://railway.app
2. Apri il tuo progetto backend
3. Clicca su "Variables" (o "Settings" → "Variables")
4. Aggiungi queste variabili:

### Variabili Obbligatorie:

```env
JWT_SECRET=<genera-con-openssl-rand-hex-32>
JWT_REFRESH_SECRET=<genera-un-altra-chiave-diversa>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://YOUR_NETLIFY_APP.netlify.app
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760
```

### Come Generare le Chiavi JWT:

Apri il terminale e esegui:
```bash
openssl rand -hex 32
```

Esegui due volte per avere due chiavi diverse (una per JWT_SECRET, una per JWT_REFRESH_SECRET).

**Nota**: `DATABASE_URL` viene creata automaticamente da Railway quando aggiungi PostgreSQL.

---

## ✅ Step 2: Aggiungi Database PostgreSQL su Railway

1. Nel progetto Railway, clicca "+ New"
2. Seleziona "Database" → "Add PostgreSQL"
3. Railway creerà automaticamente:
   - Il database PostgreSQL
   - La variabile `DATABASE_URL` nel servizio backend

---

## ✅ Step 3: Esegui Migrazioni Database

Le migrazioni dovrebbero partire automaticamente all'avvio (grazie al Dockerfile), ma puoi verificare:

1. Vai su Railway → Il tuo servizio backend
2. Clicca su "Deployments"
3. Apri il deployment più recente
4. Clicca "View Logs"
5. Cerca messaggi come:
   - "Prisma Migrate"
   - "Applied migration"
   - "All migrations have been applied"

Se non vedi questi messaggi, puoi eseguire manualmente:

**Opzione A: Via Railway CLI** (se installato)
```bash
railway run npx prisma migrate deploy
```

**Opzione B: Via Terminale Railway**
1. Railway → Backend → "Deployments"
2. Clicca sui tre puntini del deployment
3. "Open in Terminal"
4. Esegui: `npx prisma migrate deploy`

---

## ✅ Step 4: Crea il Primo Super Admin

### Opzione A: Via Script (Consigliato)

1. Vai su Railway → Backend → "Deployments"
2. Clicca sui tre puntini → "Open in Terminal"
3. Esegui:
```bash
npm run create-admin
```

Oppure con credenziali personalizzate:
```bash
ADMIN_EMAIL=admin@idrodesk.com ADMIN_PASSWORD=password123 npm run create-admin
```

### Opzione B: Via API (dopo che il backend è online)

```bash
curl -X POST https://YOUR_RAILWAY_APP.railway.app/api/admin/super-admins \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Admin",
    "cognome": "Sistema",
    "email": "admin@idrodesk.com",
    "password": "password-sicura"
  }'
```

---

## ✅ Step 5: Ottieni URL Backend Railway

1. Railway → Backend → "Settings"
2. Vai su "Networking"
3. Clicca "Generate Domain"
4. Copia l'URL (es: `https://idrodesk-production.up.railway.app`)

---

## ✅ Step 6: Configura Frontend su Netlify

1. Vai su https://app.netlify.com
2. Apri il tuo sito
3. Vai su "Site settings" → "Environment variables"
4. Aggiungi:

```env
NEXT_PUBLIC_API_URL=https://YOUR_RAILWAY_APP.railway.app/api
```

**Sostituisci** `YOUR_RAILWAY_APP` con l'URL reale del tuo backend Railway.

5. Trigger un nuovo deploy:
   - Vai su "Deploys"
   - Clicca "Trigger deploy" → "Deploy site"

---

## ✅ Step 7: Aggiorna CORS in Railway

Dopo aver ottenuto l'URL Netlify:

1. Railway → Backend → "Variables"
2. Aggiorna `CORS_ORIGIN` con l'URL Netlify completo:
   ```
   CORS_ORIGIN=https://your-app-name.netlify.app
   ```
3. Railway riavvierà automaticamente il servizio

---

## ✅ Step 8: Aggiorna Redirect API in Netlify

1. Vai su GitHub e modifica `netlify.toml`
2. Sostituisci `YOUR_RAILWAY_APP` con l'URL Railway reale:
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "https://YOUR_RAILWAY_APP.railway.app/api/:splat"
     status = 200
     force = true
   ```
3. Commit e push
4. Netlify farà il deploy automaticamente

---

## ✅ Step 9: Test Finale

### Test Backend:
1. Vai su `https://YOUR_RAILWAY_APP.railway.app/health`
2. Dovresti vedere: `{"status":"ok","timestamp":"..."}`

### Test Frontend:
1. Vai sul sito Netlify
2. Prova a registrare una nuova azienda
3. Verifica che il login funzioni

### Test Admin:
1. Vai su `https://YOUR_NETLIFY_APP.netlify.app/admin/login`
2. Accedi con le credenziali del super admin
3. Verifica che la dashboard admin funzioni

---

## 📋 Checklist Rapida

- [ ] Variabili d'ambiente configurate su Railway
- [ ] Database PostgreSQL aggiunto su Railway
- [ ] Migrazioni Prisma eseguite (controlla i log)
- [ ] Primo super admin creato
- [ ] URL backend Railway copiato
- [ ] `NEXT_PUBLIC_API_URL` configurata su Netlify
- [ ] `CORS_ORIGIN` aggiornato in Railway con URL Netlify
- [ ] Redirect API aggiornato in `netlify.toml`
- [ ] Test `/health` funziona
- [ ] Test registrazione/login funziona
- [ ] Test admin login funziona

---

## 🆘 Problemi Comuni

### Backend non risponde
- Verifica che tutte le variabili d'ambiente siano configurate
- Controlla i log Railway per errori
- Verifica che PostgreSQL sia connesso

### Frontend non chiama il backend
- Verifica `NEXT_PUBLIC_API_URL` in Netlify
- Controlla la console del browser per errori CORS
- Verifica che il redirect API in `netlify.toml` sia corretto

### Errore CORS
- Verifica che `CORS_ORIGIN` in Railway corrisponda esattamente all'URL Netlify
- Assicurati che non ci siano spazi o trailing slash

### Super admin non può accedere
- Verifica che il super admin sia stato creato correttamente
- Controlla che `isSuperAdmin = true` nel database
- Verifica le credenziali

---

## 🎯 Una Volta Completato

Dopo aver completato tutti gli step, avrai:
- ✅ Backend funzionante su Railway
- ✅ Frontend funzionante su Netlify
- ✅ Database PostgreSQL configurato
- ✅ Super admin creato e funzionante
- ✅ Sistema multi-tenant operativo
- ✅ Sistema abbonamenti attivo

Ora puoi iniziare a usare IdroDesk! 🎉

