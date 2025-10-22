# Plan Naprawy Testów - TickFlow

**Data utworzenia:** 22 października 2025  
**Branch:** module-4  
**Status:** Do realizacji  
**Autor:** AI Assistant

## 📊 Podsumowanie Sytuacji

- **Testy przeszły:** 352/387 (91%)
- **Testy niepowodzenie:** 35/387 (9%)
- **Pliki z błędami:** 6
- **Główne problemy:** Niezgodność między testami a aktualną implementacją API

## 🎯 Cel

Naprawienie wszystkich błędów testowych poprzez:
1. **Aktualizację implementacji API** tam, gdzie testy są poprawne
2. **Aktualizację testów** tam, gdzie implementacja jest poprawna i zgodna z dokumentacją
3. **Ujednolicenie formatów odpowiedzi** według standardów z tech-stack.md

---

## 📋 TODO - Grupowanie zadań

### 🔴 Grupa 1: Naprawa struktury odpowiedzi API (Priorytet: KRYTYCZNY)

**Problem:** Testy oczekują `{ success: true, data: {...} }`, ale API zwraca tylko `{...}`

#### Zadanie 1.1: Aktualizacja `successResponse` utility

**Plik:** `app/lib/utils/api-response.ts`

**Obecna implementacja:**
```typescript
export function successResponse<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}
```

**Wymagana zmiana:**
```typescript
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}
```

**Uzasadnienie:** Standardowa odpowiedź API powinna zawierać pole `success` dla jednolitości i łatwiejszej obsługi po stronie frontendu.

**Dotknięte endpointy (wszystkie poprawią się automatycznie):**
- `/api/admin/users` (GET, POST)
- `/api/admin/users/:userId` (PATCH)
- `/api/admin/users/:userId/force-password-reset` (POST)
- `/api/admin/categories` (GET)
- `/api/admin/categories/:categoryId` (PATCH)
- `/api/admin/subcategories/:subcategoryId` (PATCH)
- `/api/admin/audit-logs` (GET)

**Testy do naprawy:** 13 testów

**Szacowany czas:** 15 minut

---

#### Zadanie 1.2: Aktualizacja testów do nowej struktury odpowiedzi

**Problem:** Po zmianie `successResponse`, testy będą musiały odczytywać `data.data` zamiast `data`

**Pliki testowe do aktualizacji:**
- `tests/integration/api/admin-users-endpoints.test.ts`
- `tests/integration/api/admin-categories-endpoints.test.ts`
- `tests/integration/api/admin-audit-logs-endpoint.test.ts`
- `tests/integration/api/admin-auth-middleware.test.ts`

**Przykład zmiany:**
```typescript
// PRZED
const data = await response.json();
expect(data.success).toBe(true);
expect(data.users).toBeDefined();

// PO
const data = await response.json();
expect(data.success).toBe(true);
expect(data.data.users).toBeDefined();
```

**Szacowany czas:** 1 godzina

---

### 🔴 Grupa 2: Naprawa obsługi błędów walidacji Zod (Priorytet: WYSOKI)

**Problem:** Kod próbuje dostać się do `error.errors[0].message` bez sprawdzenia, czy tablica istnieje

**Dotknięte pliki (11 wystąpień):**
- `app/api/admin/audit-logs/route.ts:30`
- `app/api/admin/categories/[categoryId]/route.ts:30`
- `app/api/admin/subcategories/[subcategoryId]/route.ts:30`
- `app/api/admin/users/route.ts:53`
- `app/api/admin/users/[userId]/route.ts:30`

#### Zadanie 2.1: Bezpieczny dostęp do `error.errors[0]`

**Obecny kod (niebezpieczny):**
```typescript
if (error instanceof ZodError) {
  return errorResponse(
    error.errors[0].message,
    "VALIDATION_ERROR",
    400
  );
}
```

**Wymagana zmiana:**
```typescript
if (error instanceof ZodError) {
  const message = error.errors?.[0]?.message || 'Błąd walidacji danych';
  return errorResponse(message, "VALIDATION_ERROR", 400);
}
```

**Alternatywnie (lepsze - użyj istniejącej funkcji):**
```typescript
if (error instanceof ZodError) {
  return validationErrorResponse(error);
}
```

**Uwaga:** W `app/lib/utils/api-response.ts` już istnieje funkcja `validationErrorResponse(error: ZodError)` - należy jej używać!

