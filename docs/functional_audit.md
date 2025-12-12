# Audit Funzionale IdroDesk - MVP Idraulici

## Stato Attuale

### API Dashboard - Problemi Identificati

1. **Query "Oggi"**: 
   - Frontend invia `{ data: today }` dove `today` è `YYYY-MM-DD`
   - Backend crea range `gte: date, lt: nextDay` ma non gestisce timezone correttamente
   - **Fix necessario**: Usare UTC start/end del giorno

2. **Query "Prossimi 7 giorni"**: 
   - Non esiste endpoint dedicato
   - Frontend filtra solo `PIANIFICATO` senza range date
   - **Fix necessario**: Aggiungere query con range date

3. **Query "Da chiudere"**: 
   - Non esiste endpoint
   - **Fix necessario**: Creare endpoint per:
     - Interventi COMPLETATO senza rapporto
     - Preventivi inviati in attesa
     - Interventi completati non fatturati

### Stati Enum

- **StatoJob**: BOZZA, PIANIFICATO, IN_CORSO, COMPLETATO, FATTURATO, ANNULLATO ✅
- **StatoPreventivo**: BOZZA, INVIATO, ACCETTATO, RIFIUTATO, SCADUTO ✅

### Endpoint Esistenti

- `GET /jobs` - con filtri stato, assegnatoA, data ✅
- `GET /jobs/:id` ✅
- `POST /jobs` ✅
- `PATCH /jobs/:id` ✅
- `POST /quotes/:id/to-job` - converti preventivo in lavoro ✅

### Endpoint Mancanti

- `GET /jobs/dashboard/stats` - statistiche dashboard
- `GET /jobs/dashboard/today` - interventi oggi
- `GET /jobs/dashboard/upcoming` - prossimi 7 giorni
- `GET /jobs/dashboard/to-close` - da chiudere
- `PATCH /jobs/:id/start` - avvia intervento (timestamp)
- `PATCH /jobs/:id/complete` - completa intervento (timestamp)
- `POST /jobs/:id/report` - crea rapporto intervento

## Flussi da Implementare

### Flow A: Creazione Intervento (30 secondi)
- ✅ Endpoint esiste: `POST /jobs`
- ⚠️ Frontend: verificare form e validazione
- ⚠️ "Crea cliente al volo": non implementato

### Flow B: Avvia/Completa Intervento
- ⚠️ Endpoint mancanti: `/start` e `/complete`
- ⚠️ Timestamp start/end non gestiti automaticamente

### Flow C: Rapporto Intervento
- ⚠️ Endpoint mancante: `POST /jobs/:id/report`
- ⚠️ Modello "Rapporto" non esiste (usare JobChecklist o creare nuovo modello)

### Flow D: Preventivo → Lavoro
- ✅ Endpoint esiste: `POST /quotes/:id/to-job`
- ⚠️ Frontend: verificare UI e flusso

### Flow E: Cliente → Storico
- ✅ Endpoint esiste: `GET /clients/:id`
- ⚠️ Frontend: aggiungere tab Interventi/Preventivi

## Terminologia da Cambiare

- "Jobs" → "Interventi" (già fatto in alcuni posti)
- "Checklist" → "Rapporto" o "Scheda Intervento"
- "Lavori" → "Interventi" (coerenza)

## Navigazione da Riorganizzare

Attuale:
- Dashboard
- Lavori
- Preventivi
- Clienti
- Materiali
- Checklist
- Utenti
- Impostazioni

Nuova:
- Dashboard
- Interventi (Lavori)
- Agenda (nuova sezione)
- Clienti
- Preventivi
- Materiali
- Rapporti (ex Checklist)
- Impostazioni

