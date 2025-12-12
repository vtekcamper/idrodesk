# Audit Tecnico Super Admin - IdroDesk SaaS

**Data Audit**: 2024-12-XX  
**Versione Applicazione**: 1.0.0  
**Stack**: Node.js + Express, Prisma + PostgreSQL, Next.js, Railway + Netlify

---

## 1. INVENTARIO REALE

### 1.1 Pagine UI Super Admin

#### ✅ Implementate e Funzionanti
- `/admin/login` - Login super admin
- `/admin/dashboard` - Dashboard con statistiche sistema
- `/admin/companies` - Lista aziende con filtri
- `/admin/companies/[id]` - Dettaglio azienda, gestione piano, storico abbonamenti
- `/admin/users` - Lista utenti globali con filtri
- `/admin/users/[id]` - Dettaglio utente
- `/admin/subscriptions` - Gestione abbonamenti
- `/admin/payments` - Lista pagamenti
- `/admin/reports` - Report avanzati
- `/admin/settings` - Impostazioni sistema (email, configurazione)

#### ⚠️ Parzialmente Implementate
- `/admin/payments` - UI presente ma manca integrazione completa Stripe checkout
- `/admin/reports` - Report base presenti, mancano grafici avanzati e export

#### ❌ Non Implementate
- Export dati (CSV/JSON/ZIP)
- Impersonation UI
- Audit log viewer
- Tenant Admin area completa

### 1.2 API Backend

#### ✅ Implementate e Funzionanti

**Autenticazione Super Admin:**
- `POST /api/admin/login` - Login super admin
- `GET /api/admin/super-admins/check` - Verifica esistenza super admin
- `POST /api/admin/super-admins` - Crea super admin (con protezione)

**Gestione Aziende:**
- `GET /api/admin/companies` - Lista aziende (con filtri)
- `GET /api/admin/companies/:id` - Dettaglio azienda
- `PATCH /api/admin/companies/:id/plan` - Aggiorna piano
- `PATCH /api/admin/companies/:id/subscription` - Toggle abbonamento

**Gestione Utenti Globali:**
- `GET /api/admin/users` - Lista utenti (con filtri)
- `GET /api/admin/users/:id` - Dettaglio utente
- `PATCH /api/admin/users/:id` - Aggiorna utente
- `PATCH /api/admin/users/:id/status` - Toggle stato utente

**Pagamenti:**
- `POST /api/admin/payments` - Crea pagamento (Stripe/PayPal/Manuale)
- `GET /api/admin/payments` - Lista pagamenti
- `GET /api/admin/payments/:id` - Dettaglio pagamento
- `POST /api/admin/payments/webhook/stripe` - Webhook Stripe

**Email:**
- `POST /api/admin/emails/send` - Invia email
- `GET /api/admin/emails` - Lista notifiche email

**Report:**
- `GET /api/admin/reports/advanced` - Report avanzati
- `GET /api/admin/reports/subscriptions/expiring` - Abbonamenti in scadenza
- `GET /api/admin/reports/companies/top` - Top aziende

**Statistiche:**
- `GET /api/admin/stats` - Statistiche sistema

#### ⚠️ Parzialmente Implementate
- Stripe webhook: verifica firma presente, ma manca:
  - Idempotency key tracking
  - Replay attack protection
  - Gestione eventi multipli (payment_intent.succeeded, subscription.*, etc.)
- Email: invio sincrono, manca:
  - Queue asincrona
  - Retry con backoff
  - Template engine (Handlebars/MJML)

#### ❌ Non Implementate
- `POST /api/admin/impersonate` - Impersonation
- `GET /api/admin/audit-logs` - Audit log
- `POST /api/admin/export` - Export dati tenant
- `DELETE /api/admin/companies/:id` - Soft delete tenant
- `POST /api/admin/companies/:id/restore` - Restore tenant
- Rate limiting middleware
- RBAC granulare (solo ruoli base)

### 1.3 Modelli Prisma

#### ✅ Implementati
- `Company` - Tenant principale
- `User` - Utenti (tenant + super admin)
- `Client`, `Site`, `Quote`, `Job`, `Material`, `Checklist` - Modelli business
- `SubscriptionHistory` - Storico cambi piano
- `Payment` - Pagamenti (Stripe/PayPal/Manuale)
- `EmailNotification` - Notifiche email

#### ⚠️ Parzialmente Implementati
- `Company.abbonamentoAttivo` - Solo boolean, manca stato machine completo
- `Payment` - Manca idempotency tracking per webhook

#### ❌ Non Implementati
- `AuditLog` - Audit log completo
- `Company.subscriptionStatus` - Enum stato (TRIAL, ACTIVE, PAST_DUE, SUSPENDED, CANCELED, DELETED)
- `StripeEvent` - Tracking eventi Stripe per idempotency

