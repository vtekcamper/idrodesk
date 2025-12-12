# FASE 1 - Fondamenta Architetturali - Completata

**Data**: 2024-12-XX  
**Status**: ✅ Completata

---

## Modifiche Schema Prisma

### Nuovi Modelli Aggiunti

#### 1. AuditLog
Traccia tutte le azioni critiche nel sistema:
- Login/Logout
- Impersonation
- Cambi piano
- Pagamenti
- Export dati
- Delete operations

**Campi**:
- `actorType`: SUPER_ADMIN | USER | SYSTEM
- `actorId`: ID utente che ha eseguito l'azione
- `companyId`: ID tenant (se applicabile)
- `action`: Tipo di azione (LOGIN, IMPERSONATE, etc.)
- `entity`: Tipo di entità (Company, User, Payment, etc.)
- `entityId`: ID dell'entità modificata
- `metadata`: JSON con before/after/details
- `ip`, `userAgent`, `requestId`: Info richiesta

#### 2. StripeEvent
Traccia eventi Stripe per idempotency:
- Previene doppio processing
- Traccia eventi processati
- Salva snapshot event data

**Campi**:
- `id`: Stripe event ID (unique)
- `eventType`: Tipo evento Stripe
- `processed`: Boolean
- `metadata`: Snapshot event data

#### 3. RefreshToken
Gestione refresh token separati:
- Token con scadenza (30 giorni)
- Revoca token
- Tracking IP/userAgent

**Campi**:
- `token`: Refresh token (unique)
- `userId`: Utente proprietario
- `expiresAt`: Scadenza
- `revoked`: Boolean

#### 4. PasswordResetToken
Token per reset password:
- Token con scadenza (1 ora)
- Tracking utilizzo
- One-time use

**Campi**:
- `token`: Reset token (unique)
- `userId`: Utente
- `expiresAt`: Scadenza
- `used`: Boolean

#### 5. DataExport
Traccia export dati GDPR:
- Status export (PENDING, PROCESSING, COMPLETED, FAILED)
- File URL con scadenza
- Metadata export (tabelle, date range)

**Campi**:
- `companyId`: Tenant
- `requestedBy`: User ID
- `format`: CSV | JSON | ZIP
- `status`: ExportStatus enum
- `fileUrl`: Link download
- `expiresAt`: Scadenza link

#### 6. JobQueue
Coda job asincroni (backup per BullMQ):
- Email sending
- Data export
- Cleanup tasks

**Campi**:
- `jobType`: EMAIL | EXPORT | CLEANUP
- `status`: PENDING | PROCESSING | COMPLETED | FAILED
- `payload`: Job data (JSON)
- `result`: Job result (JSON)
- `attempts`: Numero tentativi
- `scheduledAt`: Quando eseguire

### Nuovi Enum

#### SubscriptionStatus
Stati abbonamento tenant:
- `TRIAL`: Periodo trial
- `ACTIVE`: Abbonamento attivo
- `PAST_DUE`: Pagamento scaduto
- `SUSPENDED`: Sospeso
- `CANCELED`: Cancellato
- `DELETED`: Soft deleted (GDPR)

#### ExportStatus
Stati export dati:
- `PENDING`: In attesa
- `PROCESSING`: In elaborazione
- `COMPLETED`: Completato
- `FAILED`: Fallito
- `EXPIRED`: Link scaduto

#### JobStatus
Stati job asincroni:
- `PENDING`: In attesa
- `PROCESSING`: In elaborazione
- `COMPLETED`: Completato
- `FAILED`: Fallito
- `CANCELLED`: Cancellato

### Modifiche Modelli Esistenti

#### Company
- ✅ Aggiunto `subscriptionStatus`: SubscriptionStatus enum (default: TRIAL)
- ✅ Aggiunto `deletedAt`: DateTime? (soft delete per GDPR)
- ✅ Aggiunte relazioni: `auditLogs`, `dataExports`, `refreshTokens`
- ✅ Aggiunti index: `subscriptionStatus`, `deletedAt`

#### User
- ✅ Aggiunte relazioni: `auditLogs`, `passwordResetTokens`, `refreshTokens`

