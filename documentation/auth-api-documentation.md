# Authentication API Documentation

## Przegląd

API uwierzytelniania TickFlow zapewnia kompletne zarządzanie sesjami użytkowników, w tym logowanie, wylogowanie, zmianę hasła i pobieranie sesji.

## Endpointy

### 1. POST `/api/auth/login`

Logowanie użytkownika do systemu.

#### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Walidacja:**
- `email`: wymagane, format email, automatyczne toLowerCase i trim
- `password`: wymagane, minimum 1 znak

#### Response

**Success (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jan Kowalski",
    "role": "AGENT",
    "passwordResetRequired": false
  },
  "session": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresAt": "2024-01-15T12:00:00.000Z"
  }
}
```

**Headers (Success):**
```
Set-Cookie: auth-token=eyJhbGciOiJIUzI1NiIs...; HttpOnly; Secure; SameSite=Strict; Max-Age=604800; Path=/
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 2024-01-08T12:01:00.000Z
```

**Errors:**

- **400 Bad Request** - Nieprawidłowe dane wejściowe
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Nieprawidłowe dane wejściowe",
  "details": [
    {
      "code": "invalid_string",
      "path": ["email"],
      "message": "Nieprawidłowy format adresu email"
    }
  ]
}
```

- **401 Unauthorized** - Nieprawidłowe dane uwierzytelniające
```json
{
  "error": "AUTHENTICATION_ERROR",
  "message": "Nieprawidłowy email lub hasło"
}
```

- **429 Too Many Requests** - Przekroczenie limitu prób
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "Zbyt wiele prób logowania. Spróbuj ponownie za chwilę.",
  "retryAfter": 45
}
```

**Headers (429):**
```
Retry-After: 45
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 2024-01-08T12:01:00.000Z
```

- **500 Internal Server Error**
```json
{
  "error": "INTERNAL_ERROR",
  "message": "Wystąpił błąd podczas logowania"
}
```

#### Rate Limiting

- **Limit:** 5 prób na minutę na IP
- **Okno:** 60 sekund
- **Nagłówki:** `X-RateLimit-*` w każdej odpowiedzi

---

### 2. POST `/api/auth/logout`

Wylogowanie użytkownika z systemu.

#### Request

**Headers:**
```
Cookie: auth-token=eyJhbGciOiJIUzI1NiIs...
```
lub
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Body:** brak

#### Response

**Success (200 OK):**
```json
{
  "message": "Pomyślnie wylogowano"
}
```

**Headers (Success):**
```
Set-Cookie: auth-token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/
```

**Errors:**

- **500 Internal Server Error**
```json
{
  "error": "INTERNAL_ERROR",
  "message": "Wystąpił błąd podczas wylogowania"
}
```

---

### 3. POST `/api/auth/change-password`

Zmiana hasła użytkownika (wymaga uwierzytelnienia).

#### Request

**Headers:**
```
Content-Type: application/json
Cookie: auth-token=eyJhbGciOiJIUzI1NiIs...
```
lub
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewSecurePass456!",
  "confirmPassword": "NewSecurePass456!"
}
```

**Walidacja nowego hasła:**
- Minimum 8 znaków
- Maximum 100 znaków
- Przynajmniej jedna mała litera (a-z)
- Przynajmniej jedna wielka litera (A-Z)
- Przynajmniej jedna cyfra (0-9)
- Przynajmniej jeden znak specjalny (@$!%*?&)
- Musi różnić się od obecnego hasła
- Musi być identyczne z `confirmPassword`

#### Response

**Success (200 OK):**
```json
{
  "message": "Hasło zostało pomyślnie zmienione",
  "passwordResetRequired": false
}
```

**Errors:**

- **400 Bad Request** - Nieprawidłowe dane wejściowe
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Nieprawidłowe dane wejściowe",
  "details": [
    {
      "code": "too_small",
      "path": ["newPassword"],
      "message": "Hasło musi mieć minimum 8 znaków"
    }
  ]
}
```

- **401 Unauthorized** - Brak uwierzytelnienia lub nieprawidłowe obecne hasło
```json
{
  "error": "AUTHENTICATION_ERROR",
  "message": "Aktualne hasło jest nieprawidłowe"
}
```

- **500 Internal Server Error**
```json
{
  "error": "INTERNAL_ERROR",
  "message": "Nie udało się zaktualizować hasła"
}
```

---

### 4. GET `/api/auth/session`

Pobranie aktualnej sesji użytkownika (wymaga uwierzytelnienia).

#### Request

**Headers:**
```
Cookie: auth-token=eyJhbGciOiJIUzI1NiIs...
```
lub
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Body:** brak

#### Response

**Success (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Jan Kowalski",
    "role": "AGENT",
    "passwordResetRequired": false
  }
}
```

