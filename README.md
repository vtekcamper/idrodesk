# IdroDesk

Gestionale SaaS per idraulici italiani - MVP Production-Ready

## 🎯 Caratteristiche

- ✅ Multi-tenant (multi-azienda)
- ✅ Multi-utente con ruoli (Owner, Tecnico, Backoffice)
- ✅ Gestione clienti e cantieri
- ✅ Preventivi con righe editabili
- ✅ Conversione preventivo → lavoro
- ✅ Gestione lavori con stati
- ✅ Checklist personalizzabili
- ✅ Materiali usati per lavoro
- ✅ Upload foto/documenti
- ✅ Generazione PDF rapportino
- ✅ PWA installabile
- ✅ Mobile-first responsive

## 🛠 Stack Tecnologico

- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Frontend**: Next.js 14+ (App Router) + TypeScript + Tailwind CSS
- **PWA**: Service Worker + Manifest
- **Deploy**: Docker Compose ready

## 📁 Struttura Progetto

```
IdroDesk/
├── backend/          # API Express
│   ├── src/
│   │   ├── config/      # Database, configurazioni
│   │   ├── controllers/ # Business logic
│   │   ├── middleware/   # Auth, error handling
│   │   ├── routes/       # Route handlers
│   │   └── utils/       # Utilities
│   ├── prisma/          # Schema e migrazioni
│   └── uploads/         # File upload (locale)
├── frontend/         # Next.js app
│   ├── src/
│   │   ├── app/         # Pages (App Router)
│   │   ├── components/  # Componenti React
│   │   └── lib/         # API client, utilities
│   └── public/          # Static assets, PWA
└── docker-compose.yml
```

## 🚀 Setup Locale

### Prerequisiti
- Node.js 18+
- PostgreSQL 14+ (o Docker)
- npm o yarn

### 1. Backend

```bash
cd backend
npm install

# Crea file .env
cp .env.example .env
# Modifica .env con:
# - DATABASE_URL (es: postgresql://user:pass@localhost:5432/idrodesk)
# - JWT_SECRET e JWT_REFRESH_SECRET (genera stringhe casuali)
# - PORT (default: 3001)

# Setup database
npx prisma migrate dev
npx prisma generate

# Avvia server
npm run dev
```

Il backend sarà disponibile su `http://localhost:3001`

### 2. Frontend

```bash
cd frontend
npm install

# Crea file .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api" > .env.local

# Avvia dev server
npm run dev
```

Il frontend sarà disponibile su `http://localhost:3000`

### 3. Docker (Alternativa)

```bash
# Avvia tutto con Docker
docker-compose up -d

# Backend: http://localhost:3001
# Frontend: http://localhost:3000
# PostgreSQL: localhost:5432
```

## 📝 Variabili d'Ambiente

### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/idrodesk"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
CORS_ORIGIN="http://localhost:3000"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 🔐 Autenticazione

1. **Registrazione**: Crea una nuova azienda con utente Owner
2. **Login**: Email + Password
3. **Token**: JWT con refresh token
4. **Multi-tenant**: Ogni richiesta filtra automaticamente per `companyId`

## 📱 PWA

L'app è installabile come PWA:
- **Manifest**: `/public/manifest.json`
- **Service Worker**: `/public/sw.js`
- **Offline**: Pagina offline disponibile

Per testare:
1. Apri Chrome DevTools → Application → Service Workers
2. Verifica che il service worker sia registrato
3. Vai su "Add to Home Screen" per installare

## 🗄 Database

### Prisma Commands

```bash
# Genera Prisma Client
npx prisma generate

# Crea nuova migrazione
npx prisma migrate dev --name nome_migrazione

# Applica migrazioni (produzione)
npx prisma migrate deploy

# Apri Prisma Studio (GUI)
npx prisma studio
```

## 📦 API Endpoints

### Auth
- `POST /api/auth/register-company` - Registra azienda
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token

### Clients
- `GET /api/clients` - Lista clienti
- `GET /api/clients/:id` - Dettaglio cliente
- `POST /api/clients` - Crea cliente
- `PATCH /api/clients/:id` - Aggiorna cliente

### Quotes
- `GET /api/quotes` - Lista preventivi
- `GET /api/quotes/:id` - Dettaglio preventivo
- `POST /api/quotes` - Crea preventivo
- `PATCH /api/quotes/:id` - Aggiorna preventivo
- `POST /api/quotes/:id/duplicate` - Duplica preventivo
- `POST /api/quotes/:id/to-job` - Converti in lavoro

### Jobs
- `GET /api/jobs` - Lista lavori
- `GET /api/jobs/:id` - Dettaglio lavoro
- `POST /api/jobs` - Crea lavoro
- `PATCH /api/jobs/:id` - Aggiorna lavoro
- `POST /api/jobs/:id/materials` - Aggiungi materiale
- `POST /api/jobs/:id/attachments` - Upload file
- `GET /api/jobs/:id/report-pdf` - Genera PDF

### Materials
- `GET /api/materials` - Lista materiali
- `POST /api/materials` - Crea materiale
- `PATCH /api/materials/:id` - Aggiorna materiale

### Checklists
- `GET /api/checklists` - Lista checklist
- `GET /api/checklists/:id` - Dettaglio checklist
- `POST /api/checklists` - Crea checklist

## 🚢 Deploy

### Railway / Render / VPS

1. **Backend**:
   - Imposta variabili d'ambiente
   - Esegui `npx prisma migrate deploy`
   - Avvia con `npm start`

2. **Frontend**:
   - Build: `npm run build`
   - Start: `npm start`
   - Imposta `NEXT_PUBLIC_API_URL` con URL backend

3. **Database**:
   - PostgreSQL su Railway/Render o VPS
   - Aggiorna `DATABASE_URL` nel backend

### Docker

```bash
# Build e avvia
docker-compose up -d

# Logs
docker-compose logs -f

# Stop
docker-compose down
```

## 🔧 Sviluppo

### Script Utili

**Backend**:
- `npm run dev` - Dev server con hot reload
- `npm run build` - Build produzione
- `npm start` - Avvia produzione
- `npm run prisma:studio` - Apri Prisma Studio

**Frontend**:
- `npm run dev` - Dev server
- `npm run build` - Build produzione
- `npm start` - Avvia produzione

## 📄 Licenza

Proprietario - NOMOS LAB

## 🐛 Troubleshooting

### Database connection error
- Verifica che PostgreSQL sia in esecuzione
- Controlla `DATABASE_URL` nel `.env`
- Esegui `npx prisma migrate dev`

### CORS errors
- Verifica `CORS_ORIGIN` nel backend
- Assicurati che corrisponda all'URL del frontend

### PWA non funziona
- Verifica che il service worker sia registrato
- Controlla console browser per errori
- Assicurati che l'app sia servita via HTTPS (in produzione)

