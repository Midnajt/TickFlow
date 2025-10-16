# Plan Dodania Roli ADMIN do TickFlow

**Data**: Październik 2025  
**Wersja**: 1.0  
**Status**: Plan do realizacji  
**Właściciel**: Zespół Rozwojowy

---

## 📋 Spis Treści

1. [Przegląd](#przegląd)
2. [Kroki Implementacji](#kroki-implementacji)
3. [Szczegóły Techniczne](#szczegóły-techniczne)
4. [Testing](#testing)
5. [Wdrożenie](#wdrożenie)

---

## 🎯 Przegląd

### Cel
Dodanie nowej roli użytkownika **ADMIN** do systemu TickFlow, która będzie posiadać wszystkie uprawnienia roli AGENT i USER, z możliwością rozszerzenia o funkcjonalności administerskie w przyszłości.

### Zakres Roli ADMIN

| Uprawnienie | USER | AGENT | ADMIN |
|---|---|---|---|
| Logowanie | ✅ | ✅ | ✅ |
| Tworzenie ticketu | ✅ | ✅ | ✅ |
| Podgląd własnych ticketów | ✅ | ✅ | ✅ |
| Podgląd ticketów z kategorii | ❌ | ✅ | ✅ (wszystkie) |
| Przypisywanie ticketu | ❌ | ✅ | ✅ (wszystkie) |
| Zmiana statusu ticketu | ❌ | ✅ | ✅ (wszystkie) |
| **Przyszłe funkcjonalności** | | | |
| Zarządzanie kategoriami | ❌ | ❌ | ⏳ |
| Zarządzanie agentami | ❌ | ❌ | ⏳ |
| Raportowanie i analityka | ❌ | ❌ | ⏳ |
| Zarządzanie użytkownikami | ❌ | ❌ | ⏳ |

---

## 🚀 Kroki Implementacji

### FAZA 1: Baza Danych

#### Krok 1.1: Aktualizacja Enum `role` w Supabase
**Plik**: `supabase/migrations/20251016_add_admin_role.sql`

Status: ✅ Plik istnieje (pusty)

**Działanie**:
- Dodać nową wartość `'ADMIN'` do enum `role`
- Migracja powinna być bezpieczna (nie zmienia istniejące dane)

```sql
-- migration: add admin role
-- purpose: add ADMIN role to role enum
-- affected: role enum, users table

-- Alter the existing role enum to include ADMIN
ALTER TYPE role ADD VALUE 'ADMIN' AFTER 'AGENT';
```

**Weryfikacja**:
```bash
# Po uruchomieniu migracji, sprawdzić czy enum został zaktualizowany
psql $DATABASE_URL -c "SELECT enum_range(NULL::role);"
```

---

### FAZA 2: TypeScript Types

#### Krok 2.1: Aktualizacja Database Types
**Plik**: `app/lib/database.types.ts`

**Działanie**:
- Zaktualizować enum `role` w `Enums` (linia ~316)
- Zmienić z `role: "USER" | "AGENT"` na `role: "USER" | "AGENT" | "ADMIN"`

```typescript
// Zmienić z:
role: ["USER", "AGENT"] as const,

// Na:
role: ["USER", "AGENT", "ADMIN"] as const,
```

#### Krok 2.2: Regeneracja Types z Supabase CLI (opcjonalnie)
```bash
npx supabase gen types typescript --project-id your-project > app/lib/database.types.ts
```

---

### FAZA 3: Logika Usług i Autoryzacji

#### Krok 3.1: Aktualizacja `AgentCategoryService`
**Plik**: `app/lib/services/agent-categories.ts`

**Działanie**:
- Zaktualizować metodę `getAgentCategories()` aby obsługiwała rolę ADMIN
- Admin powinien mieć dostęp do wszystkich kategorii bez konieczności przypisania

```typescript
// W getAgentCategories - dodać warunek dla ADMIN
if (userRole === 'ADMIN') {
  // Admin ma dostęp do wszystkich kategorii
  // Zamiast sprawdzać agent_categories, pobrać wszystkie kategorie
  const { data, error } = await supabase
    .from('categories')
    .select(...)
    .order('name', { ascending: true });
}
```

**Metody do aktualizacji**:
- `getAgentCategories()` - dla admina zwrócić wszystkie kategorie
- `hasAccessToCategory()` - dla admina zawsze zwrócić `true`
- `hasAccessToTicket()` - dla admina zawsze zwrócić `true`
- `getAgentCategoryIds()` - dla admina zwrócić wszystkie category IDs

#### Krok 3.2: Aktualizacja `TicketQueryService`
**Plik**: `app/lib/services/tickets/ticket-query.service.ts`

**Działanie**:
- Zaktualizować metodę `verifyUserAccess()` aby obsługiwała rolę ADMIN
- Admin powinien mieć dostęp do wszystkich ticketów

```typescript
// W verifyUserAccess - dodać warunek dla ADMIN
if (userRole === 'ADMIN') {
  // Admin ma dostęp do wszystkich ticketów
  return; // Pominąć sprawdzenie uprawnień
}
```

#### Krok 3.3: Aktualizacja `TicketQueryBuilder`
**Plik**: `app/lib/services/tickets/ticket-query-builder.ts`

**Działanie**:
- Zaktualizować metodę `forUser()` aby obsługiwała rolę ADMIN
- Admin widzi wszystkie tickety (bez filtrowania)

```typescript
// W forUser - dodać warunek dla ADMIN
if (userRole === 'ADMIN') {
  // Admin widzi wszystkie tickety
  return this; // Brak filtrowania
}
```

#### Krok 3.4: Aktualizacja `TicketCommandService`
**Plik**: `app/lib/services/tickets/ticket-command.service.ts`

**Działanie**:
- Zaktualizować autoryzację w metodach modyfikujących tickety
- Admin może przypisywać/zmieniać status wszystkich ticketów

```typescript
// W assignTicket() - dodać warunek dla ADMIN
if (userRole === 'ADMIN') {
  // Admin może przypisać każdy ticket sobie lub innemu agentowi
  return; // Pominąć sprawdzenie kategorii
}

// W updateTicketStatus() - dodać warunek dla ADMIN
if (userRole === 'ADMIN') {
  // Admin może zmienić status każdego ticketu
  return; // Pominąć sprawdzenie uprawnień
}
```

---

### FAZA 4: Walidatory

#### Krok 4.1: Aktualizacja Auth Validators
**Plik**: `app/lib/validators/auth.ts`

**Działanie**:
- Brak zmian wymaganych - validators dla logowania/hasła nie zawierają hardcoded ról

---

### FAZA 5: Komponenty Frontend

#### Krok 5.1: Aktualizacja `DashboardHeader`
**Plik**: `app/components/DashboardHeader.tsx`

**Działanie**:
- Dodać style dla roli ADMIN (kolor badge'a)
- Opcjonalnie: wyróżnić admina specjalnym kolorem/ikoną

```typescript
// W warunkowym CSS - dodać przypadek ADMIN
className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
  user.role === 'AGENT'
    ? 'bg-purple-900 text-purple-300'
    : user.role === 'ADMIN'
    ? 'bg-red-900 text-red-300'     // Nowe - kolor dla admina
    : 'bg-blue-900 text-blue-300'
}`}
```

#### Krok 5.2: Aktualizacja Komponentów Ticketów
**Pliki**:
- `app/components/tickets/TicketList.tsx`
- `app/components/tickets/TicketCard.tsx`
- `app/components/tickets/CreateTicketForm.tsx`

**Działanie**:
- Admin widzi wszystkie tickety (jak AGENT widzi tickety z kategorii)
- Admin może przypisywać i zmieniać status wszystkich ticketów (bez ograniczeń kategorii)
- Brak zmian w formularzu tworzenia ticketu

---

### FAZA 6: Strony

#### Krok 6.1: Aktualizacja `app/tickets/page.tsx`
**Plik**: `app/tickets/page.tsx`

**Działanie**:
- Admin widzi wszystkie tickety (bez filtrowania po kategoriach)
- Opcjonalnie: wyświetlić różne opcje filtrowania dla admina

#### Krok 6.2: Aktualizacja `app/page.tsx` (Dashboard)
**Plik**: `app/page.tsx`

**Działanie**:
- Wyświetlić dashboard z informacjami dla admina
- Opcjonalnie: inne statystyki dla admina (wszystkie tickety, wszystkie kategorie)

---

### FAZA 7: Scripts Seeding

#### Krok 7.1: Aktualizacja `seed-users.ts`
**Plik**: `scripts/seed-users.ts`

**Działanie**:
- Dodać testowego użytkownika z rolą ADMIN
- Domyślne hasło: `Start!125`
- Wymuszenie zmiany hasła przy pierwszym logowaniu

```typescript
// Dodać do tablicy users:
{
  email: 'admin@firma.pl',
  name: 'Admin Testowy',
  role: 'ADMIN',
  password: 'Start!125',
  force_password_change: true
}
```

#### Krok 7.2: Aktualizacja `seed-navireo.ts` (jeśli istnieje)
**Plik**: `scripts/seed-navireo.ts`

**Działanie**:
- Dodać testowego admina jeśli skrypt wykorzystywany

---

### FAZA 8: Testy

#### Krok 8.1: Aktualizacja Unit Testów
**Pliki do utworzenia/aktualizacji**:
- `tests/unit/admin-role.test.ts` (nowy plik)

**Zakres**:
- Test `AgentCategoryService.getAgentCategories()` dla admina
- Test `AgentCategoryService.hasAccessToCategory()` dla admina
- Test autoryzacji w ticket service dla admina

```typescript
describe('ADMIN role authorization', () => {
  it('should grant ADMIN access to all categories', async () => {
    // Test że admin ma dostęp do wszystkich kategorii
  });

  it('should grant ADMIN access to all tickets', async () => {
    // Test że admin widzi wszystkie tickety
  });

  it('should allow ADMIN to assign any ticket', async () => {
    // Test że admin może przypisać każdy ticket
  });
});
```

#### Krok 8.2: Aktualizacja Integration Testów
**Pliki**:
- `tests/integration/api/*.test.ts`

**Działanie**:
- Dodać testy dla API endpoints z rolą ADMIN
- Weryfikacja że admin ma dostęp do wszystkich ticketów/kategorii

#### Krok 8.3: Aktualizacja E2E Testów
**Plik**: `tests/e2e/auth.spec.ts`

**Działanie**:
- Dodać test dla logowania jako admin
- Weryfikacja widoku dashboardu dla admina
- Test przypisywania ticketów jako admin

```typescript
test('admin can see all tickets', async ({ page }) => {
  // Login as admin
  // Navigate to tickets
  // Verify all tickets are visible
});
```

---

## 🔧 Szczegóły Techniczne

### Zmiany w Uprawnieniach (Authorization)

#### Przed
```typescript
if (user.role === 'AGENT') {
  // Sprawdzić dostęp do kategorii
  const hasAccess = await checkAgentCategoryAccess();
}
```

#### Po
```typescript
if (user.role === 'AGENT') {
  // Sprawdzić dostęp do kategorii
  const hasAccess = await checkAgentCategoryAccess();
} else if (user.role === 'ADMIN') {
  // Admin ma pełny dostęp
  return true;
}
```

### Komunikacja z Frontendem

Admin powinien być reprezentowany jako:
```typescript
interface UserSessionDTO {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'AGENT' | 'ADMIN';
  passwordResetRequired: boolean;
}
```

---

## 🧪 Testing

### Checklist Testowy

- [ ] Enum role w Supabase zawiera 'ADMIN'
- [ ] Database types zawierają 'ADMIN'
- [ ] Testowy admin może się zalogować
- [ ] Admin widzi wszystkie tickety
- [ ] Admin może przypisać każdy ticket
- [ ] Admin może zmienić status każdego ticketu
- [ ] Admin widzi dashboard z wszystkimi danymi
- [ ] Ikona roli admin wyświetla się poprawnie
- [ ] Testy jednostkowe przechodzą
- [ ] Testy integracyjne przechodzą
- [ ] Testy E2E przechodzą

### Polecenia Testowe

```bash
# Testy jednostkowe
npm test -- admin-role.test.ts

# Testy integracyjne
npm run test:integration

# Testy E2E
npm run test:e2e

# Wszystkie testy
npm run test:all
```

---

## 📈 Wdrożenie

### Kolejność Działań

1. **FAZA 1**: Uruchomić migrację bazy danych
2. **FAZA 2**: Zaktualizować types
3. **FAZA 3**: Zaktualizować logikę serwisów
4. **FAZA 5-6**: Aktualizacje frontend
5. **FAZA 7**: Zaktualizować seed scripts
6. **FAZA 8**: Dodać/zaktualizować testy
7. **Testowanie**: Uruchomić pełną batię testów
8. **Code Review**: Przegląd zmian
9. **Merge**: Scalić do main

### Deployment

```bash
# 1. Merge do main
git merge feature/add-admin-role

# 2. Supabase migration
npx prisma migrate deploy

# 3. Deploy na Vercel
git push origin main

# 4. Seed testowego admina
npm run seed
```

---

## 📝 Notatki

### Future Enhancements (Faza 2)

- Zarządzanie kategoriami (CRUD)
- Zarządzanie agentami (przypisywanie kategorii)
- Raportowanie i analityka (statystyki ticketów)
- Zarządzanie użytkownikami (tworzenie, usuwanie, zmiana roli)
- Audit log (śledzenie akcji admina)
- Permissions management (bardziej granularne uprawnienia)

### Bezpieczeństwo

- Admin ma dostęp do wszystkich danych - **wymagane monitorowanie działań**
- Rozważ dodanie audit logu dla akcji admina
- Ogranicz rolę admina tylko do zaufanych osób

### Performance

- Admin widzi wszystkie tickety - może być wolne z dużą ilością danych
- Rozważ paginację
- Rozważ indeksy w bazie dla lepszej wydajności zapytań

---

## ✅ Definicja Done

Rola ADMIN będzie uznana za gotową, gdy:

- ✅ Enum role zawiera wartość 'ADMIN'
- ✅ Admin może się zalogować
- ✅ Admin widzi wszystkie tickety (bez filtrowania po kategoriach)
- ✅ Admin może przypisywać wszystkie tickety (bez ograniczeń)
- ✅ Admin może zmieniać status wszystkich ticketów
- ✅ Admin widzi wszystkie kategorie
- ✅ Ikona roli wyświetla się poprawnie na UI
- ✅ Testy jednostkowe, integracyjne i E2E przechodzą
- ✅ Code zmergowany do main
- ✅ Deploy na production powodzony