**Errors:**

- **401 Unauthorized** - Brak sesji lub token nieprawidłowy
```json
{
  "error": "AUTHENTICATION_ERROR",
  "message": "Token jest nieprawidłowy lub wygasł"
}
```

- **500 Internal Server Error**
```json
{
  "error": "INTERNAL_ERROR",
  "message": "Wystąpił błąd podczas pobierania sesji"
}
```

---

## Uwierzytelnianie

### Metody uwierzytelniania

API obsługuje dwie metody uwierzytelniania:

#### 1. HTTP-Only Cookie (Zalecane)

Token JWT jest automatycznie ustawiany jako HttpOnly cookie po logowaniu.

**Zalety:**
- Automatyczne zarządzanie przez przeglądarkę
- Bezpieczniejsze (niedostępne dla JavaScript)
- Ochrona przed XSS

**Konfiguracja:**
```javascript
// Cookie jest ustawiane automatycznie przez API
// Nie wymaga żadnej konfiguracji po stronie klienta
```

#### 2. Authorization Header (Bearer Token)

Token JWT może być wysyłany w nagłówku Authorization.

**Format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

**Zalety:**
- Lepsza kontrola po stronie klienta
- Użyteczne dla aplikacji mobilnych/SPA
- Możliwość użycia w środowiskach non-browser

**Przykład użycia:**
```javascript
const response = await fetch('/api/auth/session', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

## Bezpieczeństwo

### JWT Token

- **Algorytm:** HS256
- **Ważność:** 7 dni
- **Payload:**
  ```json
  {
    "userId": "uuid",
    "email": "user@example.com",
    "role": "AGENT",
    "iat": 1704700800,
    "exp": 1705305600
  }
  ```

### Cookie Security

Ciasteczka JWT są ustawiane z następującymi flagami:

- `HttpOnly`: Niedostępne dla JavaScript (ochrona przed XSS)
- `Secure`: Tylko HTTPS w produkcji
- `SameSite=Strict`: Ochrona przed CSRF
- `Max-Age=604800`: 7 dni (w sekundach)
- `Path=/`: Dostępne dla całej aplikacji

### Rate Limiting

Endpoint `/api/auth/login` jest chroniony rate limiterem:

- **Limit:** 5 prób na minutę
- **Identyfikacja:** IP klienta
- **Nagłówki:**
  - `X-RateLimit-Limit`: Maksymalna liczba requestów
  - `X-RateLimit-Remaining`: Pozostałe requesty
  - `X-RateLimit-Reset`: Czas resetu (ISO 8601)
  - `Retry-After`: Sekundy do czasu resetu (tylko przy 429)

### Hashowanie haseł

- **Algorytm:** bcrypt
- **Cost Factor:** 10 rounds
- Hasła nigdy nie są zwracane w response
- Hash jest przechowywany w bazie danych

---

## Przykłady użycia

### JavaScript/TypeScript

```typescript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePassword123!',
  }),
  credentials: 'include', // Ważne dla cookies
});

const { user, session } = await loginResponse.json();

// Get Session
const sessionResponse = await fetch('/api/auth/session', {
  credentials: 'include', // Ważne dla cookies
});

const { user } = await sessionResponse.json();

// Change Password
const changePasswordResponse = await fetch('/api/auth/change-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    currentPassword: 'OldPassword123!',
    newPassword: 'NewSecurePass456!',
    confirmPassword: 'NewSecurePass456!',
  }),
  credentials: 'include',
});

// Logout
const logoutResponse = await fetch('/api/auth/logout', {
  method: 'POST',
  credentials: 'include',
});
```

### Next.js Server Component

```typescript
import { cookies } from 'next/headers';
import { AuthService } from '@/app/lib/services/auth';

export default async function ProtectedPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    redirect('/login');
  }

  try {
    const session = await AuthService.getSession(token);
    return <div>Welcome, {session.user.name}!</div>;
  } catch (error) {
    redirect('/login');
  }
}
```

### Next.js API Route (z utility functions)

```typescript
import { withAuth, withRole } from '@/app/lib/utils/auth';