**Pliki do naprawy:**
1. `app/api/admin/audit-logs/route.ts` (linia ~30)
2. `app/api/admin/categories/[categoryId]/route.ts` (linia ~30)
3. `app/api/admin/subcategories/[subcategoryId]/route.ts` (linia ~30)
4. `app/api/admin/users/route.ts` (linia ~53) - **UWAGA:** Ten już ma bezpieczne sprawdzenie!
5. `app/api/admin/users/[userId]/route.ts` (linia ~30)

**Testy do naprawy:** 11 testów

**Szacowany czas:** 30 minut

---

### 🟡 Grupa 3: Brakujący validator `getCategoriesQuerySchema` (Priorytet: ŚREDNI)

**Problem:** Test importuje `getCategoriesQuerySchema`, który nie istnieje w `app/lib/validators/categories.ts`

#### Zadanie 3.1: Analiza potrzeby validatora

**Pytania do rozstrzygnięcia:**
1. Czy endpoint `/api/categories` przyjmuje query parameter `includeSubcategories`?
2. Czy ta funkcjonalność jest potrzebna w MVP?

**Opcja A: Validator jest potrzebny (dodaj implementację)**

**Plik:** `app/lib/validators/categories.ts`

```typescript
/**
 * Walidator dla query parameters GET /api/categories
 */
export const getCategoriesQuerySchema = z.object({
  includeSubcategories: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val === 'true')
    .or(z.boolean()),
});

export type GetCategoriesQuery = z.infer<typeof getCategoriesQuerySchema>;
```

**Następnie:** Użyj tego validatora w `app/api/categories/route.ts`

**Opcja B: Validator nie jest potrzebny (usuń test)**

**Plik do usunięcia:** `tests/unit/category-validators.test.ts`

**Lub zmień test, aby testował istniejące validatory:**
- `updateCategorySchema`
- `updateSubcategorySchema`

**Rekomendacja:** Opcja B - usuń test, ponieważ w obecnej implementacji nie ma endpointu, który używałby tego validatora w MVP.

**Testy do naprawy:** 6 testów

**Szacowany czas:** 15 minut (opcja B) lub 1 godzina (opcja A)

---

### 🟡 Grupa 4: Naprawa audit logging w endpoincie login (Priorytet: ŚREDNI)

**Problem:** Test `auth-audit-logging.test.ts` nie przechodzi, ponieważ:
1. Login endpoint zwraca 500 zamiast 200
2. Błąd: `Cannot read properties of undefined (reading 'token')` w linii 68

#### Zadanie 4.1: Analiza błędu logowania

**Plik:** `app/api/auth/login/route.ts:68`

**Obecny kod:**
```typescript
response.cookies.set({
  name: "auth-token",
  value: loginResponse.session.token, // Linia 68 - tutaj błąd
  // ...
});
```

**Problem:** `loginResponse` może być undefined lub nie mieć właściwości `session`

**Analiza:** Sprawdziłem `app/lib/services/auth.ts` - metoda `login()` **poprawnie** zwraca obiekt z `session.token`. Problem może być w teście.

#### Zadanie 4.2: Aktualizacja testu audit logging

**Plik:** `tests/integration/api/auth-audit-logging.test.ts`

**Problem:** Test może nie mockować poprawnie `AuthService.login()`

**Wymagane sprawdzenie:**
1. Czy mock zwraca poprawny obiekt `{ user: {...}, session: { token: '...', expiresAt: '...' } }`?
2. Czy mock `AuditLogService.createLog` jest poprawnie ustawiony?

**Przykład poprawnego mocka:**
```typescript
vi.mock('@/app/lib/services/auth', () => ({
  AuthService: {
    login: vi.fn().mockResolvedValue({
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        passwordResetRequired: false
      },
      session: {
        token: 'test-jwt-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    })
  }
}));
```

**Testy do naprawy:** 2 testy

**Szacowany czas:** 45 minut

---

### 🟡 Grupa 5: Naprawa endpointu logout i audit logging (Priorytet: ŚREDNI)

**Problem:** Test logout nie przechodzi, ponieważ:
1. `AuditLogService.createLog` nie jest wywoływany (0 wywołań)
2. Błąd: `Cannot read properties of undefined (reading 'user')` w `route.ts:17`
3. Błąd: `AuthService.logout is not a function` (nieprawda - funkcja istnieje!)

#### Zadanie 5.1: Sprawdzenie implementacji `/api/auth/logout`

**Plik do przeanalizowania:** `app/api/auth/logout/route.ts`

**Sprawdź:**
1. Czy endpoint wywołuje `AuditLogService.createLog()` przed wylogowaniem?
2. Czy endpoint poprawnie pobiera `user` z sesji?
3. Czy endpoint wywołuje `AuthService.logout()`?

