# Lista elementów do przetestowania (Unit Tests)

## Priorytety testowania

### 🔴 Wysoki priorytet (krytyczne dla działania aplikacji)

#### 1. Validators (`app/lib/validators/*.ts`)
**Status:** ✅ Częściowo pokryte (`tests/unit/validators.test.ts`, `tests/unit/ticket-validators.test.ts`)

**Dlaczego:**
- Stanowią pierwszą linię obrony przed nieprawidłowymi danymi
- Błędy w walidacji mogą prowadzić do luk bezpieczeństwa
- Schematy Zod są używane wszędzie (API routes, forms)
- Łatwe do testowania - pure functions bez side effects

**Co testować:**
- ✅ `validators/auth.ts` - loginSchema, changePasswordSchema
- ✅ `validators/tickets.ts` - createTicketSchema, updateTicketStatusSchema
- ⚠️ `validators/categories.ts` - getCategoriesQuerySchema (brak testów)
- ⚠️ `validators/ai.ts` - aiCompletionSchema (brak testów)

**Rekomendacja:** Rozszerzyć pokrycie o brakujące schematy

---

#### 2. Utils (`app/lib/utils/*.ts`)

##### 2a. `utils/api-response.ts`
**Status:** ❌ Brak testów

**Dlaczego:**
- Używany w każdym API route handler
- Standaryzuje formatowanie odpowiedzi API
- Obsługuje różne typy błędów (ZodError, generyczne)
- Krityczny dla spójności API

**Co testować:**
```typescript
describe('apiResponse', () => {
  // Success responses
  test('formatuje prawidłową odpowiedź sukcesu')
  test('zawiera właściwe nagłówki i status code')
  
  // Error handling
  test('formatuje ZodError z poprawnymi szczegółami walidacji')
  test('formatuje generyczne błędy')
  test('ukrywa wrażliwe dane w produkcji')
  test('zwraca właściwe kody HTTP dla różnych błędów')
})
```

##### 2b. `utils/auth.ts`
**Status:** ❌ Brak testów

**Dlaczego:**
- Zawiera middleware `withAuth`, `withRole`, `requireAuth`
- Krytyczny dla bezpieczeństwa aplikacji
- Kontroluje dostęp do API endpoints
- Logika weryfikacji JWT i uprawnień

**Co testować:**
```typescript
describe('withAuth', () => {
  test('przepuszcza żądania z prawidłowym tokenem')
  test('blokuje żądania bez tokenu')
  test('blokuje żądania z nieprawidłowym tokenem')
  test('zwraca 401 dla wygasłych tokenów')
})

describe('withRole', () => {
  test('przepuszcza użytkowników z odpowiednią rolą')
  test('blokuje użytkowników bez odpowiedniej roli')
  test('zwraca 403 dla nieautoryzowanych ról')
})

describe('requireAuth', () => {
  test('zwraca dane użytkownika dla prawidłowej sesji')
  test('rzuca błąd dla nieprawidłowej sesji')
})
```

##### 2c. `utils/supabase-auth.ts`
**Status:** ❌ Brak testów

**Dlaczego:**
- Integracja z Supabase auth
- Konwersja między typami bazy danych a aplikacji
- Helper functions dla sesji

**Co testować:**
- Funkcje pomocnicze (jeśli są pure functions)
- Transformacje danych
- Edge cases (null, undefined, brakujące pola)

---

#### 3. Services (`app/lib/services/*.ts`)

##### 3a. `services/auth.ts`
**Status:** ❌ Brak testów

**Dlaczego:**
- Kluczowa logika biznesowa autoryzacji
- Haszowanie haseł (bcryptjs)
- Generowanie i weryfikacja JWT (jose)
- Operacje na bazie danych (logowanie, zmiana hasła)