// Wymaga tylko uwierzytelnienia
export const GET = withAuth(async (request, user) => {
  return NextResponse.json({
    message: `Hello ${user.name}`,
  });
});

// Wymaga roli AGENT
export const POST = withRole(['AGENT'], async (request, user) => {
  // Tylko agenci mogą wykonać tę akcję
  return NextResponse.json({
    message: 'Agent-only endpoint',
  });
});
```

---

## Kody błędów

| Kod | Nazwa | Opis |
|-----|-------|------|
| `VALIDATION_ERROR` | Błąd walidacji | Nieprawidłowe dane wejściowe (szczegóły w `details`) |
| `AUTHENTICATION_ERROR` | Błąd uwierzytelniania | Nieprawidłowe dane logowania lub token wygasł |
| `AUTHORIZATION_ERROR` | Błąd autoryzacji | Użytkownik nie ma odpowiednich uprawnień |
| `RATE_LIMIT_EXCEEDED` | Limit przekroczony | Zbyt wiele prób logowania |
| `INTERNAL_ERROR` | Błąd serwera | Nieoczekiwany błąd po stronie serwera |

---

## Testing

### Testowanie z curl

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}' \
  -c cookies.txt

# Get Session (używając cookies)
curl -X GET http://localhost:3000/api/auth/session \
  -b cookies.txt

# Change Password
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"Test123!@#","newPassword":"NewTest456!@#","confirmPassword":"NewTest456!@#"}' \
  -b cookies.txt

# Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -b cookies.txt
```

### Testowanie z Postman/Insomnia

1. Ustaw `Content-Type: application/json` w Headers
2. Włącz automatyczne zarządzanie cookies
3. Po logowaniu, cookie `auth-token` będzie automatycznie używane w kolejnych requestach

---

## Best Practices

### Po stronie klienta

1. **Używaj credentials: 'include'** - zawsze przy fetchowaniu API z cookies
2. **Obsługuj błędy 401** - przekierowuj na stronę logowania
3. **Waliduj dane przed wysłaniem** - użyj tych samych schematów Zod
4. **Nie przechowuj hasła** - nigdy nie cachuj hasła użytkownika
5. **Sprawdzaj `passwordResetRequired`** - wymuszaj zmianę hasła gdy `true`

### Po stronie serwera

1. **Używaj `withAuth` / `withRole`** - dla chronionych endpointów
2. **Nie loguj wrażliwych danych** - hasła, tokeny
3. **Rotuj JWT_SECRET** - regularnie w produkcji
4. **Monitoruj rate limiting** - śledź podejrzane IP
5. **Używaj HTTPS** - zawsze w produkcji

---

## Migracja z NextAuth

Jeśli wcześniej używałeś NextAuth, oto główne różnice:

| NextAuth | TickFlow Auth |
|----------|---------------|
| `useSession()` | `fetch('/api/auth/session')` |
| `signIn()` | `fetch('/api/auth/login', ...)` |
| `signOut()` | `fetch('/api/auth/logout', ...)` |
| `session.user` | `user` (bezpośrednio z API) |
| Providers | Tylko credentials (email/password) |

---

## Troubleshooting

### Problem: "Token jest nieprawidłowy lub wygasł"

**Rozwiązanie:**
- Sprawdź czy `JWT_SECRET` jest ustawiony w `.env.local`
- Upewnij się że ten sam `JWT_SECRET` jest używany w całej aplikacji
- Token ma ważność 7 dni - po tym czasie należy zalogować się ponownie

### Problem: "Zbyt wiele prób logowania"

**Rozwiązanie:**
- Poczekaj 1 minutę przed kolejną próbą
- Sprawdź nagłówek `Retry-After` dla dokładnego czasu
- W development możesz zrestartować serwer aby wyczyścić rate limiter

### Problem: Cookie nie jest ustawiane

**Rozwiązanie:**
- Użyj `credentials: 'include'` w fetch
- Sprawdź czy używasz tego samego origin (localhost:3000)
- W production upewnij się że używasz HTTPS

### Problem: "Brak uprawnień"

**Rozwiązanie:**
- Sprawdź rolę użytkownika w bazie danych
- Upewnij się że endpoint używa prawidłowych dozwolonych ról
- Sprawdź czy token zawiera prawidłową rolę

