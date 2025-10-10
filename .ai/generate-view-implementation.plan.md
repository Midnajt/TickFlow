# Podsumowanie sesji

W tej sesji przeprowadziliśmy szczegółową analizę wymagań PRD oraz UI Plan w kontekście obsługi logowania użytkownika. Skupiliśmy się na:
- Wyciągnięciu kluczowych wymagań z PRD (formularz logowania, wymaganie zmiany hasła, walidacja, obsługa błędów).  
- Przeglądzie user stories dotyczących logowania, pobierania i wylogowywania sesji.  
- Opisie endpointów API: `/api/auth/login`, `/api/auth/logout`, `/api/auth/session`, `/api/auth/change-password`.  
- Zidentyfikowaniu odpowiednich typów DTO w `src/types.ts`.  
- Planowaniu głównych komponentów frontendu (LoginForm, ChangePasswordForm, AuthLayout, ErrorAlert) i ich hierarchii.  
- Określeniu technologii: Next.js App Router, React Hook Form + Zod, shadcn/ui, middleware ochrony tras.
- Ustalone kluczowe scenariusze walidacji i obsługi błędów (400, 401, 500).

# Plan implementacji widoku logowania

## 1. Przegląd
Widok logowania umożliwia autentykację użytkownika (email + hasło) oraz przekierowanie do zmiany hasła, jeśli profil wymaga resetu.

## 2. Routing widoku
Ścieżka: `/login` (plik: `app/(auth)/login/page.tsx`).

## 3. Struktura komponentów
- AuthLayout  
  - LoginForm  
    - TextInput (email)  
    - PasswordInput (hasło)  
    - SubmitButton  
    - ErrorAlert

## 4. Szczegóły komponentów

### AuthLayout
- Opis: kontener dla stron autoryzacji.
- Elementy: nagłówek z tytułem, slot na formularz.
- Propsy: `children: React.ReactNode`.

### LoginForm
- Opis: formularz logowania.
- Główne elementy: pola email i password, przycisk „Zaloguj się”, komponent do wyświetlania błędów.
- Obsługiwane interakcje: wpisanie danych, kliknięcie submit.
- Walidacja:
  - email: required, poprawny format.
  - password: required.
- Typy:
  - DTO: `LoginCommand` (src/types.ts)
  - Response: `LoginResponseDTO`.
- Propsy: brak (samodzielnie inicjuje akcję).

### ErrorAlert
- Opis: wyświetla błędy walidacji lub odpowiedzi serwera.
- Propsy: `messages: string[]`.

## 5. Typy
- LoginFormModel:
  ```ts
  interface LoginFormModel {
    email: string;
    password: string;
  }
  ```
- Korzystamy z `LoginCommand` i `LoginResponseDTO` z `src/types.ts`.

## 6. Zarządzanie stanem
- React Hook Form (`useForm<LoginFormModel>`).
- `useState<string[]>` dla komunikatów błędów backend.
- `useRouter` (Next.js) do redirect po udanym logowaniu.

## 7. Integracja API
- POST `/api/auth/login`:
  - Body: `LoginCommand`.
  - 200: zapis cookie HTTP-only + redirect do `/` lub `/change-password`.
  - 400/401/500: wyświetlenie `ErrorAlert`.
- Po zalogowaniu wykonać GET `/api/auth/session` w middleware lub na serwerze, aby sprawdzić `passwordResetRequired`.

## 8. Interakcje użytkownika
1. Użytkownik wpisuje email i hasło.  
2. Kliknięcie „Zaloguj się” wywołuje akcję submit.  
3. Pojawia się loader na przycisku.  
4. W razie błędu: wyświetlenie szczegółów.  
5. W razie sukcesu: redirect według flagi `passwordResetRequired`.

## 9. Warunki i walidacja
- Zod na formularzu:
  - email: `z.string().email()`  
  - password: `z.string().min(1)`  
- Backend również waliduje schematem Zod i zwraca `VALIDATION_ERROR`.

## 10. Obsługa błędów
- 400: highlight pól + `ErrorAlert` z `details`.  
- 401: `ErrorAlert` z komunikatem uwierzytelnienia.  
- 500: globalny toast lub `ErrorAlert` z komunikatem „Wystąpił błąd serwera”.

## 11. Kroki implementacji
1. Utworzyć `app/(auth)/login/page.tsx` z `AuthLayout` i `LoginForm`.  
2. Zaimplementować `LoginForm` z React Hook Form i Zod (schemat w `app/lib/validators/auth.ts`).  
3. Dodać akcję fetch do `/api/auth/login`.  
4. Obsłużyć odpowiedzi i zapisać błędy w stanie.  
5. Po sukcesie: użyć `useRouter().push()` w zależności od flagi w `LoginResponseDTO.user.passwordResetRequired`.  
6. Dodać prosty loader i disabled na submit.  
7. Przetestować scenariusze 400, 401, 500.  
8. Dodać testy jednostkowe dla walidacji i integrację manualną.  
9. Dodać middleware do zabezpieczenia tras i redirectu już zalogowanych (`/` jeśli istnieje token).