**Co testować (z mockami Supabase):**
```typescript
describe('AuthService', () => {
  describe('login', () => {
    test('zwraca token dla prawidłowych credentials')
    test('rzuca błąd dla nieprawidłowego emaila')
    test('rzuca błąd dla nieprawidłowego hasła')
    test('weryfikuje hash hasła za pomocą bcrypt')
    test('generuje prawidłowy JWT token')
  })
  
  describe('changePassword', () => {
    test('zmienia hasło dla prawidłowego starego hasła')
    test('rzuca błąd dla nieprawidłowego starego hasła')
    test('haszuje nowe hasło przed zapisem')
    test('zwraca nowy token JWT')
  })
  
  describe('verifyToken', () => {
    test('weryfikuje prawidłowy token')
    test('rzuca błąd dla nieprawidłowego tokenu')
    test('rzuca błąd dla wygasłego tokenu')
  })
})
```

##### 3b. `services/tickets.ts`
**Status:** ❌ Brak testów

**Dlaczego:**
- Główna logika biznesowa aplikacji
- CRUD operations dla ticketów
- Przypisywanie ticketów do agentów
- Zmiana statusów
- Filtrowanie i sortowanie

**Co testować (z mockami):**
```typescript
describe('TicketService', () => {
  describe('createTicket', () => {
    test('tworzy ticket z prawidłowymi danymi')
    test('przypisuje domyślny status "new"')
    test('weryfikuje istnienie kategorii')
    test('zapisuje do bazy danych')
  })
  
  describe('assignTicket', () => {
    test('przypisuje ticket do agenta')
    test('weryfikuje czy agent ma dostęp do kategorii')
    test('zmienia status na "assigned"')
    test('rzuca błąd jeśli agent nie ma dostępu')
  })
  
  describe('updateStatus', () => {
    test('zmienia status ticketa')
    test('waliduje przejścia stanów (FSM)')
    test('zapisuje timestamp zmiany')
  })
  
  describe('getTickets', () => {
    test('zwraca wszystkie tickety dla admina')
    test('filtruje tickety po statusie')
    test('filtruje tickety po kategorii')
    test('zwraca tylko tickety użytkownika dla roli "user"')
    test('zwraca tickety z przypisanych kategorii dla agenta')
  })
})
```

##### 3c. `services/categories.ts`
**Status:** ❌ Brak testów

**Dlaczego:**
- Zarządzanie kategoriami i subkategoriami
- Hierarchia danych
- Używany w wielu miejscach

**Co testować:**
```typescript
describe('CategoryService', () => {
  test('pobiera wszystkie kategorie z subkategoriami')
  test('pobiera pojedynczą kategorię')
  test('filtruje kategorie po typie')
  test('obsługuje brakujące kategorie (404)')
})
```

##### 3d. `services/agent-categories.ts`
**Status:** ❌ Brak testów

**Dlaczego:**
- Zarządzanie przypisaniami agentów do kategorii
- Kontrola dostępu oparta na kategoriach
- Wpływa na widoczność ticketów

**Co testować:**
```typescript
describe('AgentCategoryService', () => {
  test('pobiera kategorie przypisane do agenta')
  test('dodaje agenta do kategorii')
  test('usuwa agenta z kategorii')
  test('weryfikuje czy agent ma dostęp do kategorii')
})
```

##### 3e. `services/openrouter/*`
**Status:** ❌ Brak testów

**Dlaczego:**
- Integracja z zewnętrznym API (OpenRouter AI)
- Obsługa błędów sieci
- Rate limiting
- Formatowanie promptów i odpowiedzi

**Co testować:**
```typescript
describe('OpenRouterService', () => {
  describe('complete', () => {
    test('wysyła prawidłowe żądanie do API')
    test('formatuje prompt zgodnie z API')
    test('parsuje odpowiedź z API')
    test('obsługuje błędy sieci')
    test('obsługuje timeout')
    test('rzuca odpowiednie błędy dla kodów HTTP')
  })
  
  describe('errors', () => {
    test('OpenRouterError zawiera właściwe informacje')
    test('mapuje kody HTTP na błędy domenowe')
  })
})
```

---

#### 4. Middleware (`app/lib/middleware/*.ts`)

##### 4a. `middleware/rate-limiter.ts`
**Status:** ❌ Brak testów

