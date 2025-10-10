# Plan Testowania Widoku Logowania

## Przegląd
Ten dokument opisuje scenariusze testowe dla widoku logowania zgodnie z planem implementacji.

## Scenariusze Testowe

### 1. Test Walidacji Formularza (Frontend)

#### 1.1 Test: Email - Pusty
- **Akcja**: Pozostaw pole email puste, wpisz hasło, kliknij "Zaloguj się"
- **Oczekiwany wynik**: Komunikat walidacyjny "Email jest wymagany" pod polem email
- **Status**: ✅ Zaimplementowane (React Hook Form + Zod)

#### 1.2 Test: Email - Niepoprawny format
- **Akcja**: Wpisz "test@test", wpisz hasło, kliknij "Zaloguj się"
- **Oczekiwany wynik**: Komunikat "Nieprawidłowy format adresu email" pod polem email
- **Status**: ✅ Zaimplementowane

#### 1.3 Test: Hasło - Puste
- **Akcja**: Wpisz email, pozostaw hasło puste, kliknij "Zaloguj się"
- **Oczekiwany wynik**: Komunikat "Hasło jest wymagane" pod polem password
- **Status**: ✅ Zaimplementowane

### 2. Test Odpowiedzi API - Błąd 400 (Bad Request)

#### 2.1 Test: Niepoprawne dane (backend validation)
- **Akcja**: Wymuś błąd walidacji na backendzie (np. przez API bezpośrednio)
- **Oczekiwany wynik**: 
  - Status HTTP: 400
  - ErrorAlert z listą błędów walidacji z `details`
  - Pole formularza podświetlone na czerwono
- **Status**: ✅ Zaimplementowane w LoginForm (linie 52-62)

### 3. Test Odpowiedzi API - Błąd 401 (Unauthorized)

#### 3.1 Test: Nieprawidłowe hasło
- **Akcja**: Wpisz prawidłowy email (np. "admin@tickflow.com"), nieprawidłowe hasło
- **Oczekiwany wynik**:
  - Status HTTP: 401
  - ErrorAlert z komunikatem "Nieprawidłowy email lub hasło"
- **Status**: ✅ Zaimplementowane w LoginForm (linie 64-67)

#### 3.2 Test: Nieistniejący użytkownik
- **Akcja**: Wpisz nieistniejący email (np. "nieistnieje@test.com")
- **Oczekiwany wynik**:
  - Status HTTP: 401
  - ErrorAlert z komunikatem uwierzytelnienia
- **Status**: ✅ Zaimplementowane

### 4. Test Odpowiedzi API - Błąd 500 (Internal Server Error)

#### 4.1 Test: Błąd serwera
- **Akcja**: Symuluj błąd serwera (np. wyłącz bazę danych)
- **Oczekiwany wynik**:
  - Status HTTP: 500
  - ErrorAlert z komunikatem "Wystąpił błąd serwera. Spróbuj ponownie później."
- **Status**: ✅ Zaimplementowane w LoginForm (linie 69-72)

### 5. Test Odpowiedzi API - Sukces (200 OK)

#### 5.1 Test: Pomyślne logowanie - Bez wymaganej zmiany hasła
- **Akcja**: Wpisz prawidłowe dane (np. "admin@tickflow.com" / "Admin123!@#")
- **Oczekiwany wynik**:
  - Status HTTP: 200
  - Cookie HTTP-only "auth-token" ustawione
  - Redirect do `/`
  - Brak komunikatów błędów
- **Status**: ✅ Zaimplementowane w LoginForm (linie 82-87)

#### 5.2 Test: Pomyślne logowanie - Z wymaganą zmianą hasła
- **Akcja**: Zaloguj się jako użytkownik z `force_password_change = true`
- **Oczekiwany wynik**:
  - Status HTTP: 200
  - Cookie HTTP-only "auth-token" ustawione
  - Redirect do `/change-password`
- **Status**: ✅ Zaimplementowane w LoginForm (linie 82-87)

### 6. Test Stanów UI