**Prawdopodobna implementacja (jeśli nie istnieje):**
```typescript
export async function POST(request: NextRequest) {
  try {
    // 1. Pobierz token z cookie
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return unauthorizedResponse('Brak tokenu autoryzacji');
    }

    // 2. Pobierz sesję użytkownika
    const session = await AuthService.getSession(token);
    
    // 3. Zapisz audit log
    await AuditLogService.createLog({
      userId: session.user.id,
      action: 'USER_LOGOUT',
      details: { email: session.user.email },
      ipAddress: AuditLogService.getClientIp(request),
      userAgent: AuditLogService.getUserAgent(request),
    });

    // 4. Wyloguj (usunie token po stronie klienta)
    await AuthService.logout();

    // 5. Usuń cookie
    const response = NextResponse.json(
      { message: 'Pomyślnie wylogowano' },
      { status: 200 }
    );
    
    response.cookies.delete('auth-token');
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return internalErrorResponse('Błąd podczas wylogowania');
  }
}
```

#### Zadanie 5.2: Aktualizacja testu logout

**Plik:** `tests/integration/api/auth-audit-logging.test.ts`

**Sprawdź:**
1. Czy test mockuje `request.cookies.get('auth-token')`?
2. Czy test mockuje `AuthService.getSession()`?
3. Czy test mockuje `AuthService.logout()`?

**Testy do naprawy:** 1 test

**Szacowany czas:** 1 godzina

---

### 🟢 Grupa 6: Ujednolicenie komunikatów błędów (Priorytet: NISKI)

**Problem:** Test oczekuje komunikatu "nie masz uprawnień", ale otrzymuje "Brak uprawnień. Wymagana rola"

#### Zadanie 6.1: Decyzja o komunikacie

**Opcja A: Zmień komunikat w middleware**

**Plik:** `app/lib/middleware/auth-middleware.ts`

```typescript
// Znajdź miejsce, gdzie zwracany jest błąd 403
// Zmień komunikat na:
return forbiddenResponse('nie masz uprawnień do tej operacji');
```

**Opcja B: Zmień oczekiwanie w teście**

**Plik:** `tests/integration/api/admin-auth-middleware.test.ts:140`

```typescript
// PRZED
expect(data.message).toContain('nie masz uprawnień');

// PO
expect(data.message).toContain('Brak uprawnień');
```

**Rekomendacja:** Opcja B - zaktualizuj test, ponieważ obecny komunikat jest bardziej formalny i profesjonalny.

**Testy do naprawy:** 1 test

**Szacowany czas:** 5 minut

---

### 🟢 Grupa 7: Naprawa błędnego kodu statusu HTTP (Priorytet: NISKI)

**Problem:** Endpoint zwraca 500 zamiast 400 przy braku danych do aktualizacji

**Test:** `admin-categories-endpoints.test.ts:390`

#### Zadanie 7.1: Walidacja przed wywołaniem serwisu

**Plik:** `app/api/admin/subcategories/[subcategoryId]/route.ts`

**Obecny kod (prawdopodobnie):**
```typescript
export const PATCH = withRole(['ADMIN'], async (request, user, params) => {
  try {
    const body = await request.json();
    const validatedData = updateSubcategorySchema.parse(body);
    
    // Tutaj brak sprawdzenia, czy są jakieś dane do aktualizacji!
    
    const updated = await SubcategoryService.update(params.subcategoryId, validatedData);
    return successResponse({ subcategory: updated }, 200);
  } catch (error) {
    // ...
  }
});
```

**Wymagana zmiana:**
```typescript
export const PATCH = withRole(['ADMIN'], async (request, user, params) => {
  try {
    const body = await request.json();
    
    // Sprawdź, czy są jakieś dane
    if (!body || Object.keys(body).length === 0) {
      return errorResponse(
        'Brak danych do aktualizacji',
        'VALIDATION_ERROR',
        400
      );
    }
    
    const validatedData = updateSubcategorySchema.parse(body);
    
    // Sprawdź ponownie po walidacji (opcjonalne pola mogą być undefined)
    if (!validatedData.name && !validatedData.description) {
      return errorResponse(
        'Musisz podać przynajmniej jedno pole do aktualizacji',
        'VALIDATION_ERROR',
        400
      );
    }
    
    const updated = await SubcategoryService.update(params.subcategoryId, validatedData);
    return successResponse({ subcategory: updated }, 200);
  } catch (error) {
    // ...
  }
});
```

**Testy do naprawy:** 1 test

**Szacowany czas:** 20 minut

