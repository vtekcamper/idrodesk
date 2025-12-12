# UI/UX Audit - IdroDesk Frontend

## Stato Attuale

### ✅ Presente
- Tailwind CSS configurato
- Inter font (Google Fonts)
- Layout base (AdminLayout, DashboardLayout)
- React Query per data fetching
- React Hook Form + Zod per forms

### ❌ Mancante
- shadcn/ui (componenti Radix)
- lucide-react (icone moderne)
- recharts (grafici)
- Design system centralizzato
- Theme system (light/dark)
- Componenti UI riutilizzabili
- Skeleton/empty/error states coerenti
- DataTable con sorting/pagination
- Toast notifications coerenti

## Pattern Incoerenti Identificati

1. **Emoji nei menu**: AdminLayout usa emoji (📊, 🏢, etc.) - da sostituire con icone lucide-react
2. **Tabelle HTML base**: Nessuna tabella usa componenti riutilizzabili, sorting, pagination
3. **Card inconsistenti**: Alcune usano `.card`, altre stili inline
4. **Colori incoerenti**: Palette non standardizzata
5. **Loading states**: Alcuni skeleton, altri "Caricamento..."
6. **Empty states**: Messaggi semplici, nessun CTA
7. **Forms**: Nessun componente form riutilizzabile
8. **Badge stati**: Stili inline, non componenti

## Pagine da Refactorare (Priorità)

### Admin (Alta Priorità)
1. `/admin/dashboard` - Dashboard con emoji, card basic
2. `/admin/companies` - Tabella HTML base
3. `/admin/users` - Tabella HTML base
4. `/admin/payments` - Tabella HTML base
5. `/admin/reports` - Nessun grafico
6. `/admin/audit-logs` - Tabella base

### Tenant (Alta Priorità)
1. `/dashboard` - Dashboard base
2. `/clients` - Tabella base
3. `/jobs` - Tabella base
4. `/quotes` - Tabella base
5. `/materials` - Tabella base
6. `/checklists` - Lista base

### Auth (Media Priorità)
1. `/login` - Form base
2. `/register` - Form base

## Componenti da Creare

1. **PageHeader** - Titolo, descrizione, breadcrumb, CTA
2. **StatCard** - Numero, label, delta %
3. **DataTable** - Wrapper con sorting/pagination
4. **FilterBar** - Search, select, date range
5. **EmptyState** - Icona + testo + CTA
6. **ConfirmDialog** - Dialog conferma
7. **FormSection** - Titolo + descrizione + contenuto
8. **StatusBadge** - Enum → stile
9. **Skeleton** - Set coerente
10. **ErrorState** - Errore + retry button
11. **Toast** - Notifiche coerenti

## Design Tokens da Definire

- Primary: blu moderno (#2563eb)
- Success: verde (#10b981)
- Warning: giallo (#f59e0b)
- Danger: rosso (#ef4444)
- Neutral: grigi bilanciati
- Radius: 12px (rounded-xl)
- Shadows: morbide e sottili

