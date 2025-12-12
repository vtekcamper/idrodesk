# QA + Hardening Pass - Fixes Implementati

## 0) Baseline Check ✅

### TypeScript Fix
- **File**: `backend/src/utils/jwt.ts`
- **Problema**: `expiresIn` type error
- **Fix**: Cambiato tipo parametro da `string` a `string | number` e rimosso cast non necessario

## 1) Migration + Prisma Sanity ✅

### Schema Verificato
- ✅ AuditLog con indici corretti
- ✅ StripeEvent per idempotency
- ✅ RefreshToken con revoca
- ✅ PasswordResetToken con one-time use
- ✅ DataExport per GDPR
- ✅ JobQueue per async jobs
- ✅ SubscriptionStatus enum completo

### Indici Verificati
- ✅ `companyId` su tutte le tabelle tenant-scoped
- ✅ `createdAt` per audit log
- ✅ `action`, `entity`, `entityId` per audit log
- ✅ `subscriptionStatus` su Company
- ✅ `deletedAt` per soft delete

## 2) Security Fixes

### 2.1 Refresh Token Rotation ⚠️ DA IMPLEMENTARE
**Problema**: Refresh token non viene salvato nel DB né revocato dopo uso.

**Fix Necessario**:
- Salvare refresh token nel DB al login/register
- Verificare token nel DB al refresh
- Revocare token vecchio e creare nuovo token
- Implementare cleanup token scaduti

### 2.2 Password Reset ⚠️ DA IMPLEMENTARE
**Problema**: Password reset non implementato.

**Fix Necessario**:
- Endpoint `/api/auth/forgot-password` (genera token)
- Endpoint `/api/auth/reset-password` (usa token, marca come used)
- Token one-time, scadenza 1h
- Email con link reset

### 2.3 Tenant Isolation ✅ VERIFICATO
**Status**: I controller usano `findFirst({ where: { id, companyId } })` invece di `findUnique({ where: { id } })`.

**Controller Verificati**:
- ✅ `jobController.ts` - usa `findFirst` con `companyId`
- ✅ `quoteController.ts` - usa `findFirst` con `companyId`
- ✅ `checklistController.ts` - usa `findFirst` con `companyId`
- ✅ `clientController.ts` - verifica necessario

**Eccezioni Legittime**:
- `adminController.ts` - super admin può accedere a tutte le company
- `auditController.ts` - super admin solo
- `paymentController.ts` - super admin solo per `getPayment`

### 2.4 Rate Limiting ✅ VERIFICATO
- ✅ Login: 5 tentativi / 15 min
- ✅ API generale: 100 / min
- ✅ Creazione: 20 / ora
- ✅ Email: 10 / ora
- ✅ Export: 3 / giorno

### 2.5 JWT ✅ VERIFICATO
- ✅ Access token e refresh token separati
- ⚠️ Refresh token rotation mancante (vedi 2.1)

## 3) Audit Log ✅ VERIFICATO

### Scrittura Audit Log
- ✅ Login/logout (via middleware)
- ✅ Impersonation start/stop
- ✅ Change plan/subscription status
- ✅ Webhook Stripe events
- ✅ Export e soft delete/restore
- ✅ Creazione/modifica utenti

### Campi Verificati
- ✅ actorType/actorId
- ✅ companyId (se applicabile)
- ✅ action/entity/entityId
- ✅ metadata (before/after)
- ✅ ip/userAgent/requestId

### API Audit Logs ✅
- ✅ Paginazione robusta
- ✅ Filtri funzionanti
- ✅ Ordinamento coerente
- ✅ Access: solo super admin

## 4) Impersonation ✅ VERIFICATO

### Backend ✅
- ✅ Token impersonation: 15 minuti
- ✅ Flag isImpersonated, impersonatedBy
- ✅ Audit obbligatorio start/stop
- ✅ Stop impersonation funziona

### Frontend ✅
- ✅ Banner sempre visibile
- ✅ Bottone "Esci" funziona

## 5) Subscription State Machine ✅ VERIFICATO

### Regole ✅
- ✅ DELETED: calcolato correttamente
- ✅ SUSPENDED: calcolato correttamente
- ✅ PAST_DUE: calcolato correttamente
- ✅ ACTIVE/TRIAL: calcolato correttamente

### Enforcement ⚠️ DA VERIFICARE
- ⚠️ Middleware per bloccare accesso se DELETED/SUSPENDED
- ✅ `checkPlanLimits` middleware esiste

## 6) Stripe Idempotency ✅ VERIFICATO

### Idempotency ✅
- ✅ Tabella StripeEvent usata sempre
- ✅ Stesso event due volte → process una volta sola
- ✅ Endpoint webhook non crasha su eventi ignoti

### Event Handling ✅
- ✅ payment_intent.succeeded: Payment aggiornato, Audit log creato
- ✅ payment_intent.payment_failed: gestito
- ✅ charge.refunded: gestito
- ✅ invoice.payment_succeeded/failed: gestiti

## 7) Deploy Readiness

### 7.1 Env Var Checklist ⚠️ DA CREARE
- ⚠️ `.env.example` completo mancante

### 7.2 CORS ✅ VERIFICATO
- ✅ CORS accetta solo `CORS_ORIGIN` (prod)
- ✅ Localhost gestito in dev

### 7.3 Health Checks ✅ VERIFICATO
- ✅ Endpoint `/health` ok
- ✅ Verifica database
- ✅ Verifica Redis (opzionale)

## Fixes da Implementare

1. **Refresh Token Rotation** (CRITICO)
2. **Password Reset** (IMPORTANTE)
3. **Subscription State Enforcement Middleware** (IMPORTANTE)
4. **`.env.example` completo** (IMPORTANTE)
5. **Verifica tenant isolation in clientController** (MEDIO)