**Dlaczego:**
- Ochrona przed abuse
- Krytyczny dla wydajności i bezpieczeństwa
- Logika limitowania żądań

**Co testować:**
```typescript
describe('RateLimiter', () => {
  test('przepuszcza żądania poniżej limitu')
  test('blokuje żądania powyżej limitu')
  test('resetuje licznik po upływie czasu')
  test('używa właściwych kluczy (IP, user ID)')
  test('zwraca odpowiednie nagłówki (X-RateLimit-*)')
  test('obsługuje współbieżne żądania')
})
```

---

### 🟡 Średni priorytet (ważne, ale mniej krytyczne)

#### 5. Hooks (`app/hooks/*.ts`)

##### 5a. `useTickets.ts`
**Status:** ❌ Brak testów

**Dlaczego:**
- Centralny punkt zarządzania stanem ticketów
- Używany w wielu komponentach
- Logika filtrowania i sortowania po stronie klienta

**Co testować (z React Testing Library):**
```typescript
describe('useTickets', () => {
  test('pobiera tickety przy montowaniu')
  test('filtruje tickety lokalnie')
  test('odświeża listę po utworzeniu nowego ticketa')
  test('obsługuje błędy podczas ładowania')
  test('pokazuje stan loading podczas pobierania')
})
```

##### 5b. `useCategories.ts`
**Status:** ❌ Brak testów

**Dlaczego:**
- Zarządzanie listą kategorii
- Cache'owanie danych
- Używany w formularzach

**Co testować:**
```typescript
describe('useCategories', () => {
  test('pobiera kategorie przy montowaniu')
  test('cache\'uje wyniki')
  test('obsługuje błędy')
  test('obsługuje puste listy')
})
```

##### 5c. `useRealtimeTickets.ts`
**Status:** ❌ Brak testów (trudne - realtime)

**Dlaczego:**
- Integracja z Supabase Realtime
- Krytyczny dla user experience
- Obsługa WebSocket connections

**Uwaga:** Test realtime może wymagać mocków Supabase client. Można przetestować logikę obsługi zdarzeń.

```typescript
describe('useRealtimeTickets', () => {
  test('subskrybuje zmiany w ticketach')
  test('aktualizuje listę po otrzymaniu INSERT')
  test('aktualizuje listę po otrzymaniu UPDATE')
  test('aktualizuje listę po otrzymaniu DELETE')
  test('odsubskrybowuje przy unmount')
  test('obsługuje błędy połączenia')
})
```

---

#### 6. API Client (`app/lib/api-client.ts`)
**Status:** ❌ Brak testów

**Dlaczego:**
- Centralny punkt komunikacji z backend
- Obsługa błędów HTTP
- Formatowanie żądań i odpowiedzi
- Zarządzanie tokenami

**Co testować (z msw lub fetch mock):**
```typescript
describe('ticketsApi', () => {
  test('wysyła GET do /api/tickets')
  test('załącza token autoryzacji')
  test('parsuje odpowiedź JSON')
  test('obsługuje błędy 401 (przekierowanie do login)')
  test('obsługuje błędy 500')
  test('formatuje query params')
})

describe('authApi', () => {
  test('wysyła credentials do /api/auth/login')
  test('zapisuje token w localStorage/cookies')
  test('obsługuje błędy logowania')
})

describe('categoriesApi', () => {
  test('pobiera kategorie z cache')
  test('odświeża cache po invalidacji')
})
```

---

### 🟢 Niski priorytet (nice to have)

#### 7. Server Actions (`app/actions/ai/complete.ts`)
**Status:** ❌ Brak testów

**Dlaczego:**
- Server actions są testowane głównie przez integrację/E2E
- Można testować logikę biznesową w izolacji

**Co testować:**
```typescript
describe('completeAi', () => {
  test('wywołuje OpenRouter service')
  test('waliduje input z Zod')
  test('formatuje odpowiedź')
  test('obsługuje błędy API')
})
```

---

## Podsumowanie priorytetów