### 1.4 Middleware

#### ✅ Implementati
- `authenticate` - Verifica JWT, setta `req.user` e `req.companyId`
- `requireSuperAdmin` - Verifica isSuperAdmin
- `requireRole` - Verifica ruolo utente
- `checkPlanLimits` - Verifica limiti piano abbonamento
- `errorHandler` - Gestione errori centralizzata

#### ⚠️ Parzialmente Implementati
- `authenticate` - Non verifica scadenza token in modo robusto
- `requireRole` - Non supporta permessi granulari

#### ❌ Non Implementati
- `requireTenant` - Middleware esplicito per tenant isolation
- `rateLimit` - Rate limiting
- `auditLog` - Middleware per log automatico
- `validateRequest` - Validazione request centralizzata

### 1.5 Integrazione Stripe

#### ✅ Implementato
- Creazione PaymentIntent
- Webhook endpoint con verifica firma
- Aggiornamento stato pagamento su `payment_intent.succeeded`
- Rinnovo abbonamento automatico su pagamento completato

#### ⚠️ Parzialmente Implementato
- Webhook verifica firma ma manca:
  - Idempotency key tracking (event ID)
  - Replay attack protection
  - Gestione eventi multipli (subscription.*, customer.*, etc.)

#### ❌ Non Implementato
- Checkout session creation
- Subscription management (create, update, cancel)
- Invoice generation
- Refund handling

### 1.6 Sistema Email

#### ✅ Implementato
- Nodemailer configurato
- Invio email sincrono
- Tracking stato (PENDING, SENT, FAILED)
- Helper per email benvenuto e scadenza abbonamento

#### ⚠️ Parzialmente Implementato
- Invio sincrono (blocca request)
- Template HTML hardcoded (no template engine)

#### ❌ Non Implementato
- Queue asincrona (Bull/BullMQ)
- Retry con backoff esponenziale
- Template engine (Handlebars/MJML)
- Preview template
- Unsubscribe per email non transazionali
- Tracking apertura/click

### 1.7 Report e Analytics

#### ✅ Implementato
- Report avanzati (revenue, subscriptions, companies)
- Filtri base (data, piano, stato)
- Top companies per revenue

#### ⚠️ Parzialmente Implementato
- Query base funzionanti ma mancano:
  - Caching per performance
  - Paginazione per dataset grandi
  - Export CSV/JSON

#### ❌ Non Implementato
- Grafici interattivi (Chart.js/Recharts)
- Dashboard real-time
- Export report

### 1.8 Configurazione Deploy

#### ✅ Configurato
- Railway: backend + database PostgreSQL
- Netlify: frontend
- Dockerfile per backend
- Environment variables base (DATABASE_URL, JWT_SECRET, CORS_ORIGIN, PORT)
- Health check endpoint

#### ⚠️ Parzialmente Configurato
- CORS: configurato ma potrebbe essere più restrittivo
- PORT: gestito ma potrebbe essere più robusto

#### ❌ Non Configurato
- Rate limiting configurazione
- Logging centralizzato (Winston/Pino)
- Monitoring (Sentry/DataDog)
- Backup automatico database

---

## 2. VERIFICA FEATURE DICHIARATE

### 2.1 Dashboard Statistiche
**Status**: ✅ Funziona end-to-end
- UI: `/admin/dashboard` mostra statistiche
- API: `GET /api/admin/stats` restituisce dati corretti
- Database: Query Prisma funzionanti

### 2.2 Gestione Aziende
**Status**: ✅ Funziona end-to-end
- UI: Lista, dettaglio, filtri funzionanti
- API: CRUD completo implementato
- Database: Modello Company completo

**Gap**: Manca soft delete e restore

### 2.3 Gestione Utenti Globali
**Status**: ✅ Funziona end-to-end
- UI: Lista, dettaglio, filtri funzionanti
- API: CRUD completo implementato
- Database: Modello User completo

**Gap**: Manca reset password, export utenti

### 2.4 Gestione Abbonamenti
**Status**: ⚠️ Funziona parzialmente
- UI: Visualizzazione presente
- API: Toggle abbonamento funziona
- Database: SubscriptionHistory presente

**Gap**: 
- Manca stato machine completo (solo boolean)
- Manca gestione trial period
- Manca alert automatici scadenza

### 2.5 Gestione Pagamenti
**Status**: ⚠️ Funziona parzialmente
- UI: Lista pagamenti presente
- API: Creazione e lettura funzionano
- Database: Modello Payment completo
- Stripe: Webhook base funziona

**Gap**:
- Manca idempotency tracking
- Manca gestione refund
- Manca invoice generation
- Manca checkout session UI

### 2.6 Sistema Email SMTP + Template
**Status**: ⚠️ Funziona parzialmente
- SMTP: Configurato e funzionante
- Invio: Sincrono, funziona
- Tracking: Stato salvato in DB