#### 6.1 Test: Stan ładowania
- **Akcja**: Kliknij "Zaloguj się"
- **Oczekiwany wynik**:
  - Przycisk pokazuje spinner i tekst "Logowanie..."
  - Przycisk jest wyłączony (`disabled`)
  - Po zakończeniu żądania stan wraca do normalnego
- **Status**: ✅ Zaimplementowane w LoginForm (linie 94-110)

#### 6.2 Test: Wyświetlanie błędów
- **Akcja**: Wywołaj dowolny błąd
- **Oczekiwany wynik**:
  - ErrorAlert pojawia się z odpowiednim komunikatem
  - Komunikat jest dostępny dla screen readerów (aria-live="polite")
- **Status**: ✅ Zaimplementowane w ErrorAlert

### 7. Test Dostępności (A11y)

#### 7.1 Test: Nawigacja klawiaturą
- **Akcja**: Użyj Tab/Shift+Tab do nawigacji
- **Oczekiwany wynik**: Wszystkie elementy interaktywne są osiągalne
- **Status**: ✅ Zaimplementowane (native HTML inputs, button)

#### 7.2 Test: ARIA attributes
- **Akcja**: Sprawdź atrybuty ARIA w DevTools
- **Oczekiwany wynik**:
  - `aria-invalid` na polach z błędami
  - `aria-describedby` łączy pola z komunikatami błędów
  - `role="alert"` na komunikatach błędów
  - `aria-live="polite"` na ErrorAlert
- **Status**: ✅ Zaimplementowane w LoginForm i ErrorAlert

#### 7.3 Test: Screen reader
- **Akcja**: Użyj screen readera (NVDA, JAWS, VoiceOver)
- **Oczekiwany wynik**: 
  - Wszystkie pola mają odpowiednie etykiety
  - Błędy są ogłaszane
  - Stan ładowania jest komunikowany
- **Status**: ✅ Zaimplementowane

### 8. Test Błędów Sieciowych

#### 8.1 Test: Brak połączenia
- **Akcja**: Wyłącz sieć, kliknij "Zaloguj się"
- **Oczekiwany wynik**:
  - ErrorAlert z komunikatem "Wystąpił błąd połączenia. Sprawdź swoje połączenie internetowe."
  - Błąd logowany w konsoli
- **Status**: ✅ Zaimplementowane w LoginForm (linie 88-91)

## Uruchomienie Testów Manualnych

### Przygotowanie
1. Upewnij się, że serwer deweloperski działa: \`npm run dev\`
2. Otwórz przeglądarkę na \`http://localhost:3000/login\`
3. Otwórz DevTools (F12) na zakładkę Console i Network

### Testowe Konta
```
👤 admin@tickflow.com / Admin123!@#
👤 agent@tickflow.com / Agent123!@#
👤 user@tickflow.com / User123!@#
```

### Sprawdzenie Cookie
Po pomyślnym logowaniu:
1. DevTools → Application → Cookies → http://localhost:3000
2. Szukaj cookie "auth-token"
3. Upewnij się, że ma flagę HttpOnly

## Podsumowanie Implementacji

### ✅ Zaimplementowane
- AuthLayout component
- LoginForm component z React Hook Form + Zod
- ErrorAlert component
- Obsługa wszystkich statusów HTTP (400, 401, 500)
- Stan ładowania i disabled na przycisku
- Redirect w zależności od `passwordResetRequired`
- Pełna dostępność (ARIA, keyboard navigation)
- Obsługa błędów sieciowych

### 📝 Do zrobienia w kolejnych krokach (kroki 7-9 z planu)
- Middleware do ochrony tras
- Redirect już zalogowanych użytkowników z `/login`
- Testy jednostkowe (opcjonalnie)

## Struktura Plików

```
app/
├── components/
│   ├── AuthLayout.tsx         ✅ Utworzony
│   ├── ErrorAlert.tsx         ✅ Utworzony
│   └── LoginForm.tsx          ✅ Utworzony
├── lib/
│   └── validators/
│       └── auth.ts            ✅ Istniejący (schemat loginSchema)
└── login/
    └── page.tsx               ✅ Zrefaktoryzowany
```