### Must-have (przed wdrożeniem produkcyjnym)
1. ✅ Validators (rozszerzyć pokrycie)
2. ❌ `utils/auth.ts` - bezpieczeństwo
3. ❌ `utils/api-response.ts` - stabilność API
4. ❌ `services/auth.ts` - autoryzacja
5. ❌ `services/tickets.ts` - core business logic
6. ❌ `middleware/rate-limiter.ts` - ochrona

### Should-have (dla lepszej jakości)
7. ❌ `services/categories.ts`
8. ❌ `services/agent-categories.ts`
9. ❌ `services/openrouter/*`
10. ❌ `api-client.ts`
11. ❌ Hooks (useTickets, useCategories)

### Nice-to-have (możliwe rozszerzenia)
12. ❌ `useRealtimeTickets.ts` (z mockami realtime)
13. ❌ Server actions
14. ❌ `utils/supabase-auth.ts`

---

## Strategia implementacji

### Faza 1: Fundament (tydzień 1)
- [ ] `utils/api-response.ts`
- [ ] `utils/auth.ts` (withAuth, withRole, requireAuth)
- [ ] `middleware/rate-limiter.ts`
- [ ] Rozszerzyć `validators/*` (categories, ai)

### Faza 2: Core Business Logic (tydzień 2)
- [ ] `services/auth.ts`
- [ ] `services/tickets.ts` (podstawowe operacje)
- [ ] `services/categories.ts`

### Faza 3: Integracje i Features (tydzień 3)
- [ ] `services/agent-categories.ts`
- [ ] `services/openrouter/*`
- [ ] `api-client.ts`
- [ ] `services/tickets.ts` (zaawansowane operacje)

### Faza 4: Frontend Logic (tydzień 4)
- [ ] `hooks/useTickets.ts`
- [ ] `hooks/useCategories.ts`
- [ ] `hooks/useRealtimeTickets.ts`

---

## Dlaczego unit testy są ważne dla tego projektu?

### 1. **Szybka informacja zwrotna**
   - Vitest działa w watch mode
   - Testy wykonują się w milisekundach
   - Natychmiastowe wykrywanie regresji

### 2. **Dokumentacja żywego kodu**
   - Testy pokazują jak używać API
   - Opisują oczekiwane zachowanie
   - Ułatwiają onboarding nowych developerów

### 3. **Ułatwienie refactoringu**
   - MVP będzie ewoluować
   - Testy dają pewność przy zmianach
   - Chronią przed wprowadzeniem błędów

### 4. **Bezpieczeństwo**
   - Autoryzacja musi działać bezbłędnie
   - Walidacja zapobiega atakom
   - Rate limiting chroni zasoby

### 5. **Jakość kodu**
   - Kod testowalny = kod modularny
   - Wymusza dobre praktyki (dependency injection)
   - Redukuje coupling

---

## Uwagi techniczne

### Mockowanie Supabase
```typescript
// tests/mocks/supabase.ts
vi.mock('@/app/lib/supabase-server', () => ({
  createSupabaseAdmin: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })),
  })),
}))
```

### Mockowanie fetch dla API client
```typescript
// Użyj msw (Mock Service Worker)
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

const server = setupServer(
  http.get('/api/tickets', () => {
    return HttpResponse.json({ tickets: [] })
  })
)
```

### Testowanie hooków
```typescript
import { renderHook, waitFor } from '@testing-library/react'

test('useTickets pobiera dane', async () => {
  const { result } = renderHook(() => useTickets())
  
  await waitFor(() => {
    expect(result.current.tickets).toHaveLength(5)
  })
})
```

---

## Metryki sukcesu

- ✅ Coverage validators: 100%
- 🎯 Coverage utils: >90%
- 🎯 Coverage services: >80%
- 🎯 Coverage hooks: >70%
- 🎯 Coverage ogólne: >75%
- ✅ Wszystkie testy przechodzą w CI/CD
- ✅ Testy działają w watch mode podczas development

---

*Dokument utworzony: 2025-10-15*
*Aktualizacja statusu: przed rozpoczęciem implementacji fazy 1*

