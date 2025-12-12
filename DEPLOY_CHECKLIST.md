# ✅ Checklist Post-Deploy

## 🔧 Railway (Backend)

### Variabili d'Ambiente da Configurare:

1. Vai su Railway → Il tuo servizio backend → "Variables"
2. Aggiungi queste variabili (se non ci sono già):

```env
JWT_SECRET=<genera-con-openssl-rand-hex-32>
JWT_REFRESH_SECRET=<genera-un-altra-chiave-diversa>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=3001
NODE_ENV=production
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760
CORS_ORIGIN=https://YOUR_NETLIFY_APP.netlify.app
```

**Nota**: `DATABASE_URL` viene creata automaticamente quando aggiungi PostgreSQL.

### Genera chiavi JWT sicure:
```bash
openssl rand -hex 32
```
Esegui due volte per avere due chiavi diverse.

### Aggiungi Database PostgreSQL:
1. Nel progetto Railway, clicca "+ New"
2. Seleziona "Database" → "Add PostgreSQL"
3. Railway creerà automaticamente il database

### Ottieni URL Backend:
1. Vai su "Settings" → "Networking"
2. Clicca "Generate Domain"
3. Copia l'URL (es: `https://idrodesk-production.up.railway.app`)

---

## 🎨 Netlify (Frontend)

### Variabile d'Ambiente:

1. Vai su Netlify → Il tuo sito → "Site settings" → "Environment variables"
2. Aggiungi:

```env
NEXT_PUBLIC_API_URL=https://YOUR_RAILWAY_APP.railway.app/api
```

**Sostituisci** `YOUR_RAILWAY_APP` con l'URL reale del tuo backend Railway.

### Aggiorna Redirect API:

1. Vai su GitHub e modifica `netlify.toml`
2. Sostituisci `YOUR_RAILWAY_APP` con l'URL Railway reale
3. Commit e push

Oppure puoi farlo direttamente qui:

---

## 🔄 Aggiorna CORS in Railway

Dopo aver ottenuto l'URL Netlify:

1. Vai su Railway → Backend → "Variables"
2. Aggiorna `CORS_ORIGIN` con l'URL Netlify completo:
   ```
   CORS_ORIGIN=https://your-app-name.netlify.app
   ```
3. Riavvia il servizio (Railway lo farà automaticamente)

---

## 🧪 Test Finale

1. **Test Backend:**
   - Vai su `https://YOUR_RAILWAY_APP.railway.app/health`
   - Dovresti vedere: `{"status":"ok","timestamp":"..."}`

2. **Test Frontend:**
   - Vai sul sito Netlify
   - Prova a registrare una nuova azienda
   - Verifica che il login funzioni

3. **Test API:**
   - Apri la console del browser (F12)
   - Verifica che non ci siano errori CORS
   - Controlla che le chiamate API vadano al backend Railway

---

## 🐛 Troubleshooting

### Errore CORS
- Verifica che `CORS_ORIGIN` in Railway corrisponda esattamente all'URL Netlify
- Assicurati che non ci siano spazi o trailing slash

### Errore 401 (Non autorizzato)
- Verifica che `JWT_SECRET` sia configurato in Railway
- Controlla che il token venga inviato correttamente nelle richieste

### Database non connesso
- Verifica che PostgreSQL sia aggiunto al progetto Railway
- Controlla che `DATABASE_URL` sia presente nelle variabili d'ambiente
- Vedi i log Railway per errori di connessione

### Frontend non chiama il backend
- Verifica `NEXT_PUBLIC_API_URL` in Netlify
- Controlla la console del browser per errori
- Verifica che il redirect API in `netlify.toml` sia corretto

