# Szybki Przewodnik - Testy Jednostkowe

## Szybki Start

### 1. Uruchom wszystkie nowe testy

```bash
# Wszystkie testy jednostkowe
npm test

# Lub w watch mode (zalecane podczas development)
npm run test:watch
```

### 2. Uruchom tylko nowe testy z Fazy 1

```bash
# Walidatory
npm test -- category-validators
npm test -- ai-validators

# Utils
npm test -- api-response
npm test -- auth-utils

# Middleware  
npm test -- rate-limiter
```

### 3. Sprawdź pokrycie

```bash
npm run test:coverage
```

Raport pojawi się w terminalu oraz zostanie wygenerowany w `coverage/index.html`

### 4. Debugowanie z UI

```bash
npm run test:ui
```

Otwiera graficzny interfejs Vitest do analizy testów.

## Struktura Nowych Testów

```
tests/unit/
├── category-validators.test.ts  (~10 testów)
├── ai-validators.test.ts        (~35 testów)  
├── api-response.test.ts         (~25 testów)
├── auth-utils.test.ts           (~30 testów)
└── rate-limiter.test.ts         (~30 testów)
```

**Łącznie:** ~120+ nowych testów jednostkowych

## Co Testujemy?

### ✅ Validators
- Parametry modelu AI (temperature, max_tokens, top_p, penalties)
- Prompty i limity znaków (max 4000)
- JSON Schema validation
- Query parameters (includeSubcategories)

### ✅ API Response Utils
- Success responses z różnymi status codes
- Error responses (400, 401, 403, 404, 500)
- Formatowanie błędów walidacji z Zod
- Edge cases (długie wiadomości, unicode, znaki specjalne)

### ✅ Auth Utils & Middleware
- Ekstrakcja JWT tokenów (cookie, Authorization header)
- `requireAuth` - walidacja sesji
- `hasRole` / `requireRole` - RBAC
- `withAuth` / `withRole` - middleware wrappers
- Obsługa błędów (401, 403)

### ✅ Rate Limiter
- Limitowanie żądań (5 req/min per IP)
- Time windows (60s reset)
- IP extraction (x-forwarded-for, x-real-ip)
- Rate limit headers
- Concurrent requests handling

## Typowe Problemy i Rozwiązania

### Problem: "Cannot find module 'vitest'"

```bash
npm install
```

Upewnij się, że wszystkie dependencies są zainstalowane.

### Problem: Testy przechodzą ale TypeScript pokazuje błędy

To normalne - linter TypeScript czasem nie widzi types z node_modules.  
Testy działają poprawnie w runtime.

### Problem: "Module not found" podczas importu z @/

Sprawdź czy `vitest.config.ts` ma poprawnie skonfigurowane path aliases:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './app')
  }
}
```

### Problem: Testy rate-limiter timeout

Rate limiter używa fake timers (`vi.useFakeTimers()`).  
Sprawdź czy w `beforeEach` / `afterEach` jest `vi.useRealTimers()`.

## Mockowanie w Testach

### AuthService Mock (auth-utils.test.ts)

```typescript
vi.mock('@/app/lib/services/auth', () => ({
  AuthService: {
    getSession: vi.fn()
  }
}))

// W teście
vi.mocked(AuthService.getSession).mockResolvedValue({
  user: mockUser,
  token: 'valid-token',
  expiresAt: '...'
})
```

### NextRequest Mock

```typescript
const request = new NextRequest('http://localhost:3000/api/test', {
  headers: {
    'Authorization': 'Bearer token',
    'x-forwarded-for': '192.168.1.1'
  }
})
```

### Fake Timers (rate-limiter)

```typescript
beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

// W teście
vi.advanceTimersByTime(61 * 1000) // +61 sekund
```

## Sprawdzanie Konkretnych Scenariuszy

### Test: Rate limiter blokuje po 5 żądaniach

```bash
npm test -- rate-limiter -t "should block requests exceeding"
```

### Test: Auth middleware zwraca 401 bez tokenu

```bash
npm test -- auth-utils -t "should return 401 when no token"
```

### Test: AI validator odrzuca temperature > 2

```bash
npm test -- ai-validators -t "should reject temperature above"
```

### Test: Zod errors są formatowane poprawnie

```bash
npm test -- api-response -t "should format ZodError"
```

## Metryki Sukcesu

Po uruchomieniu `npm run test:coverage` sprawdź:

- ✅ **Lines:** >95% dla validators, utils, middleware
- ✅ **Functions:** >95%
- ✅ **Branches:** >90%
- ✅ **Statements:** >95%

## CI/CD

Testy uruchamiają się automatycznie w GitHub Actions przy:
- Push do main/develop
- Pull requests
- Manual workflow dispatch

Sprawdź plik `.github/workflows/test.yml` dla konfiguracji.

## Następne Kroki

Po zweryfikowaniu że Faza 1 działa poprawnie:

1. **Faza 2**: Testy dla Services
   - `services/auth.ts`
   - `services/tickets.ts`  
   - `services/categories.ts`
   - `services/agent-categories.ts`

2. **Faza 3**: Testy dla Hooks
   - `useTickets.ts`
   - `useCategories.ts`
   - `useRealtimeTickets.ts`

Zobacz `docs/app-test-list.md` dla pełnego planu.

## Pomocne Komendy

```bash
# Tylko watch dla jednego pliku
npm test -- auth-utils --watch

# Tylko failed testy
npm test -- --reporter=verbose --reporter=json

# Coverage tylko dla unit tests
npm test -- --coverage tests/unit/

# Clear cache jeśli coś nie działa
npm test -- --clearCache
```

## Dokumentacja

- 📄 `docs/TESTING_PHASE1_COMPLETE.md` - Szczegółowy raport z Fazy 1
- 📄 `docs/app-test-list.md` - Pełna lista elementów do testowania
- 📄 `tests/README.md` - Kompletny przewodnik testowania
- 📄 `.ai/test-plan.md` - Strategia testowania projektu

## Pytania?

Sprawdź `tests/README.md` lub `docs/TESTING_PHASE1_COMPLETE.md` dla szczegółów.

---

*Powodzenia z testowaniem! 🚀*