**Gap**:
- Manca template engine
- Manca queue asincrona
- Manca retry logic
- Manca preview

### 2.7 Report e Analytics
**Status**: ⚠️ Funziona parzialmente
- Report base: Funzionanti
- Query: Ottimizzate per dataset piccoli

**Gap**:
- Manca caching
- Manca paginazione
- Manca export
- Manca grafici interattivi

### 2.8 Impostazioni Sistema
**Status**: ✅ Funziona end-to-end
- UI: Pagina impostazioni completa
- API: Endpoint email funzionanti
- Config: Visualizzazione configurazione

---

## 3. SECURITY REVIEW

### 3.1 Isolamento Tenant

#### ✅ Implementato Correttamente
- Controller tenant usano `req.companyId`:
  - `clientController.ts` ✅
  - `jobController.ts` ✅
  - `quoteController.ts` ✅
  - `materialController.ts` ✅
  - `checklistController.ts` ✅

#### ⚠️ Da Verificare
- Tutti i controller devono verificare `req.companyId` prima di query
- Admin controller non applicano tenant filter (corretto per super admin)

#### ❌ Rischio IDOR Potenziale
- `/api/admin/companies/:id` - Super admin può accedere a qualsiasi company (corretto)
- `/api/admin/users/:id` - Super admin può accedere a qualsiasi user (corretto)
- `/api/clients/:id` - Verifica `companyId` nel controller ✅
- `/api/jobs/:id` - Verifica `companyId` nel controller ✅
- `/api/quotes/:id` - Verifica `companyId` nel controller ✅

**Raccomandazione**: Aggiungere middleware `requireTenant` esplicito per chiarezza

### 3.2 Rate Limiting e Brute Force

#### ❌ Non Implementato
- Nessun rate limiting su:
  - `/api/admin/login` - Vulnerabile a brute force
  - `/api/auth/login` - Vulnerabile a brute force
  - `/api/admin/*` - Nessuna protezione

**Rischio**: ALTO - Brute force attack possibile

**Raccomandazione**: Implementare `express-rate-limit` con:
  - 5 tentativi login per IP/15 minuti
  - 100 richieste API per IP/minuto

### 3.3 JWT

#### ✅ Implementato
- Password hashing: bcrypt con salt 10 ✅
- JWT signing: jwt.sign con secret ✅
- Token expiration: 7 giorni ✅

#### ⚠️ Parzialmente Implementato
- Refresh token: Esiste ma è identico all'access token (non è un vero refresh)
- Token revocation: Non implementato (blacklist)

#### ❌ Non Implementato
- Token rotation
- Refresh token separato con scadenza diversa
- Logout globale (invalida tutti i token)

**Rischio**: MEDIO - Token compromesso valido per 7 giorni

### 3.4 Password Reset

#### ❌ Non Implementato
- Endpoint reset password
- Token reset password con scadenza
- Email reset password

**Rischio**: MEDIO - Utenti bloccati se dimenticano password

### 3.5 CORS e CSRF

#### ✅ Implementato
- CORS: Configurato in `index.ts` con `origin` da env
- Credentials: `credentials: true` abilitato

#### ⚠️ Da Verificare
- CORS potrebbe essere più restrittivo (solo dominio frontend)
- CSRF token: Non implementato (JWT in header protegge parzialmente)

**Rischio**: BASSO - JWT in Authorization header protegge da CSRF base

### 3.6 Upload File

#### ✅ Implementato
- Multer configurato
- Upload directory configurabile

#### ⚠️ Da Verificare
- MIME type validation: Non verificato nel codice
- File size limit: Non verificato nel codice
- Path traversal: Non verificato nel codice

**Rischio**: MEDIO - Upload file non validati

**Raccomandazione**: Aggiungere validazione:
  - MIME type whitelist
  - Max file size (es. 10MB)
  - Sanitize filename

### 3.7 Logging Dati Sensibili

#### ⚠️ Parzialmente Implementato
- `console.log` usato ovunque
- Password non loggate (OK)
- Token non loggati (OK)
- Email loggate in alcuni punti (⚠️)

**Rischio**: BASSO - Log potrebbero contenere dati sensibili in produzione

**Raccomandazione**: Usare logger strutturato (Winston/Pino) con:
  - Redaction di dati sensibili
  - Log levels (error, warn, info, debug)

### 3.8 Webhook Stripe

#### ✅ Implementato
- Verifica firma: `stripe.webhooks.constructEvent()` ✅
- Raw body: `express.raw({ type: 'application/json' })` ✅

#### ❌ Non Implementato
- Idempotency: Event ID non tracciato
- Replay attack: Nessuna protezione
- Event deduplication: Eventi duplicati processati più volte

