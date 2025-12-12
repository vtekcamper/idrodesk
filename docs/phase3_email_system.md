# FASE 3 - Sistema Email Professionale - Implementazione Completata

**Data**: 2024-12-XX  
**Status**: ✅ Completata

---

## 1. QUEUE ASINCRONA (BULLMQ) ✅

### Configurazione
- ✅ **Redis Client** (`config/redis.ts`):
  - Supporta Redis URL e configurazione manuale
  - Fallback graceful se Redis non disponibile
  - Auto-reconnect e error handling

- ✅ **Email Queue** (`queues/emailQueue.ts`):
  - Queue BullMQ con configurazione retry
  - Retry: 3 tentativi
  - Backoff esponenziale: 1s, 5s, 30s
  - Timeout: 30 secondi per job
  - Cleanup automatico job completati/falliti

### Worker
- ✅ **Email Worker** (`workers/emailWorker.ts`):
  - Processa email dalla queue
  - Concurrency: 5 email in parallelo
  - Rate limiting: max 10 email/secondo
  - Event handlers per completed/failed
  - Graceful shutdown

### Integrazione
- ✅ Worker avviato automaticamente in `index.ts`
- ✅ Non blocca server se Redis non disponibile
- ✅ Log dettagliati per debugging

---

## 2. TEMPLATE ENGINE (HANDLEBARS) ✅

### Template System
- ✅ **Template Engine** (`utils/emailTemplates.ts`):
  - Handlebars per rendering template
  - Helper personalizzati:
    - `formatDate`: Formatta date in italiano
    - `formatCurrency`: Formatta currency
    - `uppercase`: Uppercase string
    - `eq`: Confronto valori
  - Template inline (fallback se file non esiste)
  - Supporto template da file (`.hbs`)

### Template Disponibili
- ✅ **WELCOME**: Email benvenuto nuove aziende
- ✅ **SUBSCRIPTION_EXPIRING**: Notifica scadenza abbonamento
- ✅ **SUBSCRIPTION_EXPIRED**: Notifica abbonamento scaduto
- ✅ **PAYMENT_SUCCESS**: Conferma pagamento
- ✅ **PAYMENT_FAILED**: Notifica pagamento fallito
- ✅ **PLAN_UPGRADE**: Notifica upgrade piano
- ✅ **PLAN_DOWNGRADE**: Notifica downgrade piano

### Design Template
- ✅ HTML responsive
- ✅ Styling inline per compatibilità email client
- ✅ Colori distintivi per tipo email
- ✅ Layout professionale con header/footer

---

## 3. RETRY CON BACKOFF ✅

### Configurazione Retry
- ✅ **3 tentativi** per ogni email
- ✅ **Backoff esponenziale**:
  - Tentativo 1: 1 secondo
  - Tentativo 2: 5 secondi
  - Tentativo 3: 30 secondi
- ✅ **Timeout**: 30 secondi per job
- ✅ **Error tracking**: Errori salvati in `EmailNotification.error`

### Gestione Errori
- ✅ Status aggiornato a `FAILED` se tutti i tentativi falliscono
- ✅ Error message salvato per debugging
- ✅ Job rimossi dopo 7 giorni se falliti

---

## 4. PREVIEW TEMPLATE ✅

### API
- ✅ **POST `/api/admin/emails/preview`**:
  - Preview template con dati personalizzati
  - Ritorna HTML renderizzato
  - Supporta tutti i tipi email

- ✅ **GET `/api/admin/emails/templates`**:
  - Lista template disponibili
  - Variabili richieste per ogni template
  - Descrizione template

### Frontend
- ✅ **Pagina `/admin/emails/templates`**:
  - Lista template con descrizione
  - Preview interattivo
  - Dati di esempio personalizzabili
  - Visualizzazione HTML renderizzato

---

## 5. TRIGGER AUTOMATICI ✅

### Job Automatici
- ✅ **Trial Expiring** (`sendTrialExpiringEmails`):
  - Invia email a company in trial che scadono tra 1-7 giorni
  - Eseguibile manualmente o via cron

- ✅ **Subscription Expired** (`sendSubscriptionExpiredEmails`):
  - Invia email a company con abbonamento scaduto
  - Evita duplicati (max 1 email/giorno)

- ✅ **Subscription Reminder** (`sendSubscriptionReminderEmails`):
  - Reminder a 7, 3, 1 giorni dalla scadenza
  - Solo per abbonamenti ACTIVE

### Trigger Integrati
- ✅ **Pagamento Riuscito**:
  - Trigger automatico da `handlePaymentIntentSucceeded`
  - Email con importo e nuova data scadenza

- ✅ **Pagamento Fallito**:
  - Trigger automatico da `handlePaymentIntentFailed`
  - Email con errore e link retry

- ✅ **Cambio Piano**:
  - Trigger automatico da `updateCompanyPlan`
  - Email upgrade/downgrade con dettagli piano

