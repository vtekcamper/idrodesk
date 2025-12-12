# Roadmap P0/P1/P2 - IdroDesk SaaS Production Ready

**Data**: 2024-12-XX  
**Baseline**: Audit completato - vedi `audit_superadmin.md`

---

## PRIORITÀ P0 - CRITICI (Sicurezza e Business)

### P0.1 Rate Limiting e Protezione Brute Force
**Effort**: S (Small)  
**Motivazione**: Rischio sicurezza ALTO - Vulnerabile a brute force attack su login

**Task**:
- [ ] Installare `express-rate-limit`
- [ ] Middleware rate limit per `/api/admin/login` (5 tentativi/15 min)
- [ ] Middleware rate limit per `/api/auth/login` (5 tentativi/15 min)
- [ ] Rate limit generale API (100 req/min per IP)
- [ ] Test brute force protection

**File da modificare**:
- `backend/src/index.ts` - Aggiungere rate limiting
- `backend/src/middleware/rateLimit.ts` - Nuovo middleware
- `backend/package.json` - Aggiungere dipendenza

---

### P0.2 Audit Log Completo
**Effort**: M (Medium)  
**Motivazione**: Compliance, sicurezza, debugging - Tracciare tutte le azioni critiche

**Task**:
- [ ] Creare modello Prisma `AuditLog`
- [ ] Migrazione database
- [ ] Middleware `auditLog` per log automatico
- [ ] Loggare: login, impersonation, cambio piano, pagamenti, delete, export
- [ ] API `GET /api/admin/audit-logs` con filtri
- [ ] UI audit log viewer in admin
- [ ] Test audit log

**File da creare/modificare**:
- `backend/prisma/schema.prisma` - Aggiungere modello AuditLog
- `backend/src/middleware/auditLog.ts` - Nuovo middleware
- `backend/src/controllers/auditController.ts` - Nuovo controller
- `backend/src/routes/adminRoutes.ts` - Aggiungere route
- `frontend/src/app/(admin)/admin/audit-logs/page.tsx` - Nuova pagina

**Campi AuditLog**:
```prisma
model AuditLog {
  id          String    @id @default(cuid())
  actorType   String    // "SUPER_ADMIN" | "USER" | "SYSTEM"
  actorId     String?
  companyId   String?
  action      String    // "LOGIN", "IMPERSONATE", "CHANGE_PLAN", etc.
  entity      String    // "Company", "User", "Payment", etc.
  entityId    String?
  metadata    Json?     // { before: {...}, after: {...} }
  ip          String?
  userAgent   String?
  requestId   String?
  createdAt   DateTime  @default(now())
  
  @@index([actorId])
  @@index([companyId])
  @@index([action])
  @@index([createdAt])
}
```

---

### P0.3 Impersonation Super Admin
**Effort**: M (Medium)  
**Motivazione**: Supporto clienti, debugging - Super admin deve poter impersonare utenti tenant

**Task**:
- [ ] API `POST /api/admin/impersonate` con validazione
- [ ] Generare token temporaneo (15 minuti) con flag `isImpersonated: true`
- [ ] Banner UI quando impersonato
- [ ] Audit log obbligatorio per impersonation
- [ ] Endpoint `POST /api/admin/stop-impersonate`
- [ ] Test impersonation

**File da creare/modificare**:
- `backend/src/controllers/adminController.ts` - Aggiungere `impersonateUser`
- `backend/src/routes/adminRoutes.ts` - Aggiungere route
- `backend/src/utils/jwt.ts` - Supporto flag `isImpersonated`
- `frontend/src/components/ImpersonationBanner.tsx` - Nuovo componente
- `frontend/src/lib/adminApi.ts` - Aggiungere metodi impersonation

**Sicurezza**:
- Solo super admin può impersonare
- Token impersonation scade dopo 15 minuti
- Audit log obbligatorio
- Banner visibile in UI

---

### P0.4 Tenant State Machine
**Effort**: M (Medium)  
**Motivazione**: Business logic - Gestione corretta stati abbonamento (TRIAL, ACTIVE, PAST_DUE, etc.)

**Task**:
- [ ] Aggiungere enum `SubscriptionStatus` in Prisma
- [ ] Migrazione: aggiungere campo `subscriptionStatus` a `Company`
- [ ] Logica calcolo stato basata su `dataScadenza` e `abbonamentoAttivo`
- [ ] Job cron per aggiornare stati (PAST_DUE, SUSPENDED)
- [ ] API aggiornamento stato
- [ ] UI mostra stato con badge colorato
- [ ] Test state machine

