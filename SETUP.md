# 🚀 Quick Start - IdroDesk

## Setup Rapido

### 1. Database PostgreSQL

Assicurati di avere PostgreSQL in esecuzione:

```bash
# Con Docker
docker run -d --name postgres-idrodesk \
  -e POSTGRES_USER=idrodesk \
  -e POSTGRES_PASSWORD=idrodesk_password \
  -e POSTGRES_DB=idrodesk \
  -p 5432:5432 \
  postgres:15-alpine

# Oppure usa un'istanza esistente
```

### 2. Backend

```bash
cd backend

# Installa dipendenze
npm install

# Crea .env
cat > .env << EOF
DATABASE_URL="postgresql://idrodesk:idrodesk_password@localhost:5432/idrodesk?schema=public"
JWT_SECRET="super-secret-key-change-in-production-$(openssl rand -hex 32)"
JWT_REFRESH_SECRET="super-refresh-secret-$(openssl rand -hex 32)"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
CORS_ORIGIN="http://localhost:3000"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760
EOF

# Setup database
npx prisma migrate dev
npx prisma generate

# Avvia
npm run dev
```

### 3. Frontend

```bash
cd frontend

# Installa dipendenze
npm install

# Crea .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local

# Avvia
npm run dev
```

### 4. Primo Accesso

1. Vai su http://localhost:3000
2. Clicca su "Registrati"
3. Compila il form di registrazione azienda
4. Accedi con le credenziali create

## 🎯 Funzionalità Implementate

### ✅ Completate
- [x] Autenticazione (registrazione, login, JWT)
- [x] Multi-tenant (filtro automatico per company)
- [x] Gestione clienti
- [x] Gestione preventivi (crea, modifica, duplica, converti in lavoro)
- [x] Gestione lavori (crea, modifica, cambia stato)
- [x] Materiali usati per lavoro
- [x] Checklist (crea, associa a lavoro, compila)
- [x] Upload file (foto/documenti)
- [x] Generazione PDF rapportino
- [x] Dashboard con statistiche
- [x] PWA (manifest, service worker)
- [x] Responsive mobile-first

### 🔄 Da Implementare (fuori MVP)
- [ ] Form creazione/modifica cliente
- [ ] Form creazione/modifica preventivo
- [ ] Form creazione/modifica lavoro
- [ ] Form creazione/modifica materiale
- [ ] Form creazione/modifica checklist
- [ ] Form creazione/modifica utente
- [ ] Upload multipli file
- [ ] Anteprima PDF
- [ ] Notifiche push
- [ ] Export dati

## 📝 Note

- Le icone PWA devono essere aggiunte in `/frontend/public/icons/`
- Il service worker è configurato per caching base
- I file upload sono salvati localmente in `/backend/uploads/`
- Per produzione, configurare S3 o storage cloud

## 🐛 Troubleshooting

**Errore connessione database:**
```bash
# Verifica che PostgreSQL sia in esecuzione
psql -U idrodesk -d idrodesk -c "SELECT 1;"
```

**Errore Prisma:**
```bash
cd backend
npx prisma generate
npx prisma migrate reset  # ATTENZIONE: cancella tutti i dati
```

**CORS errors:**
- Verifica che `CORS_ORIGIN` nel backend corrisponda all'URL del frontend
- In sviluppo: `http://localhost:3000`

## 📚 Prossimi Passi

1. Aggiungi le icone PWA
2. Implementa i form mancanti
3. Aggiungi validazione lato client (Zod + React Hook Form)
4. Configura CI/CD
5. Deploy su Railway/Render/VPS