### Endpoint Job
- ✅ **POST `/api/admin/jobs/email/trial-expiring`**
- ✅ **POST `/api/admin/jobs/email/subscription-expired`**
- ✅ **POST `/api/admin/jobs/email/subscription-reminder`**

---

## 6. INTEGRAZIONE AUDIT LOG ✅

- ✅ **Log automatico** su invio email:
  - Action: `SEND_EMAIL`
  - Entity: `EmailNotification`
  - Metadata: to, subject, type, companyId

---

## 7. CONFIGURAZIONI ADMIN ✅

### Variabili Ambiente
- ✅ `REDIS_URL`: URL Redis (opzionale)
- ✅ `REDIS_HOST`: Host Redis (default: localhost)
- ✅ `REDIS_PORT`: Port Redis (default: 6379)
- ✅ `REDIS_PASSWORD`: Password Redis (opzionale)
- ✅ `SMTP_HOST`: SMTP host
- ✅ `SMTP_PORT`: SMTP port
- ✅ `SMTP_SECURE`: SMTP secure (true/false)
- ✅ `SMTP_USER`: SMTP username
- ✅ `SMTP_PASSWORD`: SMTP password
- ✅ `SMTP_FROM`: Email mittente
- ✅ `FRONTEND_URL`: URL frontend per link email
- ✅ `SUPPORT_EMAIL`: Email supporto

---

## FILE CREATI/MODIFICATI

### Backend
- ✅ `config/redis.ts` - Nuovo (Redis client)
- ✅ `queues/emailQueue.ts` - Nuovo (BullMQ queue)
- ✅ `workers/emailWorker.ts` - Nuovo (Email worker)
- ✅ `utils/emailTemplates.ts` - Nuovo (Template engine)
- ✅ `jobs/emailTriggers.ts` - Nuovo (Trigger automatici)
- ✅ `controllers/emailController.ts` - Riscritto (queue, template, preview)
- ✅ `controllers/paymentController.ts` - Modificato (trigger email)
- ✅ `controllers/adminController.ts` - Modificato (trigger email cambio piano)
- ✅ `routes/adminRoutes.ts` - Modificato (nuove route)
- ✅ `index.ts` - Modificato (avvio worker)
- ✅ `prisma/schema.prisma` - Modificato (EmailType enum)

### Frontend
- ✅ `app/(admin)/admin/emails/templates/page.tsx` - Nuovo
- ✅ `lib/adminApi.ts` - Modificato (nuove API)
- ✅ `components/AdminLayout.tsx` - Modificato (menu template)

---

## PROSSIMI PASSI

1. **Installare dipendenze**:
   ```bash
   cd backend
   npm install
   ```

2. **Configurare Redis**:
   - Opzione 1: Redis locale (per sviluppo)
   - Opzione 2: Redis cloud (Railway, Upstash, etc.)
   - Aggiungere `REDIS_URL` in Railway

3. **Eseguire migrazione Prisma**:
   ```bash
   cd backend
   npx prisma migrate dev --name email_system_phase3
   npx prisma generate
   ```

4. **Configurare SMTP**:
   - Aggiungere variabili SMTP in Railway
   - Testare invio email

5. **Configurare Cron Job** (opzionale):
   - Eseguire job email automatici ogni giorno
   - Può essere fatto via Railway cron o external scheduler

6. **Testare sistema**:
   - Test invio email manuale
   - Test preview template
   - Test trigger automatici
   - Test retry su errore SMTP

---

## NOTE IMPLEMENTAZIONE

### Compatibilità
- ✅ Sistema retrocompatibile con email esistenti
- ✅ Fallback graceful se Redis non disponibile
- ✅ Template inline se file non esiste

### Performance
- ✅ Queue asincrona non blocca API
- ✅ Concurrency controllata (5 email parallele)
- ✅ Rate limiting (10 email/secondo)

### Sicurezza
- ✅ Audit log obbligatorio
- ✅ Validazione dati template
- ✅ Sanitizzazione HTML (Handlebars escape automatico)

### Scalabilità
- ✅ Worker separabile (può essere processo dedicato)
- ✅ Redis distribuito supportato
- ✅ Job idempotenti (notificationId come jobId)

---

## ESEMPI USO

### Invio Email Manuale
```typescript
await adminApi.sendEmail({
  to: 'user@example.com',
  subject: 'Test Email',
  body: '<p>Test</p>',
  type: 'CUSTOM',
});
```

### Preview Template
```typescript
const preview = await adminApi.previewEmailTemplate({
  type: 'SUBSCRIPTION_EXPIRING',
  templateData: {
    companyName: 'Test Company',
    daysUntilExpiry: 7,
  },
});
```

### Trigger Automatico
```typescript
// Da paymentController
await triggerPaymentSuccessEmail(companyId, amount, expiryDate);

// Da adminController
await triggerPlanChangeEmail(companyId, oldPlan, newPlan, isUpgrade);
```

---

**Status**: ✅ FASE 3 completata, pronta per test e deploy