**File da creare/modificare**:
- `backend/prisma/schema.prisma` - Aggiungere enum e campo
- `backend/src/utils/subscriptionState.ts` - Nuovo utility
- `backend/src/jobs/subscriptionStateJob.ts` - Nuovo job (se usiamo cron)
- `backend/src/controllers/adminController.ts` - Aggiornare logica
- `frontend/src/app/(admin)/admin/companies/[id]/page.tsx` - Mostrare stato

**Stati**:
```prisma
enum SubscriptionStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  SUSPENDED
  CANCELED
  DELETED
}
```

---

### P0.5 Stripe Idempotency e Replay Attack Protection
**Effort**: S (Small)  
**Motivazione**: Rischio business ALTO - Doppio processing pagamenti possibile

**Task**:
- [ ] Creare modello Prisma `StripeEvent`
- [ ] Migrazione database
- [ ] Tracciare `event.id` in webhook handler
- [ ] Verificare event già processato prima di processare
- [ ] Test idempotency (invia stesso evento 2 volte)

**File da creare/modificare**:
- `backend/prisma/schema.prisma` - Aggiungere modello StripeEvent
- `backend/src/controllers/paymentController.ts` - Aggiungere idempotency check
- `backend/src/controllers/paymentController.ts` - Salvare event.id

**Modello**:
```prisma
model StripeEvent {
  id          String   @id
  eventType   String
  processed   Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  @@unique([id])
}
```

---

### P0.6 Export Dati e GDPR Compliance
**Effort**: M (Medium)  
**Motivazione**: Compliance GDPR - Diritto all'export e cancellazione dati

**Task**:
- [ ] API `POST /api/admin/companies/:id/export` - Export dati tenant (CSV/ZIP)
- [ ] Export: clients, jobs, quotes, materials, users
- [ ] Soft delete: `DELETE /api/admin/companies/:id` (setta `subscriptionStatus: DELETED`)
- [ ] Job cleanup: Hard delete dopo 30 giorni (anonimizzazione)
- [ ] Audit log obbligatorio per export e delete
- [ ] UI export button in dettaglio azienda
- [ ] Test export e delete

**File da creare/modificare**:
- `backend/src/controllers/adminController.ts` - Aggiungere `exportCompanyData`, `softDeleteCompany`
- `backend/src/routes/adminRoutes.ts` - Aggiungere route
- `backend/src/utils/exportData.ts` - Nuovo utility per export
- `frontend/src/app/(admin)/admin/companies/[id]/page.tsx` - Aggiungere button export

---

## PRIORITÀ P1 - IMPORTANTI (Funzionalità e UX)

### P1.1 Sistema Email Asincrono con Queue
**Effort**: L (Large)  
**Motivazione**: Performance - Invio sincrono blocca request, retry necessario

**Task**:
- [ ] Installare Bull/BullMQ e Redis
- [ ] Creare queue `email-queue`
- [ ] Job worker per invio email asincrono
- [ ] Retry con backoff esponenziale (3 tentativi)
- [ ] Aggiornare controller email per usare queue
- [ ] Test queue e retry

**File da creare/modificare**:
- `backend/package.json` - Aggiungere bullmq, ioredis
- `backend/src/queues/emailQueue.ts` - Nuova queue
- `backend/src/workers/emailWorker.ts` - Nuovo worker
- `backend/src/controllers/emailController.ts` - Usare queue invece di invio diretto
- `backend/src/index.ts` - Avviare worker

---

### P1.2 Template Engine per Email
**Effort**: M (Medium)  
**Motivazione**: UX - Email professionali con template riutilizzabili

**Task**:
- [ ] Installare Handlebars o MJML
- [ ] Creare template email (welcome, subscription_expiring, payment_success, etc.)
- [ ] API `GET /api/admin/emails/templates` - Lista template
- [ ] API `GET /api/admin/emails/templates/:id/preview` - Preview template
- [ ] UI template editor (opzionale)
- [ ] Aggiornare helper email per usare template
- [ ] Test template rendering

**File da creare/modificare**:
- `backend/package.json` - Aggiungere handlebars
- `backend/src/templates/email/` - Directory template
- `backend/src/utils/emailTemplate.ts` - Nuovo utility
- `backend/src/controllers/emailController.ts` - Usare template
- `frontend/src/app/(admin)/admin/settings/page.tsx` - Preview template

---

### P1.3 Password Reset
**Effort**: S (Small)  
**Motivazione**: UX - Utenti bloccati se dimenticano password

**Task**:
- [ ] API `POST /api/auth/forgot-password` - Genera token reset
- [ ] API `POST /api/auth/reset-password` - Reset con token
- [ ] Modello Prisma `PasswordResetToken` (o campo in User)
- [ ] Email reset password con link
- [ ] Token scade dopo 1 ora
- [ ] UI forgot password page
- [ ] Test password reset flow