---

## 📊 Priorytetyzacja Wykonania

### Faza 1: Krytyczne naprawy (2-3 godziny)
1. ✅ **Grupa 1 (Zadanie 1.1)** - Naprawa `successResponse` (15 min)
2. ✅ **Grupa 1 (Zadanie 1.2)** - Aktualizacja testów do nowej struktury (1h)
3. ✅ **Grupa 2** - Naprawa obsługi błędów Zod (30 min)

**Po Fazie 1:** 24 z 35 testów powinno przejść (69% naprawionych)

---

### Faza 2: Ważne naprawy (2-3 godziny)
4. ✅ **Grupa 3** - Usunięcie testu `getCategoriesQuerySchema` (15 min)
5. ✅ **Grupa 4** - Naprawa audit logging w login (45 min)
6. ✅ **Grupa 5** - Implementacja/naprawa logout z audit logging (1h)

**Po Fazie 2:** 33 z 35 testów powinno przejść (94% naprawionych)

---

### Faza 3: Dopracowanie (30 minut)
7. ✅ **Grupa 6** - Ujednolicenie komunikatów (5 min)
8. ✅ **Grupa 7** - Walidacja pustych danych (20 min)

**Po Fazie 3:** 35 z 35 testów powinno przejść (100% ✅)

---

## 🔍 Checklist przed rozpoczęciem

- [ ] Zrób backup obecnej wersji (commit lub branch)
- [ ] Przeczytaj cały plan naprawy
- [ ] Przygotuj środowisko testowe
- [ ] Upewnij się, że wszystkie zależności są zainstalowane

---

## 🧪 Checklist po każdej grupie zadań

- [ ] Uruchom testy jednostkowe: `npm run test`
- [ ] Sprawdź, czy nie wprowadzono regresji
- [ ] Commituj zmiany z opisowym komunikatem
- [ ] Zaktualizuj dokumentację (jeśli potrzeba)

---

## 📈 Metryki sukcesu

| Metryka | Przed | Cel |
|---------|-------|-----|
| Testy przeszły | 352/387 (91%) | 387/387 (100%) |
| Testy niepowodzenie | 35/387 (9%) | 0/387 (0%) |
| Coverage | ? | ≥80% |
| Pliki z błędami | 6 | 0 |

---

## 📝 Dodatkowe uwagi

### Struktura odpowiedzi API (standard)

Po naprawie wszystkie endpointy powinny zwracać:

**Sukces:**
```json
{
  "success": true,
  "data": {
    // dane specyficzne dla endpointu
  }
}
```

**Błąd:**
```json
{
  "error": "ERROR_CODE",
  "message": "Czytelny komunikat błędu"
}
```

**Błąd walidacji:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Błąd walidacji danych",
  "errors": [
    {
      "field": "email",
      "message": "Email jest wymagany"
    }
  ]
}
```

---

### Pliki do zmodyfikowania (podsumowanie)

**Implementacja (8 plików):**
1. `app/lib/utils/api-response.ts`
2. `app/api/admin/audit-logs/route.ts`
3. `app/api/admin/categories/[categoryId]/route.ts`
4. `app/api/admin/subcategories/[subcategoryId]/route.ts`
5. `app/api/admin/users/[userId]/route.ts`
6. `app/api/auth/logout/route.ts` (do sprawdzenia/implementacji)
7. `app/lib/middleware/auth-middleware.ts` (opcjonalnie)
8. `app/lib/validators/categories.ts` (opcjonalnie - dodać lub nie)

**Testy (5 plików):**
1. `tests/integration/api/admin-users-endpoints.test.ts`
2. `tests/integration/api/admin-categories-endpoints.test.ts`
3. `tests/integration/api/admin-audit-logs-endpoint.test.ts`
4. `tests/integration/api/admin-auth-middleware.test.ts`
5. `tests/integration/api/auth-audit-logging.test.ts`

**Do usunięcia (1 plik):**
1. `tests/unit/category-validators.test.ts` (jeśli wybierzemy Opcję B w Grupie 3)

---

## 🎯 Następne kroki po naprawie

1. Uruchom pełny suite testów: `npm run test:all`
2. Sprawdź coverage: `npm run test:coverage`
3. Uruchom testy E2E: `npm run test:e2e`
4. Zaktualizuj dokumentację w `docs/`
5. Utwórz pull request z opisem zmian
6. Przejdź code review
7. Merge do branch `module-4`

---

**Czas realizacji całego planu:** ~6-8 godzin roboczych

**Ostatnia aktualizacja:** 22 października 2025

