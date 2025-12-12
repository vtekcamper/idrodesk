# Area Impostazioni Tenant - Implementazione Completa

## Riepilogo

Implementazione completa dell'area Impostazioni per i tenant (aziende idrauliche) con tutte le sezioni richieste.

## Schema Database

### Modelli Aggiunti/Modificati

1. **Company** (esteso):
   - `nomeCommerciale`, `codiceFiscale`, `citta`, `cap`, `provincia`, `paese`
   - `sitoWeb`, `pecEmail`, `sdiCode`, `iban`
   - `defaultPaymentTermsDays`, `notePublic`

2. **DocumentSettings** (nuovo):
   - Numerazione: `quotePrefix`, `quoteNextNumber`, `jobPrefix`, `jobNextNumber`
   - Template documenti: `docHeaderText`, `docFooterText`
   - Preventivi: `defaultQuoteValidityDays`, `defaultWarrantyText`, `defaultTermsText`, `defaultPrivacyText`
   - Email template: `defaultEmailTemplateQuoteSubject/Body`, `defaultEmailTemplateReportSubject/Body`
   - IVA e formattazione: `defaultTaxRate`, `showTax`, `currency`, `locale`

3. **AppPreferences** (nuovo):
   - Workflow: `workflowEnabled`, `requireReportOnComplete`
   - Materiali: `enableMaterialsPricing`, `defaultUnit`
   - Tracking: `timeTrackingEnabled`, `attachmentsEnabled`, `maxUploadSizeMB`
   - Notifiche: `notifyQuoteExpiring`, `notifyJobsTomorrow`, `notifyMissingReports`
   - Formato: `dateFormat`

## API Endpoints

### Settings
- `GET /api/company/settings` - Ottiene tutte le impostazioni (company + documents + preferences)
- `PATCH /api/company/settings/company` - Aggiorna dati aziendali
- `GET /api/company/settings/documents` - Ottiene impostazioni documenti
- `PATCH /api/company/settings/documents` - Aggiorna impostazioni documenti
- `GET /api/company/settings/preferences` - Ottiene preferenze app
- `PATCH /api/company/settings/preferences` - Aggiorna preferenze app
- `PATCH /api/company/settings/notifications` - Aggiorna notifiche

### Security
- `POST /api/auth/change-password` - Cambia password utente loggato

### Users
- `POST /api/users/:id/reset-password` - Invia email reset password (placeholder)

## Pagine UI

1. **`/settings/company`** - Dati aziendali, logo, contatti, PEC, SDI, IBAN
2. **`/settings/documents`** - Numerazione, template email, IVA, header/footer
3. **`/settings/users`** - Gestione utenti con modal, ruoli, reset password
4. **`/settings/billing`** - Piano, utilizzo risorse, storico pagamenti
5. **`/settings/preferences`** - Toggle workflow, materiali, tracking, upload
6. **`/settings/notifications`** - Configurazione notifiche email
7. **`/settings/security`** - Cambio password, placeholder sessioni/2FA

## Integrazioni

### Numerazione Automatica
- `generateQuoteNumber()` usa `DocumentSettings.quotePrefix` e `quoteNextNumber`
- `generateJobNumber()` usa `DocumentSettings.jobPrefix` e `jobNextNumber`
- Incremento atomico tramite Prisma `increment`

### IVA Default
- `createQuote()` applica `DocumentSettings.defaultTaxRate` se non specificato negli items

### Template Email
- Template salvati in `DocumentSettings` per preventivi e rapporti
- Variabili supportate: `{companyName}`, `{clientName}`, `{quoteNumber}`, `{jobNumber}`, `{link}`, `{total}`

## Validazioni

- P.IVA: minimo 11 caratteri (soft validation)
- Email: formato valido
- Numeri preventivi/interventi: interi positivi
- Aliquota IVA: 0-100%
- Upload logo: max 2MB, PNG/JPG/WEBP
- Password: minimo 8 caratteri

## TODO / Miglioramenti Futuri

1. **Upload Logo**: Implementare endpoint upload file con storage
2. **Email Template Preview**: Anteprima template con dati reali
3. **Notifiche Email**: Implementare sistema notifiche automatiche
4. **Gestione Sessioni**: Logout da tutti i dispositivi
5. **2FA**: Autenticazione a due fattori
6. **Stripe Integration**: Checkout e customer portal per upgrade piano
7. **Migration Prisma**: Eseguire migration quando possibile (problema ICU)

## File Modificati/Creati

### Backend
- `backend/prisma/schema.prisma` - Modelli estesi
- `backend/src/controllers/settingsController.ts` - Nuovo
- `backend/src/controllers/authController.ts` - Aggiunto `changePassword`
- `backend/src/routes/companyRoutes.ts` - Route settings
- `backend/src/routes/userRoutes.ts` - Route reset password
- `backend/src/routes/authRoutes.ts` - Route change password
- `backend/src/utils/quoteNumber.ts` - Usa DocumentSettings
- `backend/src/controllers/quoteController.ts` - Integrazione DocumentSettings

### Frontend
- `frontend/src/app/(dashboard)/settings/layout.tsx` - Layout con tabs
- `frontend/src/app/(dashboard)/settings/company/page.tsx` - Nuovo
- `frontend/src/app/(dashboard)/settings/documents/page.tsx` - Nuovo
- `frontend/src/app/(dashboard)/settings/users/page.tsx` - Nuovo
- `frontend/src/app/(dashboard)/settings/billing/page.tsx` - Nuovo
- `frontend/src/app/(dashboard)/settings/preferences/page.tsx` - Nuovo
- `frontend/src/app/(dashboard)/settings/notifications/page.tsx` - Nuovo
- `frontend/src/app/(dashboard)/settings/security/page.tsx` - Nuovo
- `frontend/src/lib/api.ts` - API aggiornate

## Note

- Tutte le pagine hanno loading states, error handling, validazioni
- Toast notifications usando alert placeholder (da sostituire con sistema toast)
- Upload logo è placeholder (da implementare endpoint upload)
- Notifiche email sono placeholder (settings salvati per futuro)
- Migration Prisma non eseguita a causa problema ICU (da eseguire manualmente)