---

## Middleware Implementati

### 1. Rate Limiting (`src/middleware/rateLimit.ts`)

#### `apiRateLimiter`
- 100 richieste/minuto per IP
- Applicabile a tutte le API

#### `loginRateLimiter`
- 5 tentativi/15 minuti per IP+email
- Protezione brute force
- Skip successful requests

#### `createRateLimiter`
- 20 creazioni/ora per IP
- Prevenzione spam

#### `emailRateLimiter`
- 10 email/ora per utente
- Prevenzione spam email

#### `exportRateLimiter`
- 3 export/giorno per company
- Limitazione export GDPR

### 2. Tenant Isolation (`src/middleware/tenantIsolation.ts`)

#### `requireTenant`
- Verifica `req.companyId` presente
- Verifica match tra `req.companyId` e parametri richiesta
- Super admin bypass automatico

#### Helper Functions
- `withTenantFilter()`: Applica automaticamente companyId a query
- `verifyTenantOwnership()`: Verifica ownership risorsa

### 3. Audit Logging (`src/middleware/auditLog.ts`)

#### `requestId`
- Genera UUID univoco per ogni richiesta
- Header `X-Request-ID` nella risposta

#### `auditLog(action, entity, entityId?, metadata?)`
- Middleware per loggare automaticamente azioni
- Logga dopo risposta (non blocca request)
- Salta per route pubbliche (health check, etc.)

#### `logAuditAction()`
- Helper per loggare manualmente azioni
- Usabile in controller quando middleware non sufficiente

### 4. Permission-Based RBAC (`src/middleware/permissions.ts`)

#### Permission Enum
Permessi granulari:
- `MANAGE_USERS`, `VIEW_USERS`
- `MANAGE_COMPANY_SETTINGS`, `VIEW_COMPANY_SETTINGS`
- `MANAGE_BILLING`, `VIEW_BILLING`
- `EXPORT_DATA`, `DELETE_DATA`
- `SEND_EMAILS`
- `MANAGE_CLIENTS`, `VIEW_CLIENTS`
- `MANAGE_JOBS`, `VIEW_JOBS`
- `MANAGE_QUOTES`, `VIEW_QUOTES`
- `MANAGE_MATERIALS`, `VIEW_MATERIALS`
- `MANAGE_CHECKLISTS`, `VIEW_CHECKLISTS`

#### Role Permissions Mapping
- **OWNER**: Tutti i permessi
- **TECNICO**: Permessi operativi (jobs, checklists, view)
- **BACKOFFICE**: Permessi limitati (quotes, view)

#### Middleware
- `requirePermission(...permissions)`: Verifica almeno uno dei permessi
- `requireAllPermissions(...permissions)`: Verifica tutti i permessi
- `checkPermission()`: Helper per verificare permessi in controller

---

## Dipendenze Aggiunte

- `express-rate-limit`: ^7.1.5
- `@types/express-rate-limit`: ^5.0.0

**Nota**: `uuid` non necessario, usiamo `crypto.randomUUID()` (built-in Node.js 14+)

---

## Prossimi Passi

### Migrazione Database
Eseguire:
```bash
cd backend
npx prisma migrate dev --name foundation_audit_security
npx prisma generate
```

### Integrazione Middleware
I middleware sono pronti ma non ancora integrati nelle route. Integrazione prevista in Fase 2.

### Test
- Test rate limiting
- Test tenant isolation
- Test audit logging
- Test permissions

---

## Note Implementazione

### Compatibilità
- ✅ Tutte le modifiche sono **additive**
- ✅ Nessun breaking change
- ✅ Backward compatible con codice esistente

### Performance
- Index aggiunti su campi critici (subscriptionStatus, deletedAt, etc.)
- Audit log asincrono (non blocca request)
- Rate limiting configurabile per ambiente

### Sicurezza
- Rate limiting su tutti gli endpoint critici
- Tenant isolation esplicita
- Audit log completo per compliance
- RBAC granulare per controllo accessi

---

**Status**: ✅ Fondamenta complete, pronte per Fase 2 (Implementazione Feature)