**Rischio**: MEDIO - Doppio processing pagamenti possibile

**Raccomandazione**: Tracciare `event.id` in tabella `StripeEvent`

---

## 4. TENANT ISOLATION AUDIT

### 4.1 Verifica Query Prisma

#### ✅ Controller con Tenant Isolation
- `clientController.ts`: `where: { companyId }` ✅
- `jobController.ts`: `where: { companyId }` ✅
- `quoteController.ts`: `where: { companyId }` ✅
- `materialController.ts`: `where: { companyId }` ✅
- `checklistController.ts`: `where: { companyId }` ✅

#### ⚠️ Da Verificare
- `userController.ts`: Verifica `companyId` per utenti tenant
- `attachmentController.ts`: Verifica `companyId` indirettamente (via job)

#### ❌ Super Admin Controller
- `adminController.ts`: Non applica tenant filter (corretto)
- `adminUsersController.ts`: Non applica tenant filter (corretto)

### 4.2 Stato Tenant

#### ⚠️ Implementazione Parziale
- `Company.abbonamentoAttivo`: Solo boolean
- `Company.dataScadenza`: Presente ma non usato per calcolo stato

**Gap**: Manca enum `SubscriptionStatus`:
- `TRIAL`
- `ACTIVE`
- `PAST_DUE`
- `SUSPENDED`
- `CANCELED`
- `DELETED`

---

## 5. PERFORMANCE E SCALABILITÀ

### 5.1 Database Query

#### ✅ Ottimizzazioni Presenti
- Index su `companyId` (implicito via foreign key)
- `include` per eager loading relazioni

#### ⚠️ Potenziali Problemi
- Report query senza paginazione (potrebbe essere lento con molti dati)
- N+1 queries in alcuni controller (es. `getAllCompanies`)

### 5.2 Caching

#### ❌ Non Implementato
- Nessun caching per:
  - Statistiche dashboard
  - Report
  - Plan limits

**Raccomandazione**: Implementare Redis per caching

### 5.3 Background Jobs

#### ❌ Non Implementato
- Email invio sincrono (blocca request)
- Alert scadenza abbonamenti (non automatizzato)
- Cleanup dati vecchi (non automatizzato)

**Raccomandazione**: Implementare Bull/BullMQ per job asincroni

---

## 6. TESTING

#### ❌ Non Implementato
- Nessun test unitario
- Nessun test di integrazione
- Nessun test end-to-end

**Rischio**: ALTO - Refactoring rischioso senza test

**Raccomandazione**: Implementare:
- Test unitari per utility functions
- Test integrazione per API
- Test E2E per flow critici (login, pagamento, tenant isolation)

---

## 7. DOCUMENTAZIONE

#### ✅ Presente
- `README.md` - Setup base
- `ADMIN_FEATURES.md` - Feature admin
- `TROUBLESHOOTING.md` - Troubleshooting

#### ⚠️ Parzialmente Presente
- API documentation: Commenti nel codice, ma manca OpenAPI/Swagger

#### ❌ Non Presente
- Manuale super admin
- API reference completa
- Deployment guide dettagliata
- Security best practices

---

## 8. CONCLUSIONI AUDIT

### 8.1 Punti di Forza
1. ✅ Tenant isolation implementato correttamente nei controller tenant
2. ✅ Password hashing con bcrypt
3. ✅ JWT authentication funzionante
4. ✅ Stripe webhook base funzionante
5. ✅ UI admin completa e funzionale
6. ✅ Modelli Prisma ben strutturati

### 8.2 Gap Critici (P0)
1. ❌ **Rate limiting**: Nessuna protezione brute force
2. ❌ **Audit log**: Nessun tracking azioni critiche
3. ❌ **Impersonation**: Non implementato
4. ❌ **Tenant state machine**: Solo boolean, manca enum stato
5. ❌ **Stripe idempotency**: Eventi duplicati possibili
6. ❌ **Export dati**: GDPR compliance mancante

### 8.3 Gap Importanti (P1)
1. ⚠️ **Email asincrona**: Invio sincrono blocca request
2. ⚠️ **Template engine**: HTML hardcoded
3. ⚠️ **Password reset**: Non implementato
4. ⚠️ **Refresh token**: Non è un vero refresh
5. ⚠️ **File upload validation**: MIME type, size, path traversal
6. ⚠️ **Testing**: Nessun test

### 8.4 Gap Minori (P2)
1. ⚠️ **Caching**: Nessun caching per performance
2. ⚠️ **Grafici**: Report senza visualizzazioni
3. ⚠️ **Monitoring**: Nessun monitoring/alerting
4. ⚠️ **API docs**: Manca OpenAPI/Swagger

---

**Prossimi Passi**: Vedere `docs/roadmap_p0_p1_p2.md` per dettagli implementazione.

