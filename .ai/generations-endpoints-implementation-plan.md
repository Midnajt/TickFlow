# API Endpoint Implementation Plan: Authentication Endpoints

## 1. Przegląd punktów końcowych
Celem jest wdrożenie czterech punktów końcowych REST API do zarządzania uwierzytelnianiem:
- POST `/api/auth/login` – logowanie użytkownika i creación sesji.
- POST `/api/auth/logout` – wylogowanie i zakończenie sesji.
- POST `/api/auth/change-password` – zmiana hasła wymagana przy pierwszym logowaniu.
- GET  `/api/auth/session` – pobranie aktualnej sesji użytkownika.

## 2. Szczegóły żądania

### 2.1 POST /api/auth/login
- Metoda HTTP: POST
- URL: `/api/auth/login`
- Nagłówki: `Content-Type: application/json`
- Body (JSON):
  ```json
  {
    "email": "string",      // wymagane, email użytkownika
    "password": "string"   // wymagane, hasło użytkownika
  }
  ```

### 2.2 POST /api/auth/logout
- Metoda HTTP: POST
- URL: `/api/auth/logout`
- Nagłówki: `Authorization: Bearer <token>` lub HTTP-only cookie JWT
- Body: brak

### 2.3 POST /api/auth/change-password
- Metoda HTTP: POST
- URL: `/api/auth/change-password`
- Nagłówki: `Authorization: Bearer <token>` lub cookie
- Body (JSON):
  ```json
  {
    "currentPassword": "string",  // wymagane
    "newPassword": "string",      // wymagane, zgodne z regułami
    "confirmPassword": "string"   // wymagane, musi się zgadzać z newPassword
  }
  ```

### 2.4 GET /api/auth/session
- Metoda HTTP: GET
- URL: `/api/auth/session`
- Nagłówki: `Authorization: Bearer <token>` lub cookie
- Body: brak

## 3. Wykorzystywane typy
- `LoginCommand`, `LoginResponseDTO`, `UserSessionDTO`  
- `LogoutResponseDTO`  
- `ChangePasswordCommand`, `ChangePasswordResponseDTO`  
- `SessionDTO`

## 4. Szczegóły odpowiedzi

### 4.1 POST /api/auth/login
- 200 OK
  ```json
  {
    "user": UserSessionDTO,
    "session": { token: string, expiresAt: string }
  }
  ```
- 400 Bad Request – brak wymaganych pól lub walidacji
- 401 Unauthorized – nieprawidłowe dane uwierzytelniające
- 500 Internal Server Error – błąd serwera

### 4.2 POST /api/auth/logout
- 200 OK
  ```json
  { "message": "Successfully logged out" }
  ```
- 401 Unauthorized – brak/nieprawidłowe dane sesji
- 500 Internal Server Error

### 4.3 POST /api/auth/change-password
- 200 OK
  ```json
  { "message": "Password changed successfully", "passwordResetRequired": false }
  ```
- 400 Bad Request – hasła nie pasują lub nie spełniają wymogów
- 401 Unauthorized – bieżące hasło niepoprawne
- 422 Unprocessable Entity – silna walidacja Zod nie przeszła
- 500 Internal Server Error

### 4.4 GET /api/auth/session
- 200 OK
  ```json
  { "user": UserSessionDTO }
  ```
- 401 Unauthorized – brak/nieprawidłowa sesja

## 5. Przepływ danych
1. Serwer odbiera żądanie w `route.ts` dla odpowiedniej ścieżki.
2. Parser JSON i walidacja Zod (schema odpowiedniego endpointu).
3. Wywołanie metod `AuthService`:
   - `login`: pobranie użytkownika z Prisma/Supabase, porównanie bcrypt, generowanie JWT, zapis w cookie.
   - `logout`: czyszczenie cookie JWT i ewentualne unieważnienie sesji.
   - `changePassword`: weryfikacja bieżącego hasła, silna walidacja nowego hasła, hash z bcrypt, aktualizacja w DB.
   - `getSession`: weryfikacja JWT, odczyt danych użytkownika, zwrócenie DTO.
4. Revalidate ścieżek (jeśli używane Server Actions).
5. Zwrócenie odpowiedzi JSON.

## 6. Względy bezpieczeństwa
- Autoryzacja: `Authorization` nagłówek z JWT lub HTTP-only cookie.
- CSRF: SameSite cookie + NextAuth built-in CSRF token w credentials flow.
- Użycie Prisma ORM lub Supabase client – brak SQL injection.
- Passwords: hash bcrypt (cost 10), nigdy nie ujawniać hashów.
- Rate limiting na endpoint `/login` (np. 5 prób na minutę).
- Ustawienie HttpOnly, Secure, SameSite=strict na ciasteczku JWT.

## 7. Obsługa błędów
- Zwracanie ustandaryzowanych błędów Zod z kodem `VALIDATION_ERROR`.
- Błędy uwierzytelniania: `AUTHENTICATION_ERROR` 401.
- Inne: `INTERNAL_ERROR` 500.
- Logowanie błędów do serwisu (`ErrorLoggerService`), opcjonalnie zapisy do tabeli `error_logs`.

## 8. Rozważania dotyczące wydajności
- Walidacja na krawędzi (Edge Functions) – minimalne opóźnienie parsowania.
- Użycie indeksów (users.email) dla szybkiego odczytu.
- Reużycie połączenia Prisma/Supabase.
- Asynchroniczne operacje bcrypt i DB – minimalizacja blokad.

## 9. Kroki implementacji
1. Utworzyć pliki route.ts w:
   - `app/api/auth/login/route.ts`
   - `app/api/auth/logout/route.ts`
   - `app/api/auth/change-password/route.ts`
   - `app/api/auth/session/route.ts`
2. Zdefiniować Zod schematy walidacji w `app/lib/validators/auth.ts`.
3. Implementować `AuthService` w `app/lib/services/auth.ts` z metodami: `login`, `logout`, `changePassword`, `getSession`.
4. Skonfigurować Prisma client w `app/lib/db.ts` i zaimportować w serwisie.
5. Dodać logikę bcrypt i JWT (lub NextAuth credentials provider) w `AuthService`.
6. Dodać rate limiter middleware dla `/login`.
7. Napisać testy jednostkowe dla serwisu i walidacji Zod.
8. Napisać testy integracyjne dla każdego endpointu (Mock DB lub testowe środowisko Supabase).
9. Dokonać code review i wdrożyć na staging, sprawdzić zachowanie sesji i CSRF.
10. Monitorować logi i zabezpieczyć ewentualne luki.