**File da creare/modificare**:
- `backend/prisma/schema.prisma` - Aggiungere modello o campo
- `backend/src/controllers/authController.ts` - Aggiungere forgot/reset
- `backend/src/routes/authRoutes.ts` - Aggiungere route
- `frontend/src/app/(auth)/forgot-password/page.tsx` - Nuova pagina
- `frontend/src/app/(auth)/reset-password/page.tsx` - Nuova pagina

---

### P1.4 Refresh Token Separato
**Effort**: S (Small)  
**Motivazione**: Sicurezza - Refresh token separato con scadenza diversa

**Task**:
- [ ] Modificare `generateRefreshToken` per token separato (30 giorni)
- [ ] Modello Prisma `RefreshToken` (opzionale, può essere stateless)
- [ ] API `POST /api/auth/refresh` - Refresh token
- [ ] Revoca token su logout
- [ ] Test refresh flow

**File da modificare**:
- `backend/src/utils/jwt.ts` - Separare refresh token
- `backend/src/controllers/authController.ts` - Aggiornare refresh endpoint
- `frontend/src/lib/auth.ts` - Gestire refresh automatico

---

### P1.5 File Upload Validation
**Effort**: S (Small)  
**Motivazione**: Sicurezza - Protezione da upload file maliziosi

**Task**:
- [ ] Validazione MIME type whitelist (image/*, application/pdf, etc.)
- [ ] Validazione file size (max 10MB)
- [ ] Sanitize filename (rimuovere path traversal)
- [ ] Virus scanning (opzionale, ClamAV)
- [ ] Test upload validation

**File da modificare**:
- `backend/src/controllers/attachmentController.ts` - Aggiungere validazione
- `backend/src/middleware/uploadValidation.ts` - Nuovo middleware

---

### P1.6 Testing Base
**Effort**: L (Large)  
**Motivazione**: Qualità - Refactoring rischioso senza test

**Task**:
- [ ] Setup Jest/Vitest
- [ ] Test unitari: utility functions (jwt, password, quoteNumber)
- [ ] Test integrazione: API auth, tenant isolation
- [ ] Test E2E: login flow, pagamento flow
- [ ] CI/CD: run test su push
- [ ] Coverage target: 60% per P1

**File da creare/modificare**:
- `backend/package.json` - Aggiungere jest/vitest
- `backend/src/__tests__/` - Directory test
- `backend/jest.config.js` - Configurazione
- `.github/workflows/test.yml` - CI/CD (opzionale)

---

## PRIORITÀ P2 - MIGLIORAMENTI (Nice to Have)

### P2.1 Caching con Redis
**Effort**: M (Medium)  
**Motivazione**: Performance - Dashboard e report lenti con molti dati

**Task**:
- [ ] Setup Redis (già necessario per BullMQ)
- [ ] Cache statistiche dashboard (TTL 5 minuti)
- [ ] Cache report (TTL 10 minuti)
- [ ] Cache plan limits (TTL 1 ora)
- [ ] Invalidation cache su update

**File da creare/modificare**:
- `backend/src/utils/cache.ts` - Nuovo utility
- `backend/src/controllers/adminController.ts` - Usare cache
- `backend/src/controllers/reportsController.ts` - Usare cache

---

### P2.2 Grafici e Visualizzazioni Report
**Effort**: M (Medium)  
**Motivazione**: UX - Report più leggibili con grafici

**Task**:
- [ ] Installare Chart.js o Recharts
- [ ] Grafico revenue mensile
- [ ] Grafico nuove aziende nel tempo
- [ ] Grafico distribuzione piani
- [ ] Dashboard con grafici interattivi

**File da creare/modificare**:
- `frontend/package.json` - Aggiungere recharts
- `frontend/src/app/(admin)/admin/reports/page.tsx` - Aggiungere grafici
- `frontend/src/components/Charts/` - Nuovi componenti

---

### P2.3 Monitoring e Alerting
**Effort**: M (Medium)  
**Motivazione**: Operazioni - Monitorare errori e performance

**Task**:
- [ ] Setup Sentry o DataDog
- [ ] Logging strutturato (Winston/Pino)
- [ ] Alert su errori critici
- [ ] Dashboard monitoring
- [ ] Uptime monitoring

**File da creare/modificare**:
- `backend/package.json` - Aggiungere sentry, winston
- `backend/src/utils/logger.ts` - Nuovo logger
- `backend/src/index.ts` - Setup Sentry

---

### P2.4 API Documentation (OpenAPI/Swagger)
**Effort**: S (Small)  
**Motivazione**: Developer experience - Documentazione API automatica

**Task**:
- [ ] Installare swagger-ui-express
- [ ] Annotare route con JSDoc
- [ ] Generare OpenAPI spec
- [ ] UI Swagger su `/api-docs`
- [ ] Documentare tutti gli endpoint

**File da creare/modificare**:
- `backend/package.json` - Aggiungere swagger
- `backend/src/swagger.ts` - Configurazione
- `backend/src/index.ts` - Setup Swagger UI

---

### P2.5 Area Tenant Admin Completa
**Effort**: L (Large)  
**Motivazione**: UX - Tenant devono gestire la propria azienda

**Task**:
- [ ] Company settings page (anagrafica, P.IVA, logo)
- [ ] Gestione utenti tenant (inviti, ruoli)
- [ ] Billing page (piano, limiti, usage, storico pagamenti)
- [ ] Subscription management (upgrade/downgrade)
- [ ] Usage dashboard (quanto usato vs limiti)

**File da creare/modificare**:
- `frontend/src/app/(dashboard)/settings/page.tsx` - Nuova pagina
- `frontend/src/app/(dashboard)/billing/page.tsx` - Nuova pagina
- `backend/src/controllers/companyController.ts` - Nuovo controller
- `backend/src/routes/companyRoutes.ts` - Nuove route

---

## STIMA EFFORT TOTALE

- **P0**: 6 task × (2S + 4M) = ~20-25 giorni
- **P1**: 6 task × (2S + 2M + 2L) = ~25-30 giorni
- **P2**: 5 task × (1S + 3M + 1L) = ~15-20 giorni

**Totale**: ~60-75 giorni di sviluppo (con 1 sviluppatore)

---

## ORDINE DI IMPLEMENTAZIONE RACCOMANDATO

### Fase 1: Fondamenta Sicurezza (P0.1, P0.2, P0.5)
1. Rate limiting (P0.1) - 1 giorno
2. Audit log (P0.2) - 3 giorni
3. Stripe idempotency (P0.5) - 1 giorno

**Totale Fase 1**: ~5 giorni

### Fase 2: Funzionalità Core (P0.3, P0.4, P0.6)
4. Impersonation (P0.3) - 3 giorni
5. Tenant state machine (P0.4) - 3 giorni
6. Export dati (P0.6) - 3 giorni

**Totale Fase 2**: ~9 giorni

### Fase 3: Sistema Email (P1.1, P1.2)
7. Email asincrona (P1.1) - 5 giorni
8. Template engine (P1.2) - 3 giorni

**Totale Fase 3**: ~8 giorni

### Fase 4: Sicurezza e UX (P1.3, P1.4, P1.5)
9. Password reset (P1.3) - 2 giorni
10. Refresh token (P1.4) - 2 giorni
11. File upload validation (P1.5) - 1 giorno

**Totale Fase 4**: ~5 giorni

### Fase 5: Testing e Refinement (P1.6, P2.*)
12. Testing base (P1.6) - 10 giorni (in parallelo con altre fasi)
13. Caching (P2.1) - 3 giorni
14. Grafici (P2.2) - 3 giorni
15. Monitoring (P2.3) - 3 giorni
16. API docs (P2.4) - 2 giorni
17. Tenant admin area (P2.5) - 10 giorni

**Totale Fase 5**: ~31 giorni

---

## NOTE IMPLEMENTAZIONE

### Prerequisiti
- Redis per BullMQ (email queue) e caching
- Environment variables aggiuntive (vedi `env.example`)

### Migrazioni Database
- AuditLog model
- StripeEvent model
- SubscriptionStatus enum + campo Company
- PasswordResetToken (o campo User)

### Breaking Changes
- Nessuno previsto (tutte le modifiche sono additive)

### Backward Compatibility
- Tutte le modifiche mantengono compatibilità con codice esistente
- Nuovi campi opzionali o con default

---

## METRICHE DI SUCCESSO

### P0 Completato Quando:
- ✅ Rate limiting attivo su tutti gli endpoint critici
- ✅ Audit log traccia tutte le azioni critiche
- ✅ Impersonation funzionante con audit log
- ✅ Tenant state machine completa
- ✅ Stripe idempotency verificata
- ✅ Export dati funzionante

### P1 Completato Quando:
- ✅ Email asincrona con retry
- ✅ Template engine funzionante
- ✅ Password reset flow completo
- ✅ Refresh token separato
- ✅ File upload validato
- ✅ Test coverage > 60%

### P2 Completato Quando:
- ✅ Caching attivo per dashboard/report
- ✅ Grafici interattivi nei report
- ✅ Monitoring e alerting configurato
- ✅ API docs complete
- ✅ Tenant admin area completa

---

**Prossimi Passi**: Iniziare con Fase 1 (Fondamenta Sicurezza)

