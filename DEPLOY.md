# 🚀 Guida al Deploy - Railway + Netlify

## 📋 Prerequisiti

- Account Railway: https://railway.app
- Account Netlify: https://netlify.com
- Repository GitHub collegato

---

## 🔧 Backend su Railway

### 1. Crea nuovo progetto su Railway

1. Vai su https://railway.app
2. Clicca "New Project"
3. Seleziona "Deploy from GitHub repo"
4. Scegli il repository `idrodesk`

### 2. Aggiungi PostgreSQL Database

1. Nel progetto Railway, clicca "+ New"
2. Seleziona "Database" → "Add PostgreSQL"
3. Railway creerà automaticamente un database PostgreSQL

### 3. Configura il servizio Backend

1. Railway dovrebbe aver rilevato automaticamente il Dockerfile
2. Se non lo ha fatto:
   - Clicca sul servizio
   - Vai su "Settings"
   - Imposta "Root Directory" a `backend`

### 4. Configura le Variabili d'Ambiente

Nel servizio backend, vai su "Variables" e aggiungi:

```env
# Database (Railway genera automaticamente questa variabile)
# DATABASE_URL viene creata automaticamente quando aggiungi PostgreSQL
# Se non c'è, copiala dal servizio PostgreSQL → "Connect" → "Private Network"

# JWT
JWT_SECRET=genera-una-chiave-segreta-lunga-e-casuale
JWT_REFRESH_SECRET=genera-un-altra-chiave-segreta-diversa
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=production

# File Upload
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760

# CORS (sostituisci con l'URL Netlify dopo il deploy)
CORS_ORIGIN=https://your-app.netlify.app
```

**Genera chiavi JWT sicure:**
```bash
# Su Mac/Linux
openssl rand -hex 32

# Oppure usa un generatore online
```

### 5. Configura il Port

1. Vai su "Settings" del servizio backend
2. Imposta "Port" a `3001` (o quello che preferisci)
3. Abilita "Public Domain" per ottenere un URL pubblico

### 6. Esegui le Migrazioni

1. Vai su "Deployments"
2. Clicca sul deployment più recente
3. Apri "View Logs"
4. Verifica che le migrazioni Prisma siano state eseguite

**Se le migrazioni non partono automaticamente**, aggiungi questo script nel `package.json` del backend:

```json
"scripts": {
  "postinstall": "prisma generate",
  "migrate": "prisma migrate deploy"
}
```

E modifica il Dockerfile per eseguire le migrazioni:

```dockerfile
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
```

### 7. Ottieni l'URL del Backend

1. Vai su "Settings" → "Networking"
2. Clicca "Generate Domain"
3. Copia l'URL (es: `https://idrodesk-production.up.railway.app`)

---

## 🎨 Frontend su Netlify

### 1. Crea nuovo sito su Netlify

1. Vai su https://app.netlify.com
2. Clicca "Add new site" → "Import an existing project"
3. Connetti GitHub e seleziona il repository `idrodesk`

### 2. Configura Build Settings

**Base directory:** `frontend`

**Build command:**
```bash
npm install && npm run build
```

**Publish directory:**
```
.next
```

**IMPORTANTE**: Next.js su Netlify richiede il plugin `@netlify/plugin-nextjs`

### 3. Installa Netlify Next.js Plugin

Crea/modifica `netlify.toml` nella root del progetto:

```toml
[build]
  command = "cd frontend && npm install && npm run build"
  publish = "frontend/.next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "18"
  NEXT_TELEMETRY_DISABLED = "1"
```

### 4. Configura Variabili d'Ambiente

In Netlify, vai su "Site settings" → "Environment variables" e aggiungi:

```env
NEXT_PUBLIC_API_URL=https://YOUR_RAILWAY_APP.railway.app/api
```

**Sostituisci** `YOUR_RAILWAY_APP` con l'URL del tuo backend Railway.

### 5. Configura Redirects per API

Netlify deve inoltrare le chiamate API al backend. Aggiungi in `netlify.toml`:

```toml
[[redirects]]
  from = "/api/*"
  to = "https://YOUR_RAILWAY_APP.railway.app/api/:splat"
  status = 200
  force = true
```

### 6. Deploy

1. Netlify dovrebbe fare il deploy automaticamente
2. Vai su "Deploys" per vedere lo stato
3. Una volta completato, ottieni l'URL del sito (es: `https://idrodesk.netlify.app`)

---

## 🔄 Aggiorna CORS dopo il Deploy

Dopo aver ottenuto l'URL Netlify:

1. Vai su Railway → Backend → Variables
2. Aggiorna `CORS_ORIGIN` con l'URL Netlify:
   ```
   CORS_ORIGIN=https://idrodesk.netlify.app
   ```
3. Riavvia il servizio backend

---

## 📝 Checklist Post-Deploy

- [ ] Backend Railway è online e risponde a `/health`
- [ ] Database PostgreSQL è connesso
- [ ] Migrazioni Prisma eseguite
- [ ] Frontend Netlify è online
- [ ] Variabile `NEXT_PUBLIC_API_URL` configurata correttamente
- [ ] CORS configurato con URL Netlify
- [ ] Test di login/registrazione funzionano

---

## 🐛 Troubleshooting

### Backend non si connette al database

- Verifica che `DATABASE_URL` sia configurata correttamente
- Controlla che il database sia nella stessa "Private Network" del backend
- Verifica i log Railway per errori di connessione

### Frontend non chiama il backend

- Verifica `NEXT_PUBLIC_API_URL` in Netlify
- Controlla la console del browser per errori CORS
- Verifica che `CORS_ORIGIN` in Railway corrisponda all'URL Netlify

### Build fallisce su Netlify

- Verifica che `base directory` sia `frontend`
- Controlla che `@netlify/plugin-nextjs` sia installato
- Vedi i log di build in Netlify per dettagli

### Prisma non trova OpenSSL

- Verifica che il Dockerfile usi `node:18-slim` (Debian)
- Controlla che OpenSSL sia installato nel Dockerfile

---

## 🔐 Sicurezza

- ✅ Non committare mai file `.env` nel repository
- ✅ Usa variabili d'ambiente per tutti i secret
- ✅ Genera chiavi JWT sicure e uniche
- ✅ Abilita HTTPS (automatico su Railway e Netlify)

---

## 📚 Risorse

- Railway Docs: https://docs.railway.app
- Netlify Docs: https://docs.netlify.com
- Next.js Deploy: https://nextjs.org/docs/deployment


